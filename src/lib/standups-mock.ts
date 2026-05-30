export interface TeamMember {
  name: string;
  role: string;
  avatar: string; // color
  yesterday: string;
  today: string;
  blockers: string | null;
}

export interface StandupRecord {
  id: number;
  date: string;
  dateShort: string;
  day: string;
  duration: number;
  attendees: number;
  totalMembers: number;
  summary: string;
  blockerCount: number;
  energy: 'high' | 'medium' | 'low';
}

export interface ActionItem {
  id: number;
  title: string;
  owner: string;
  ownerColor: string;
  status: 'open' | 'in-progress' | 'done';
  sourceDate: string;
}

export const todayMembers: TeamMember[] = [
  {
    name: 'Alex Chen',
    role: 'EM',
    avatar: '#f16e2c',
    yesterday: 'Reviewed Sprint 24 retro action items',
    today: 'Finalize Sprint 25 plan with ATLAS recommendations',
    blockers: null,
  },
  {
    name: 'Sarah Kim',
    role: 'IC',
    avatar: '#8b5cf6',
    yesterday: 'Completed auth token refresh fix (COMP-218)',
    today: 'Start search autocomplete (COMP-223)',
    blockers: 'Waiting on Elasticsearch cluster provisioning',
  },
  {
    name: 'Jordan Lee',
    role: 'TL',
    avatar: '#06b6d4',
    yesterday: 'Dashboard query optimization research',
    today: 'Implement query caching layer for COMP-220',
    blockers: 'Need DBA review on index strategy',
  },
  {
    name: 'Priya Patel',
    role: 'IC',
    avatar: '#10b981',
    yesterday: 'Finished mobile nav refactor PR (COMP-222)',
    today: 'Start user avatar upload (COMP-219)',
    blockers: null,
  },
  {
    name: 'Marcus Wright',
    role: 'IC',
    avatar: '#f59e0b',
    yesterday: 'Email notification templates in progress',
    today: 'Continue COMP-221, add Sendgrid integration',
    blockers: 'Sendgrid API key pending from DevOps',
  },
];

export const standupHistory: StandupRecord[] = [
  {
    id: 1,
    date: 'February 20, 2025',
    dateShort: 'Feb 20',
    day: 'Thursday',
    duration: 11,
    attendees: 5,
    totalMembers: 5,
    summary: 'Auth token fix merged. Dashboard optimization kicked off. No new blockers introduced.',
    blockerCount: 1,
    energy: 'high',
  },
  {
    id: 2,
    date: 'February 19, 2025',
    dateShort: 'Feb 19',
    day: 'Wednesday',
    duration: 14,
    attendees: 5,
    totalMembers: 5,
    summary: 'Sprint 24 retro discussed. Two new blockers surfaced around Elasticsearch and Sendgrid. Mobile nav PR opened.',
    blockerCount: 2,
    energy: 'medium',
  },
  {
    id: 3,
    date: 'February 18, 2025',
    dateShort: 'Feb 18',
    day: 'Tuesday',
    duration: 10,
    attendees: 4,
    totalMembers: 5,
    summary: 'Marcus OOO. Auth fix near completion. Email templates 60% done. Team velocity on track.',
    blockerCount: 1,
    energy: 'high',
  },
  {
    id: 4,
    date: 'February 17, 2025',
    dateShort: 'Feb 17',
    day: 'Monday',
    duration: 9,
    attendees: 5,
    totalMembers: 5,
    summary: 'Sprint 25 kickoff standup. Sprint goals reviewed. All tickets assigned and confirmed.',
    blockerCount: 0,
    energy: 'high',
  },
  {
    id: 5,
    date: 'February 14, 2025',
    dateShort: 'Feb 14',
    day: 'Friday',
    duration: 13,
    attendees: 5,
    totalMembers: 5,
    summary: 'Sprint 24 final standup. Carry-over items identified. Payment flow deferred to Sprint 25.',
    blockerCount: 1,
    energy: 'low',
  },
];

export const actionItems: ActionItem[] = [
  {
    id: 1,
    title: 'Follow up with DevOps on Sendgrid API key provisioning',
    owner: 'Alex Chen',
    ownerColor: '#f16e2c',
    status: 'in-progress',
    sourceDate: 'Feb 19',
  },
  {
    id: 2,
    title: 'Schedule DBA review for index optimization strategy',
    owner: 'Jordan Lee',
    ownerColor: '#06b6d4',
    status: 'open',
    sourceDate: 'Feb 21',
  },
  {
    id: 3,
    title: 'Request Elasticsearch cluster provisioning ETA from infra',
    owner: 'Alex Chen',
    ownerColor: '#f16e2c',
    status: 'in-progress',
    sourceDate: 'Feb 19',
  },
  {
    id: 4,
    title: 'Pair with Sarah on search autocomplete architecture',
    owner: 'Jordan Lee',
    ownerColor: '#06b6d4',
    status: 'done',
    sourceDate: 'Feb 18',
  },
  {
    id: 5,
    title: 'Update Sprint 24 retro doc with final action items',
    owner: 'Priya Patel',
    ownerColor: '#10b981',
    status: 'done',
    sourceDate: 'Feb 17',
  },
  {
    id: 6,
    title: 'Create Sendgrid sandbox env for email template testing',
    owner: 'Marcus Wright',
    ownerColor: '#f59e0b',
    status: 'open',
    sourceDate: 'Feb 21',
  },
];
