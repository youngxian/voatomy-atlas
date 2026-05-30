// =============================================================================
// ATLAS Sprint Intelligence - Mock Data
// Brand color: #f16e2c | Dark mode application
// =============================================================================

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

export type ProjectTool = "jira" | "linear" | "clickup";
export type UserRole = "em" | "tl" | "ic";
export type SprintCadence = "1wk" | "2wk" | "3wk";

export interface Project {
  id: string;
  name: string;
  tool: ProjectTool;
  role: UserRole;
  currentSprint: number;
  sprintLabel: string;
  cadence: SprintCadence;
  teamSize: number;
  velocity: number;
  healthScore: number;
}

export type SignalStatus = "live" | "stale" | "disconnected";

export interface Signal {
  id: string;
  name: string;
  status: SignalStatus;
  source: string;
  lastSync: string | null;
  description: string;
  iconKey: string;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface TicketSignal {
  type: string;
  label: string;
  severity: RiskLevel;
}

export interface SprintTicket {
  id: string;
  title: string;
  atlasPoints: number;
  teamPoints: number;
  risk: RiskLevel;
  module: string;
  signals: TicketSignal[];
  confidence: number;
  assignee: string;
  status: "todo" | "in_progress" | "review" | "done";
  ai_type?: string;
}

export type ExclusionReason = "debt_risk" | "over_capacity" | "dependency_blocked" | "scope_creep";

export interface ExcludedTicket {
  id: string;
  title: string;
  atlasPoints: number;
  teamPoints: number;
  reason: ExclusionReason;
  reasonLabel: string;
  explanation: string;
  module: string;
}

export interface AccuracyTicketBreakdown {
  id: string;
  title: string;
  atlasEstimate: number;
  teamEstimate: number;
  actualEffort: number;
  delivered: boolean;
  delta: number;
}

export interface SprintAccuracyData {
  sprintNumber: number;
  sprintLabel: string;
  accuracyPercent: number;
  committed: number;
  delivered: number;
  carryOver: number;
  tickets: AccuracyTicketBreakdown[];
}

export interface AccuracyHistoryEntry {
  sprintNumber: number;
  sprintLabel: string;
  accuracyPercent: number;
  committed: number;
  delivered: number;
  atlasAccuracy: number;
  teamAccuracy: number;
}

export interface Adjustment {
  type: "pto" | "on_call" | "fte" | "focus_time" | "meetings";
  label: string;
  week: number | null;
  impact: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  avatarInitial: string;
  avatarColor: string;
  velocityPerWeek: number;
  adjustments: Adjustment[];
  effectiveCapacity: number;
  currentLoad: number;
}

export type NotificationType =
  | "sprint_close"
  | "plan_ready"
  | "revenue_signal"
  | "pacing_alert"
  | "reminder"
  | "integration_stale";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  relativeTime: string;
  isRead: boolean;
  actionLabel: string | null;
  actionHref: string | null;
  priority: NotificationPriority;
}

export type IntegrationStatus = "connected" | "not_connected";
export type IntegrationSyncStatus = "live" | "stale" | "none";
export type IntegrationCategory = "project_management" | "code" | "crm" | "support" | "design" | "communication";

export interface Integration {
  id: string;
  name: string;
  status: IntegrationStatus;
  syncStatus: IntegrationSyncStatus;
  category: IntegrationCategory;
  iconKey: string;
  description: string;
  lastSync: string | null;
  connectedAt: string | null;
}

export type ComplexitySeverity = "LOW" | "MED" | "HIGH";

export interface ModuleComplexity {
  module: string;
  complexityScore: number;
  severity: ComplexitySeverity;
  debtMultiplier: number;
  linesOfCode: number;
  openIssues: number;
  lastModified: string;
}

export interface DebtModule {
  module: string;
  severity: RiskLevel;
  slowdownFactor: number;
  affectedTickets: string[];
  description: string;
  recommendation: string;
  estimatedResolutionDays: number;
}

export type CalibrationDirection = "up" | "down" | "unchanged";

export interface CalibrationChange {
  ticketId: string;
  title: string;
  teamEstimate: number;
  atlasEstimate: number;
  direction: CalibrationDirection;
  reason: string;
}

export interface TeamPerformance {
  memberId: string;
  name: string;
  committed: number;
  delivered: number;
  accuracy: number;
}

export interface SprintReport {
  sprintNumber: number;
  sprintLabel: string;
  dateRange: string;
  executiveSummary: string;
  totalCommitted: number;
  totalDelivered: number;
  accuracyPercent: number;
  ticketBreakdown: {
    total: number;
    completed: number;
    carriedOver: number;
    descoped: number;
  };
  teamPerformance: TeamPerformance[];
  calibrationChanges: CalibrationChange[];
  keyInsights: string[];
  risksIdentified: string[];
}

export interface StakeholderProjectHealth {
  projectId: string;
  projectName: string;
  healthScore: number;
  trend: "improving" | "stable" | "declining";
  sprintAccuracy: number;
  velocity: number;
  activeSprint: string;
  riskCount: number;
}

export interface RevenueImpact {
  unblockedRevenue: number;
  atRiskRevenue: number;
  revenueTickets: {
    id: string;
    title: string;
    revenueImpact: number;
    status: "on_track" | "at_risk" | "blocked";
  }[];
}

export interface RecentReport {
  sprintLabel: string;
  generatedAt: string;
  accuracy: number;
  delivered: number;
  committed: number;
}

export interface StakeholderData {
  projectHealth: StakeholderProjectHealth[];
  accuracyTrend: AccuracyHistoryEntry[];
  revenueImpact: RevenueImpact;
  recentReports: RecentReport[];
}

// -----------------------------------------------------------------------------
// 1. Mock Projects
// -----------------------------------------------------------------------------

export const mockProjects: Project[] = [
  {
    id: "proj_acme_backend",
    name: "ACME Backend",
    tool: "jira",
    role: "em",
    currentSprint: 25,
    sprintLabel: "Sprint 25",
    cadence: "2wk",
    teamSize: 5,
    velocity: 42,
    healthScore: 78,
  },
  {
    id: "proj_mobile_app",
    name: "Mobile App",
    tool: "linear",
    role: "tl",
    currentSprint: 48,
    sprintLabel: "Sprint 48",
    cadence: "1wk",
    teamSize: 4,
    velocity: 24,
    healthScore: 85,
  },
  {
    id: "proj_data_pipeline",
    name: "Data Pipeline",
    tool: "clickup",
    role: "em",
    currentSprint: 12,
    sprintLabel: "Sprint 12",
    cadence: "3wk",
    teamSize: 3,
    velocity: 36,
    healthScore: 64,
  },
];

// -----------------------------------------------------------------------------
// 2. Mock Signals
// -----------------------------------------------------------------------------

