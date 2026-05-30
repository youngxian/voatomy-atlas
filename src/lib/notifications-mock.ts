import {
  CheckCircle2,
  Bug,
  TrendingUp,
  Heart,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationType = 'sprint' | 'pr' | 'deploy' | 'mention' | 'accuracy' | 'capacity' | 'alert' | 'insight' | 'comment' | 'integration';
export type TimeGroup = 'today' | 'yesterday' | 'thisWeek';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  group: TimeGroup;
  actionLabel?: string;
  avatar?: { initials: string; color: string };
}

export interface KPI {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
  bg: string;
}

export interface Feature {
  id: string;
  name: string;
  owner: string;
  ownerColor: string;
  ownerInitials: string;
  progress: number;
  deadline: string;
  status: 'on-track' | 'at-risk' | 'completed' | 'behind';
}

export interface Risk {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  impact: string;
  mitigation: string;
  owner: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'sprint', title: 'Sprint 25 Planning Complete',
    description: 'Sprint 25 has been auto-planned with 54 story points across 14 tickets. Review the plan before standup.',
    timestamp: '10 min ago', unread: true, group: 'today', actionLabel: 'Review Plan',
  },
  {
    id: 'n2', type: 'pr', title: 'PR #441 Merged: Auth Refactor',
    description: 'Sarah Kim merged the authentication refactor into main. 12 files changed, all CI checks passed.',
    timestamp: '25 min ago', unread: true, group: 'today', actionLabel: 'View PR',
    avatar: { initials: 'SK', color: '#8b5cf6' },
  },
  {
    id: 'n3', type: 'deploy', title: 'Production Deploy v2.14.0',
    description: 'Deployment to production completed successfully. 3 features and 2 bug fixes included in this release.',
    timestamp: '1h ago', unread: true, group: 'today', actionLabel: 'View Release',
  },
  {
    id: 'n4', type: 'mention', title: '@you mentioned in COMP-217',
    description: 'Alex Chen mentioned you: "Can you review the payment gateway integration? Need your input on the error handling approach."',
    timestamp: '2h ago', unread: true, group: 'today', actionLabel: 'Reply',
    avatar: { initials: 'AC', color: '#f16e2c' },
  },
  {
    id: 'n5', type: 'accuracy', title: 'Accuracy Alert: Sprint 24 at 76%',
    description: 'Sprint 24 accuracy dropped below the 80% target. 3 tickets missed due to re-estimation mid-sprint.',
    timestamp: '3h ago', unread: false, group: 'today', actionLabel: 'View Report',
  },
  {
    id: 'n6', type: 'capacity', title: 'Capacity Warning: Elena OOO',
    description: 'Elena Volkov will be out of office Mar 1-14. Sprint 26 capacity reduced by 13 story points.',
    timestamp: '5h ago', unread: false, group: 'today', actionLabel: 'Adjust Capacity',
  },
  {
    id: 'n7', type: 'alert', title: 'Revenue Signal: $48K Deal Blocked',
    description: 'LOOP detected that Nextera ($48K ARR) is blocked by the checkout latency bug COMP-217.',
    timestamp: '1d ago', unread: false, group: 'yesterday', actionLabel: 'View in LOOP',
  },
  {
    id: 'n8', type: 'pr', title: 'PR #438 Needs Review',
    description: 'Jordan Rivera requested your review on "DevOps: CI/CD pipeline optimization". Estimated review time: 15 min.',
    timestamp: '1d ago', unread: false, group: 'yesterday', actionLabel: 'Review PR',
    avatar: { initials: 'JR', color: '#06b6d4' },
  },
  {
    id: 'n9', type: 'insight', title: 'NEXUS: Estimation Pattern Detected',
    description: 'AI detected that backend tasks are consistently over-estimated by 22%. Consider recalibrating story points.',
    timestamp: '1d ago', unread: false, group: 'yesterday', actionLabel: 'View Insight',
  },
  {
    id: 'n10', type: 'deploy', title: 'Staging Deploy v2.14.0-rc3',
    description: 'Release candidate deployed to staging. 4 new E2E tests added. QA verification needed before prod push.',
    timestamp: '2d ago', unread: false, group: 'thisWeek', actionLabel: 'View Build',
  },
  {
    id: 'n11', type: 'comment', title: 'New comment on COMP-180',
    description: 'Priya Patel commented: "Updated the acceptance criteria based on product feedback. Please review when you get a chance."',
    timestamp: '3d ago', unread: false, group: 'thisWeek', actionLabel: 'View Comment',
    avatar: { initials: 'PP', color: '#ec4899' },
  },
  {
    id: 'n12', type: 'integration', title: 'GitHub Integration Synced',
    description: 'GitHub webhook successfully resynced. 23 new commits and 5 PRs imported into ATLAS.',
    timestamp: '3d ago', unread: false, group: 'thisWeek',
  },
];

