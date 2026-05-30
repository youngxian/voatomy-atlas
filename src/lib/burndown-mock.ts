import { CheckCircle2, Circle, Loader2, Ban } from 'lucide-react';
import type { BurndownSnapshot } from '@/lib/api';

export type TicketStatus = 'done' | 'in_progress' | 'todo' | 'blocked';

export interface SprintTicket {
  id: string;
  title: string;
  points: number;
  assignee: string;
  assigneeInitials: string;
  avatarColor: string;
  status: TicketStatus;
  completedDay?: number;
  confidence: number;
  module: string;
}

export interface DayData {
  day: number;
  date: string;
  remaining: number;
  completed: number;
  cumulative: number;
  ticketsCompleted: string[];
  isPast: boolean;
  isToday: boolean;
}

export const sprintTickets: SprintTicket[] = [
  { id: 'COMP-211', title: 'Implement OAuth2 refresh token flow', points: 5, assignee: 'Alex Chen', assigneeInitials: 'AC', avatarColor: '#22C55E', status: 'done', completedDay: 1, confidence: 100, module: 'auth/' },
  { id: 'COMP-212', title: 'Add rate limiting middleware', points: 3, assignee: 'Jordan Lee', assigneeInitials: 'JL', avatarColor: '#06b6d4', status: 'done', completedDay: 2, confidence: 100, module: 'api/' },
  { id: 'COMP-213', title: 'Dashboard performance optimization', points: 8, assignee: 'Sarah Kim', assigneeInitials: 'SK', avatarColor: '#8b5cf6', status: 'done', completedDay: 3, confidence: 100, module: 'dashboard/' },
  { id: 'COMP-214', title: 'User notification preferences API', points: 5, assignee: 'Priya Patel', assigneeInitials: 'PP', avatarColor: '#ec4899', status: 'done', completedDay: 4, confidence: 100, module: 'notifications/' },
  { id: 'COMP-215', title: 'Migrate legacy payment endpoints', points: 3, assignee: 'Marcus Wright', assigneeInitials: 'MW', avatarColor: '#10b981', status: 'done', completedDay: 5, confidence: 100, module: 'payments/' },
  { id: 'COMP-216', title: 'Real-time WebSocket event system', points: 8, assignee: 'Alex Chen', assigneeInitials: 'AC', avatarColor: '#22C55E', status: 'in_progress', confidence: 85, module: 'core/' },
  { id: 'COMP-217', title: 'Payment gateway failover logic', points: 5, assignee: 'Jordan Lee', assigneeInitials: 'JL', avatarColor: '#06b6d4', status: 'in_progress', confidence: 62, module: 'payments/' },
  { id: 'COMP-218', title: 'E2E test suite for checkout flow', points: 5, assignee: 'Priya Patel', assigneeInitials: 'PP', avatarColor: '#ec4899', status: 'todo', confidence: 78, module: 'testing/' },
  { id: 'COMP-220', title: 'Database index optimization', points: 3, assignee: 'Marcus Wright', assigneeInitials: 'MW', avatarColor: '#10b981', status: 'blocked', confidence: 55, module: 'database/' },
];

export const burndownData: DayData[] = [
  { day: 1, date: 'Feb 17', remaining: 45, completed: 0, cumulative: 0, ticketsCompleted: [], isPast: true, isToday: false },
  { day: 2, date: 'Feb 18', remaining: 40, completed: 5, cumulative: 5, ticketsCompleted: ['COMP-211'], isPast: true, isToday: false },
  { day: 3, date: 'Feb 19', remaining: 37, completed: 3, cumulative: 8, ticketsCompleted: ['COMP-212'], isPast: true, isToday: false },
  { day: 4, date: 'Feb 20', remaining: 29, completed: 8, cumulative: 16, ticketsCompleted: ['COMP-213'], isPast: true, isToday: false },
  { day: 5, date: 'Feb 21', remaining: 24, completed: 5, cumulative: 21, ticketsCompleted: ['COMP-214'], isPast: true, isToday: false },
  { day: 6, date: 'Feb 24', remaining: 21, completed: 3, cumulative: 24, ticketsCompleted: ['COMP-215'], isPast: false, isToday: true },
  { day: 7, date: 'Feb 25', remaining: 16, completed: 5, cumulative: 29, ticketsCompleted: [], isPast: false, isToday: false },
  { day: 8, date: 'Feb 26', remaining: 10, completed: 6, cumulative: 35, ticketsCompleted: [], isPast: false, isToday: false },
  { day: 9, date: 'Feb 27', remaining: 5, completed: 5, cumulative: 40, ticketsCompleted: [], isPast: false, isToday: false },
  { day: 10, date: 'Feb 28', remaining: 0, completed: 5, cumulative: 45, ticketsCompleted: [], isPast: false, isToday: false },
];

