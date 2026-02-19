import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nomi_screen_mode';

export type ScreenMode = 'warm' | 'dark';

interface ThemeState {
  screenMode: ScreenMode;
  setScreenMode: (mode: ScreenMode) => void;
  init: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  screenMode: 'warm',

  setScreenMode: async (mode) => {
    set({ screenMode: mode });
    try {
      await AsyncStorage.setItem(KEY, mode);
    } catch {
      // ignore
    }
  },

  init: async () => {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved === 'warm' || saved === 'dark') {
        set({ screenMode: saved });
      } else if (saved === 'purple') {
        set({ screenMode: 'dark' });
        await AsyncStorage.setItem(KEY, 'dark');
      } else if (saved === 'white') {
        set({ screenMode: 'warm' });
        await AsyncStorage.setItem(KEY, 'warm');
      }
    } catch {
      // ignore
    }
  },
}));
