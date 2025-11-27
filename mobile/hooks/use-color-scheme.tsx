import React, { createContext, useContext, useMemo, useState } from 'react';
import { Appearance, useColorScheme as useRNColorScheme } from 'react-native';

type Scheme = 'light' | 'dark';

type ColorSchemeContextValue = {
  colorScheme: Scheme;
  source: 'system' | 'manual';
  setColorScheme: (scheme: Scheme) => void;
  useSystem: () => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | undefined>(undefined);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme() ?? (Appearance.getColorScheme() as Scheme) ?? 'light';
  const [manual, setManual] = useState<Scheme | null>(null);

  const value = useMemo<ColorSchemeContextValue>(() => {
    const colorScheme = manual ?? systemScheme;
    return {
      colorScheme,
      source: manual ? 'manual' : 'system',
      setColorScheme: (scheme: Scheme) => setManual(scheme),
      useSystem: () => setManual(null),
    };
  }, [manual, systemScheme]);

  return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>;
}

export function useColorScheme(): Scheme {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    throw new Error('useColorScheme must be used within ColorSchemeProvider');
  }
  return ctx.colorScheme;
}

export function useColorSchemeControls() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    throw new Error('useColorSchemeControls must be used within ColorSchemeProvider');
  }
  return ctx;
}