export const mockSignals: Signal[] = [
  {
    id: "sig_code",
    name: "Code",
    status: "live",
    source: "GitHub",
    lastSync: "2h ago",
    description: "Commit frequency, PR velocity, and code complexity metrics from your GitHub repositories.",
    iconKey: "code",
  },
  {
    id: "sig_capacity",
    name: "Capacity",
    status: "live",
    source: "Calendar",
    lastSync: "today",
    description: "Team availability, PTO schedules, on-call rotations, and meeting load from connected calendars.",
    iconKey: "capacity",
  },
  {
    id: "sig_customer",
    name: "Customer",
    status: "stale",
    source: "Zendesk",
    lastSync: "3d ago",
    description: "Customer ticket volume, severity trends, and escalation patterns from Zendesk support data.",
    iconKey: "customer",
  },
  {
    id: "sig_debt",
    name: "Debt",
    status: "live",
    source: "PHANTOM",
    lastSync: "1h ago",
    description: "Technical debt hotspots, module complexity, and slowdown factors computed by the PHANTOM engine.",
    iconKey: "debt",
  },
  {
    id: "sig_design",
    name: "Design",
    status: "disconnected",
    source: "Figma",
    lastSync: null,
    description: "Design readiness, handoff status, and spec completeness from Figma project files.",
    iconKey: "design",
  },
  {
    id: "sig_business",
    name: "Business",
    status: "disconnected",
    source: "Salesforce",
    lastSync: null,
    description: "Revenue pipeline data, deal dependencies, and customer impact signals from Salesforce CRM.",
    iconKey: "business",
  },
];

// -----------------------------------------------------------------------------
// 3. Mock Sprint Tickets
// -----------------------------------------------------------------------------

export const mockSprintTickets: SprintTicket[] = [
  {
    id: "COMP-217",
    title: "Implement Stripe payment flow for subscription upgrades",
    atlasPoints: 8,
    teamPoints: 5,
    risk: "high",
    module: "payments/",
    signals: [
      { type: "debt", label: "High module complexity (2.8x)", severity: "high" },
      { type: "revenue", label: "Blocks $120K pipeline", severity: "critical" },
      { type: "code", label: "4 open PRs in module", severity: "medium" },
    ],
    confidence: 62,
    assignee: "Alex Chen",
    status: "in_progress",
  },
  {
    id: "COMP-218",
    title: "Fix auth token refresh race condition on concurrent requests",
    atlasPoints: 5,
    teamPoints: 3,
    risk: "medium",
    module: "auth/",
    signals: [
      { type: "debt", label: "Module debt 1.4x", severity: "medium" },
      { type: "customer", label: "12 support tickets linked", severity: "high" },
    ],
    confidence: 74,
    assignee: "Sarah Kim",
    status: "todo",
  },
  {
    id: "COMP-219",
    title: "Add user profile avatar upload with image optimization",
    atlasPoints: 3,
    teamPoints: 3,
    risk: "low",
    module: "users/",
    signals: [
      { type: "design", label: "Figma specs ready", severity: "low" },
    ],
    confidence: 91,
    assignee: "Priya Patel",
    status: "todo",
  },
  {
    id: "COMP-220",
    title: "Optimize dashboard query performance for large datasets",
    atlasPoints: 8,
    teamPoints: 5,
    risk: "high",
    module: "dashboard/",
    signals: [
      { type: "code", label: "N+1 queries detected", severity: "high" },
      { type: "customer", label: "P1 escalation from Enterprise client", severity: "critical" },
      { type: "capacity", label: "Owner on-call week 2", severity: "medium" },
    ],
    confidence: 58,
    assignee: "Jordan Lee",
    status: "todo",
  },
  {
    id: "COMP-221",
    title: "Build transactional email notification system with templates",
    atlasPoints: 5,
    teamPoints: 5,
    risk: "low",
    module: "notifications/",
    signals: [
      { type: "design", label: "Email templates approved", severity: "low" },
    ],
    confidence: 88,
    assignee: "Marcus Wright",
    status: "in_progress",
  },
  {
    id: "COMP-222",
    title: "Refactor mobile navigation to bottom tab pattern",
    atlasPoints: 3,
    teamPoints: 2,
    risk: "low",
    module: "dashboard/",
    signals: [
      { type: "design", label: "Figma prototype complete", severity: "low" },
    ],
    confidence: 93,
    assignee: "Priya Patel",
    status: "review",
  },
  {
    id: "COMP-223",
    title: "Implement search autocomplete with debounced API calls",
    atlasPoints: 5,
    teamPoints: 3,
    risk: "medium",
    module: "api/",
    signals: [
      { type: "code", label: "Elasticsearch integration needed", severity: "medium" },
      { type: "debt", label: "API module debt 1.2x", severity: "low" },
    ],
    confidence: 72,
    assignee: "Sarah Kim",
    status: "todo",
  },
  {
    id: "COMP-224",
    title: "Fix onboarding wizard step validation and error states",
    atlasPoints: 3,
    teamPoints: 2,
    risk: "low",
    module: "users/",
    signals: [
      { type: "customer", label: "Drop-off rate 34% at step 3", severity: "medium" },
    ],
    confidence: 89,
    assignee: "Marcus Wright",
    status: "done",
  },
  {
    id: "COMP-225",
    title: "Add webhook retry logic with exponential backoff",
    atlasPoints: 5,
    teamPoints: 5,
    risk: "medium",
    module: "api/",
    signals: [
      { type: "code", label: "No retry mechanism exists", severity: "medium" },
      { type: "customer", label: "3 integration partners affected", severity: "high" },
    ],
    confidence: 76,
    assignee: "Alex Chen",
    status: "todo",
  },
];

// -----------------------------------------------------------------------------
// 4. Mock Excluded Tickets
// -----------------------------------------------------------------------------

export const mockExcludedTickets: ExcludedTicket[] = [
  {
    id: "COMP-230",
    title: "Migrate payment gateway to v2 API with 3DS2 support",
    atlasPoints: 13,
    teamPoints: 8,
    reason: "debt_risk",
    reasonLabel: "Technical Debt Risk",
    explanation:
      "The payments/ module has a 2.8x debt multiplier. ATLAS estimates this 8-point ticket requires 13 effective points due to accumulated complexity. Including it would push the sprint 7 points over safe capacity.",
    module: "payments/",
  },
  {
    id: "COMP-231",
    title: "Implement real-time notification system via WebSockets",
    atlasPoints: 6,
    teamPoints: 3,
    reason: "over_capacity",
    reasonLabel: "Over Capacity",
    explanation:
      "Sarah is on PTO during week 1 and Jordan is on-call during week 2. With adjusted capacity at 38 effective points, adding this ticket would exceed the team's bandwidth by 4 points.",
    module: "notifications/",
  },
];

// -----------------------------------------------------------------------------
// 5. Mock Accuracy Data (Sprint 24)
// -----------------------------------------------------------------------------