export const kpis: KPI[] = [
  { label: 'Features Delivered', value: '14', change: '+3 vs last sprint', changeType: 'up', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  { label: 'Bug Fix Rate', value: '92%', change: '+8% vs last sprint', changeType: 'up', icon: Bug, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Sprint Velocity', value: '54 pts', change: '+6 pts vs average', changeType: 'up', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Customer Satisfaction', value: '4.6/5', change: 'Steady', changeType: 'neutral', icon: Heart, color: 'text-primary', bg: 'bg-primary/10' },
];

export const features: Feature[] = [
  { id: 'f1', name: 'Payment Gateway v2', owner: 'Alex Chen', ownerColor: '#f16e2c', ownerInitials: 'AC', progress: 85, deadline: 'Mar 7', status: 'on-track' },
  { id: 'f2', name: 'SSO Authentication', owner: 'Sarah Kim', ownerColor: '#8b5cf6', ownerInitials: 'SK', progress: 100, deadline: 'Feb 28', status: 'completed' },
  { id: 'f3', name: 'Dashboard Analytics', owner: 'Priya Patel', ownerColor: '#ec4899', ownerInitials: 'PP', progress: 62, deadline: 'Mar 14', status: 'at-risk' },
  { id: 'f4', name: 'Mobile Push Notifications', owner: 'David Park', ownerColor: '#3b82f6', ownerInitials: 'DP', progress: 45, deadline: 'Mar 21', status: 'on-track' },
  { id: 'f5', name: 'API Rate Limiting', owner: 'Jordan Rivera', ownerColor: '#06b6d4', ownerInitials: 'JR', progress: 30, deadline: 'Mar 28', status: 'behind' },
  { id: 'f6', name: 'E2E Test Automation', owner: 'Marcus Johnson', ownerColor: '#10b981', ownerInitials: 'MJ', progress: 70, deadline: 'Mar 7', status: 'on-track' },
];

export const risks: Risk[] = [
  { id: 'r1', title: 'Key developer OOO for 2 weeks', severity: 'high', impact: 'Sprint 26 capacity reduced by 21%', mitigation: 'Cross-training in progress', owner: 'Engineering Lead' },
  { id: 'r2', title: 'Third-party API deprecation', severity: 'high', impact: 'Payment processing affected', mitigation: 'Migration to v3 planned', owner: 'Backend Team' },
  { id: 'r3', title: 'Growing tech debt in billing', severity: 'medium', impact: 'Slower feature velocity', mitigation: '20% sprint capacity for refactoring', owner: 'Tech Lead' },
  { id: 'r4', title: 'QA automation coverage at 45%', severity: 'low', impact: 'Manual testing bottleneck', mitigation: 'Test automation sprint in progress', owner: 'QA Lead' },
];

export const milestones: Milestone[] = [
  { id: 'm1', title: 'SSO Launch', date: 'Feb 28', status: 'completed', description: 'Enterprise SSO deployed' },
  { id: 'm2', title: 'Payment Gateway v2', date: 'Mar 7', status: 'current', description: 'Multi-currency support' },
  { id: 'm3', title: 'Q1 Release', date: 'Mar 21', status: 'upcoming', description: 'Major quarterly release' },
  { id: 'm4', title: 'Mobile App Beta', date: 'Apr 4', status: 'upcoming', description: 'Beta to 500 users' },
];
