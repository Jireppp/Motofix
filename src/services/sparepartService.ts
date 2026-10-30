import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { MasterData, VehicleSparepart, SparepartWithDetails } from '../types';
import { calculateRemainingKm, getStatus } from '../utils/kmCalculator';
import { localizeSparepartName, localizeCategory } from '../constants/masterData';

/** Name of the shared catalog row that every user-defined (custom) part points to. */
export const CUSTOM_CATALOG_NAME = 'Custom Component';

// Legacy: before `custom_name` existed in the database, custom names were kept on the device only.
// It is still read so parts created by older app versions keep their names.
const CUSTOM_NAMES_STORAGE_KEY = 'fxon_custom_sparepart_names';

async function getCustomNamesMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_NAMES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const sparepartService = {
  /**
   * Fetch the official master catalog (English display names).
   * The shared "Custom Component" row is internal and never shown in the picker.
   */
  async getMasterData(): Promise<MasterData[]> {
    const { data, error } = await supabase
      .from('master_data')
      .select('*')
      .order('sparepart_name');

    if (error) throw error;

    return (data || [])
      .filter((item: any) => item.sparepart_name !== CUSTOM_CATALOG_NAME)
      .map((item: any) => ({
        ...item,
        sparepart_name: localizeSparepartName(item.sparepart_name),
        category: localizeCategory(item.category),
      }))
      .sort((a: MasterData, b: MasterData) => a.sparepart_name.localeCompare(b.sparepart_name));
  },

  /** Fetch all tracked spareparts for a vehicle with pure odometer-driven telemetry fields. */
  async getTrackedSpareparts(vehicleId: string, currentKm: number): Promise<SparepartWithDetails[]> {
    const { data, error } = await supabase
      .from('vehicle_sparepart')
      .select('*, master_data(*)')
      .eq('vehicle_id', vehicleId);

    if (error) throw error;

    const customNamesMap = await getCustomNamesMap();

    return (data || [])
      .map((item: any) => {
        const remainingKm = calculateRemainingKm(
          item.km_at_setup,
          item.custom_interval,
          currentKm
        );
        const resolvedName =
          item.custom_name ||
          customNamesMap[item.id] ||
          localizeSparepartName(item.master_data?.sparepart_name) ||
          'Custom Part';

        return {
          ...item,
          custom_name: item.custom_name || customNamesMap[item.id] || null,
          master_data: {
            ...(item.master_data || {}),
            sparepart_name: resolvedName,
          },
          remaining_km: remainingKm,
          status: getStatus(remainingKm),
        };
      })
      .sort((a: SparepartWithDetails, b: SparepartWithDetails) => a.remaining_km - b.remaining_km);
  },

  /** Add a new sparepart to track (100% Odometer-Driven). */
  async addSparepart(
    vehicleId: string,
    masterDataId: string,
    customInterval: number,
    currentKm: number
  ): Promise<VehicleSparepart> {
    const { data, error } = await supabase
      .from('vehicle_sparepart')
      .insert({
        vehicle_id: vehicleId,
        master_data_id: masterDataId,
        custom_interval: customInterval,
        km_at_setup: currentKm,
        status: 'Normal',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('This component is already tracked for this vehicle.');
      throw error;
    }
    return data;
  },

  /**
   * Add a user-defined (custom) sparepart for a vehicle.
   *
   * Requires the `custom_spareparts.sql` migration: one shared "Custom Component" row in
   * `master_data`, a `custom_name` column on `vehicle_sparepart`, and per-vehicle uniqueness
   * scoped by `(vehicle_id, lower(custom_name))` for custom rows.
   */
  async addCustomSparepart(
    vehicleId: string,
    sparepartName: string,
    customInterval: number,
    currentKm: number
  ): Promise<VehicleSparepart> {
    const cleanName = sparepartName.trim();

    const { data: customCatalog } = await supabase
      .from('master_data')
      .select('id')
      .eq('sparepart_name', CUSTOM_CATALOG_NAME)
      .maybeSingle();

    if (!customCatalog?.id) {
      throw new Error(
        'Custom components are not set up on the server yet. Please run supabase/custom_spareparts.sql in Supabase.'
      );
    }

    const { data, error } = await supabase
      .from('vehicle_sparepart')
      .insert({
        vehicle_id: vehicleId,
        master_data_id: customCatalog.id,
        custom_name: cleanName,
        custom_interval: customInterval,
        km_at_setup: currentKm,
        status: 'Normal',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('This component is already tracked for this vehicle.');
      }
      if (error.code === '42703' || (error.message || '').includes('custom_name')) {
        throw new Error(
          'Custom components are not set up on the server yet. Please run supabase/custom_spareparts.sql in Supabase.'
        );
      }
      throw error;
    }

    return data;
  },

  /** Mark a sparepart as replaced. Resets cycle and logs replacement with current server KM. */
  async replaceSparepart(
    sparepartId: string,
    currentKm: number,
    brandName: string,
    interval: number,
    cost: number = 0
  ): Promise<{ success: boolean; currentKm: number }> {
    const safeCost = Math.min(Math.max(0, cost || 0), 100000000);

    // 1. Try atomic database RPC function if installed
    try {
      const { data, error } = await supabase.rpc('replace_sparepart_atomic', {
        p_sparepart_id: sparepartId,
        p_brand_name: brandName,
        p_cost: safeCost,
      });

      if (!error && data) {
        return data as { success: boolean; currentKm: number };
      }
    } catch {
      // RPC not installed yet, proceed to fallback
    }

    // 2. Fallback: Fetch latest vehicle KM from server to avoid stale state
    const { data: spData, error: spError } = await supabase
      .from('vehicle_sparepart')
      .select('vehicle_id, user_vehicle(current_km)')
      .eq('id', sparepartId)
      .single();

    if (spError || !spData) throw spError || new Error('Sparepart not found.');

    const vehicleRecord: any = Array.isArray(spData.user_vehicle)
      ? spData.user_vehicle[0]
      : spData.user_vehicle;
    const actualKm = vehicleRecord?.current_km ?? currentKm;

    // 3. Log to maintenance_log first
    const { error: logError } = await supabase
      .from('maintenance_log')
      .insert({
        sparepart_id: sparepartId,
        km_at_replacement: actualKm,
        brand_name: brandName,
        cost: safeCost,
      });

    if (logError) throw logError;

    // 4. Reset the sparepart cycle
    const { error: updateError } = await supabase
      .from('vehicle_sparepart')
      .update({
        km_at_setup: actualKm,
        date_at_setup: new Date().toISOString(),
        status: 'Normal',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sparepartId);

    if (updateError) throw updateError;

    return { success: true, currentKm: actualKm };
  },

  /** Delete a tracked sparepart and its associated maintenance logs safely. */
  async deleteSparepart(sparepartId: string): Promise<void> {
    // Delete dependent maintenance logs first to prevent FK constraint error (23503)
    await supabase
      .from('maintenance_log')
      .delete()
      .eq('sparepart_id', sparepartId);

    const { error } = await supabase
      .from('vehicle_sparepart')
      .delete()
      .eq('id', sparepartId);

    if (error) throw error;
  },

  /** Update all sparepart statuses after KM change. */
  async refreshStatuses(vehicleId: string, currentKm: number): Promise<void> {
    const spareparts = await this.getTrackedSpareparts(vehicleId, currentKm);

    for (const sp of spareparts) {
      const newStatus = getStatus(sp.remaining_km);
      if (newStatus !== sp.status) {
        await supabase
          .from('vehicle_sparepart')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', sp.id);
      }
    }
  },

  /** Get maintenance history for an entire vehicle (all spareparts). */
  async getVehicleHistory(
    vehicleId: string,
    page: number = 0,
    pageSize: number = 250
  ): Promise<{ data: any[]; hasMore: boolean }> {
    const { data: spareparts, error: spErr } = await supabase
      .from('vehicle_sparepart')
      .select('id, custom_name, master_data(sparepart_name)')
      .eq('vehicle_id', vehicleId);

    let spRows: any[] | null = spareparts;

    if (spErr) {
      // Fallback if custom_name column doesn't exist in remote DB yet
      const { data: fallbackSp, error: fbErr } = await supabase
        .from('vehicle_sparepart')
        .select('id, master_data(sparepart_name)')
        .eq('vehicle_id', vehicleId);
      if (fbErr) throw fbErr;
      spRows = fallbackSp;
    }

    if (!spRows || spRows.length === 0) return { data: [], hasMore: false };

    const customNamesMap = await getCustomNamesMap();
    const sparepartIds = spRows.map((sp: any) => sp.id);
    const nameMap: Record<string, string> = {};
    spRows.forEach((sp: any) => {
      nameMap[sp.id] =
        sp.custom_name ||
        customNamesMap[sp.id] ||
        localizeSparepartName(sp.master_data?.sparepart_name) ||
        'Unknown';
    });

    const from = page * pageSize;
    const to = from + pageSize;

    const { data: logs, error: logErr } = await supabase
      .from('maintenance_log')
      .select('*')
      .in('sparepart_id', sparepartIds)
      .order('replaced_at', { ascending: false })
      .range(from, to);

    if (logErr) throw logErr;

    const hasMore = (logs || []).length > pageSize;
    const trimmed = (logs || []).slice(0, pageSize);

    const enriched = trimmed.map((log: any) => ({
      ...log,
      sparepart_name: nameMap[log.sparepart_id] || 'Unknown',
    }));

    return { data: enriched, hasMore };
  },
};