export const mockAccuracyData: SprintAccuracyData = {
  sprintNumber: 24,
  sprintLabel: "Sprint 24",
  accuracyPercent: 76,
  committed: 48,
  delivered: 41,
  carryOver: 7,
  tickets: [
    {
      id: "COMP-201",
      title: "Refactor checkout flow state management",
      atlasEstimate: 8,
      teamEstimate: 5,
      actualEffort: 9,
      delivered: true,
      delta: 1,
    },
    {
      id: "COMP-202",
      title: "Add SSO login with SAML provider",
      atlasEstimate: 5,
      teamEstimate: 5,
      actualEffort: 5,
      delivered: true,
      delta: 0,
    },
    {
      id: "COMP-203",
      title: "Build admin role permission matrix",
      atlasEstimate: 5,
      teamEstimate: 3,
      actualEffort: 6,
      delivered: true,
      delta: 1,
    },
    {
      id: "COMP-204",
      title: "Optimize image CDN pipeline",
      atlasEstimate: 3,
      teamEstimate: 3,
      actualEffort: 3,
      delivered: true,
      delta: 0,
    },
    {
      id: "COMP-205",
      title: "Implement CSV export for reports",
      atlasEstimate: 3,
      teamEstimate: 2,
      actualEffort: 3,
      delivered: true,
      delta: 0,
    },
    {
      id: "COMP-206",
      title: "Fix timezone handling in scheduling module",
      atlasEstimate: 5,
      teamEstimate: 3,
      actualEffort: 5,
      delivered: true,
      delta: 0,
    },
    {
      id: "COMP-207",
      title: "Add Stripe webhook signature verification",
      atlasEstimate: 5,
      teamEstimate: 5,
      actualEffort: 4,
      delivered: true,
      delta: -1,
    },
    {
      id: "COMP-208",
      title: "Build customer health score dashboard",
      atlasEstimate: 8,
      teamEstimate: 5,
      actualEffort: 6,
      delivered: false,
      delta: -2,
    },
    {
      id: "COMP-209",
      title: "Migrate legacy notification service",
      atlasEstimate: 5,
      teamEstimate: 8,
      actualEffort: 7,
      delivered: false,
      delta: 2,
    },
    {
      id: "COMP-210",
      title: "Implement rate limiting on public API",
      atlasEstimate: 3,
      teamEstimate: 3,
      actualEffort: 3,
      delivered: true,
      delta: 0,
    },
  ],
};

// -----------------------------------------------------------------------------
// 6. Mock Accuracy History (Sprints 21-24)
// -----------------------------------------------------------------------------

export const mockAccuracyHistory: AccuracyHistoryEntry[] = [
  {
    sprintNumber: 21,
    sprintLabel: "Sprint 21",
    accuracyPercent: 62,
    committed: 44,
    delivered: 31,
    atlasAccuracy: 68,
    teamAccuracy: 58,
  },
  {
    sprintNumber: 22,
    sprintLabel: "Sprint 22",
    accuracyPercent: 72,
    committed: 46,
    delivered: 37,
    atlasAccuracy: 76,
    teamAccuracy: 64,
  },
  {
    sprintNumber: 23,
    sprintLabel: "Sprint 23",
    accuracyPercent: 76,
    committed: 50,
    delivered: 42,
    atlasAccuracy: 80,
    teamAccuracy: 68,
  },
  {
    sprintNumber: 24,
    sprintLabel: "Sprint 24",
    accuracyPercent: 76,
    committed: 48,
    delivered: 41,
    atlasAccuracy: 82,
    teamAccuracy: 70,
  },
];

// -----------------------------------------------------------------------------
// 7. Mock Team Members
// -----------------------------------------------------------------------------

export const mockTeamMembers: TeamMember[] = [
  {
    id: "tm_alex",
    name: "Alex Chen",
    role: "em",
    avatarInitial: "A",
    avatarColor: "#f16e2c",
    velocityPerWeek: 6,
    adjustments: [],
    effectiveCapacity: 12,
    currentLoad: 13,
  },
  {
    id: "tm_sarah",
    name: "Sarah Kim",
    role: "ic",
    avatarInitial: "S",
    avatarColor: "#3b82f6",
    velocityPerWeek: 8,
    adjustments: [
      {
        type: "pto",
        label: "PTO - Week 1",
        week: 1,
        impact: -8,
      },
    ],
    effectiveCapacity: 8,
    currentLoad: 10,
  },
  {
    id: "tm_jordan",
    name: "Jordan Lee",
    role: "tl",
    avatarInitial: "J",
    avatarColor: "#8b5cf6",
    velocityPerWeek: 7,
    adjustments: [
      {
        type: "on_call",
        label: "On-call rotation - Week 2",
        week: 2,
        impact: -4,
      },
    ],
    effectiveCapacity: 10,
    currentLoad: 8,
  },
  {
    id: "tm_priya",
    name: "Priya Patel",
    role: "ic",
    avatarInitial: "P",
    avatarColor: "#10b981",
    velocityPerWeek: 9,
    adjustments: [],
    effectiveCapacity: 18,
    currentLoad: 6,
  },
  {
    id: "tm_marcus",
    name: "Marcus Wright",
    role: "ic",
    avatarInitial: "M",
    avatarColor: "#f59e0b",
    velocityPerWeek: 8,
    adjustments: [
      {
        type: "fte",
        label: "50% FTE allocation",
        week: null,
        impact: -8,
      },
    ],
    effectiveCapacity: 8,
    currentLoad: 8,
  },
];

// -----------------------------------------------------------------------------
// 8. Mock Notifications
// -----------------------------------------------------------------------------

export const mockNotifications: Notification[] = [
  {
    id: "notif_001",
    type: "sprint_close",
    title: "Sprint 24 closes tomorrow",
    body: "3 tickets are still in progress. Review carry-over candidates before the sprint boundary at 9:00 AM.",
    timestamp: "2025-02-21T08:00:00Z",
    relativeTime: "2h ago",
    isRead: false,
    actionLabel: "Review Sprint",
    actionHref: "/sprint/24/review",
    priority: "urgent",
  },
  {
    id: "notif_002",
    type: "plan_ready",
    title: "Sprint 25 plan is ready for review",
    body: "ATLAS has generated a recommended sprint plan with 45 points across 9 tickets. 2 tickets were excluded due to capacity and debt signals.",
    timestamp: "2025-02-21T07:30:00Z",
    relativeTime: "2.5h ago",
    isRead: false,
    actionLabel: "View Plan",
    actionHref: "/sprint/25/plan",
    priority: "high",
  },
  {
    id: "notif_003",
    type: "revenue_signal",
    title: "Revenue-critical ticket at risk",
    body: "COMP-217 (Stripe payment flow) blocks $120K in pipeline revenue. Current confidence is 62% due to payments/ module debt.",
    timestamp: "2025-02-21T06:00:00Z",
    relativeTime: "4h ago",
    isRead: false,
    actionLabel: "View Ticket",
    actionHref: "/tickets/COMP-217",
    priority: "high",
  },
  {
    id: "notif_004",
    type: "pacing_alert",
    title: "Sprint pacing below target",
    body: "Team has completed 24 of 48 committed points (50%) with 3 days remaining. Historical completion rate suggests 38 points at current pace.",
    timestamp: "2025-02-20T16:00:00Z",
    relativeTime: "18h ago",
    isRead: true,
    actionLabel: "View Burndown",
    actionHref: "/sprint/24/burndown",
    priority: "medium",
  },
  {
    id: "notif_005",
    type: "reminder",
    title: "Weekly calibration review due",
    body: "ATLAS accuracy improved from 72% to 76% this sprint. Review the latest calibration adjustments to keep estimates aligned.",
    timestamp: "2025-02-20T09:00:00Z",
    relativeTime: "1d ago",
    isRead: true,
    actionLabel: "Review Calibration",
    actionHref: "/calibration",
    priority: "low",
  },
  {
    id: "notif_006",
    type: "integration_stale",
    title: "Zendesk integration data is stale",
    body: "Customer signal data has not synced in 3 days. This may affect accuracy of customer-linked ticket prioritization.",
    timestamp: "2025-02-19T10:00:00Z",
    relativeTime: "2d ago",
    isRead: true,
    actionLabel: "Reconnect",
    actionHref: "/settings/integrations",
    priority: "medium",
  },
];

