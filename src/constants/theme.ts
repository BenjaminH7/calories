import '@/global.css';

import { Platform } from 'react-native';

/**
 * Palette inspirée de Cal AI : fond très clair, cartes blanches bordées,
 * typo noire très contrastée, une seule couleur d'accent par métrique.
 */
export const Colors = {
  light: {
    background: '#F6F6F4',
    card: '#FFFFFF',
    cardAlt: '#F1F1EF',
    border: '#E7E7E3',
    text: '#111111',
    textSecondary: '#8A8A83',
    ringTrack: '#EDEDE9',
    accent: '#111111',
    accentText: '#FFFFFF',
    protein: '#E5533D',
    proteinDone: '#1DB954',
    saving: '#F5A524',
    danger: '#E5484D',
    overlay: 'rgba(0,0,0,0.45)',
  },
  dark: {
    background: '#0B0B0C',
    card: '#161618',
    cardAlt: '#1F1F22',
    border: '#26262A',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    ringTrack: '#26262A',
    accent: '#FFFFFF',
    accentText: '#111111',
    protein: '#FF6B52',
    proteinDone: '#2BD965',
    saving: '#FFB24D',
    danger: '#FF5C60',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

export type Theme = Record<keyof typeof Colors.light, string>;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
})!;

export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 44,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/**
 * Hauteur de la zone d'onglets, hors marge de sécurité du bas. Calée sur le
 * contenu réel : 4 (padding) + 22 (icône) + 3 (écart) + 16 (libellé).
 */
export const TAB_BAR_HEIGHT = 50;
