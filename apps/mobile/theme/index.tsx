import { createContext, useContext } from 'react';
import { spacing, radius, typography, elevations, warmColors, darkColors, flowBlueColors } from './tokens';
import { useThemeStore } from '@/store/theme';

export type Theme = {
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  elevations: typeof elevations;
  colors: typeof warmColors;
};

function buildTheme(palette: typeof warmColors): Theme {
  return {
    spacing,
    radius,
    typography,
    elevations,
    colors: palette,
  };
}

const FlowThemeContext = createContext<Theme | null>(null);

export function FlowThemeProvider({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: Theme;
}) {
  return (
    <FlowThemeContext.Provider value={theme}>
      {children}
    </FlowThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const flowTheme = useContext(FlowThemeContext);
  if (flowTheme) return flowTheme;

  const screenMode = useThemeStore((s) => s.screenMode);
  const palette = screenMode === 'dark' ? darkColors : warmColors;
  return buildTheme(palette);
}