export const totalPoints = 45;
export const completedPoints = 24;
export const todayIndex = 5;

export function statusConfig(status: TicketStatus) {
  switch (status) {
    case 'done':
      return { label: 'Done', color: 'var(--success)', bg: 'bg-success/10', border: 'border-success/20', icon: CheckCircle2 };
    case 'in_progress':
      return { label: 'In Progress', color: 'var(--primary)', bg: 'bg-primary/10', border: 'border-primary/20', icon: Loader2 };
    case 'todo':
      return { label: 'To Do', color: 'var(--muted-foreground)', bg: 'bg-muted-foreground/10', border: 'border-muted-foreground/20', icon: Circle };
    case 'blocked':
      return { label: 'Blocked', color: 'var(--destructive)', bg: 'bg-destructive/10', border: 'border-destructive/20', icon: Ban };
  }
}

export function mapTicketStatus(apiStatus: string): TicketStatus {
  if (!apiStatus) return 'todo';
  const s = String(apiStatus).toLowerCase();
  switch (s) {
    case 'done': return 'done';
    case 'in_progress': case 'in_review': return 'in_progress';
    case 'blocked': return 'blocked';
    case 'backlog': case 'todo': case 'cancelled': default: return 'todo';
  }
}

export const AVATAR_COLORS = ['#22C55E', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export interface BuildDayDataOptions {
  start_date?: string;
  end_date?: string;
  total_points?: number;
  completed_points?: number;
}

/** Build day-by-day burndown data from snapshots. When snapshots are empty but we have sprint dates and points, synthesizes a minimal chart. */
export function buildDayData(
  snapshots: BurndownSnapshot[],
  opts?: BuildDayDataOptions
): { days: DayData[]; todayIdx: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const list = snapshots ?? [];
  if (list.length === 0) {
    // No snapshots: synthesize from sprint range + current points if we have them
    if (opts?.start_date && opts?.end_date && opts.total_points != null) {
      const start = new Date(opts.start_date);
      const end = new Date(opts.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
      const completed = opts.completed_points ?? 0;
      const remaining = Math.max(0, opts.total_points - completed);

      const days: DayData[] = [];
      let todayIdx = 0;
      for (let i = 0; i <= totalDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        d.setHours(0, 0, 0, 0);
        const isPast = d < today;
        const isToday = d.getTime() === today.getTime();
        if (isToday) todayIdx = i;
        days.push({
          day: i + 1,
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          remaining,
          completed: 0,
          cumulative: completed,
          ticketsCompleted: [],
          isPast,
          isToday,
        });
      }
      return { days, todayIdx: Math.max(0, todayIdx) };
    }
    return { days: burndownData, todayIdx: todayIndex };
  }

  const days: DayData[] = list.map((snap, i) => {
    const d = new Date(snap.snapshot_date);
    d.setHours(0, 0, 0, 0);
    const isPast = d < today;
    const isToday = d.getTime() === today.getTime();
    const prev = i > 0 ? list[i - 1] : null;
    const dayCompleted = prev ? snap.points_completed - prev.points_completed : 0;
    return {
      day: i + 1,
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      remaining: snap.points_remaining,
      completed: Math.max(0, dayCompleted),
      cumulative: snap.points_completed,
      ticketsCompleted: [],
      isPast,
      isToday,
    };
  });

  let todayIdx = days.findIndex((d) => d.isToday);
  if (todayIdx < 0) todayIdx = days.filter((d) => d.isPast).length - 1;
  if (todayIdx < 0) todayIdx = 0;

  return { days, todayIdx: Math.max(0, todayIdx) };
}
