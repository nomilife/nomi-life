import { create } from 'zustand';
import { ChatMessage, AiProposalCard } from '@/types/nomi';

interface ChatState {
  messages: ChatMessage[];
  proposalCard: AiProposalCard | null;
  /** Voice modal'dan Copilot'a yönlendirilen soru - null değilse auto-send yapılacak */
  pendingQuery: string | null;
  addMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  setProposalCard: (card: AiProposalCard | null) => void;
  confirmProposal: () => void;
  setPendingQuery: (q: string | null) => void;
}

let msgId = 100;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  proposalCard: null,
  pendingQuery: null,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, { ...msg, id: `m${msgId++}` }] })),
  setProposalCard: (card) => set({ proposalCard: card }),
  confirmProposal: () => set({ proposalCard: null }),
  setPendingQuery: (q) => set({ pendingQuery: q }),
}));
