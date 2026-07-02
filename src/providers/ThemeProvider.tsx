import React, { createContext, useContext } from 'react';
import { useThemeStore, ThemeConfig, defaultTheme } from '../store/useThemeStore';

const ThemeContext = createContext<ThemeConfig>(defaultTheme);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Reatividade automática vinda da store do Zustand.
  // Ao alterar o tema, todos os componentes que utilizam o hook useTheme() serão atualizados instantaneamente.
  const theme = useThemeStore((state) => state.theme);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeConfig {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}
