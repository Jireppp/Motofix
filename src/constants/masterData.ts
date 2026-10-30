// Fallback master data (used if Supabase fetch fails)
export const DEFAULT_SPAREPARTS = [
  { sparepart_name: 'Engine Oil', default_interval: 2000, category: 'Lubricants' },
  { sparepart_name: 'Front Brake Pads', default_interval: 15000, category: 'Brakes' },
  { sparepart_name: 'Rear Brake Pads', default_interval: 15000, category: 'Brakes' },
  { sparepart_name: 'CVT Belt', default_interval: 20000, category: 'Transmission' },
  { sparepart_name: 'Spark Plug', default_interval: 8000, category: 'Electrical' },
  { sparepart_name: 'Air Filter', default_interval: 8000, category: 'Engine' },
  { sparepart_name: 'Gear Oil', default_interval: 8000, category: 'Lubricants' },
  { sparepart_name: 'Roller', default_interval: 20000, category: 'Transmission' },
  { sparepart_name: 'Radiator Coolant', default_interval: 20000, category: 'Cooling' },
] as const;

// ─── English display names ────────────────────────────────────────────
// The official catalog stored in Supabase uses Indonesian names. The UI must be
// English, so official catalog rows are translated at read time. Names typed by
// the user (custom parts) are never translated.

const SPAREPART_NAME_EN: Record<string, string> = {
  'ban': 'Tire',
  'oli mesin': 'Engine Oil',
  'kampas rem depan': 'Front Brake Pads',
  'kampas rem belakang': 'Rear Brake Pads',
  'v-belt': 'CVT Belt',
  'busi': 'Spark Plug',
  'filter udara': 'Air Filter',
  'oli gardan': 'Gear Oil',
  'roller': 'Roller',
  'air radiator': 'Radiator Coolant',
};

const CATEGORY_EN: Record<string, string> = {
  'lainnya': 'Other',
  'pelumas': 'Lubricants',
  'rem': 'Brakes',
  'transmisi': 'Transmission',
  'kelistrikan': 'Electrical',
  'mesin': 'Engine',
  'pendingin': 'Cooling',
};

const BRAND_EN: Record<string, string> = {
  'lainnya': 'Other',
};

export const localizeSparepartName = (name?: string | null): string => {
  if (!name) return '';
  return SPAREPART_NAME_EN[name.trim().toLowerCase()] || name;
};

export const localizeCategory = (category?: string | null): string => {
  if (!category) return 'Other';
  return CATEGORY_EN[category.trim().toLowerCase()] || category;
};

export const localizeBrandName = (name?: string | null): string => {
  if (!name) return '';
  return BRAND_EN[name.trim().toLowerCase()] || name;
};