// -----------------------------------------------------------------------------
// 9. Mock Integrations
// -----------------------------------------------------------------------------

export const mockIntegrations: Integration[] = [
  {
    id: "int_jira",
    name: "Jira",
    status: "connected",
    syncStatus: "live",
    category: "project_management",
    iconKey: "jira",
    description: "Sync sprints, tickets, and story points from your Jira projects.",
    lastSync: "5 min ago",
    connectedAt: "2024-11-15T10:00:00Z",
  },
  {
    id: "int_linear",
    name: "Linear",
    status: "not_connected",
    syncStatus: "none",
    category: "project_management",
    iconKey: "linear",
    description: "Import cycles, issues, and estimates from Linear workspaces.",
    lastSync: null,
    connectedAt: null,
  },
  {
    id: "int_clickup",
    name: "ClickUp",
    status: "not_connected",
    syncStatus: "none",
    category: "project_management",
    iconKey: "clickup",
    description: "Pull sprints, tasks, and time estimates from ClickUp spaces.",
    lastSync: null,
    connectedAt: null,
  },
  {
    id: "int_github",
    name: "GitHub",
    status: "connected",
    syncStatus: "live",
    category: "code",
    iconKey: "github",
    description: "Analyze commit frequency, PR velocity, code complexity, and review turnaround.",
    lastSync: "2h ago",
    connectedAt: "2024-11-15T10:30:00Z",
  },
  {
    id: "int_hubspot",
    name: "HubSpot",
    status: "connected",
    syncStatus: "stale",
    category: "crm",
    iconKey: "hubspot",
    description: "Surface revenue pipeline dependencies and deal-linked feature requests.",
    lastSync: "5d ago",
    connectedAt: "2025-01-08T14:00:00Z",
  },
  {
    id: "int_salesforce",
    name: "Salesforce",
    status: "not_connected",
    syncStatus: "none",
    category: "crm",
    iconKey: "salesforce",
    description: "Connect CRM data to map revenue impact of sprint deliverables.",
    lastSync: null,
    connectedAt: null,
  },
  {
    id: "int_zendesk",
    name: "Zendesk",
    status: "connected",
    syncStatus: "stale",
    category: "support",
    iconKey: "zendesk",
    description: "Track customer ticket volume, severity trends, and escalation patterns.",
    lastSync: "3d ago",
    connectedAt: "2024-12-01T09:00:00Z",
  },
  {
    id: "int_figma",
    name: "Figma",
    status: "not_connected",
    syncStatus: "none",
    category: "design",
    iconKey: "figma",
    description: "Monitor design handoff readiness and spec completeness for sprint tickets.",
    lastSync: null,
    connectedAt: null,
  },
  {
    id: "int_slack",
    name: "Slack",
    status: "not_connected",
    syncStatus: "none",
    category: "communication",
    iconKey: "slack",
    description: "Deliver sprint alerts, plan summaries, and pacing notifications to Slack channels.",
    lastSync: null,
    connectedAt: null,
  },
];

// -----------------------------------------------------------------------------
// 10. Mock Module Complexity
// -----------------------------------------------------------------------------

export const mockModuleComplexity: ModuleComplexity[] = [
  {
    module: "payments/",
    complexityScore: 8.2,
    severity: "HIGH",
    debtMultiplier: 2.8,
    linesOfCode: 14_320,
    openIssues: 7,
    lastModified: "2h ago",
  },
  {
    module: "auth/",
    complexityScore: 5.1,
    severity: "MED",
    debtMultiplier: 1.4,
    linesOfCode: 8_740,
    openIssues: 3,
    lastModified: "1d ago",
  },
  {
    module: "api/",
    complexityScore: 4.8,
    severity: "MED",
    debtMultiplier: 1.2,
    linesOfCode: 11_200,
    openIssues: 4,
    lastModified: "6h ago",
  },
  {
    module: "dashboard/",
    complexityScore: 2.3,
    severity: "LOW",
    debtMultiplier: 1.0,
    linesOfCode: 6_580,
    openIssues: 1,
    lastModified: "3d ago",
  },
  {
    module: "notifications/",
    complexityScore: 2.1,
    severity: "LOW",
    debtMultiplier: 1.0,
    linesOfCode: 3_200,
    openIssues: 0,
    lastModified: "5d ago",
  },
  {
    module: "users/",
    complexityScore: 1.8,
    severity: "LOW",
    debtMultiplier: 1.0,
    linesOfCode: 4_100,
    openIssues: 1,
    lastModified: "2d ago",
  },
];

// -----------------------------------------------------------------------------
// 11. Mock Debt Modules
// -----------------------------------------------------------------------------

export const mockDebtModules: DebtModule[] = [
  {
    module: "payments/",
    severity: "critical",
    slowdownFactor: 2.8,
    affectedTickets: ["COMP-217", "COMP-230"],
    description:
      "Legacy Stripe v1 integration with deeply nested callback patterns. No test coverage on refund edge cases. Circular dependency with billing/ module.",
    recommendation:
      "Dedicate 1 sprint to extract payment processing into isolated service layer. Estimated 40% reduction in debt multiplier.",
    estimatedResolutionDays: 10,
  },
  {
    module: "auth/",
    severity: "high",
    slowdownFactor: 1.4,
    affectedTickets: ["COMP-218"],
    description:
      "Token refresh logic has race conditions under concurrent requests. Session management spans 3 different middleware layers with inconsistent error handling.",
    recommendation:
      "Consolidate session middleware into single auth gateway. Add integration tests for concurrent token refresh scenarios.",
    estimatedResolutionDays: 5,
  },
  {
    module: "api/",
    severity: "medium",
    slowdownFactor: 1.2,
    affectedTickets: ["COMP-223", "COMP-225"],
    description:
      "Rate limiting is ad-hoc per endpoint. No centralized error response format. Webhook handlers lack retry logic and idempotency keys.",
    recommendation:
      "Implement API gateway pattern with centralized middleware. Add idempotency layer for all webhook endpoints.",
    estimatedResolutionDays: 7,
  },
];

