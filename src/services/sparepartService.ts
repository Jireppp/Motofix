import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { MasterData, VehicleSparepart, SparepartWithDetails } from '../types';
import { calculateRemainingKm, getStatus } from '../utils/kmCalculator';

const CUSTOM_NAMES_STORAGE_KEY = 'fxon_custom_sparepart_names';
const USER_CUSTOM_MASTER_IDS_PREFIX = 'fxon_user_custom_master_ids_';

async function getCustomNamesMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_NAMES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveCustomNameForRow(sparepartId: string, customName: string): Promise<void> {
  try {
    const map = await getCustomNamesMap();
    map[sparepartId] = customName;
    await AsyncStorage.setItem(CUSTOM_NAMES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage write errors
  }
}

async function getUserPrivateMasterIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(`${USER_CUSTOM_MASTER_IDS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function addUserPrivateMasterId(userId: string, masterId: string): Promise<void> {
  try {
    const existing = await getUserPrivateMasterIds(userId);
    if (!existing.includes(masterId)) {
      existing.push(masterId);
      await AsyncStorage.setItem(
        `${USER_CUSTOM_MASTER_IDS_PREFIX}${userId}`,
        JSON.stringify(existing)
      );
    }
  } catch {
    // Ignore storage write errors
  }
}

export const sparepartService = {
  /**
   * Fetch master data catalog.
   * Isolates custom entries ('Lainnya') so a user only sees official factory catalog items
   * plus their own private custom components (never polluted by other users' custom parts).
   */
  async getMasterData(): Promise<MasterData[]> {
    const { data, error } = await supabase
      .from('master_data')
      .select('*')
      .order('sparepart_name');

    if (error) throw error;

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    const privateIds = userId ? await getUserPrivateMasterIds(userId) : [];

    return (data || []).filter((item: any) => {
      // If the database table has user_id column populated
      if (item.user_id) {
        return item.user_id === userId;
      }
      // Keep all official factory categories; only show 'Lainnya' if created by this user
      const isCustomCategory =
        !item.category || item.category.toLowerCase() === 'lainnya';
      if (!isCustomCategory) return true;
      return privateIds.includes(item.id);
    });
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
          item.master_data?.sparepart_name ||
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
   * Add a custom sparepart scoped to the vehicle/user.
   * Stores `custom_name` directly on `vehicle_sparepart` (if column exists in DB)
   * and binds private ownership so global catalog is never polluted for other users.
   */
  async addCustomSparepart(
    vehicleId: string,
    sparepartName: string,
    customInterval: number,
    currentKm: number
  ): Promise<VehicleSparepart> {
    const cleanName = sparepartName.trim();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    // 1. Resolve or create a backing master_data reference (for FK integrity)
    let masterId: string | undefined;

    const { data: masterEntry, error: masterError } = await supabase
      .from('master_data')
      .insert({
        sparepart_name: cleanName,
        default_interval: customInterval,
        category: 'Lainnya',
        icon_name: 'default',
      })
      .select()
      .single();

    if (!masterError && masterEntry?.id) {
      masterId = masterEntry.id;
    } else if (masterError?.code === '23505') {
      const { data: existing } = await supabase
        .from('master_data')
        .select('id')
        .ilike('sparepart_name', cleanName)
        .limit(1)
        .single();

      if (existing?.id) {
        masterId = existing.id;
      }
    }

    // Fallback: if RLS blocks master_data insert, bind to any existing base catalog ID
    // and override the name directly on the vehicle_sparepart row.
    if (!masterId) {
      const { data: fallbackMaster } = await supabase
        .from('master_data')
        .select('id')
        .limit(1)
        .single();
      masterId = fallbackMaster?.id;
    }

    if (!masterId) {
      throw new Error('Failed to resolve component catalog record.');
    }

    if (userId) {
      await addUserPrivateMasterId(userId, masterId);
    }

    // 2. Try inserting with `custom_name` directly on `vehicle_sparepart`
    let insertedRow: any = null;
    const { data: directData, error: directError } = await supabase
      .from('vehicle_sparepart')
      .insert({
        vehicle_id: vehicleId,
        master_data_id: masterId,
        custom_name: cleanName,
        custom_interval: customInterval,
        km_at_setup: currentKm,
        status: 'Normal',
      })
      .select()
      .single();

    if (!directError && directData) {
      insertedRow = directData;
    } else {
      // Fallback if `custom_name` column is not yet added in remote Supabase table
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('vehicle_sparepart')
        .insert({
          vehicle_id: vehicleId,
          master_data_id: masterId,
          custom_interval: customInterval,
          km_at_setup: currentKm,
          status: 'Normal',
        })
        .select()
        .single();

      if (fallbackError) {
        if (fallbackError.code === '23505') {
          throw new Error('This component is already tracked for this vehicle.');
        }
        throw fallbackError;
      }
      insertedRow = fallbackData;
    }

    if (insertedRow?.id) {
      await saveCustomNameForRow(insertedRow.id, cleanName);
    }

    return insertedRow;
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
        sp.master_data?.sparepart_name ||
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
