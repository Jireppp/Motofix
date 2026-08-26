// ─── MOTOFIX Design System: Instrument-Panel Brutalism ───────────────────
// A dash-mounted diagnostic unit: stamped plates, bolted bezels,
// split-flap odometer, hazard tape, label-maker tags.

const brutalistColors = {
  // Base backgrounds
  bg: '#07090C',
  surface1: '#101317',
  surface2: '#181C21',
  surface3: '#20252B',
  surface4: '#282E35',
  overlay: 'rgba(4,5,7,0.8)',

  // Borders
  border: '#262B31',
  borderStrong: '#454C55',

  // Primary
  primary: '#1449FF',
  primaryHover: '#0F39D6',
  primaryContainer: '#0E1B4D',
  onPrimaryContainer: '#9FB4FF',

  // Text
  textPrimary: '#EDEFF2',
  textSecondary: '#8A919B',
  textTertiary: '#565C64',

  // Status
  success: '#3FA66B',
  successContainer: '#10231A',
  warning: '#E0A526',
  warningContainer: '#2B2109',
  danger: '#E23B34',
  dangerContainer: '#2B1412',

  // Maintaining old property names to avoid breaking all existing components at once, 
  // but mapping them to the new brutalist colors
  surface: '#07090C',         // mapped to bg
  surfaceLow: '#101317',      // mapped to surface1
  surfaceHigh: '#181C21',     // mapped to surface2
  surfaceHighest: '#20252B',  // mapped to surface3
  
  primaryDark: '#0E1B4D',
  dangerBg: '#2B1412',

  text: '#EDEFF2',
  textSecondaryOld: '#8A919B',
  textMuted: '#565C64',
  textInverse: '#07090C',

  blueAccent: '#1449FF',
  goldAccent: '#E0A526',
  white: '#EDEFF2',
  black: '#07090C',

  gradientStart: '#1449FF',
  gradientEnd: '#0F39D6',
};

// Light Mode Modern Minimalist Colors
const lightMinimalistColors = {
  // Base backgrounds
  bg: '#FFFFFF',
  surface1: '#F7F9FC',
  surface2: '#EFF2F5',
  surface3: '#E4E7EB',
  surface4: '#D7DBDF',
  overlay: 'rgba(255,255,255,0.85)',

  // Borders
  border: '#EAECEF',
  borderStrong: '#D0D5DB',

  // Primary
  primary: '#1449FF',
  primaryHover: '#0F39D6',
  primaryContainer: '#EDF1FF',
  onPrimaryContainer: '#0B298C',

  // Text
  textPrimary: '#111418',
  textSecondary: '#4A5568',
  textTertiary: '#718096',

  // Status
  success: '#276749',
  successContainer: '#C6F6D5',
  warning: '#B7791F',
  warningContainer: '#FEEBC8',
  danger: '#9B2C2C',
  dangerContainer: '#FED7D7',

  // Maintaining old property names
  surface: '#FFFFFF',
  surfaceLow: '#F7F9FC',
  surfaceHigh: '#EFF2F5',
  surfaceHighest: '#E4E7EB',
  
  primaryDark: '#EDF1FF',
  dangerBg: '#FED7D7',

  text: '#111418',
  textSecondaryOld: '#4A5568',
  textMuted: '#718096',
  textInverse: '#FFFFFF',

  blueAccent: '#1449FF',
  goldAccent: '#B7791F',
  white: '#FFFFFF',
  black: '#000000',

  gradientStart: '#1449FF',
  gradientEnd: '#0F39D6',
};

export const darkColors = brutalistColors;
export const lightColors = lightMinimalistColors;

export const COLORS = brutalistColors;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 40,
};

export const BORDER_RADIUS = {
  sm: 3,
  md: 5,
  lg: 7,
  full: 9999,
  // Adding old properties
  xs: 3,
  xl: 12,
};

export const FONT_FAMILY = {
  display: 'Rajdhani_700Bold',
  body: 'IBMPlexSans_400Regular',
  bodyBold: 'IBMPlexSans_700Bold',
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_700Bold',
};

export const FONT_SIZE = {
  xxs: 9,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 21,
  xxl: 29,
  display: 42,
  hero: 56,
};

// Brutalist Hard Shadows
export const SHADOWS = {
  hard: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 0,
    elevation: 5,
  },
  hardSm: {
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 4,
  }
};

export const LABEL_STYLE = {
  fontFamily: FONT_FAMILY.monoBold,
  fontSize: 10.5,
  letterSpacing: 1.6,
  textTransform: 'uppercase' as const,
  color: COLORS.textTertiary,
};
