import { supabase } from '../lib/supabase';
import { MasterData, VehicleSparepart, SparepartWithDetails, MaintenanceLog } from '../types';
import { calculateRemainingKm, getStatus } from '../utils/kmCalculator';

export const sparepartService = {
  /** Fetch all master data spareparts. */
  async getMasterData(): Promise<MasterData[]> {
    const { data, error } = await supabase
      .from('master_data')
      .select('*')
      .order('sparepart_name');

    if (error) throw error;
    return data;
  },

  /** Fetch all tracked spareparts for a vehicle with computed fields. */
  async getTrackedSpareparts(vehicleId: string, currentKm: number): Promise<SparepartWithDetails[]> {
    const { data, error } = await supabase
      .from('vehicle_sparepart')
      .select('*, master_data(*)')
      .eq('vehicle_id', vehicleId);

    if (error) throw error;

    return (data || [])
      .map((item: any) => {
        const { remainingKm, remainingMonths } = calculateRemainingKm(
          item.km_at_setup, 
          item.custom_interval, 
          currentKm, 
          item.date_at_setup, 
          item.custom_time_interval
        );
        return {
          ...item,
          remaining_km: remainingKm,
          remaining_months: remainingMonths,
          status: getStatus(remainingKm, remainingMonths),
        };
      })
      .sort((a: SparepartWithDetails, b: SparepartWithDetails) => a.remaining_km - b.remaining_km);
  },

  /** Add a new sparepart to track. */
  async addSparepart(
    vehicleId: string,
    masterDataId: string,
    customInterval: number,
    currentKm: number,
    customTimeInterval?: number
  ): Promise<VehicleSparepart> {
    const { data, error } = await supabase
      .from('vehicle_sparepart')
      .insert({
        vehicle_id: vehicleId,
        master_data_id: masterDataId,
        custom_interval: customInterval,
        custom_time_interval: customTimeInterval,
        km_at_setup: currentKm,
        status: 'Normal',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Sparepart ini sudah ditambahkan.');
      throw error;
    }
    return data;
  },

  /** Add a custom sparepart (not from master data). */
  async addCustomSparepart(
    vehicleId: string,
    sparepartName: string,
    customInterval: number,
    currentKm: number,
    customTimeInterval?: number
  ): Promise<VehicleSparepart> {
    // 1. Insert into master_data
    const { data: masterEntry, error: masterError } = await supabase
      .from('master_data')
      .insert({
        sparepart_name: sparepartName,
        default_interval: customInterval,
        default_time_interval: customTimeInterval,
        category: 'Lainnya',
        icon_name: 'default',
      })
      .select()
      .single();

    if (masterError) {
      if (masterError.code === '23505') throw new Error('A spare part with this name already exists in the catalog.');
      throw masterError;
    }

    // 2. Track it for this vehicle
    const { data, error } = await supabase
      .from('vehicle_sparepart')
      .insert({
        vehicle_id: vehicleId,
        master_data_id: masterEntry.id,
        custom_interval: customInterval,
        custom_time_interval: customTimeInterval,
        km_at_setup: currentKm,
        status: 'Normal',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Mark a sparepart as replaced. Resets cycle and logs replacement. */
  async replaceSparepart(
    sparepartId: string,
    currentKm: number,
    brandName: string,
    interval: number,
    cost: number = 0
  ): Promise<void> {
    // Update sparepart: reset km_at_setup to current KM
    const { error: updateError } = await supabase
      .from('vehicle_sparepart')
      .update({
        km_at_setup: currentKm,
        status: 'Normal',
        date_at_setup: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sparepartId);

    if (updateError) throw updateError;

    // Log the replacement
    const { error: logError } = await supabase
      .from('maintenance_log')
      .insert({
        sparepart_id: sparepartId,
        km_at_replacement: currentKm,
        brand_name: brandName,
        cost: cost,
      });

    if (logError) throw logError;
  },

  /** Delete a tracked sparepart. */
  async deleteSparepart(sparepartId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_sparepart')
      .delete()
      .eq('id', sparepartId);

    if (error) throw error;
  },

  /** Get maintenance history for a sparepart. */
  async getMaintenanceHistory(sparepartId: string): Promise<MaintenanceLog[]> {
    const { data, error } = await supabase
      .from('maintenance_log')
      .select('*')
      .eq('sparepart_id', sparepartId)
      .order('replaced_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /** Update all sparepart statuses after KM change. */
  async refreshStatuses(vehicleId: string, currentKm: number): Promise<void> {
    const spareparts = await this.getTrackedSpareparts(vehicleId, currentKm);

    for (const sp of spareparts) {
      const newStatus = getStatus(sp.remaining_km, sp.remaining_months || null);
      if (newStatus !== sp.status) {
        await supabase
          .from('vehicle_sparepart')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', sp.id);
      }
    }
  },

  /** Get paginated maintenance history for an entire vehicle (all spareparts). */
  async getVehicleHistory(
    vehicleId: string,
    page: number = 0,
    pageSize: number = 10
  ): Promise<{ data: any[]; hasMore: boolean }> {
    // First get all sparepart IDs for this vehicle
    const { data: spareparts, error: spErr } = await supabase
      .from('vehicle_sparepart')
      .select('id, master_data(sparepart_name)')
      .eq('vehicle_id', vehicleId);

    if (spErr) throw spErr;
    if (!spareparts || spareparts.length === 0) return { data: [], hasMore: false };

    const sparepartIds = spareparts.map((sp: any) => sp.id);
    // Build a name lookup map
    const nameMap: Record<string, string> = {};
    spareparts.forEach((sp: any) => {
      nameMap[sp.id] = sp.master_data?.sparepart_name || 'Unknown';
    });

    const from = page * pageSize;
    const to = from + pageSize; // fetch 1 extra to check hasMore

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
