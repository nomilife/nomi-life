/**
 * Nomi Design Tokens
 * 8pt spacing system, warm pastel / 70s-80s + modern
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 32, fontWeight: '700' as const },
  title: { fontSize: 24, fontWeight: '600' as const },
  h1: { fontSize: 22, fontWeight: '600' as const },
  h2: { fontSize: 18, fontWeight: '600' as const },
  h3: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
} as const;

export const elevations = {
  1: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  2: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  3: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 },
} as const;

/** Purple mode = dark purple theme (like AI voice command dark design) */
export const purpleColors = {
  background: '#1a1528',
  surface: 'rgba(45, 40, 65, 0.85)',
  surface2: 'rgba(60, 52, 90, 0.75)',
  surfaceTranslucent: 'rgba(45, 40, 65, 0.6)',
  border: '#3d3555',
  textPrimary: '#ffffff',
  textSecondary: '#c4b5fd',
  text: '#ffffff',
  textMuted: '#9f8fcf',
  muted: '#9f8fcf',
  accent: '#a78bfa',
  accent2: '#c4b5fd',
  accentBright: '#b794f6',
  primary: '#a78bfa',
  primaryMuted: '#4c1d95',
  purpleMuted: '#7c3aed',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  financeAlert: 'rgba(127, 29, 29, 0.5)',
  cardBg: 'rgba(45, 40, 65, 0.7)',
  buttonPrimary: '#a78bfa',
  buttonSecondary: 'rgba(45, 40, 65, 0.9)',
  authPrimary: '#facc15',
  authReset: '#fb7185',
} as const;

/** White mode = light white theme (like AI voice command light design) */
export const whiteColors = {
  background: '#ffffff',
  surface: '#ffffff',
  surface2: '#f8f7fa',
  surfaceTranslucent: 'rgba(248, 247, 250, 0.95)',
  border: '#e8e4ef',
  textPrimary: '#1a1d24',
  textSecondary: '#4a5568',
  text: '#1a1d24',
  textMuted: '#8b95a5',
  muted: '#8b95a5',
  accent: '#8B5CF6',
  accent2: '#A366FF',
  accentBright: '#7c3aed',
  primary: '#8B5CF6',
  primaryMuted: '#c4b5fd',
  purpleMuted: '#a78bfa',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  financeAlert: '#fce7f3',
  cardBg: '#ffffff',
  buttonPrimary: '#1a1d24',
  buttonSecondary: '#ffffff',
  authPrimary: '#facc15',
  authReset: '#fb7185',
} as const;

/** NOMI Global UI — warm cream, soft shadows, orange accent */
export const nomiColors = {
  background: '#F5EDE4',
  surface: '#FFFFFF',
  surface2: '#FFF8F0',
  border: '#E8D5C4',
  textPrimary: '#2D3748',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  primary: '#E07C3C',
  primaryMuted: '#FBD38D',
  success: '#38A169',
  warning: '#D69E2E',
  danger: '#E53E3E',
  cardBg: '#FFFFFF',
  pillBorder: 'rgba(224, 124, 60, 0.3)',
  shadow: 'rgba(0, 0, 0, 0.06)',
} as const;

/** 70s-80s retro palette — 2020 modern minimal */
export const retroColors = {
  mustard: '#D4A84B',
  burntSienna: '#C85A2B',
  teal: '#0D9488',
  terracotta: '#C65D38',
  avocado: '#87A96B',
  harvest: '#DA9F4A',
  cream: '#FFF8E7',
  slate: '#2D3748',
} as const;

/** Dark mode — neutral dark grey, accent: turuncu/kahverengi */
export const darkColors = {
  background: '#0f0f12',
  surface: '#1a1a1f',
  surface2: '#242429',
  surfaceTranslucent: 'rgba(26, 26, 31, 0.95)',
  border: '#2d2d35',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0aa',
  text: '#ffffff',
  textMuted: '#6b6b75',
  muted: '#8b8b95',
  accent: '#D97706',
  accent2: '#EA580C',
  accentBright: '#F59E0B',
  primary: '#D97706',
  primaryMuted: '#B45309',
  success: '#D97706',
  warning: '#fbbf24',
  danger: '#f87171',
  financeAlert: 'rgba(127, 29, 29, 0.5)',
  cardBg: 'rgba(26, 26, 31, 0.9)',
  buttonPrimary: '#D97706',
  buttonSecondary: '#1a1a1f',
  tabBarBg: '#0f0f12',
  tabBarActive: '#D97706',
  tabBarInactive: '#6b6b75',
  /** Auth-specific for light yellow sign-in button */
  authPrimary: '#facc15',
  /** Auth coral for reset link */
  authReset: '#fb7185',
} as const;

