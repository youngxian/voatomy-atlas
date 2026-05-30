export type WbTool = 'select' | 'pan' | 'pen' | 'sticky' | 'text' | 'eraser' | 'rect' | 'circle' | 'line';
export type StickyColor = 'green' | 'yellow' | 'orange' | 'blue' | 'pink' | 'purple';

export type RetroColumnId = 'www' | 'cia' | 'action';

export interface StickyNoteData {
  id: string;
  text: string;
  x: number;
  y: number;
  color: StickyColor;
  author: string;
  authorInitials: string;
  width: number;
  height: number;
  rotation: number;
  columnId?: RetroColumnId;
}

export interface DrawPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface WbTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

export interface RetroItem {
  id: string;
  text: string;
  votes: number;
  author: string;
  authorInitials: string;
  authorColor: string;
}

export interface ActionItem {
  id: string;
  text: string;
  owner: string;
  ownerInitials: string;
  ownerColor: string;
  due: string;
  votes: number;
  /** When action is tracked to a board ticket */
  externalTicketId?: string;
  externalTicketUrl?: string;
  completed?: boolean;
}

export interface TeamMood {
  name: string;
  initials: string;
  color: string;
  mood: number;
  role: string;
}

export interface PreviousRetro {
  sprint: string;
  mood: number;
  theme: string;
  topAction: string;
  date: string;
}

export const STICKY_COLORS: Record<StickyColor, { bg: string; border: string; text: string }> = {
  green: { bg: 'color-mix(in srgb, var(--success) 15%, transparent)', border: 'color-mix(in srgb, var(--success) 38%, transparent)', text: 'var(--success)' },
  yellow: { bg: 'color-mix(in srgb, var(--warning) 15%, transparent)', border: 'color-mix(in srgb, var(--warning) 38%, transparent)', text: 'var(--warning)' },
  orange: { bg: 'color-mix(in srgb, var(--primary) 15%, transparent)', border: 'color-mix(in srgb, var(--primary) 38%, transparent)', text: 'var(--primary)' },
  blue: { bg: 'color-mix(in srgb, var(--primary) 15%, transparent)', border: 'color-mix(in srgb, var(--primary) 38%, transparent)', text: 'var(--primary)' },
  pink: { bg: 'color-mix(in srgb, #ec4899 15%, transparent)', border: 'color-mix(in srgb, #ec4899 38%, transparent)', text: '#ec4899' },
  purple: { bg: 'color-mix(in srgb, var(--primary) 15%, transparent)', border: 'color-mix(in srgb, var(--primary) 38%, transparent)', text: 'var(--primary)' },
};

export const wentWell: RetroItem[] = [
  { id: 'w1', text: 'ATLAS accuracy improved to 82% - best sprint yet', votes: 8, author: 'Alex Chen', authorInitials: 'AC', authorColor: '#f16e2c' },
  { id: 'w2', text: 'Payment flow ticket unblocked within 24 hours of escalation', votes: 6, author: 'Sarah Kim', authorInitials: 'SK', authorColor: '#8b5cf6' },
  { id: 'w3', text: 'Zero production incidents during sprint', votes: 7, author: 'Marcus Johnson', authorInitials: 'MJ', authorColor: '#10b981' },
  { id: 'w4', text: 'Priya shipped mobile nav refactor ahead of schedule', votes: 5, author: 'Jordan Lee', authorInitials: 'JL', authorColor: '#06b6d4' },
  { id: 'w5', text: 'Code review turnaround improved to <4 hours avg', votes: 4, author: 'Priya Patel', authorInitials: 'PP', authorColor: '#ec4899' },
];

export const couldImprove: RetroItem[] = [
  { id: 'i1', text: 'Standup meetings running over 15 minutes on average', votes: 6, author: 'Jordan Lee', authorInitials: 'JL', authorColor: '#06b6d4' },
  { id: 'i2', text: 'COMP-208 carry-over could have been caught earlier', votes: 4, author: 'Alex Chen', authorInitials: 'AC', authorColor: '#f16e2c' },
  { id: 'i3', text: 'Zendesk integration was stale for 3 days before anyone noticed', votes: 5, author: 'Sarah Kim', authorInitials: 'SK', authorColor: '#8b5cf6' },
  { id: 'i4', text: 'Sprint planning took 45 min - should target 30 min', votes: 3, author: 'Marcus Johnson', authorInitials: 'MJ', authorColor: '#10b981' },
];

export const actionItems: ActionItem[] = [
  { id: 'a1', text: 'Set up automated alert for stale integrations', owner: 'Alex Chen', ownerInitials: 'AC', ownerColor: '#f16e2c', due: 'Sprint 25 Week 1', votes: 7 },
  { id: 'a2', text: 'Add mid-sprint pacing check as standard practice', owner: 'Jordan Lee', ownerInitials: 'JL', ownerColor: '#06b6d4', due: 'Sprint 25', votes: 5 },
  { id: 'a3', text: 'Timebox standups to 12 minutes with timer', owner: 'Team', ownerInitials: 'TM', ownerColor: '#8b5cf6', due: 'Immediate', votes: 8 },
  { id: 'a4', text: 'Review payments/ module debt reduction plan', owner: 'Alex + Sarah', ownerInitials: 'A+S', ownerColor: '#ec4899', due: 'Sprint 25 Week 2', votes: 4 },
];

export const teamMoods: TeamMood[] = [
  { name: 'Alex Chen', initials: 'AC', color: '#f16e2c', mood: 4, role: 'Senior Backend' },
  { name: 'Sarah Kim', initials: 'SK', color: '#8b5cf6', mood: 3, role: 'Full-Stack' },
  { name: 'Jordan Lee', initials: 'JL', color: '#06b6d4', mood: 4, role: 'DevOps Lead' },
  { name: 'Priya Patel', initials: 'PP', color: '#ec4899', mood: 5, role: 'Frontend' },
  { name: 'Marcus Johnson', initials: 'MJ', color: '#10b981', mood: 4, role: 'QA Engineer' },
];

export const moodTrend = [
  { sprint: 'S21', mood: 3.4 },
  { sprint: 'S22', mood: 3.8 },
  { sprint: 'S23', mood: 4.0 },
  { sprint: 'S24', mood: 4.2 },
];

export const aiInsights = [
  { text: 'Sprint 24 showed consistent improvement in estimation accuracy (+4% from Sprint 23)', type: 'positive' as const },
  { text: 'Payments module accounted for 72% of estimation variance - consider dedicated refactoring sprint', type: 'warning' as const },
  { text: 'Team velocity plateau at ~41 pts suggests capacity ceiling reached at current team size', type: 'info' as const },
  { text: 'Recommendation: Add integration health monitoring to prevent future stale signal issues', type: 'action' as const },
];

export const previousRetros: PreviousRetro[] = [
  { sprint: 'Sprint 23', mood: 4.0, theme: 'CI/CD pipeline improvements', topAction: 'Migrate to parallel test runners', date: 'Jan 31, 2025' },
  { sprint: 'Sprint 22', mood: 3.8, theme: 'Communication gaps', topAction: 'Introduce async standup notes in Slack', date: 'Jan 17, 2025' },
  { sprint: 'Sprint 21', mood: 3.4, theme: 'Technical debt catching up', topAction: 'Allocate 20% sprint capacity to debt reduction', date: 'Jan 3, 2025' },
];
