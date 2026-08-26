import { supabase } from '../lib/supabase';
import { UserVehicle, MasterBrand } from '../types';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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

  /** Update the current KM and log the update. */
  async updateKm(vehicleId: string, newKm: number): Promise<void> {
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