/** 3rd photo: warm orange/amber + cream + charcoal — 2020 classic modern */
export const warmColors = {
  background: '#F5EDE4',
  surface: '#FFFFFF',
  surface2: '#FFF8F0',
  surfaceTranslucent: 'rgba(255, 248, 240, 0.95)',
  border: '#E8D5C4',
  textPrimary: '#2D3748',
  textSecondary: '#4A5568',
  text: '#2D3748',
  textMuted: '#718096',
  muted: '#A0AEC0',
  accent: '#E07C3C',
  accent2: '#D97706',
  accentBright: '#EA580C',
  primary: '#E07C3C',
  primaryMuted: '#FBD38D',
  success: '#38A169',
  warning: '#D69E2E',
  danger: '#E53E3E',
  financeAlert: '#FED7D7',
  cardBg: '#FFFFFF',
  buttonPrimary: '#E07C3C',
  buttonSecondary: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#E07C3C',
  tabBarInactive: '#718096',
  authPrimary: '#facc15',
  authReset: '#fb7185',
} as const;

/** Stitch / LifeOS 2.4 — pearlescent glass design */
export const flowStitchColors = {
  accentViolet: '#7C3AED',
  accentRose: '#FDA4AF',
  primary: '#6D28D9',
  glassLight: 'rgba(255, 255, 255, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.8)',
  slate300: '#94a3b8',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: '#0f172a',
  emerald500: '#10b981',
  backgroundLight: '#FDFCFE',
};

/** Today's Flow (varsayılan) — mor/violet tema, Stitch uyumlu */
export const flowDefaultColors = {
  background: '#FDFCFE',
  surface: '#FFFFFF',
  surface2: 'rgba(255, 255, 255, 0.6)',
  surfaceTranslucent: 'rgba(255, 255, 255, 0.7)',
  border: '#e8e4ef',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  text: '#1e293b',
  textMuted: '#64748b',
  muted: '#94a3b8',
  accent: '#7C3AED',
  accent2: '#A78BFA',
  accentRose: '#FDA4AF',
  accentBright: '#7c3aed',
  primary: '#7C3AED',
  primaryMuted: '#c4b5fd',
  success: '#10b981',
  warning: '#D69E2E',
  danger: '#E53E3E',
  financeAlert: '#fce7f3',
  cardBg: 'rgba(255, 255, 255, 0.7)',
  buttonPrimary: '#7C3AED',
  buttonSecondary: '#FFFFFF',
  tabBarBg: 'rgba(255, 255, 255, 0.7)',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#64748b',
  authPrimary: '#facc15',
  authReset: '#fb7185',
} as const;

/** Ay görünümü — mavi tema */
export const flowBlueColors = {
  background: '#E8F0F9',
  surface: '#FFFFFF',
  surface2: '#F0F7FF',
  surfaceTranslucent: 'rgba(240, 247, 255, 0.95)',
  border: '#C5D9F0',
  textPrimary: '#1E3A5F',
  textSecondary: '#3B5B7D',
  text: '#1E3A5F',
  textMuted: '#5B7A9E',
  muted: '#7B9AB8',
  accent: '#2563EB',
  accent2: '#3B82F6',
  accentBright: '#60A5FA',
  primary: '#2563EB',
  primaryMuted: '#93C5FD',
  success: '#38A169',
  warning: '#D69E2E',
  danger: '#E53E3E',
  financeAlert: '#DBEAFE',
  cardBg: '#FFFFFF',
  buttonPrimary: '#2563EB',
  buttonSecondary: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#2563EB',
  tabBarInactive: '#5B7A9E',
  authPrimary: '#facc15',
  authReset: '#fb7185',
} as const;

export const colors = {
  light: {
    ...whiteColors,
    background: '#f8f5fc',
    surface: '#ffffff',
    surface2: '#faf8fd',
  },
  dark: {
    ...darkColors,
  },
  purple: purpleColors,
  white: whiteColors,
} as const;