// -----------------------------------------------------------------------------
// 12. Mock Sprint Report
// -----------------------------------------------------------------------------

export const mockSprintReport: SprintReport = {
  sprintNumber: 24,
  sprintLabel: "Sprint 24",
  dateRange: "Feb 3 - Feb 14, 2025",
  executiveSummary:
    "Sprint 24 delivered 41 of 48 committed points (76% accuracy), consistent with Sprint 23. Two tickets carried over due to underestimated complexity in the payments module and a dependency delay on the legacy notification migration. ATLAS calibration accuracy reached 82%, outperforming team estimates by 12 percentage points. Revenue-critical items were delivered on time.",
  totalCommitted: 48,
  totalDelivered: 41,
  accuracyPercent: 76,
  ticketBreakdown: {
    total: 10,
    completed: 8,
    carriedOver: 2,
    descoped: 0,
  },
  teamPerformance: [
    {
      memberId: "tm_alex",
      name: "Alex Chen",
      committed: 13,
      delivered: 13,
      accuracy: 100,
    },
    {
      memberId: "tm_sarah",
      name: "Sarah Kim",
      committed: 10,
      delivered: 8,
      accuracy: 80,
    },
    {
      memberId: "tm_jordan",
      name: "Jordan Lee",
      committed: 10,
      delivered: 7,
      accuracy: 70,
    },
    {
      memberId: "tm_priya",
      name: "Priya Patel",
      committed: 8,
      delivered: 8,
      accuracy: 100,
    },
    {
      memberId: "tm_marcus",
      name: "Marcus Wright",
      committed: 7,
      delivered: 5,
      accuracy: 71,
    },
  ],
  calibrationChanges: [
    {
      ticketId: "COMP-201",
      title: "Refactor checkout flow state management",
      teamEstimate: 5,
      atlasEstimate: 8,
      direction: "up",
      reason: "Payments module debt multiplier (2.8x) and 3 open PRs increasing merge conflict risk.",
    },
    {
      ticketId: "COMP-203",
      title: "Build admin role permission matrix",
      teamEstimate: 3,
      atlasEstimate: 5,
      direction: "up",
      reason: "Cross-module dependency on auth/ session layer. Historical tickets in this area averaged 1.6x original estimates.",
    },
    {
      ticketId: "COMP-206",
      title: "Fix timezone handling in scheduling module",
      teamEstimate: 3,
      atlasEstimate: 5,
      direction: "up",
      reason: "Timezone bugs have historically required additional QA cycles. PHANTOM detected 4 untested edge cases.",
    },
    {
      ticketId: "COMP-207",
      title: "Add Stripe webhook signature verification",
      teamEstimate: 5,
      atlasEstimate: 5,
      direction: "unchanged",
      reason: "Team estimate aligned with ATLAS analysis. Well-scoped ticket with clear acceptance criteria.",
    },
    {
      ticketId: "COMP-209",
      title: "Migrate legacy notification service",
      teamEstimate: 8,
      atlasEstimate: 5,
      direction: "down",
      reason: "Existing notification module has low complexity (1.0x debt). Migration path is well-documented with existing adapters.",
    },
  ],
  keyInsights: [
    "ATLAS estimation accuracy (82%) exceeded team estimation accuracy (70%) by 12 points for the 4th consecutive sprint.",
    "Payments module continues to be the primary source of estimation variance. Tickets touching payments/ averaged 1.6x their team estimates.",
    "Carry-over tickets were both from modules with debt multipliers above 1.0x, reinforcing the correlation between tech debt and delivery risk.",
    "Team velocity has stabilized around 41-42 points over the last 3 sprints, suggesting reliable baseline for Sprint 25 planning.",
  ],
  risksIdentified: [
    "Zendesk integration has been stale for 3 days, degrading customer signal reliability for next sprint.",
    "Sarah Kim's PTO in Sprint 25 Week 1 reduces effective capacity by ~8 points. Plan should front-load her assigned tickets.",
    "COMP-217 (Stripe payment flow) in Sprint 25 carries $120K revenue dependency with only 62% confidence.",
  ],
};

// -----------------------------------------------------------------------------
// 13. Mock Stakeholder Data
// -----------------------------------------------------------------------------

export const mockStakeholderData: StakeholderData = {
  projectHealth: [
    {
      projectId: "proj_acme_backend",
      projectName: "ACME Backend",
      healthScore: 78,
      trend: "improving",
      sprintAccuracy: 76,
      velocity: 42,
      activeSprint: "Sprint 25",
      riskCount: 3,
    },
    {
      projectId: "proj_mobile_app",
      projectName: "Mobile App",
      healthScore: 85,
      trend: "stable",
      sprintAccuracy: 82,
      velocity: 24,
      activeSprint: "Sprint 48",
      riskCount: 1,
    },
    {
      projectId: "proj_data_pipeline",
      projectName: "Data Pipeline",
      healthScore: 64,
      trend: "declining",
      sprintAccuracy: 61,
      velocity: 36,
      activeSprint: "Sprint 12",
      riskCount: 5,
    },
  ],
  accuracyTrend: [
    {
      sprintNumber: 21,
      sprintLabel: "Sprint 21",
      accuracyPercent: 62,
      committed: 44,
      delivered: 31,
      atlasAccuracy: 68,
      teamAccuracy: 58,
    },
    {
      sprintNumber: 22,
      sprintLabel: "Sprint 22",
      accuracyPercent: 72,
      committed: 46,
      delivered: 37,
      atlasAccuracy: 76,
      teamAccuracy: 64,
    },
    {
      sprintNumber: 23,
      sprintLabel: "Sprint 23",
      accuracyPercent: 76,
      committed: 50,
      delivered: 42,
      atlasAccuracy: 80,
      teamAccuracy: 68,
    },
    {
      sprintNumber: 24,
      sprintLabel: "Sprint 24",
      accuracyPercent: 76,
      committed: 48,
      delivered: 41,
      atlasAccuracy: 82,
      teamAccuracy: 70,
    },
  ],
  revenueImpact: {
    unblockedRevenue: 450_000,
    atRiskRevenue: 89_000,
    revenueTickets: [
      {
        id: "COMP-217",
        title: "Stripe payment flow for subscription upgrades",
        revenueImpact: 120_000,
        status: "at_risk",
      },
      {
        id: "COMP-220",
        title: "Dashboard query performance optimization",
        revenueImpact: 89_000,
        status: "at_risk",
      },
      {
        id: "COMP-201",
        title: "Checkout flow state management refactor",
        revenueImpact: 200_000,
        status: "on_track",
      },
      {
        id: "COMP-225",
        title: "Webhook retry logic with exponential backoff",
        revenueImpact: 75_000,
        status: "on_track",
      },
      {
        id: "COMP-230",
        title: "Payment gateway v2 migration",
        revenueImpact: 55_000,
        status: "blocked",
      },
    ],
  },
  recentReports: [
    {
      sprintLabel: "Sprint 24",
      generatedAt: "2025-02-14T18:00:00Z",
      accuracy: 76,
      delivered: 41,
      committed: 48,
    },
    {
      sprintLabel: "Sprint 23",
      generatedAt: "2025-01-31T18:00:00Z",
      accuracy: 76,
      delivered: 42,
      committed: 50,
    },
    {
      sprintLabel: "Sprint 22",
      generatedAt: "2025-01-17T18:00:00Z",
      accuracy: 72,
      delivered: 37,
      committed: 46,
    },
    {
      sprintLabel: "Sprint 21",
      generatedAt: "2025-01-03T18:00:00Z",
      accuracy: 62,
      delivered: 31,
      committed: 44,
    },
  ],
};

