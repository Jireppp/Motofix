import { supabase } from '../lib/supabase';
import { UserVehicle, MasterBrand } from '../types';
import { authService } from './authService';

export const vehicleService = {
  /** Get all vehicles for the current user (with brand info). */
  async getVehicles(): Promise<UserVehicle[]> {
    const { data, error } = await supabase
      .from('user_vehicle')
      .select('*, master_brand(*)')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /** Get a single vehicle by ID. */
  async getVehicleById(vehicleId: string): Promise<UserVehicle | null> {
    const { data, error } = await supabase
      .from('user_vehicle')
      .select('*, master_brand(*)')
      .eq('id', vehicleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /** Get all available brands. */
  async getBrands(): Promise<MasterBrand[]> {
    const { data, error } = await supabase
      .from('master_brand')
      .select('*')
      .order('brand_name');

    if (error) throw error;
    return data || [];
  },

  /** Create a new vehicle. */
  async createVehicle(
    brandId: string,
    vehicleName: string,
    plateNumber: string,
    initialKm: number
  ): Promise<UserVehicle> {
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      await authService.signInAsGuest();
      const retryUser = await supabase.auth.getUser();
      user = retryUser.data.user;
    }
    if (!user) throw new Error('User not authenticated. Please restart the app or sign in.');

    const { data, error } = await supabase
      .from('user_vehicle')
      .insert({
        user_id: user.id,
        brand_id: brandId,
        vehicle_name: vehicleName,
        plate_number: plateNumber || null,
        current_km: initialKm,
      })
      .select('*, master_brand(*)')
      .single();

    if (error) throw error;
    return data;
  },

  /** Alias for createVehicle to maintain backward compatibility. */
  async addVehicle(
    brandId: string,
    vehicleName: string,
    plateNumber: string,
    initialKm: number
  ): Promise<UserVehicle> {
    return this.createVehicle(brandId, vehicleName, plateNumber, initialKm);
  },

  /** Update the current KM with concurrency protection and log the update. */
  async updateKm(
    vehicleId: string,
    newKm: number,
    lastKnownKm?: number
  ): Promise<{ success: boolean; currentKm?: number; reason?: string }> {
    // 1. Try atomic database RPC function if installed
    try {
      const { data, error } = await supabase.rpc('update_odometer', {
        p_vehicle_id: vehicleId,
        p_new_km: newKm,
        p_last_known_km: lastKnownKm ?? (newKm - 1),
      });

      if (!error && data) {
        return data as { success: boolean; currentKm?: number; reason?: string };
      }
    } catch {
      // RPC not installed yet, proceed to robust fallback
    }

    // 2. Client fallback: verify latest server odometer before writing
    const { data: currentVehicle, error: fetchError } = await supabase
      .from('user_vehicle')
      .select('current_km')
      .eq('id', vehicleId)
      .single();

    if (!fetchError && currentVehicle) {
      if (
        (lastKnownKm !== undefined && currentVehicle.current_km > lastKnownKm) ||
        newKm < currentVehicle.current_km
      ) {
        return {
          success: false,
          currentKm: currentVehicle.current_km,
          reason: 'ODOMETER_STALE',
        };
      }
    }

    const { error: updateError } = await supabase
      .from('user_vehicle')
      .update({
        current_km: newKm,
        last_km_updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId);

    if (updateError) throw updateError;

    const { error: logError } = await supabase
      .from('km_log')
      .insert({ vehicle_id: vehicleId, km_value: newKm });

    if (logError) throw logError;

    return { success: true, currentKm: newKm };
  },

  /** Update vehicle info (name, brand, plate). NOT KM. */
  async updateVehicle(
    vehicleId: string,
    brandId: string,
    vehicleName: string,
    plateNumber: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_vehicle')
      .update({
        brand_id: brandId,
        vehicle_name: vehicleName,
        plate_number: plateNumber || null,
      })
      .eq('id', vehicleId);

    if (error) throw error;
  },

  /** Delete a vehicle and all its data (cascade). */
  async deleteVehicle(vehicleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_vehicle')
      .delete()
      .eq('id', vehicleId);

    if (error) throw error;
  },
};
