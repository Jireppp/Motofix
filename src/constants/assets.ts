import { ImageSourcePropType } from 'react-native';

export const BRAND_LOGOS_LIGHT: Record<string, ImageSourcePropType> = {
  honda: require('../../assets/images/brands/Honda_light.png'),
  yamaha: require('../../assets/images/brands/yamaha_light.png'),
  suzuki: require('../../assets/images/brands/suzuki_light.png'),
  kawasaki: require('../../assets/images/brands/kawasaki_light.png'),
  tvs: require('../../assets/images/brands/tvs.png'),
  vespa: require('../../assets/images/brands/vespa_light.png'),
  lainnya: require('../../assets/images/brands/lainnya.png'),
  default: require('../../assets/images/brands/lainnya.png'),
};

export const BRAND_LOGOS_DARK: Record<string, ImageSourcePropType> = {
  honda: require('../../assets/images/brands/Honda_dark.png'),
  yamaha: require('../../assets/images/brands/yamaha_dark.png'),
  suzuki: require('../../assets/images/brands/suzuki_dark.png'),
  kawasaki: require('../../assets/images/brands/kawasaki_dark.png'),
  tvs: require('../../assets/images/brands/tvs.png'),
  vespa: require('../../assets/images/brands/vespa_dark.png'),
  lainnya: require('../../assets/images/brands/lainnya.png'),
  default: require('../../assets/images/brands/lainnya.png'),
};

export const EMPTY_STATE_ICONS = {
  garage: require('../../assets/images/icons/empty-garage.webp'),
  parts: require('../../assets/images/icons/empty-parts.webp'),
  history: require('../../assets/images/icons/empty-history.webp'),
} as const;

// Sparepart icon mapping (256x256 transparent WebP glyphs)
export const SPAREPART_ICONS: Record<string, ImageSourcePropType> = {
  oil: require('../../assets/images/spareparts/engine-oil.webp'),
  'engine-oil': require('../../assets/images/spareparts/engine-oil.webp'),
  'gear-oil': require('../../assets/images/spareparts/gear-oil.webp'),
  brake: require('../../assets/images/spareparts/breake-pads.webp'),
  'brake-pads': require('../../assets/images/spareparts/breake-pads.webp'),
  'brake-fluid': require('../../assets/images/spareparts/brake-fluid.webp'),
  belt: require('../../assets/images/spareparts/cvt-belt.webp'),
  'cvt-belt': require('../../assets/images/spareparts/cvt-belt.webp'),
  spark: require('../../assets/images/spareparts/spark-plug.webp'),
  'spark-plug': require('../../assets/images/spareparts/spark-plug.webp'),
  filter: require('../../assets/images/spareparts/air-filter.webp'),
  'air-filter': require('../../assets/images/spareparts/air-filter.webp'),
  roller: require('../../assets/images/spareparts/roller.webp'),
  coolant: require('../../assets/images/spareparts/radiator-coolant.webp'),
  'radiator-coolant': require('../../assets/images/spareparts/radiator-coolant.webp'),
  battery: require('../../assets/images/spareparts/battery.webp'),
  'generic-part': require('../../assets/images/spareparts/generic-part.webp'),
  default: require('../../assets/images/spareparts/generic-part.webp'),
};

export const getBrandImage = (imageUrl: string, isDark: boolean = false): ImageSourcePropType => {
  const logos = isDark ? BRAND_LOGOS_DARK : BRAND_LOGOS_LIGHT;
  return logos[imageUrl?.toLowerCase()] || logos.default;
};

export const getSparepartIcon = (nameOrKey?: string): ImageSourcePropType => {
  if (!nameOrKey) return SPAREPART_ICONS.default;
  const key = nameOrKey.toLowerCase().trim();

  if (SPAREPART_ICONS[key]) {
    return SPAREPART_ICONS[key];
  }

  if (key.includes('gardan') || key.includes('gearbox') || key.includes('gear oil')) {
    return SPAREPART_ICONS['gear-oil'];
  }
  if (key.includes('oli') || key.includes('engine oil') || key.includes('oil')) {
    return SPAREPART_ICONS['engine-oil'];
  }
  if (key.includes('minyak rem') || key.includes('brake fluid') || key.includes('fluid')) {
    return SPAREPART_ICONS['brake-fluid'];
  }
  if (key.includes('rem') || key.includes('brake') || key.includes('kampas')) {
    return SPAREPART_ICONS['brake-pads'];
  }
  if (key.includes('belt') || key.includes('rantai') || key.includes('chain')) {
    return SPAREPART_ICONS['cvt-belt'];
  }
  if (key.includes('roller')) {
    return SPAREPART_ICONS.roller;
  }
  if (key.includes('busi') || key.includes('spark')) {
    return SPAREPART_ICONS['spark-plug'];
  }
  if (key.includes('filter') || key.includes('udara')) {
    return SPAREPART_ICONS['air-filter'];
  }
  if (key.includes('radiator') || key.includes('coolant') || key.includes('pendingin')) {
    return SPAREPART_ICONS['radiator-coolant'];
  }
  if (key.includes('aki') || key.includes('battery') || key.includes('baterai')) {
    return SPAREPART_ICONS.battery;
  }

  return SPAREPART_ICONS.default;
};