// -----------------------------------------------------------------------------
// 14. Ticket Structure / Schema Types
// -----------------------------------------------------------------------------

export type TicketFieldType = "text" | "number" | "select" | "multi-select" | "date" | "user" | "url" | "rich-text";

export interface TicketFieldDefinition {
  id: string;
  label: string;
  type: TicketFieldType;
  required: boolean;
  options?: string[];
  description: string;
  defaultValue?: string | number | boolean;
  position: number;
  visible: boolean;
}

export interface TicketStructureTemplate {
  id: string;
  name: string;
  description: string;
  fields: TicketFieldDefinition[];
  createdAt: string;
  isDefault: boolean;
}

// -----------------------------------------------------------------------------
// 15. AI Ticket Modification Suggestions
// -----------------------------------------------------------------------------

export type SuggestionType = "split" | "merge" | "re-estimate" | "re-assign" | "re-prioritize" | "add-dependency" | "add-label" | "refine-scope";

export type SuggestionConfidence = "high" | "medium" | "low";

export interface TicketModificationSuggestion {
  id: string;
  ticketId: string;
  ticketTitle: string;
  type: SuggestionType;
  title: string;
  description: string;
  reason: string;
  impact: string;
  confidence: SuggestionConfidence;
  confidencePercent: number;
  accepted: boolean | null;
  signalSources: string[];
}

// -----------------------------------------------------------------------------
// 16. Next Sprint Ticket Suggestions
// -----------------------------------------------------------------------------

export interface NextSprintSuggestion {
  id: string;
  title: string;
  suggestedPoints: number;
  priority: "P0" | "P1" | "P2" | "P3";
  module: string;
  reason: string;
  signalSources: string[];
  confidence: number;
  revenueImpact: number | null;
  customerTickets: number;
  dependsOn: string[];
}

// -----------------------------------------------------------------------------
// 17. Delay Anticipation
// -----------------------------------------------------------------------------

export type DelayRisk = "imminent" | "likely" | "possible" | "unlikely";

export interface DelayAnticipation {
  id: string;
  ticketId: string;
  ticketTitle: string;
  assignee: string;
  originalEstimate: number;
  revisedEstimate: number;
  delayDays: number;
  risk: DelayRisk;
  probability: number;
  reason: string;
  mitigation: string;
  impactedTickets: string[];
  revenueAtRisk: number | null;
}

// -----------------------------------------------------------------------------
// 18. Mock Ticket Structure Templates
// -----------------------------------------------------------------------------

export const mockTicketStructures: TicketStructureTemplate[] = [
  {
    id: "ts_default",
    name: "Default Engineering",
    description: "Standard engineering ticket with story points, priority, and module tracking",
    isDefault: true,
    createdAt: "2024-11-01T00:00:00Z",
    fields: [
      { id: "f_title", label: "Title", type: "text", required: true, description: "Brief ticket summary", position: 0, visible: true },
      { id: "f_description", label: "Description", type: "rich-text", required: false, description: "Detailed ticket description with acceptance criteria", position: 1, visible: true },
      { id: "f_priority", label: "Priority", type: "select", required: true, options: ["P0", "P1", "P2", "P3"], description: "Business priority level", position: 2, visible: true },
      { id: "f_points", label: "Story Points", type: "number", required: true, description: "Team-estimated effort in story points", position: 3, visible: true },
      { id: "f_atlas_points", label: "ATLAS Points", type: "number", required: false, description: "AI-calibrated effort estimate", position: 4, visible: true },
      { id: "f_assignee", label: "Assignee", type: "user", required: false, description: "Team member assigned to this ticket", position: 5, visible: true },
      { id: "f_module", label: "Module", type: "select", required: true, options: ["payments/", "auth/", "api/", "dashboard/", "notifications/", "users/"], description: "Codebase module this ticket touches", position: 6, visible: true },
      { id: "f_labels", label: "Labels", type: "multi-select", required: false, options: ["bug", "feature", "performance", "security", "ux", "api", "migration"], description: "Categorization labels", position: 7, visible: true },
      { id: "f_sprint", label: "Sprint", type: "select", required: false, options: ["Sprint 25", "Sprint 26", "Backlog"], description: "Target sprint", position: 8, visible: true },
      { id: "f_status", label: "Status", type: "select", required: true, options: ["todo", "in_progress", "review", "done", "blocked"], description: "Current ticket status", defaultValue: "todo", position: 9, visible: true },
      { id: "f_due_date", label: "Due Date", type: "date", required: false, description: "Expected completion date", position: 10, visible: true },
      { id: "f_external_link", label: "External Link", type: "url", required: false, description: "Link to Jira/Linear/ClickUp ticket", position: 11, visible: true },
    ],
  },
  {
    id: "ts_bugfix",
    name: "Bug Report",
    description: "Bug-specific structure with severity, reproduction steps, and environment fields",
    isDefault: false,
    createdAt: "2024-12-15T00:00:00Z",
    fields: [
      { id: "f_title", label: "Bug Title", type: "text", required: true, description: "Clear bug description", position: 0, visible: true },
      { id: "f_severity", label: "Severity", type: "select", required: true, options: ["Critical", "High", "Medium", "Low"], description: "Bug severity level", position: 1, visible: true },
      { id: "f_repro_steps", label: "Reproduction Steps", type: "rich-text", required: true, description: "Step-by-step reproduction instructions", position: 2, visible: true },
      { id: "f_environment", label: "Environment", type: "select", required: true, options: ["Production", "Staging", "Development", "Local"], description: "Where the bug was found", position: 3, visible: true },
      { id: "f_affected_users", label: "Affected Users", type: "number", required: false, description: "Estimated number of affected users", position: 4, visible: true },
      { id: "f_assignee", label: "Assignee", type: "user", required: false, description: "Engineer assigned to fix", position: 5, visible: true },
      { id: "f_module", label: "Module", type: "select", required: true, options: ["payments/", "auth/", "api/", "dashboard/", "notifications/", "users/"], description: "Affected codebase module", position: 6, visible: true },
      { id: "f_points", label: "Story Points", type: "number", required: true, description: "Estimated effort", position: 7, visible: true },
      { id: "f_status", label: "Status", type: "select", required: true, options: ["reported", "triaged", "in_progress", "fix_review", "verified", "closed"], description: "Bug lifecycle status", defaultValue: "reported", position: 8, visible: true },
    ],
  },
  {
    id: "ts_feature",
    name: "Feature Request",
    description: "Feature ticket with user story, business value, and design spec tracking",
    isDefault: false,
    createdAt: "2025-01-10T00:00:00Z",
    fields: [
      { id: "f_title", label: "Feature Title", type: "text", required: true, description: "Feature name", position: 0, visible: true },
      { id: "f_user_story", label: "User Story", type: "rich-text", required: true, description: "As a [user], I want [feature] so that [benefit]", position: 1, visible: true },
      { id: "f_business_value", label: "Business Value", type: "select", required: true, options: ["Revenue Critical", "Customer Retention", "Operational Efficiency", "Tech Foundation", "Nice to Have"], description: "Business impact category", position: 2, visible: true },
      { id: "f_revenue_impact", label: "Revenue Impact ($)", type: "number", required: false, description: "Estimated revenue impact", position: 3, visible: true },
      { id: "f_design_spec", label: "Design Spec URL", type: "url", required: false, description: "Link to Figma or design spec", position: 4, visible: true },
      { id: "f_priority", label: "Priority", type: "select", required: true, options: ["P0", "P1", "P2", "P3"], description: "Priority level", position: 5, visible: true },
      { id: "f_points", label: "Story Points", type: "number", required: true, description: "Effort estimate", position: 6, visible: true },
      { id: "f_assignee", label: "Assignee", type: "user", required: false, description: "Feature owner", position: 7, visible: true },
      { id: "f_module", label: "Module", type: "select", required: true, options: ["payments/", "auth/", "api/", "dashboard/", "notifications/", "users/"], description: "Target module", position: 8, visible: true },
      { id: "f_status", label: "Status", type: "select", required: true, options: ["proposed", "approved", "in_progress", "review", "shipped"], description: "Feature lifecycle", defaultValue: "proposed", position: 9, visible: true },
    ],
  },
];

