import { create } from 'zustand';
import { InboxItem } from '@/types/nomi';

interface InboxState {
  items: InboxItem[];
  activeTab: 'all' | 'voice' | 'notes';
  setActiveTab: (tab: 'all' | 'voice' | 'notes') => void;
  addItem: (item: Omit<InboxItem, 'id'>) => void;
  removeItem: (id: string) => void;
  convertToTask: (id: string) => void;
  convertToEvent: (id: string) => void;
  convertToHabit: (id: string) => void;
  convertToBill: (id: string) => void;
  keepAsNote: (id: string) => void;
}

let itemId = 100;

export const useInboxStore = create<InboxState>((set) => ({
  items: [],
  activeTab: 'all',
  setActiveTab: (tab) => set({ activeTab: tab }),
  addItem: (item) =>
    set((s) => ({
      items: [{ ...item, id: `inv-${itemId++}` }, ...s.items],
    })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  convertToTask: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  convertToEvent: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  convertToHabit: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  convertToBill: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  keepAsNote: () => {}, // no-op, item stays
}));
