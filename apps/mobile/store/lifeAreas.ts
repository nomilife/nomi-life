import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nomi_life_areas';

const DEFAULT_AREAS = [
  'Health',
  'Career',
  'Learning',
  'Finance',
  'Relationships',
  'Mind',
] as const;

export type LifeArea = string;

interface LifeAreasState {
  areas: LifeArea[];
  setAreas: (areas: LifeArea[]) => void;
  addArea: (name: string) => void;
  removeArea: (name: string) => void;
  init: () => Promise<void>;
}

export const useLifeAreasStore = create<LifeAreasState>((set, get) => ({
  areas: [...DEFAULT_AREAS],

  setAreas: async (areas) => {
    set({ areas });
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(areas));
    } catch {
      // ignore
    }
  },

  addArea: (name) => {
    const { areas } = get();
    if (!name.trim() || areas.includes(name.trim())) return;
    const next = [...areas, name.trim()];
    set({ areas: next });
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  },

  removeArea: (name) => {
    const { areas } = get();
    const next = areas.filter((a) => a !== name);
    set({ areas: next });
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  },

  init: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) set({ areas: parsed });
      }
    } catch {
      // ignore
    }
  },
}));