// -----------------------------------------------------------------------------
// 19. Mock AI Ticket Modification Suggestions
// -----------------------------------------------------------------------------

export const mockTicketSuggestions: TicketModificationSuggestion[] = [
  {
    id: "sug_001",
    ticketId: "COMP-217",
    ticketTitle: "Implement Stripe payment flow for subscription upgrades",
    type: "split",
    title: "Split into 2 smaller tickets",
    description: "ATLAS detects this 8-point ticket spans payment processing and UI components. Splitting into 'Payment API integration' (5 pts) and 'Upgrade UI flow' (3 pts) would reduce risk and allow parallel work.",
    reason: "Module complexity analysis shows 2 distinct code paths. Historical data: split tickets in payments/ complete 34% faster.",
    impact: "Reduces delivery risk from HIGH to MEDIUM. Enables parallel assignment.",
    confidence: "high",
    confidencePercent: 89,
    accepted: null,
    signalSources: ["Code Complexity", "Historical Velocity", "Module Analysis"],
  },
  {
    id: "sug_002",
    ticketId: "COMP-220",
    ticketTitle: "Optimize dashboard query performance for large datasets",
    type: "re-estimate",
    title: "Increase estimate from 5 to 8 points",
    description: "ATLAS detected N+1 query patterns and a P1 enterprise escalation. Similar optimizations in dashboard/ have historically taken 1.6x longer than estimated.",
    reason: "Enterprise client escalation adds testing requirements. Code signal: 4 database tables affected with no index coverage.",
    impact: "More accurate sprint capacity planning. Avoids carry-over.",
    confidence: "high",
    confidencePercent: 85,
    accepted: null,
    signalSources: ["Code Signal", "Customer Signal", "Historical Accuracy"],
  },
  {
    id: "sug_003",
    ticketId: "COMP-218",
    ticketTitle: "Fix auth token refresh race condition on concurrent requests",
    type: "re-assign",
    title: "Reassign from Sarah Kim to Alex Chen",
    description: "Sarah Kim is on PTO week 1. Alex Chen has 4 pts of capacity headroom and recent context from auth/ module work in Sprint 23.",
    reason: "Capacity signal: Sarah unavailable for first half of sprint. Alex completed similar auth work last sprint.",
    impact: "Ticket can start on Day 1 instead of Day 6. Unblocks dependent auth work.",
    confidence: "medium",
    confidencePercent: 74,
    accepted: null,
    signalSources: ["Capacity Signal", "Assignment History"],
  },
  {
    id: "sug_004",
    ticketId: "COMP-223",
    ticketTitle: "Implement search autocomplete with debounced API calls",
    type: "add-dependency",
    title: "Add dependency on COMP-225 (webhook retry logic)",
    description: "Both tickets modify shared API middleware. Working on them simultaneously risks merge conflicts and integration issues.",
    reason: "Code analysis: 3 shared files in api/ module. COMP-225 changes request handling that COMP-223 depends on.",
    impact: "Prevents merge conflicts. Recommended: Complete COMP-225 first, then COMP-223.",
    confidence: "medium",
    confidencePercent: 71,
    accepted: null,
    signalSources: ["Code Signal", "Dependency Analysis"],
  },
  {
    id: "sug_005",
    ticketId: "COMP-221",
    ticketTitle: "Build transactional email notification system with templates",
    type: "refine-scope",
    title: "Scope down to core transactional only",
    description: "Design specs show 12 email templates. ATLAS suggests shipping 4 critical templates (welcome, invoice, password reset, alert) in Sprint 25 and deferring 8 marketing templates to Sprint 26.",
    reason: "At 5 points, only core templates fit sprint capacity. Deferred templates have no revenue dependencies.",
    impact: "Reduces scope creep risk. Core templates cover 92% of user interactions.",
    confidence: "high",
    confidencePercent: 82,
    accepted: null,
    signalSources: ["Design Signal", "Customer Data", "Scope Analysis"],
  },
  {
    id: "sug_006",
    ticketId: "COMP-219",
    ticketTitle: "Add user profile avatar upload with image optimization",
    type: "re-prioritize",
    title: "Deprioritize from Sprint 25 to Sprint 26",
    description: "No revenue dependency or customer escalation. Current sprint has 2 high-risk tickets (COMP-217, COMP-220). Moving this frees 3 pts of buffer capacity.",
    reason: "Zero customer support tickets linked. No revenue pipeline dependency. Low urgency signal.",
    impact: "Creates 3 pts buffer for high-risk items. Reduces sprint risk score by 8%.",
    confidence: "medium",
    confidencePercent: 68,
    accepted: null,
    signalSources: ["Priority Analysis", "Risk Model"],
  },
];

