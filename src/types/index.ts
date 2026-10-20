// ============================================
// Database Types (matching Supabase schema v1.1)
// ============================================

export interface MasterBrand {
  id: string;
  brand_name: string;
  image_url: string;
  created_at: string;
}

export interface MasterData {
  id: string;
  sparepart_name: string;
  default_interval: number;
  category: string | null;
  icon_name: string;
  created_at: string;
}

export type MasterSparepart = MasterData;
export type MasterCategory = string;

export interface UserVehicle {
  id: string;
  user_id: string;
  brand_id: string;
  vehicle_name: string;
  plate_number: string | null;
  current_km: number;
  last_km_updated_at: string;
  created_at: string;
  // Joined fields
  master_brand?: MasterBrand;
}

export interface VehicleSparepart {
  id: string;
  vehicle_id: string;
  master_data_id: string;
  custom_name?: string | null;
  custom_interval: number;
  km_at_setup: number;
  date_at_setup: string;
  status: 'Normal' | 'Warning' | 'Overdue';
  created_at: string;
  updated_at: string;
}

export interface KmLog {
  id: string;
  vehicle_id: string;
  km_value: number;
  recorded_at: string;
}

export interface MaintenanceLog {
  id: string;
  sparepart_id: string;
  km_at_replacement: number;
  brand_name: string;
  replaced_at: string;
  cost?: number;
}

// ============================================
// Computed / UI Types
// ============================================

export interface SparepartWithDetails extends VehicleSparepart {
  master_data: MasterData;
  remaining_km: number;
}

export type SparepartStatus = 'Normal' | 'Warning' | 'Overdue';
