import { useColorScheme } from 'react-native';

/**
 * Two grounds, each measured against its own surface rather than inverted from
 * the other. Warm rather than the usual blue-grey: this is opened at the start
 * and end of a working day, often at a desk lamp.
 */
export type Palette = {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  rule: string;
  accent: string;
  onAccent: string;
  accentWash: string;
  running: string;
  runningWash: string;
};

const light: Palette = {
  bg: '#faf9f6',
  card: '#ffffff',
  ink: '#17160f', // 17.6:1 on bg
  muted: '#6a6960', // 5.3:1 on bg
  rule: '#e2dfd5',
  accent: '#12503f', // 8.9:1 on bg
  onAccent: '#ffffff',
  accentWash: '#e7f0ec',
  running: '#8a4b12', // 5.2:1 on bg
  runningWash: '#fbeee0',
};

const dark: Palette = {
  bg: '#131311',
  card: '#1c1c19',
  ink: '#f1efe8', // 16.0:1 on bg
  muted: '#a2a096', // 7.2:1 on bg
  rule: '#33332c',
  accent: '#6fd0b0', // 10.3:1 on bg
  onAccent: '#0a1f19',
  accentWash: '#15302a',
  running: '#e8a86a', // 9.2:1 on bg
  runningWash: '#2e2317',
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const palettes = { light, dark };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16 };

/**
 * The smallest thing anyone is asked to tap. The platform minimum is 44; this
 * app is used one-handed while doing something else, so nothing goes below it
 * and the primary action is well above.
 */
export const TAP = 48;