// -----------------------------------------------------------------------------
// 20. Mock Next Sprint Ticket Suggestions
// -----------------------------------------------------------------------------

export const mockNextSprintSuggestions: NextSprintSuggestion[] = [
  {
    id: "ns_001",
    title: "Migrate payment gateway to v2 API with 3DS2 support",
    suggestedPoints: 13,
    priority: "P0",
    module: "payments/",
    reason: "Carried over from Sprint 25 exclusion. Payment processor deprecating v1 API in 60 days. Revenue-critical.",
    signalSources: ["Integration Alert", "Revenue Signal", "Compliance"],
    confidence: 95,
    revenueImpact: 340000,
    customerTickets: 0,
    dependsOn: ["COMP-217"],
  },
  {
    id: "ns_002",
    title: "Implement real-time notification system via WebSockets",
    suggestedPoints: 6,
    priority: "P1",
    module: "notifications/",
    reason: "Previously excluded due to capacity. 3 enterprise clients requested this feature. WebSocket infrastructure from COMP-216 will be ready.",
    signalSources: ["Customer Signal", "Dependency Graph"],
    confidence: 82,
    revenueImpact: 89000,
    customerTickets: 8,
    dependsOn: [],
  },
  {
    id: "ns_003",
    title: "Add RBAC permission system for team workspace",
    suggestedPoints: 8,
    priority: "P1",
    module: "auth/",
    reason: "Enterprise readiness requirement. 45-day-old backlog item with 2 blocked dependent tickets.",
    signalSources: ["Backlog Age", "Customer Signal", "Enterprise Readiness"],
    confidence: 78,
    revenueImpact: 120000,
    customerTickets: 5,
    dependsOn: ["COMP-218"],
  },
  {
    id: "ns_004",
    title: "Automated performance regression test suite",
    suggestedPoints: 5,
    priority: "P2",
    module: "api/",
    reason: "Tech debt signal: 2 performance regressions in last 3 sprints went undetected until production. CI/CD gap.",
    signalSources: ["Incident History", "Code Quality", "Tech Debt"],
    confidence: 74,
    revenueImpact: null,
    customerTickets: 0,
    dependsOn: [],
  },
  {
    id: "ns_005",
    title: "SSO integration for Okta and Azure AD",
    suggestedPoints: 8,
    priority: "P1",
    module: "auth/",
    reason: "Blocked for 45 days. 3 enterprise deals ($420K total) contingent on SSO support. Okta SDK update simplifies implementation.",
    signalSources: ["Revenue Signal", "CRM Data", "Backlog Age"],
    confidence: 86,
    revenueImpact: 420000,
    customerTickets: 12,
    dependsOn: [],
  },
];

// -----------------------------------------------------------------------------
// 21. Mock Delay Anticipations
// -----------------------------------------------------------------------------

export const mockDelayAnticipations: DelayAnticipation[] = [
  {
    id: "delay_001",
    ticketId: "COMP-217",
    ticketTitle: "Implement Stripe payment flow for subscription upgrades",
    assignee: "Alex Chen",
    originalEstimate: 8,
    revisedEstimate: 11,
    delayDays: 2,
    risk: "imminent",
    probability: 88,
    reason: "Payments module debt multiplier (2.8x) + 4 open PRs creating merge conflicts. Alex is at 108% load capacity. Historical: similar tickets averaged 1.6x estimates.",
    mitigation: "Split ticket into payment API (5 pts) + upgrade UI (3 pts). Reassign UI portion to Priya (18 pts available capacity). Front-load code review to reduce merge conflict window.",
    impactedTickets: ["COMP-230"],
    revenueAtRisk: 120000,
  },
  {
    id: "delay_002",
    ticketId: "COMP-220",
    ticketTitle: "Optimize dashboard query performance for large datasets",
    assignee: "Jordan Lee",
    originalEstimate: 8,
    revisedEstimate: 10,
    delayDays: 1,
    risk: "likely",
    probability: 72,
    reason: "Jordan on-call week 2 reduces effective velocity by 4 pts. P1 enterprise escalation adds mandatory load testing requirement not in original scope.",
    mitigation: "Schedule on-call handoff to Marcus for critical hours. Pre-create database indexes before optimization work begins. Pair with DBA for load test setup.",
    impactedTickets: [],
    revenueAtRisk: 89000,
  },
  {
    id: "delay_003",
    ticketId: "COMP-225",
    ticketTitle: "Add webhook retry logic with exponential backoff",
    assignee: "Alex Chen",
    originalEstimate: 5,
    revisedEstimate: 6,
    delayDays: 1,
    risk: "possible",
    probability: 45,
    reason: "Shared codebase with COMP-223 (search autocomplete). If both proceed in parallel, merge conflicts in api/ middleware could add 1 day of resolution work.",
    mitigation: "Sequence COMP-225 before COMP-223. Use feature flags to isolate retry logic changes. Schedule pair programming session for shared middleware updates.",
    impactedTickets: ["COMP-223"],
    revenueAtRisk: null,
  },
  {
    id: "delay_004",
    ticketId: "COMP-218",
    ticketTitle: "Fix auth token refresh race condition on concurrent requests",
    assignee: "Sarah Kim",
    originalEstimate: 5,
    revisedEstimate: 5,
    delayDays: 3,
    risk: "likely",
    probability: 100,
    reason: "Sarah Kim on PTO entire week 1. Ticket cannot start until Day 6. With 5-point effort, completion pushes to final sprint day with zero buffer.",
    mitigation: "Reassign to Alex Chen who has auth/ module context from Sprint 23. Or: accept 3-day delay and plan for potential carry-over.",
    impactedTickets: ["COMP-231"],
    revenueAtRisk: null,
  },
];

// -----------------------------------------------------------------------------
// Utility: Computed summary values
// -----------------------------------------------------------------------------

export const sprintPlanSummary = {
  totalAtlasPoints: mockSprintTickets.reduce((sum, t) => sum + t.atlasPoints, 0),
  totalTeamPoints: mockSprintTickets.reduce((sum, t) => sum + t.teamPoints, 0),
  ticketCount: mockSprintTickets.length,
  highRiskCount: mockSprintTickets.filter((t) => t.risk === "high" || t.risk === "critical").length,
  averageConfidence: Math.round(
    mockSprintTickets.reduce((sum, t) => sum + t.confidence, 0) / mockSprintTickets.length
  ),
  teamEffectiveCapacity: mockTeamMembers.reduce((sum, m) => sum + m.effectiveCapacity, 0),
  excludedCount: mockExcludedTickets.length,
};
