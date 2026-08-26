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

export const THEME_ICONS = {
  light: require('../../assets/images/icons/Light.png'),
  dark: require('../../assets/images/icons/dark.png'),
  system: require('../../assets/images/icons/sistem.png'),
};

// Sparepart icon mapping
export const SPAREPART_ICONS: Record<string, ImageSourcePropType> = {
  oil: require('../../assets/images/spareparts/engine_oil.png'),
  brake: require('../../assets/images/spareparts/brake_pads.png'),
  belt: require('../../assets/images/spareparts/cvt_belt.png'),
  spark: require('../../assets/images/spareparts/spark_plug.png'),
  filter: require('../../assets/images/spareparts/Air_Filter.png'),
  roller: require('../../assets/images/spareparts/Roller.png'),
  coolant: require('../../assets/images/spareparts/radiator_coolant.png'),
  default: require('../../assets/images/spareparts/engine_oil.png'),
};

export const getBrandImage = (imageUrl: string, isDark: boolean = false): ImageSourcePropType => {
  const logos = isDark ? BRAND_LOGOS_DARK : BRAND_LOGOS_LIGHT;
  return logos[imageUrl?.toLowerCase()] || logos.default;
};

export const getSparepartIcon = (iconName: string): ImageSourcePropType => {
  return SPAREPART_ICONS[iconName] || SPAREPART_ICONS.default;
};
