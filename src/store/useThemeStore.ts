import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl: string | null;
  brandName: string;

  // Premium dark theme tokens
  bg: string;
  surface: string;
  surfaceHi: string;
  surfaceLo: string;
  border: string;
  borderStrong: string;
  text: string;
  textDim: string;
  textMuted: string;
  success: string;
  warn: string;
  danger: string;
  primarySoft: string;
  primaryDeep: string;
  accent: string;
}

export const themePalettes = {
  forge: {
    brandName: 'NeoStrength',
    primaryColor: '#F26A3A',
    secondaryColor: '#B84418',
    primarySoft: 'rgba(242, 106, 58, 0.14)',
    primaryDeep: '#B84418',
    accent: '#FFB37A',
  },
  crimson: {
    brandName: 'Pulse Atelier',
    primaryColor: '#EF4444',
    secondaryColor: '#9F1239',
    primarySoft: 'rgba(239, 68, 68, 0.14)',
    primaryDeep: '#9F1239',
    accent: '#FCA5A5',
  },
  forest: {
    brandName: 'Verde Lab',
    primaryColor: '#34D399',
    secondaryColor: '#065F46',
    primarySoft: 'rgba(52, 211, 153, 0.14)',
    primaryDeep: '#065F46',
    accent: '#A7F3D0',
  },
  ocean: {
    brandName: 'Tide Studio',
    primaryColor: '#60A5FA',
    secondaryColor: '#1E40AF',
    primarySoft: 'rgba(96, 165, 250, 0.14)',
    primaryDeep: '#1E40AF',
    accent: '#BAE6FD',
  },
};

export const getThemeColors = (isDark: boolean, primaryColor: string, secondaryColor: string) => {
  if (isDark) {
    return {
      backgroundColor: '#0A0B0E',
      textColor: '#F4F2EC',
      bg: '#0A0B0E',
      surface: '#13151B',
      surfaceHi: '#1B1E27',
      surfaceLo: '#0F1116',
      border: 'rgba(255,255,255,0.06)',
      borderStrong: 'rgba(255,255,255,0.12)',
      text: '#F4F2EC',
      textDim: '#9097A4',
      textMuted: '#5A6070',
      success: '#5BD37C',
      warn: '#F4B23B',
      danger: '#F4625C',
      primarySoft: `${primaryColor}24`, // ~14% opacidade
      primaryDeep: secondaryColor || primaryColor,
      accent: primaryColor,
    };
  } else {
    return {
      backgroundColor: '#F8F9FA',
      textColor: '#1A1C20',
      bg: '#F8F9FA',
      surface: '#FFFFFF',
      surfaceHi: '#F1F3F5',
      surfaceLo: '#FFFFFF',
      border: 'rgba(0,0,0,0.08)',
      borderStrong: 'rgba(0,0,0,0.14)',
      text: '#1A1C20',
      textDim: '#5A6070',
      textMuted: '#8890A0',
      success: '#22C55E',
      warn: '#EAB308',
      danger: '#EF4444',
      primarySoft: `${primaryColor}18`, // slightly lighter opacidade for light mode
      primaryDeep: secondaryColor || primaryColor,
      accent: primaryColor,
    };
  }
};

export const defaultTheme: ThemeConfig = {
  primaryColor: '#F26A3A', // Forge / NeoStrength por padrão
  secondaryColor: '#B84418',
  logoUrl: null,
  brandName: 'NeoStrength',
  ...getThemeColors(true, '#F26A3A', '#B84418'),
};

interface ThemeState {
  theme: ThemeConfig;
  isDarkMode: boolean;
  setTheme: (newTheme: Partial<ThemeConfig>) => void;
  toggleThemeMode: () => void;
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: { ...defaultTheme },
      isDarkMode: true,
      setTheme: (newTheme) =>
        set((state) => {
          const merged = { ...state.theme, ...newTheme };
          const modeColors = getThemeColors(
            state.isDarkMode,
            merged.primaryColor,
            merged.secondaryColor
          );
          return {
            ...state,
            theme: { ...merged, ...modeColors, ...newTheme },
          };
        }),
      toggleThemeMode: () =>
        set((state) => {
          const nextMode = !state.isDarkMode;
          const modeColors = getThemeColors(
            nextMode,
            state.theme.primaryColor,
            state.theme.secondaryColor
          );
          return {
            ...state,
            isDarkMode: nextMode,
            theme: { ...state.theme, ...modeColors },
          };
        }),
      resetTheme: () =>
        set((state) => {
          return {
            ...state,
            isDarkMode: true,
            theme: { ...defaultTheme },
          };
        }),
    }),
    {
      name: 'fitapp-theme-storage-premium-dark-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
