/**
 * NOMI Data Models — Screen A (Chat), B (Flow), C (Inbox)
 */

export type InboxItemType = 'voice' | 'note' | 'imported_email';
export type AiLabel = 'IDEA' | 'REFLECTION' | 'BILL';

export interface InboxItem {
  id: string;
  type: InboxItemType;
  title?: string;
  content: string;
  createdAt: string;
  aiLabel?: AiLabel;
  attachments?: { type: 'image'; uri: string }[];
  /** For imported_email */
  from?: string;
  /** For imported_email: amount due */
  amount?: number;
  /** For voice: duration seconds */
  durationSeconds?: number;
}

export type BillStatus = 'paid' | 'unpaid' | 'overdue';

export interface Bill {
  id: string;
  vendor: string;
  title?: string;
  dueDate: string;
  amount: number;
  currency?: string;
  status: BillStatus;
  source?: 'email' | 'manual';
}

export type EventIconType = 'coffee' | 'gym' | 'meeting' | 'default';

export interface Event {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  iconType?: EventIconType;
  location?: string;
}

export interface Habit {
  id: string;
  title: string;
  completedToday: boolean;
  streak: number;
}

export interface FlowTimelineItem {
  id: string;
  kind: 'bill' | 'event' | 'habit' | 'task';
  bill?: Bill;
  event?: Event;
  habit?: Habit;
  task?: { id: string; title: string; completed: boolean };
  time: string; // HH:mm
  /** For event: "14:00 – 15:00" */
  timeRange?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ScheduleProposalItem {
  id: string;
  time: string;
  title: string;
  subtitle: string;
}

export interface AiProposalCard {
  id: string;
  title: string;
  items: ScheduleProposalItem[];
  rationale?: string;
}
