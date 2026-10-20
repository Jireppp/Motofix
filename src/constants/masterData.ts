// Fallback master data (used if Supabase fetch fails)
export const DEFAULT_SPAREPARTS = [
  { sparepart_name: 'Oli Mesin', default_interval: 2000, category: 'Pelumas' },
  { sparepart_name: 'Kampas Rem Depan', default_interval: 15000, category: 'Rem' },
  { sparepart_name: 'Kampas Rem Belakang', default_interval: 15000, category: 'Rem' },
  { sparepart_name: 'V-Belt', default_interval: 20000, category: 'Transmisi' },
  { sparepart_name: 'Busi', default_interval: 8000, category: 'Kelistrikan' },
  { sparepart_name: 'Filter Udara', default_interval: 8000, category: 'Mesin' },
  { sparepart_name: 'Oli Gardan', default_interval: 8000, category: 'Pelumas' },
  { sparepart_name: 'Roller', default_interval: 20000, category: 'Transmisi' },
  { sparepart_name: 'Air Radiator', default_interval: 20000, category: 'Pendingin' },
] as const;
