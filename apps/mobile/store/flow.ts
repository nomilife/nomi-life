/**
 * Flow store - holds derived/computed values from timeline API.
 * Timeline data comes from useQuery in Flow screen; this store is for
 * brief summary, progress, focus mode that we compute or will get from API.
 */
import { create } from 'zustand';

interface FlowState {
  dailyProgress: number;
  focusModeMinutes: number;
  briefSummary: string;
  userName: string;
  setBriefFromItems: (itemCount: number, overdueCount: number, workoutTime?: string) => void;
  setUserName: (name: string) => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  dailyProgress: 0,
  focusModeMinutes: 0,
  briefSummary: '',
  userName: '',
  setBriefFromItems: (itemCount, overdueCount, workoutTime) => {
    const parts: string[] = [];
    if (itemCount > 0) parts.push(`${itemCount} görev/etkinlik`);
    if (overdueCount > 0) parts.push(`${overdueCount} vadesi geçmiş fatura`);
    if (workoutTime) parts.push(`${workoutTime}'de antrenman`);
    const summary = parts.length > 0
      ? `Bugün ${parts.join(', ')} var. Düzenlememi ister misin?`
      : 'Bugün için henüz bir plan yok. Planlamama yardımcı olalım mı?';
    set({ briefSummary: summary });
  },
  setUserName: (name) => set({ userName: name || 'there' }),
}));
