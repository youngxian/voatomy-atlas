import { Bug, GitPullRequest, Layers, Rocket } from 'lucide-react';

export interface SprintVelocity {
  sprint: string;
  committed: number;
  delivered: number;
}

export interface TeamMember {
  name: string;
  initials: string;
  color: string;
  role: string;
  velocity: number;
  accuracy: number;
  storiesCompleted: number;
  strengths: string[];
  sprintTrend: number[];
  workload: { frontend: number; backend: number; infra: number };
}

export interface ModuleAccuracy {
  module: string;
  atlas: number;
  team: number;
  actual: number;
}

export interface HealthMetric {
  label: string;
  icon: React.ElementType;
  values: number[];
  unit: string;
  trend: 'up' | 'down' | 'flat';
  good: 'high' | 'low';
}

export const velocityData: SprintVelocity[] = [
  { sprint: 'S19', committed: 44, delivered: 36 },
  { sprint: 'S20', committed: 46, delivered: 38 },
  { sprint: 'S21', committed: 42, delivered: 37 },
  { sprint: 'S22', committed: 48, delivered: 40 },
  { sprint: 'S23', committed: 45, delivered: 39 },
  { sprint: 'S24', committed: 48, delivered: 41 },
];

export const teamMembers: TeamMember[] = [
  {
    name: 'Alex Chen', initials: 'AC', color: '#f16e2c', role: 'Senior Backend Engineer',
    velocity: 13.2, accuracy: 85, storiesCompleted: 28,
    strengths: ['Backend', 'Performance', 'Architecture'],
    sprintTrend: [11, 12, 14, 13],
    workload: { frontend: 10, backend: 70, infra: 20 },
  },
  {
    name: 'Sarah Kim', initials: 'SK', color: '#8b5cf6', role: 'Full-Stack Developer',
    velocity: 10.5, accuracy: 78, storiesCompleted: 24,
    strengths: ['Frontend', 'API Design', 'Testing'],
    sprintTrend: [8, 9, 11, 10],
    workload: { frontend: 50, backend: 40, infra: 10 },
  },
  {
    name: 'Jordan Lee', initials: 'JL', color: '#06b6d4', role: 'DevOps Lead',
    velocity: 8.8, accuracy: 82, storiesCompleted: 20,
    strengths: ['DevOps', 'CI/CD', 'Monitoring'],
    sprintTrend: [7, 8, 9, 9],
    workload: { frontend: 5, backend: 25, infra: 70 },
  },
  {
    name: 'Priya Patel', initials: 'PP', color: '#ec4899', role: 'Frontend Engineer',
    velocity: 11.0, accuracy: 88, storiesCompleted: 26,
    strengths: ['Frontend', 'UX', 'Accessibility'],
    sprintTrend: [9, 10, 10, 11],
    workload: { frontend: 85, backend: 10, infra: 5 },
  },
  {
    name: 'Marcus Johnson', initials: 'MJ', color: '#10b981', role: 'QA Engineer',
    velocity: 6.5, accuracy: 80, storiesCompleted: 18,
    strengths: ['Testing', 'Automation', 'Security'],
    sprintTrend: [5, 6, 6, 7],
    workload: { frontend: 20, backend: 30, infra: 50 },
  },
];

export const moduleAccuracy: ModuleAccuracy[] = [
  { module: 'Payments', atlas: 78, team: 62, actual: 45 },
  { module: 'Auth', atlas: 88, team: 80, actual: 32 },
  { module: 'API', atlas: 85, team: 75, actual: 28 },
  { module: 'Dashboard', atlas: 92, team: 85, actual: 38 },
  { module: 'Notifications', atlas: 90, team: 82, actual: 15 },
  { module: 'Users', atlas: 86, team: 78, actual: 22 },
];

export const estimationComparison = [
  { sprint: 'S21', atlasWins: 6, teamWins: 3, ties: 1 },
  { sprint: 'S22', atlasWins: 7, teamWins: 2, ties: 1 },
  { sprint: 'S23', atlasWins: 7, teamWins: 3, ties: 0 },
  { sprint: 'S24', atlasWins: 8, teamWins: 2, ties: 0 },
];

export const healthMetrics: HealthMetric[] = [
  { label: 'Scope Creep', icon: Layers, values: [18, 14, 11, 8], unit: '%', trend: 'down', good: 'low' },
  { label: 'Bug Escape Rate', icon: Bug, values: [5, 3, 4, 2], unit: '', trend: 'down', good: 'low' },
  { label: 'PR Review Time', icon: GitPullRequest, values: [8.2, 6.4, 5.1, 3.8], unit: 'hrs', trend: 'down', good: 'low' },
  { label: 'Deploy Frequency', icon: Rocket, values: [3, 4, 5, 7], unit: '/wk', trend: 'up', good: 'high' },
];

export const reviewMatrix = [
  { reviewer: 'AC', reviews: { AC: 0, SK: 8, JL: 4, PP: 6, MJ: 3 } },
  { reviewer: 'SK', reviews: { AC: 7, SK: 0, JL: 2, PP: 9, MJ: 4 } },
  { reviewer: 'JL', reviews: { AC: 5, SK: 3, JL: 0, PP: 2, MJ: 6 } },
  { reviewer: 'PP', reviews: { AC: 4, SK: 7, JL: 1, PP: 0, MJ: 5 } },
  { reviewer: 'MJ', reviews: { AC: 6, SK: 5, JL: 5, PP: 4, MJ: 0 } },
];

export const pairProgramming = [
  { pair: 'Alex + Sarah', hours: 12 },
  { pair: 'Priya + Marcus', hours: 8 },
  { pair: 'Jordan + Alex', hours: 6 },
  { pair: 'Sarah + Priya', hours: 10 },
  { pair: 'Marcus + Jordan', hours: 4 },
];

export const aiRecommendations = [
  { text: 'Consider redistributing backend load - Alex is at 108% capacity', type: 'warning' as const },
  { text: "Sarah's estimation accuracy improved 15% this sprint - recognize the improvement", type: 'positive' as const },
  { text: 'Payments module needs dedicated refactoring time - blocking team velocity', type: 'action' as const },
];
