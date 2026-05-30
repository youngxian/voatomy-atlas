import { config } from './config';

// ── Fetch wrapper ──

const DEFAULT_TIMEOUT_MS = 15_000;

async function fetchAPI<T>(path: string, options?: RequestInit & { service?: 'onboarding' | 'atlas' | 'signal'; timeoutMs?: number }): Promise<T> {
  const svc = options?.service;
  let base: string;
  if (svc === 'signal') {
    base = config.signalApiBase;
  } else if (svc === 'onboarding' || path.startsWith('/v1/me') || path.startsWith('/v1/notifications') || path.startsWith('/v1/settings')) {
    base = config.apiBase;
  } else {
    base = config.atlasApiBase;
  }
  const url = `${base}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof window !== 'undefined' && getCookieToken()
          ? { Authorization: `Bearer ${getCookieToken()}` }
          : {}),
        ...options?.headers,
      },
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new APIError(res.status, body?.error?.code ?? 'unknown', body?.error?.message ?? res.statusText);
    }

    const json = await res.json();
    return json.data ?? json;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new APIError(0, 'timeout', `Request timed out after ${options?.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )session=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ── Types ──

export interface MeResponse {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: string;
  org_name: string;
  avatar?: string;
  timezone?: string;
  onboarding_completed?: boolean;
  product_activations?: Record<string, 'pending' | 'in_progress' | 'completed' | 'skipped'>;
}

export interface ProviderConnection {
  id: string;
  project_id: string;
  provider: string;
  external_project_id: string;
  external_board_id: string;
  sync_enabled: boolean;
  last_synced_at?: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  sprint_duration_days: number;
  estimation_method: string;
  provider?: string;
  connections?: ProviderConnection[];
  jira_project_key?: string;
  linear_team_id?: string;
  clickup_list_id?: string;
  clickup_space_id?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  planned_points?: number;
  actual_points?: number;
  accuracy_pct?: number;
  confidence_level?: string;
  ai_notes?: string;
  human_notes?: string;
  clickup_list_id?: string;
  external_id?: string;
  jira_sprint_id?: string;
  linear_cycle_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SprintDetail extends Sprint {
  tickets?: SprintTicketLink[];
}

export interface SprintTicketLink {
  id: string;
  sprint_id: string;
  ticket_id: string;
  status: string;
  planned_points?: number;
  actual_points?: number;
  order_index: number;
}

export type TicketType = 'bug' | 'feature' | 'chore' | 'tech_debt' | 'spike';

export interface Ticket {
  id: string;
  project_id: string;
  external_id: string;
  external_url?: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  ai_points?: number;
  human_points?: number;
  estimation_confidence?: string;
  ai_type?: TicketType;
  labels?: string[];
  assignee_id?: string;
  assignee_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  sprints_synced: number;
  tickets_synced: number;
  errors?: string[];
}

// ── User / Auth ──

export function getMe(): Promise<MeResponse> {
  return fetchAPI<MeResponse>('/v1/me');
}

export function updateMe(input: { full_name?: string; timezone?: string; org_name?: string }): Promise<MeResponse> {
  return fetchAPI<MeResponse>('/v1/me', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteAccount(): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>('/v1/me', { method: 'DELETE' });
}

// ── Projects ──

export function getProjects(): Promise<Project[]> {
  return fetchAPI<Project[]>('/v1/projects');
}

export function getProject(id: string): Promise<Project> {
  return fetchAPI<Project>(`/v1/projects/${id}`);
}

/** Project-level RBAC role from user_project_access */
export type ProjectRole = 'admin' | 'manager' | 'member' | 'viewer';

export interface ProjectAccessResponse {
  role: ProjectRole;
}

export function getProjectAccess(projectId: string): Promise<ProjectAccessResponse> {
  return fetchAPI<ProjectAccessResponse>(`/v1/projects/${projectId}/access`);
}

export function createProject(input: Partial<Project>): Promise<Project> {
  return fetchAPI<Project>('/v1/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProject(id: string, input: Partial<Project> & { sprint_name?: string }): Promise<Project> {
  return fetchAPI<Project>(`/v1/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: string): Promise<{ deleted: boolean }> {
  return fetchAPI<{ deleted: boolean }>(`/v1/projects/${id}`, { method: 'DELETE' });
}

// ── ClickUp Discovery ──

export interface ClickUpSpaceInfo {
  space_id: string;
  space_name: string;
  team_id: string;
  team_name: string;
  private: boolean;
  imported: boolean;
}

export interface ClickUpImportResult {
  created: Project[];
  skipped: string[];
}

export function getClickUpSpaces(): Promise<ClickUpSpaceInfo[]> {
  return fetchAPI<ClickUpSpaceInfo[]>('/v1/integrations/clickup/spaces');
}

export interface ClickUpListInfo {
  id: string;
  name: string;
  has_sprint: boolean;
  start_date?: string;
  due_date?: string;
}

export interface ClickUpSpaceDetails {
  folder_count: number;
  folders?: {
    id: string;
    name: string;
    lists: ClickUpListInfo[];
    list_ids?: string[];
    has_sprint?: boolean;
    sprint_list_ids?: string[];
  }[];
  folderless_lists?: ClickUpListInfo[];
  current_sprint?: {
    id: string;
    name: string;
    start_date: string;
    due_date: string;
    status: string;
  };
}

export function getClickUpSpaceDetails(spaceId: string): Promise<ClickUpSpaceDetails> {
  return fetchAPI<ClickUpSpaceDetails>(`/v1/integrations/clickup/spaces/${spaceId}/details`);
}

export function importClickUpSpaces(spaceIds: string[], teamId?: string): Promise<ClickUpImportResult> {
  return fetchAPI<ClickUpImportResult>('/v1/integrations/clickup/import', {
    method: 'POST',
    body: JSON.stringify({ space_ids: spaceIds, team_id: teamId ?? '' }),
  });
}

export interface BoardSyncResult {
  sprints_synced: number;
  tickets_synced: number;
  comments_synced: number;
  errors?: string[];
}

/** @deprecated Use {@link syncProject} instead. */
export function syncClickUpProject(projectId: string): Promise<BoardSyncResult> {
  return syncProject(projectId);
}

export function registerClickUpWebhook(teamId: string): Promise<{ webhook_id: string; status: string }> {
  return fetchAPI<{ webhook_id: string; status: string }>('/v1/integrations/clickup/webhook', {
    method: 'POST',
    body: JSON.stringify({ team_id: teamId }),
  });
}

// ── Generic Provider Discovery ──

export interface DiscoveryWorkspace {
  id: string;
  name: string;
  avatar_url?: string;
  member_count?: number;
}

export interface DiscoveryProject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface DiscoveryBoard {
  id: string;
  name: string;
  description?: string;
  has_sprints?: boolean;
  ticket_count?: number;
}

export interface ImportProviderRequest {
  workspace_id?: string;
  project_id?: string;
  board_ids: string[];
  project_name?: string;
}

export interface ImportProviderResult {
  created: Project[];
  skipped: string[];
}

export function getProviderWorkspaces(provider: string): Promise<DiscoveryWorkspace[]> {
  return fetchAPI<DiscoveryWorkspace[]>(`/v1/integrations/${provider}/workspaces`);
}

export function getProviderProjects(provider: string, workspaceId: string): Promise<DiscoveryProject[]> {
  return fetchAPI<DiscoveryProject[]>(
    `/v1/integrations/${provider}/projects?workspace_id=${encodeURIComponent(workspaceId)}`,
  );
}

export function getProviderBoards(
  provider: string,
  workspaceId: string,
  projectId?: string,
): Promise<DiscoveryBoard[]> {
  const params = new URLSearchParams({ workspace_id: workspaceId });
  if (projectId) params.set('project_id', projectId);
  return fetchAPI<DiscoveryBoard[]>(`/v1/integrations/${provider}/boards?${params}`);
}

export function importProviderBoard(
  provider: string,
  body: ImportProviderRequest,
): Promise<ImportProviderResult> {
  return fetchAPI<ImportProviderResult>(`/v1/integrations/${provider}/import`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Write-Back APIs ──

export function pushTicketStatus(
  projectId: string,
  ticketId: string,
  status: string,
): Promise<void> {
  return fetchAPI<void>(`/v1/projects/${projectId}/tickets/${ticketId}/push-status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export function pushTicketComment(
  projectId: string,
  ticketId: string,
  body: string,
): Promise<void> {
  return fetchAPI<void>(`/v1/projects/${projectId}/tickets/${ticketId}/push-comment`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function pushTicketLabel(
  projectId: string,
  ticketId: string,
  label: string,
): Promise<void> {
  return fetchAPI<void>(`/v1/projects/${projectId}/tickets/${ticketId}/push-label`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
}

export function pushTicketField(
  projectId: string,
  ticketId: string,
  fieldId: string,
  value: unknown,
): Promise<void> {
  return fetchAPI<void>(`/v1/projects/${projectId}/tickets/${ticketId}/push-field`, {
    method: 'POST',
    body: JSON.stringify({ field_id: fieldId, value }),
  });
}

export function pushNewTicket(
  projectId: string,
  ticket: { title: string; description?: string; status?: string; priority?: string; labels?: string[] },
): Promise<{ external_id: string }> {
  return fetchAPI<{ external_id: string }>(`/v1/projects/${projectId}/push-ticket`, {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
}

// ── Connection Management APIs ──

export interface AddConnectionRequest {
  provider: string;
  external_project_id: string;
  external_board_id?: string;
  sync_enabled?: boolean;
}

export function getProjectConnections(projectId: string): Promise<ProviderConnection[]> {
  return fetchAPI<ProviderConnection[]>(`/v1/projects/${projectId}/connections`);
}

export function addProjectConnection(
  projectId: string,
  data: AddConnectionRequest,
): Promise<ProviderConnection> {
  return fetchAPI<ProviderConnection>(`/v1/projects/${projectId}/connections`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProjectConnection(
  projectId: string,
  connId: string,
  data: Partial<Pick<ProviderConnection, 'sync_enabled' | 'external_board_id'>>,
): Promise<ProviderConnection> {
  return fetchAPI<ProviderConnection>(`/v1/projects/${projectId}/connections/${connId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function removeProjectConnection(
  projectId: string,
  connId: string,
): Promise<void> {
  return fetchAPI<void>(`/v1/projects/${projectId}/connections/${connId}`, {
    method: 'DELETE',
  });
}

export function syncConnection(
  projectId: string,
  connId: string,
): Promise<BoardSyncResult> {
  return fetchAPI<BoardSyncResult>(`/v1/projects/${projectId}/connections/${connId}/sync`, {
    method: 'POST',
  });
}

export function registerConnectionWebhook(
  projectId: string,
  connId: string,
): Promise<{ webhook_id: string; status: string }> {
  return fetchAPI<{ webhook_id: string; status: string }>(
    `/v1/projects/${projectId}/connections/${connId}/webhook`,
    { method: 'POST' },
  );
}

// ── Project Hierarchy (Board Explorer) ──

export interface HierarchyItem {
  id: string;
  name: string;
  type: string;
  has_sprint: boolean;
  is_active: boolean;
  ticket_count?: number;
  children?: HierarchyItem[];
}

export interface ProjectHierarchy {
  provider: string;
  project_name: string;
  containers: HierarchyItem[];
  standalone_items?: HierarchyItem[];
  active_item_id: string;
  active_item_name: string;
}

export function getProjectHierarchy(projectId: string): Promise<ProjectHierarchy> {
  return fetchAPI<ProjectHierarchy>(`/v1/projects/${projectId}/hierarchy`, { timeoutMs: 30_000 });
}

// ── Universal Board Structure ──

export interface SprintSummary {
  external_id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  ticket_count: number;
}

export interface StatusInfo {
  name: string;
  provider_id: string;
  maps_to: string;
  ticket_count: number;
  position: number;
  is_done: boolean;
  is_initial: boolean;
}

export interface BoardStructure {
  provider: string;
  has_sprints: boolean;
  sprints: SprintSummary[];
  active_sprint?: SprintSummary;
  past_sprints?: SprintSummary[];
  future_sprints?: SprintSummary[];
  backlog_count: number;
  total_tickets: number;
  team_member_count: number;
  status_workflow: StatusInfo[];
  has_subtasks: boolean;
  has_dependencies: boolean;
  estimation_field: string;
}

export interface BoardColumn {
  id: string;
  connection_id: string;
  provider_name: string;
  provider_id: string;
  mapped_status: string;
  position: number;
  is_done: boolean;
  is_initial: boolean;
}

export function getBoardColumns(projectId: string): Promise<{ columns: BoardColumn[] }> {
  return fetchAPI<{ columns: BoardColumn[] }>(`/v1/projects/${projectId}/board-columns`);
}

export function patchBoardColumns(
  projectId: string,
  input: { columns: { provider_name: string; provider_id?: string; mapped_status: string; position: number; is_done: boolean; is_initial: boolean }[] },
): Promise<{ columns: BoardColumn[] }> {
  return fetchAPI<{ columns: BoardColumn[] }>(`/v1/projects/${projectId}/board-columns`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getBoardStructure(
  provider: string,
  externalProjectId: string,
  orgId: string,
  externalBoardId?: string,
): Promise<BoardStructure> {
  const params = new URLSearchParams({
    external_project_id: externalProjectId,
    org_id: orgId,
  });
  if (externalBoardId) params.set('external_board_id', externalBoardId);
  return fetchAPI<BoardStructure>(
    `/v1/integrations/${provider}/board-structure?${params}`,
    { timeoutMs: 30_000 },
  );
}

export function syncProject(projectId: string): Promise<BoardSyncResult> {
  return fetchAPI<BoardSyncResult>(`/v1/projects/${projectId}/sync`, { method: 'POST' });
}

// ── Sprints ──

export function getSprints(projectId: string, status?: string): Promise<Sprint[]> {
  const params = status ? `?status=${status}` : '';
  return fetchAPI<Sprint[]>(`/v1/projects/${projectId}/sprints${params}`);
}

export function getCurrentSprint(projectId: string): Promise<SprintDetail> {
  return fetchAPI<SprintDetail>(`/v1/projects/${projectId}/sprints/current`);
}

export function getSprint(projectId: string, sprintId: string): Promise<SprintDetail> {
  return fetchAPI<SprintDetail>(`/v1/projects/${projectId}/sprints/${sprintId}`);
}

export function getSprintTicketsFull(projectId: string, sprintId: string): Promise<Ticket[]> {
  return fetchAPI<Ticket[]>(`/v1/projects/${projectId}/sprints/${sprintId}/tickets`);
}

// ── Tickets ──

export function getTickets(projectId: string, filters?: { status?: string; sprint?: string }): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.sprint) params.set('sprint', filters.sprint);
  const qs = params.toString();
  return fetchAPI<Ticket[]>(`/v1/projects/${projectId}/tickets${qs ? `?${qs}` : ''}`);
}

export function getTicket(projectId: string, ticketId: string): Promise<Ticket> {
  return fetchAPI<Ticket>(`/v1/projects/${projectId}/tickets/${ticketId}`);
}

export function updateTicket(
  projectId: string,
  ticketId: string,
  input: Partial<Pick<Ticket, 'status' | 'priority' | 'human_points' | 'assignee_id' | 'title' | 'description'>>,
): Promise<Ticket> {
  return fetchAPI<Ticket>(`/v1/projects/${projectId}/tickets/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function createTicket(
  projectId: string,
  input: { title: string; description?: string; status?: Ticket['status']; priority?: Ticket['priority']; labels?: string[]; assignee_id?: string },
): Promise<Ticket> {
  return fetchAPI<Ticket>(`/v1/projects/${projectId}/tickets`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteTicket(projectId: string, ticketId: string): Promise<void> {
  return fetchAPI<void>(`/v1/projects/${projectId}/tickets/${ticketId}`, {
    method: 'DELETE',
  });
}

export function bulkUpdateTickets(
  projectId: string,
  input: { ticket_ids: string[]; status?: string; priority?: string },
): Promise<{ updated: number }> {
  return fetchAPI<{ updated: number }>(`/v1/projects/${projectId}/tickets/bulk-update`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ── Sync ──

export function triggerSync(projectId: string): Promise<SyncResult> {
  return fetchAPI<SyncResult>(`/v1/projects/${projectId}/sync`, { method: 'POST' });
}

// ── Phase 2: Sprint Intelligence ──

// Accuracy
export interface AccuracyOverview {
  project_id: string;
  current_accuracy: number;
  previous_accuracy: number;
  trend: string;
  total_sprints: number;
  target_accuracy: number;
}

export interface AccuracyHistoryEntry {
  sprint_id: string;
  sprint_name: string;
  accuracy_pct: number;
  planned_points: number;
  actual_points: number;
  ticket_count: number;
  completed: number;
  carried_over: number;
}

export interface AccuracyHistory {
  entries: AccuracyHistoryEntry[];
}

export interface SprintAccuracyDetail {
  sprint: Sprint;
  accuracy_pct: number;
  tickets: TicketAccuracyDetail[];
  planned_points: number;
  actual_points: number;
}

export interface TicketAccuracyDetail {
  ticket_id: string;
  external_id: string;
  title: string;
  planned_points: number;
  actual_points: number;
  variance: number;
  delivered: boolean;
  assignee_id?: string;
  assignee_name?: string;
}

export interface TeamAccuracy {
  members: { assignee_id: string; assignee_name?: string; total_tickets: number; delivered: number; accuracy_pct: number; avg_variance: number }[];
}

export interface ModuleAccuracy {
  modules: { label: string; ticket_count: number; accuracy_pct: number; avg_variance: number }[];
}

export function getAccuracyOverview(projectId: string): Promise<AccuracyOverview> {
  return fetchAPI<AccuracyOverview>(`/v1/projects/${projectId}/accuracy`);
}

export function getAccuracyHistory(projectId: string): Promise<AccuracyHistory> {
  return fetchAPI<AccuracyHistory>(`/v1/projects/${projectId}/accuracy/history`);
}

export function getSprintAccuracy(projectId: string, sprintId: string): Promise<SprintAccuracyDetail> {
  return fetchAPI<SprintAccuracyDetail>(`/v1/projects/${projectId}/accuracy/${sprintId}`);
}

export function getSprintAccuracyTickets(projectId: string, sprintId: string): Promise<TicketAccuracyDetail[]> {
  return fetchAPI<TicketAccuracyDetail[]>(`/v1/projects/${projectId}/accuracy/${sprintId}/tickets`);
}

export function getTeamAccuracy(projectId: string): Promise<TeamAccuracy> {
  return fetchAPI<TeamAccuracy>(`/v1/projects/${projectId}/accuracy/team`);
}

export function getModuleAccuracy(projectId: string): Promise<ModuleAccuracy> {
  return fetchAPI<ModuleAccuracy>(`/v1/projects/${projectId}/accuracy/modules`);
}

// Intelligence
export interface TicketSuggestion {
  id: string;
  project_id: string;
  ticket_id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  status: string;
}

export interface NextSprintRecommendation {
  tickets: { ticket: Ticket; priority: number; reason: string; points: number }[];
  total_points: number;
  capacity_use_pct: number;
  rationale: string;
}

export interface DelayRisk {
  id: string;
  project_id: string;
  ticket_id?: string;
  ticket_title: string;
  risk_level: string;
  probability: number;
  impact_days: number;
  description: string;
  mitigation: string;
}

export function getTicketSuggestions(projectId: string): Promise<TicketSuggestion[]> {
  return fetchAPI<TicketSuggestion[]>(`/v1/projects/${projectId}/ai/ticket-suggestions`);
}

export function acceptSuggestion(projectId: string, suggestionId: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/projects/${projectId}/ai/ticket-suggestions/${suggestionId}/accept`, { method: 'POST' });
}

export function dismissSuggestion(projectId: string, suggestionId: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/projects/${projectId}/ai/ticket-suggestions/${suggestionId}/dismiss`, { method: 'POST' });
}

export function estimateTickets(projectId: string, ticketIds?: string[]): Promise<{ estimated: number }> {
  return fetchAPI<{ estimated: number }>(`/v1/projects/${projectId}/ai/tickets/estimate`, {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds ?? [] }),
  });
}

export function getNextSprintRecommendation(projectId: string): Promise<NextSprintRecommendation> {
  return fetchAPI<NextSprintRecommendation>(`/v1/projects/${projectId}/ai/next-sprint`);
}

export function getDelayRisks(projectId: string): Promise<DelayRisk[]> {
  return fetchAPI<DelayRisk[]>(`/v1/projects/${projectId}/ai/delay-risks`);
}

// Duplicates
export interface DuplicateGroup {
  ticket_ids: string[];
  titles: string[];
  confidence: number;
  reason: string;
}

export function getDuplicates(projectId: string): Promise<DuplicateGroup[]> {
  return fetchAPI<DuplicateGroup[]>(`/v1/projects/${projectId}/ai/duplicates`);
}

// Subtask Detection
export interface SuggestedTask {
  title: string;
  description: string;
  points: number;
}

export interface SubtaskSuggestion {
  ticket_id: string;
  ticket_title: string;
  reason: string;
  subtasks: SuggestedTask[];
}

export function getSubtaskSuggestions(projectId: string): Promise<SubtaskSuggestion[]> {
  return fetchAPI<SubtaskSuggestion[]>(`/v1/projects/${projectId}/ai/subtasks`);
}

// ── Sprint Insights APIs ──

export interface SmartLabel {
  ticket_id: string;
  external_id: string;
  ticket_title: string;
  label: string;
  reason: string;
  confidence: number;
  pushed: boolean;
}

export interface CalibrationEntry {
  assignee_id: string;
  assignee_name?: string;
  module: string;
  total_tickets: number;
  avg_bias: number;
  avg_abs_error: number;
  over_estimate: number;
  under_estimate: number;
  accurate: number;
  accuracy_pct: number;
}

export interface CalibrationReport {
  project_id: string;
  sprints_used: number;
  by_developer: CalibrationEntry[];
  by_module: CalibrationEntry[];
  global_bias: number;
  insight: string;
  generated_at: string;
}

export interface ForecastPoint {
  sprint_name: string;
  actual: number;
  predicted: number;
}

export interface VelocityForecast {
  project_id: string;
  next_sprint_low: number;
  next_sprint_mid: number;
  next_sprint_high: number;
  confidence_pct: number;
  trend: string;
  data_points: ForecastPoint[];
  insight: string;
}

export interface CascadeNode {
  ticket_id: string;
  external_id: string;
  title: string;
  status: string;
  points: number;
  depth: number;
}

export interface BlockerCascade {
  root_ticket_id: string;
  root_title: string;
  root_status: string;
  affected_tickets: CascadeNode[];
  total_impact_pts: number;
  max_depth: number;
  risk_level: string;
  recommendation: string;
}

export interface SimulationRisk {
  factor: string;
  impact: string;
  probability: number;
}

export interface SprintSimulation {
  sprint_id: string;
  sprint_name: string;
  total_planned: number;
  iterations: number;
  completion_prob: number;
  p50_delivered: number;
  p75_delivered: number;
  p90_delivered: number;
  risk_factors: SimulationRisk[];
  insight: string;
}

export interface AnomalyAlert {
  id: string;
  project_id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  metric_name: string;
  expected_value: number;
  actual_value: number;
  deviation_pct: number;
  detected_at: string;
}

export interface LoadRecommendation {
  assignee_id: string;
  assignee_name: string;
  current_load: number;
  ideal_load: number;
  delta: number;
  action: string;
}

export interface LoadBalanceReport {
  project_id: string;
  sprint_id?: string;
  total_points: number;
  member_count: number;
  ideal_per_member: number;
  gini_coefficient: number;
  is_balanced: boolean;
  recommendations: LoadRecommendation[];
  insight: string;
}

export interface ExecutiveMetrics {
  avg_velocity: number;
  velocity_trend: string;
  avg_accuracy: number;
  accuracy_trend: string;
  total_delivered: number;
  total_planned: number;
  sprints_analyzed: number;
  blocker_count: number;
  carryover_rate: number;
}

export interface ExecutiveReport {
  project_id: string;
  project_name: string;
  period: string;
  health_score: number;
  highlights: string[];
  risks: string[];
  metrics: ExecutiveMetrics;
  recommendations: string[];
  generated_at: string;
}

export function getSmartLabels(projectId: string, pushToBoard = false): Promise<SmartLabel[]> {
  return fetchAPI<SmartLabel[]>(`/v1/projects/${projectId}/ai/smart-labels`, {
    method: 'POST',
    body: JSON.stringify({ push_to_board: pushToBoard }),
  });
}

export function pushRiskComments(projectId: string): Promise<{ pushed: number }> {
  return fetchAPI<{ pushed: number }>(`/v1/projects/${projectId}/ai/push-risk-comments`, { method: 'POST' });
}

export function getCalibrationReport(projectId: string): Promise<CalibrationReport> {
  return fetchAPI<CalibrationReport>(`/v1/projects/${projectId}/ai/calibration`);
}

export function getVelocityForecast(projectId: string): Promise<VelocityForecast> {
  return fetchAPI<VelocityForecast>(`/v1/projects/${projectId}/ai/velocity-forecast`);
}

export function getBlockerCascades(projectId: string): Promise<BlockerCascade[]> {
  return fetchAPI<BlockerCascade[]>(`/v1/projects/${projectId}/ai/blocker-cascades`);
}

export function simulateSprintOutcome(projectId: string): Promise<SprintSimulation> {
  return fetchAPI<SprintSimulation>(`/v1/projects/${projectId}/ai/simulate-sprint`);
}

export function detectAnomalies(projectId: string): Promise<AnomalyAlert[]> {
  return fetchAPI<AnomalyAlert[]>(`/v1/projects/${projectId}/ai/anomalies`);
}

export function getLoadBalanceReport(projectId: string): Promise<LoadBalanceReport> {
  return fetchAPI<LoadBalanceReport>(`/v1/projects/${projectId}/ai/load-balance`);
}

export function getExecutiveReport(projectId: string): Promise<ExecutiveReport> {
  return fetchAPI<ExecutiveReport>(`/v1/projects/${projectId}/ai/executive-report`);
}

// Burndown
export interface BurndownSnapshot {
  snapshot_date: string;
  points_remaining: number;
  points_completed: number;
  points_added: number;
}

export interface BurndownData {
  sprint_id: string;
  sprint_name: string;
  start_date?: string;
  end_date?: string;
  snapshots: BurndownSnapshot[];
  ideal_line: { date: string; points_remaining: number }[];
}

export function getBurndown(projectId: string, sprintId: string): Promise<BurndownData> {
  return fetchAPI<BurndownData>(`/v1/projects/${projectId}/sprints/${sprintId}/burndown`);
}

export interface EnrichedSprintTicket {
  id: string;
  sprint_id: string;
  ticket_id: string;
  status: string;
  planned_points?: number;
  actual_points?: number;
  started_at?: string;
  completed_at?: string;
  order_index: number;
  title: string;
  external_id: string;
  assignee_name?: string;
  module?: string;
  ticket_status: string;
  labels?: string[];
}

export interface EnrichedBurndownData extends BurndownData {
  sprint_status: string;
  total_points: number;
  completed_points: number;
  planned_points: number;
  tickets: EnrichedSprintTicket[];
}

export function getEnrichedBurndown(projectId: string, sprintId: string): Promise<EnrichedBurndownData> {
  return fetchAPI<EnrichedBurndownData>(`/v1/projects/${projectId}/sprints/${sprintId}/burndown/enriched`);
}

export function recordBurndownSnapshot(projectId: string, sprintId: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/projects/${projectId}/sprints/${sprintId}/burndown/snapshot`, { method: 'POST' });
}

// Analytics
export interface AnalyticsOverview {
  project_id: string;
  avg_velocity: number;
  velocity_trend: string;
  avg_throughput: number;
  avg_cycle_time_days: number;
  avg_lead_time_days: number;
  sprint_count: number;
  velocity_data: VelocityPoint[];
  /** Extended analytics payloads when the API returns richer dashboards */
  health_metrics?: unknown[];
  review_matrix?: unknown[];
  pair_programming?: unknown[];
  ai_recommendations?: unknown[];
}

export interface VelocityPoint {
  sprint_id: string;
  sprint_name: string;
  planned: number;
  actual: number;
}

export interface VelocityTrend {
  points: VelocityPoint[];
  avg_velocity: number;
  trend: string;
  prediction?: number;
}

export function getAnalyticsOverview(projectId: string): Promise<AnalyticsOverview> {
  return fetchAPI<AnalyticsOverview>(`/v1/projects/${projectId}/analytics`);
}

export function getVelocityTrend(projectId: string): Promise<VelocityTrend> {
  return fetchAPI<VelocityTrend>(`/v1/projects/${projectId}/analytics/velocity`);
}

// Reports
export interface SprintReport {
  sprint: Sprint;
  total_committed: number;
  total_delivered: number;
  accuracy_pct: number;
  ticket_breakdown: { total: number; completed: number; carried_over: number; descoped: number };
  key_insights: string[];
  risks_identified: string[];
}

export function getSprintReport(projectId: string, sprintId: string): Promise<SprintReport> {
  return fetchAPI<SprintReport>(`/v1/projects/${projectId}/sprints/${sprintId}/report`);
}

// Sprint Plan
export interface SprintPlan {
  sprint: Sprint;
  included_tickets: { ticket: Ticket; points: number; order_index: number }[];
  excluded_tickets: { ticket: Ticket; reason: string }[];
  total_points: number;
  capacity_used_pct: number;
  predicted_accuracy: number;
  confidence: string;
  notes: string;
}

export function getSprintPlan(projectId: string): Promise<SprintPlan> {
  return fetchAPI<SprintPlan>(`/v1/projects/${projectId}/sprints/plan`);
}

export interface GenerateOptions {
  signals?: string[];
  write_back?: Record<string, boolean>;
}

export interface PushResult {
  written: string[];
  plan_id: string;
}

export function generateSprintPlan(projectId: string, opts?: GenerateOptions): Promise<SprintPlan> {
  return fetchAPI<SprintPlan>(`/v1/projects/${projectId}/sprints/plan/generate`, {
    method: 'POST',
    timeoutMs: 60_000,
    ...(opts ? { body: JSON.stringify(opts) } : {}),
  });
}

export function pushSprintPlan(projectId: string, writeBack: Record<string, boolean>, planId?: string): Promise<PushResult> {
  return fetchAPI<PushResult>(`/v1/projects/${projectId}/sprints/plan/push`, {
    method: 'POST',
    body: JSON.stringify({ write_back: writeBack, ...(planId ? { plan_id: planId } : {}) }),
  });
}

export function generateSprintPlanStream(
  projectId: string,
  onStep: (step: string, detail?: string) => void,
  opts?: GenerateOptions
): Promise<SprintPlan> {
  return new Promise((resolve, reject) => {
    const base = config.atlasApiBase;
    const url = `${base}/v1/projects/${projectId}/sprints/plan/generate/stream`;
    const token = typeof window !== 'undefined' ? getCookieToken() : null;
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(opts ? { body: JSON.stringify(opts) } : {}),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new APIError(res.status, body?.error?.code ?? 'unknown', body?.error?.message ?? res.statusText);
        }
        const reader = res.body?.getReader();
        if (!reader) {
          reject(new Error('No response body'));
          return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split(/\n\n+/);
          buffer = chunks.pop() ?? '';
          for (const chunk of chunks) {
            let eventType = '';
            let data = '';
            for (const line of chunk.split('\n')) {
              if (line.startsWith('event: ')) eventType = line.slice(7).trim();
              else if (line.startsWith('data: ')) data = line.slice(6);
            }
            if (!data) continue;
            if (eventType === 'step') {
              try {
                const obj = JSON.parse(data);
                if (obj.step) onStep(obj.step, obj.detail);
              } catch {
                /* ignore */
              }
            } else if (eventType === 'error') {
              try {
                const obj = JSON.parse(data);
                reject(new Error(obj.message ?? 'Generation failed'));
                return;
              } catch {
                reject(new Error(data || 'Generation failed'));
                return;
              }
            } else if (eventType === 'done') {
              try {
                const plan = JSON.parse(data) as SprintPlan;
                resolve(plan);
                return;
              } catch {
                reject(new Error('Invalid plan response'));
                return;
              }
            }
          }
        }
        reject(new Error('Stream ended without done event'));
      })
      .catch(reject);
  });
}

// Planning Config
export interface PlanningConfig {
  id?: string;
  project_id: string;
  capacity_buffer_pct: number;
  velocity_window: number;
  auto_estimate: boolean;
  auto_plan_on_sprint_start?: boolean;
  auto_push_on_sprint_start?: boolean;
  use_calendar_for_capacity?: boolean;
}

export function getPlanningConfig(projectId: string): Promise<PlanningConfig> {
  return fetchAPI<PlanningConfig>(`/v1/projects/${projectId}/sprints/plan/config`);
}

export function updatePlanningConfig(projectId: string, cfg: Partial<PlanningConfig>): Promise<PlanningConfig> {
  return fetchAPI<PlanningConfig>(`/v1/projects/${projectId}/sprints/plan/config`, {
    method: 'PUT',
    body: JSON.stringify(cfg),
  });
}

// ── Phase 3: Team, Capacity, Standups ──

// Team
export type RoleType = 'em' | 'tl' | 'ic';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id?: string;
  name: string;
  initials: string;
  email?: string;
  role: string;
  role_type: RoleType;
  avatar_color: string;
  skills: string[];
  base_velocity: number;
  availability: number;
  created_at: string;
  updated_at: string;
}

export interface TeamInfo {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TeamOverview {
  team: TeamInfo;
  members: TeamMember[];
  avg_velocity: number;
  avg_accuracy: number;
  total_capacity: number;
  online_count: number;
}

export interface AddTeamMemberInput {
  name: string;
  initials?: string;
  email?: string;
  role?: string;
  role_type?: RoleType;
  avatar_color?: string;
  skills?: string[];
  base_velocity?: number;
  availability?: number;
  user_id?: string;
}

export interface UpdateTeamMemberInput {
  name?: string;
  initials?: string;
  email?: string;
  role?: string;
  role_type?: RoleType;
  avatar_color?: string;
  skills?: string[];
  base_velocity?: number;
  availability?: number;
  user_id?: string;
}

export function getTeamOverview(projectId: string): Promise<TeamOverview> {
  return fetchAPI<TeamOverview>(`/v1/projects/${projectId}/team`);
}

export function getTeamMembers(projectId: string): Promise<TeamMember[]> {
  return fetchAPI<TeamMember[]>(`/v1/projects/${projectId}/team/members`);
}

export function addTeamMember(projectId: string, data: AddTeamMemberInput): Promise<TeamMember> {
  return fetchAPI<TeamMember>(`/v1/projects/${projectId}/team/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTeamMember(projectId: string, memberId: string, data: UpdateTeamMemberInput): Promise<TeamMember> {
  return fetchAPI<TeamMember>(`/v1/projects/${projectId}/team/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function removeTeamMember(projectId: string, memberId: string): Promise<{ deleted: boolean }> {
  return fetchAPI<{ deleted: boolean }>(`/v1/projects/${projectId}/team/members/${memberId}`, {
    method: 'DELETE',
  });
}

// Capacity
export interface CapacityAdjustment {
  id?: string;
  team_id: string;
  member_id: string;
  type: string;
  week?: number;
  impact_pct: number;
  label: string;
}

export interface TeamCapacity {
  team_id: string;
  members: {
    member_id: string;
    base_capacity: number;
    effective_capacity: number;
    adjustments: CapacityAdjustment[];
  }[];
  total_capacity: number;
  adjusted_capacity: number;
}

export function getTeamCapacity(teamId: string): Promise<TeamCapacity> {
  return fetchAPI<TeamCapacity>(`/v1/teams/${teamId}/capacity`);
}

export function updateCapacityAdjustments(teamId: string, adjustments: CapacityAdjustment[]): Promise<TeamCapacity> {
  return fetchAPI<TeamCapacity>(`/v1/teams/${teamId}/capacity/adjustments`, {
    method: 'PUT',
    body: JSON.stringify({ adjustments }),
  });
}

// Standups
export interface StandupEntry {
  id: string;
  team_id: string;
  user_id: string;
  entry_date: string;
  yesterday: string;
  today: string;
  blockers?: string;
}

export function getStandups(teamId: string, from?: string, to?: string): Promise<StandupEntry[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return fetchAPI<StandupEntry[]>(`/v1/teams/${teamId}/standups${qs ? `?${qs}` : ''}`);
}

export function getTodayStandups(teamId: string): Promise<StandupEntry[]> {
  return fetchAPI<StandupEntry[]>(`/v1/teams/${teamId}/standups/today`);
}

export function submitStandup(teamId: string, data: { user_id: string; yesterday: string; today: string; blockers?: string }): Promise<StandupEntry> {
  return fetchAPI<StandupEntry>(`/v1/teams/${teamId}/standups`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateStandup(teamId: string, entryId: string, data: { yesterday: string; today: string; blockers?: string }): Promise<StandupEntry> {
  return fetchAPI<StandupEntry>(`/v1/teams/${teamId}/standups/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Phase 4: Signals & Repos ──

// Signals (signal-app)
export interface SignalConfig {
  id: string;
  project_id: string;
  provider: string;
  name: string;
  webhook_url?: string;
  config: Record<string, unknown>;
  weight: number;
  enabled: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SignalEvent {
  id: string;
  signal_config_id: string;
  project_id: string;
  provider: string;
  event_type: string;
  title: string;
  body?: string;
  severity: 'info' | 'warning' | 'critical';
  external_id?: string;
  external_url?: string;
  metadata?: Record<string, unknown>;
  received_at: string;
}

export interface SignalSummary {
  total_configs: number;
  active_configs: number;
  event_counts: Record<string, number>;
  recent_events: SignalEvent[];
}

export function getSignalConfigs(projectId: string): Promise<SignalConfig[]> {
  return fetchAPI<SignalConfig[]>(`/v1/projects/${projectId}/signals/`, { service: 'signal' });
}

export function createSignalConfig(projectId: string, data: { provider: string; name: string; config?: Record<string, unknown>; weight?: number }): Promise<SignalConfig> {
  return fetchAPI<SignalConfig>(`/v1/projects/${projectId}/signals/`, { method: 'POST', body: JSON.stringify(data), service: 'signal' });
}

export function getSignalConfig(projectId: string, signalId: string): Promise<SignalConfig> {
  return fetchAPI<SignalConfig>(`/v1/projects/${projectId}/signals/${signalId}/`, { service: 'signal' });
}

export function updateSignalConfig(projectId: string, signalId: string, data: Partial<Pick<SignalConfig, 'name' | 'config' | 'weight' | 'enabled'>>): Promise<SignalConfig> {
  return fetchAPI<SignalConfig>(`/v1/projects/${projectId}/signals/${signalId}/`, { method: 'PUT', body: JSON.stringify(data), service: 'signal' });
}

export function deleteSignalConfig(projectId: string, signalId: string): Promise<{ deleted: boolean }> {
  return fetchAPI<{ deleted: boolean }>(`/v1/projects/${projectId}/signals/${signalId}/`, { method: 'DELETE', service: 'signal' });
}

export function getSignalEvents(projectId: string, signalId: string, limit?: number): Promise<SignalEvent[]> {
  const qs = limit ? `?limit=${limit}` : '';
  return fetchAPI<SignalEvent[]>(`/v1/projects/${projectId}/signals/${signalId}/events${qs}`, { service: 'signal' });
}

export function getSignalSummary(projectId: string): Promise<SignalSummary> {
  return fetchAPI<SignalSummary>(`/v1/projects/${projectId}/signals/summary`, { service: 'signal' });
}

export function triggerSignalSync(signalId: string): Promise<{ signal_id: string; status: string }> {
  return fetchAPI<{ signal_id: string; status: string }>(`/v1/signals/sync/${signalId}`, { method: 'POST', service: 'signal' });
}

// Repos (atlas-service)
export interface Repo {
  id: string;
  org_id: string;
  name: string;
  full_name: string;
  provider: string;
  default_branch: string;
  language?: string;
  description?: string;
  external_url?: string;
  is_private: boolean;
  connected_at: string;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RepoActivity {
  type: string;
  title: string;
  author: string;
  url?: string;
  created_at: string;
}

export interface RepoStats {
  total_commits: number;
  total_prs: number;
  open_prs: number;
  contributors: number;
  top_contributors: { name: string; commits: number; avatar?: string }[];
}

export function getRepos(orgId: string): Promise<Repo[]> {
  return fetchAPI<Repo[]>(`/v1/repos?org_id=${orgId}`);
}

export function createRepo(data: { org_id: string; name: string; full_name: string; provider?: string; default_branch?: string; language?: string; description?: string; external_url?: string; is_private?: boolean }): Promise<Repo> {
  return fetchAPI<Repo>('/v1/repos', { method: 'POST', body: JSON.stringify(data) });
}

export function getRepo(repoId: string): Promise<Repo> {
  return fetchAPI<Repo>(`/v1/repos/${repoId}`);
}

export function deleteRepo(repoId: string): Promise<{ deleted: boolean }> {
  return fetchAPI<{ deleted: boolean }>(`/v1/repos/${repoId}`, { method: 'DELETE' });
}

// Project-linked repos (for Activity tab)
export function getProjectRepos(projectId: string): Promise<Repo[]> {
  return fetchAPI<Repo[]>(`/v1/projects/${projectId}/repos`);
}

export function linkRepoToProject(projectId: string, repoId: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/projects/${projectId}/repos`, {
    method: 'POST',
    body: JSON.stringify({ repo_id: repoId }),
  });
}

export function unlinkRepoFromProject(projectId: string, repoId: string): Promise<{ unlinked: boolean }> {
  return fetchAPI<{ unlinked: boolean }>(`/v1/projects/${projectId}/repos/${repoId}`, { method: 'DELETE' });
}

export function bulkLinkReposToProject(projectId: string, input: { repo_ids?: string[]; all?: boolean }): Promise<{ linked: number }> {
  return fetchAPI<{ linked: number }>(`/v1/projects/${projectId}/repos/bulk`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface RecentComment {
  id: string;
  ticket_id: string;
  ticket_external_id: string;
  ticket_title: string;
  author_name: string;
  body_snippet: string;
  created_at: string;
  external_url?: string;
}

export function getRecentComments(
  projectId: string,
  opts?: { since?: string; until?: string; limit?: number },
): Promise<{ comments: RecentComment[] }> {
  const params = new URLSearchParams();
  if (opts?.since) params.set('since', opts.since);
  if (opts?.until) params.set('until', opts.until);
  if (opts?.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return fetchAPI<{ comments: RecentComment[] }>(
    `/v1/projects/${projectId}/activity/recent-comments${qs ? `?${qs}` : ''}`,
  );
}

export function getRepoActivity(repoId: string): Promise<RepoActivity[]> {
  return fetchAPI<RepoActivity[]>(`/v1/repos/${repoId}/activity`);
}

export function getRepoStats(repoId: string): Promise<RepoStats> {
  return fetchAPI<RepoStats>(`/v1/repos/${repoId}/stats`);
}

// ── Phase 5: Extended Features ──

// Backlog
export function getBacklog(projectId: string): Promise<Ticket[]> {
  return fetchAPI<Ticket[]>(`/v1/projects/${projectId}/backlog`);
}

export function prioritizeBacklog(projectId: string): Promise<Ticket[]> {
  return fetchAPI<Ticket[]>(`/v1/projects/${projectId}/backlog/prioritize`, { method: 'PUT' });
}

export function rankBacklogTicket(projectId: string, ticketId: string, rank: number): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/projects/${projectId}/backlog/${ticketId}/rank`, { method: 'PUT', body: JSON.stringify({ rank }) });
}

// Backlog Intelligence
export interface PriorityBucket {
  priority: string;
  count: number;
  points: number;
}

export interface AgingBucket {
  label: string;
  min_days: number;
  max_days: number;
  count: number;
}

export interface ModuleBreakdown {
  module: string;
  count: number;
  points: number;
}

export interface BacklogHealth {
  total_items: number;
  total_points: number;
  health_score: number;
  avg_age_days: number;
  stale_count: number;
  blocked_count: number;
  unestimated_count: number;
  ready_count: number;
  draft_count: number;
  priority_distribution: PriorityBucket[];
  aging_buckets: AgingBucket[];
  module_breakdown: ModuleBreakdown[];
}

export interface BacklogInsight {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  ticket_id?: string;
  ticket_title?: string;
  action?: string;
}

export function getBacklogHealth(projectId: string): Promise<BacklogHealth> {
  return fetchAPI<BacklogHealth>(`/v1/projects/${projectId}/backlog/health`);
}

export function getBacklogInsights(projectId: string): Promise<BacklogInsight[]> {
  return fetchAPI<BacklogInsight[]>(`/v1/projects/${projectId}/backlog/insights`);
}

// Dependencies
export interface Dependency {
  id: string;
  project_id: string;
  source_ticket_id: string;
  target_ticket_id: string;
  type: 'blocks' | 'blocked_by' | 'relates';
  status: 'active' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface DependencySummary {
  total: number;
  active: number;
  resolved: number;
  blocks: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

export function getDependencies(projectId: string, filters?: { status?: string; type?: string; ticket_id?: string }): Promise<Dependency[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.ticket_id) params.set('ticket_id', filters.ticket_id);
  const qs = params.toString();
  return fetchAPI<Dependency[]>(`/v1/projects/${projectId}/dependencies${qs ? `?${qs}` : ''}`);
}

export function getDependencySummary(projectId: string): Promise<DependencySummary> {
  return fetchAPI<DependencySummary>(`/v1/projects/${projectId}/dependencies/summary`);
}

export function createDependency(projectId: string, data: { source_ticket_id: string; target_ticket_id: string; type: string }): Promise<Dependency> {
  return fetchAPI<Dependency>(`/v1/projects/${projectId}/dependencies`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateDependency(projectId: string, depId: string, data: { type?: string; status?: string }): Promise<Dependency> {
  return fetchAPI<Dependency>(`/v1/projects/${projectId}/dependencies/${depId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteDependency(projectId: string, depId: string): Promise<{ deleted: boolean }> {
  return fetchAPI<{ deleted: boolean }>(`/v1/projects/${projectId}/dependencies/${depId}`, { method: 'DELETE' });
}

// Retros
export interface RetroItem {
  id: string;
  sprint_id: string;
  project_id: string;
  category: 'went_well' | 'to_improve' | 'action_item';
  content: string;
  votes: number;
  author_id?: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  due_label?: string;
  external_ticket_id?: string;
  external_ticket_url?: string;
  completed?: boolean;
}

export interface RetroHighlights {
  accuracy_pct: number;
  accuracy_delta: number;
  velocity_delivered: number;
  velocity_planned: number;
  carry_over_count: number;
  blocker_count: number;
  top_risk_ticket: string;
  debt_score: number;
}

export interface RetroSummaryData {
  went_well: string[];
  could_improve: string[];
  action_items: string[];
  themes: string[];
  highlights: RetroHighlights;
}

export interface RetroSummary {
  id: string;
  sprint_id: string;
  project_id: string;
  summary: RetroSummaryData;
  generated_at: string;
}

export interface RetroSentimentEntry {
  id: string;
  sprint_id: string;
  project_id: string;
  user_id?: string;
  user_name: string;
  mood: number;
  comment: string;
  created_at: string;
}

export interface SentimentTrendPoint {
  sprint_id: string;
  sprint_name: string;
  avg_mood: number;
  count: number;
  anomaly: boolean;
}

export function getRetro(projectId: string, sprintId: string): Promise<RetroItem[]> {
  return fetchAPI<RetroItem[]>(`/v1/projects/${projectId}/sprints/${sprintId}/retro`);
}

export function addRetroItem(projectId: string, sprintId: string, data: { category: string; content: string; author_id?: string }): Promise<RetroItem> {
  return fetchAPI<RetroItem>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/items`, { method: 'POST', body: JSON.stringify({ ...data, project_id: projectId, sprint_id: sprintId }) });
}

export function updateRetroItem(projectId: string, sprintId: string, itemId: string, data: { content?: string; category?: string; votes?: number }): Promise<RetroItem> {
  return fetchAPI<RetroItem>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteRetroItem(projectId: string, sprintId: string, itemId: string): Promise<void> {
  return fetchAPI<void>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/items/${itemId}`, { method: 'DELETE' });
}

export function voteRetroItem(projectId: string, sprintId: string, itemId: string): Promise<{ votes: number }> {
  return fetchAPI<{ votes: number }>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/items/${itemId}/vote`, { method: 'POST' });
}

export function generateRetro(projectId: string, sprintId: string): Promise<RetroSummary> {
  return fetchAPI<RetroSummary>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/generate`, { method: 'POST', timeoutMs: 60000 });
}

export function getRetroSummary(projectId: string, sprintId: string): Promise<RetroSummary> {
  return fetchAPI<RetroSummary>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/summary`);
}

export function getSentiment(projectId: string, sprintId: string): Promise<RetroSentimentEntry[]> {
  return fetchAPI<RetroSentimentEntry[]>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/sentiment`);
}

export function submitSentiment(projectId: string, sprintId: string, data: { user_id?: string; user_name: string; mood: number; comment?: string }): Promise<RetroSentimentEntry> {
  return fetchAPI<RetroSentimentEntry>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/sentiment`, { method: 'POST', body: JSON.stringify(data) });
}

export function getSentimentTrend(projectId: string, limit?: number): Promise<SentimentTrendPoint[]> {
  const q = limit != null ? `?limit=${limit}` : '';
  return fetchAPI<SentimentTrendPoint[]>(`/v1/projects/${projectId}/retro/sentiment-trend${q}`);
}

export function trackRetroAction(projectId: string, sprintId: string, itemId: string): Promise<RetroItem> {
  return fetchAPI<RetroItem>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/items/${itemId}/track`, { method: 'POST' });
}

export function publishRetro(projectId: string, sprintId: string): Promise<{ external_ticket_id: string }> {
  return fetchAPI<{ external_ticket_id: string }>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/publish`, { method: 'POST' });
}

export function markRetroActionComplete(projectId: string, sprintId: string, itemId: string): Promise<{ completed: boolean }> {
  return fetchAPI<{ completed: boolean }>(`/v1/projects/${projectId}/sprints/${sprintId}/retro/items/${itemId}/complete`, { method: 'PUT' });
}

export interface RetroBoardConfig {
  id?: string;
  project_id: string;
  sprint_id?: string;
  miro_board_url: string;
  created_at?: string;
}

export function getRetroBoardConfig(projectId: string, sprintId?: string): Promise<RetroBoardConfig> {
  const qs = sprintId ? `?sprint_id=${sprintId}` : '';
  return fetchAPI<RetroBoardConfig>(`/v1/projects/${projectId}/retro/board-config${qs}`);
}

export function saveRetroBoardConfig(projectId: string, miroBoardUrl: string, sprintId?: string): Promise<RetroBoardConfig> {
  return fetchAPI<RetroBoardConfig>(`/v1/projects/${projectId}/retro/board-config`, {
    method: 'PUT',
    body: JSON.stringify({ miro_board_url: miroBoardUrl, sprint_id: sprintId }),
  });
}

// Notes
export function getSprintNotes(projectId: string, sprintId: string): Promise<{ notes: string }> {
  return fetchAPI<{ notes: string }>(`/v1/projects/${projectId}/sprints/${sprintId}/notes`);
}

export function updateSprintNotes(projectId: string, sprintId: string, notes: string): Promise<{ notes: string }> {
  return fetchAPI<{ notes: string }>(`/v1/projects/${projectId}/sprints/${sprintId}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) });
}

// Insights
export interface ComplexityInsight {
  module: string;
  score: number;
  file_count: number;
  trend: string;
}

export interface DebtOverview {
  total_score: number;
  items: { category: string; score: number; description: string; priority: string }[];
}

export interface DebtTrend {
  date: string;
  score: number;
}

export function getComplexityInsights(projectId: string): Promise<ComplexityInsight[]> {
  return fetchAPI<ComplexityInsight[]>(`/v1/projects/${projectId}/insights/complexity`);
}

export function getDebtOverview(projectId: string): Promise<DebtOverview> {
  return fetchAPI<DebtOverview>(`/v1/projects/${projectId}/insights/debt`);
}

export function getDebtTrend(projectId: string): Promise<DebtTrend[]> {
  return fetchAPI<DebtTrend[]>(`/v1/projects/${projectId}/insights/debt/trend`);
}

// Automations
export interface AutomationRule {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  trigger_type: string;
  conditions: Record<string, unknown>;
  actions: unknown[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  triggered_at: string;
  status: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export function getAutomations(orgId: string): Promise<AutomationRule[]> {
  return fetchAPI<AutomationRule[]>(`/v1/automations?org_id=${orgId}`);
}

export function createAutomation(data: { org_id: string; name: string; trigger_type: string; conditions?: Record<string, unknown>; actions?: unknown[]; description?: string }): Promise<AutomationRule> {
  return fetchAPI<AutomationRule>('/v1/automations', { method: 'POST', body: JSON.stringify(data) });
}

export function updateAutomation(id: string, data: Partial<AutomationRule>): Promise<AutomationRule> {
  return fetchAPI<AutomationRule>(`/v1/automations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteAutomation(id: string): Promise<{ deleted: boolean }> {
  return fetchAPI<{ deleted: boolean }>(`/v1/automations/${id}`, { method: 'DELETE' });
}

export function toggleAutomation(id: string, enabled: boolean): Promise<{ toggled: boolean }> {
  return fetchAPI<{ toggled: boolean }>(`/v1/automations/${id}/toggle`, { method: 'POST', body: JSON.stringify({ enabled }) });
}

export function getAutomationLogs(id: string): Promise<AutomationLog[]> {
  return fetchAPI<AutomationLog[]>(`/v1/automations/${id}/logs`);
}

export function runAutomation(id: string): Promise<{ triggered: boolean }> {
  return fetchAPI<{ triggered: boolean }>(`/v1/automations/${id}/run`, { method: 'POST' });
}

// Revenue & Stakeholder
export interface RevenueOverview {
  total_revenue: number;
  pipeline: { stage: string; value: number; count: number }[];
  by_feature: { feature: string; revenue: number; impact: number }[];
}

export interface StakeholderReport {
  id: string;
  title: string;
  summary: string;
  status: string;
  date?: string;
}

export function getRevenue(orgId: string): Promise<RevenueOverview> {
  return fetchAPI<RevenueOverview>(`/v1/revenue?org_id=${orgId}`);
}

export function getRevenuePipeline(orgId: string): Promise<RevenueOverview['pipeline']> {
  return fetchAPI<RevenueOverview['pipeline']>(`/v1/revenue/pipeline?org_id=${orgId}`);
}

export function getRevenueByFeature(orgId: string): Promise<RevenueOverview['by_feature']> {
  return fetchAPI<RevenueOverview['by_feature']>(`/v1/revenue/by-feature?org_id=${orgId}`);
}

export function getStakeholderReports(orgId: string): Promise<StakeholderReport[]> {
  return fetchAPI<StakeholderReport[]>(`/v1/stakeholder/reports?org_id=${orgId}`);
}

export function generateStakeholderReport(orgId: string): Promise<StakeholderReport> {
  return fetchAPI<StakeholderReport>('/v1/stakeholder/reports/generate', { method: 'POST', body: JSON.stringify({ org_id: orgId }) });
}

// NEXUS Feed
export interface NexusFeedItem {
  id: string;
  org_id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  source: string;
  metadata?: Record<string, unknown>;
  dismissed: boolean;
  created_at: string;
}

export function getNexusFeed(orgId: string): Promise<NexusFeedItem[]> {
  return fetchAPI<NexusFeedItem[]>(`/v1/nexus/feed?org_id=${orgId}`);
}

export function getNexusFeedItem(itemId: string): Promise<NexusFeedItem> {
  return fetchAPI<NexusFeedItem>(`/v1/nexus/feed/${itemId}`);
}

export function dismissNexusFeedItem(itemId: string): Promise<{ dismissed: boolean }> {
  return fetchAPI<{ dismissed: boolean }>(`/v1/nexus/feed/${itemId}/dismiss`, { method: 'POST' });
}

// Chat
export interface ChatMessage {
  id: string;
  org_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  feedback?: string;
  created_at: string;
}

export function sendChatMessage(data: { org_id: string; user_id: string; content: string }): Promise<ChatMessage> {
  return fetchAPI<ChatMessage>('/v1/chat', { method: 'POST', body: JSON.stringify(data) });
}

export function getChatHistory(orgId: string, userId: string, limit?: number): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ org_id: orgId, user_id: userId });
  if (limit) params.set('limit', String(limit));
  return fetchAPI<ChatMessage[]>(`/v1/chat/history?${params}`);
}

export function submitChatFeedback(msgId: string, feedback: string): Promise<{ updated: boolean }> {
  return fetchAPI<{ updated: boolean }>(`/v1/chat/${msgId}/feedback`, { method: 'POST', body: JSON.stringify({ feedback }) });
}

// Notifications (onboarding-service)
export interface AppNotification {
  id: string;
  org_id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export function getNotifications(limit?: number, offset?: number): Promise<AppNotification[]> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  const qs = params.toString();
  return fetchAPI<AppNotification[]>(`/v1/notifications${qs ? `?${qs}` : ''}`, { service: 'onboarding' });
}

export function markNotificationRead(id: string): Promise<{ read: boolean }> {
  return fetchAPI<{ read: boolean }>(`/v1/notifications/${id}/read`, { method: 'PUT', service: 'onboarding' });
}

export function markAllNotificationsRead(): Promise<{ read_count: number }> {
  return fetchAPI<{ read_count: number }>('/v1/notifications/read-all', { method: 'POST', service: 'onboarding' });
}

export function getUnreadCount(): Promise<{ count: number }> {
  return fetchAPI<{ count: number }>('/v1/notifications/unread-count', { service: 'onboarding' });
}

// Settings (onboarding-service)
export interface OrgSettings {
  id?: string;
  org_id: string;
  category: string;
  settings: Record<string, unknown>;
  updated_at: string;
}

export function getSettings(category: string): Promise<OrgSettings> {
  return fetchAPI<OrgSettings>(`/v1/settings/${category}`, { service: 'onboarding' }).catch((err) => {
    if (err instanceof APIError && err.status === 404) {
      return {
        org_id: '',
        category,
        settings: {},
        updated_at: new Date().toISOString(),
      };
    }
    throw err;
  });
}

export function updateSettings(category: string, settings: Record<string, unknown>): Promise<OrgSettings> {
  return fetchAPI<OrgSettings>(`/v1/settings/${category}`, {
    method: 'PUT',
    body: JSON.stringify({ settings }),
    service: 'onboarding',
  }).catch((err) => {
    if (err instanceof APIError && err.status === 404) {
      // Some backend environments do not expose settings routes yet.
      // Treat this as a soft failure and keep local preferences working.
      return {
        org_id: '',
        category,
        settings,
        updated_at: new Date().toISOString(),
      };
    }
    throw err;
  });
}

// Integration Types & API (onboarding-service)

export interface IntegrationProvider {
  key: string;
  display_name: string;
  category: string;
  auth_method: 'oauth2' | 'oauth2_pkce' | 'api_key';
  required_fields?: { key: string; label: string; placeholder: string; secret: boolean }[];
}

export interface ConnectedIntegration {
  id: string;
  org_id: string;
  provider: string;
  auth_method: string;
  category: string;
  display_name: string;
  account_id?: string;
  scopes?: string[];
  status: 'pending' | 'connected' | 'syncing' | 'error' | 'disconnected';
  connected_at: string;
  last_sync_at?: string;
  error_message?: string;
}

export interface IntegrationSyncStatus {
  provider: string;
  status: string;
  last_sync_at?: string;
  synced_items?: number;
}

export interface IntegrationSyncEvent {
  id: string;
  provider: string;
  type: string;
  message: string;
  created_at: string;
}

export function listIntegrations(): Promise<ConnectedIntegration[]> {
  return fetchAPI<ConnectedIntegration[]>('/v1/integrations', { service: 'onboarding' });
}

export function listProviders(): Promise<IntegrationProvider[]> {
  return fetchAPI<IntegrationProvider[]>('/v1/integrations/providers', { service: 'onboarding' });
}

export function connectIntegration(provider: string, body: { redirect_url?: string; credentials?: Record<string, string> }): Promise<{ auth_url?: string; state?: string; auth_method: string }> {
  return fetchAPI<{ auth_url?: string; state?: string; auth_method: string }>(`/v1/integrations/${provider}/connect`, {
    method: 'POST',
    body: JSON.stringify(body),
    service: 'onboarding',
  });
}

export function disconnectIntegration(provider: string): Promise<void> {
  return fetchAPI<void>(`/v1/integrations/${provider}`, { method: 'DELETE', service: 'onboarding' });
}

export function getIntegrationSyncStatus(provider: string): Promise<IntegrationSyncStatus> {
  return fetchAPI<IntegrationSyncStatus>(`/v1/integrations/${provider}/sync-status`, { service: 'onboarding' });
}

export function triggerIntegrationSync(provider: string): Promise<IntegrationSyncStatus> {
  return fetchAPI<IntegrationSyncStatus>(`/v1/integrations/${provider}/sync`, { method: 'POST', service: 'onboarding' });
}

export function getIntegrationEvents(provider: string): Promise<IntegrationSyncEvent[]> {
  return fetchAPI<IntegrationSyncEvent[]>(`/v1/integrations/${provider}/events`, { service: 'onboarding' });
}

export function completeOAuthCallback(provider: string, code: string, state: string): Promise<ConnectedIntegration> {
  return fetchAPI<ConnectedIntegration>(`/v1/integrations/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, { service: 'onboarding' });
}

export function configureProvider(provider: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/integrations/${provider}/configure`, {
    method: 'POST',
    body: JSON.stringify({}),
    service: 'onboarding',
  });
}

// ── Git Provider Integration APIs (atlas-service) ──

export interface GitProviderRepo {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  url: string;
  default_branch: string;
  language?: string;
  is_private: boolean;
  stars: number;
  forks: number;
  open_issues: number;
  updated_at: string;
  provider: string;
}

export interface GitProviderCommit {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string; username?: string; avatar_url?: string };
  url: string;
  provider: string;
}

export interface GitProviderPR {
  id: string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  url: string;
  source_branch: string;
  target_branch: string;
  author: { login: string; avatar_url?: string };
  created_at: string;
  updated_at: string;
  is_draft: boolean;
  provider: string;
}

export interface GitProviderPipeline {
  id: string;
  name?: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  ref: string;
  sha: string;
  url: string;
  created_at: string;
  duration?: number;
  provider: string;
}

export interface GitProviderWebhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  provider: string;
}

export interface GitProviderUser {
  id: string;
  username: string;
  display_name: string;
  email?: string;
  avatar_url?: string;
  provider: string;
}

export function getGitProviderUser(provider: string): Promise<GitProviderUser> {
  return fetchAPI<GitProviderUser>(`/v1/integrations/${provider}/user`, { service: 'onboarding' });
}

export function getGitProviderRepos(provider: string, options?: { page?: number; per_page?: number }): Promise<GitProviderRepo[]> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.per_page) params.set('per_page', String(options.per_page));
  return fetchAPI<GitProviderRepo[]>(`/v1/integrations/${provider}/repos?${params}`, { service: 'onboarding' });
}

export function getGitProviderCommits(provider: string, owner: string, repo: string, options?: { page?: number; per_page?: number; since?: string }): Promise<GitProviderCommit[]> {
  const params = new URLSearchParams({ owner, repo });
  if (options?.page) params.set('page', String(options.page));
  if (options?.per_page) params.set('per_page', String(options.per_page));
  if (options?.since) params.set('since', options.since);
  return fetchAPI<GitProviderCommit[]>(`/v1/integrations/${provider}/commits?${params}`, { service: 'onboarding' });
}

export function getGitProviderPRs(provider: string, owner: string, repo: string, options?: { state?: string; page?: number; per_page?: number }): Promise<GitProviderPR[]> {
  const params = new URLSearchParams({ owner, repo });
  if (options?.state) params.set('state', options.state);
  if (options?.page) params.set('page', String(options.page));
  if (options?.per_page) params.set('per_page', String(options.per_page));
  return fetchAPI<GitProviderPR[]>(`/v1/integrations/${provider}/pull-requests?${params}`, { service: 'onboarding' });
}

export function getGitProviderPipelines(provider: string, owner: string, repo: string, options?: { page?: number; per_page?: number }): Promise<GitProviderPipeline[]> {
  const params = new URLSearchParams({ owner, repo });
  if (options?.page) params.set('page', String(options.page));
  if (options?.per_page) params.set('per_page', String(options.per_page));
  return fetchAPI<GitProviderPipeline[]>(`/v1/integrations/${provider}/pipelines?${params}`, { service: 'onboarding' });
}

export function getGitProviderWebhooks(provider: string, owner: string, repo: string): Promise<GitProviderWebhook[]> {
  return fetchAPI<GitProviderWebhook[]>(`/v1/integrations/${provider}/webhooks?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, { service: 'onboarding' });
}

export function createGitProviderWebhook(provider: string, owner: string, repo: string, events: string[]): Promise<GitProviderWebhook> {
  return fetchAPI<GitProviderWebhook>(`/v1/integrations/${provider}/webhooks`, {
    method: 'POST',
    body: JSON.stringify({ owner, repo, events }),
    service: 'onboarding',
  });
}

export function deleteGitProviderWebhook(provider: string, owner: string, repo: string, hookId: string): Promise<void> {
  return fetchAPI<void>(`/v1/integrations/${provider}/webhooks/${hookId}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
    method: 'DELETE',
    service: 'onboarding',
  });
}

export function importGitProviderRepo(provider: string, repoFullName: string): Promise<Repo> {
  return fetchAPI<Repo>(`/v1/integrations/${provider}/import-repo`, {
    method: 'POST',
    body: JSON.stringify({ full_name: repoFullName }),
    service: 'onboarding',
  });
}

// ── PII / Vulnerability Scanner (atlas-service) ──

export type PIICategory = 'email' | 'phone' | 'ssn_tax_id' | 'credit_card' | 'address' | 'passport' | 'api_key' | 'password' | 'ip_address' | 'health_data' | 'custom';
export type PIISeverity = 'critical' | 'high' | 'medium' | 'low';
export type PIIFindingStatus = 'open' | 'remediated' | 'dismissed' | 'auto_fixed';
export type AIActionType = 'redact' | 'mask' | 'replace' | 'delete_comment' | 'edit_comment' | 'rotate_key' | 'notify_hr' | 'custom';
export type OwnershipFlag = 'none' | 'orphaned' | 'bouncing' | 'risk';
export type TicketAuditEventType = 'owner_changed' | 'status_changed' | 'pii_detected' | 'pii_resolved' | 'comment_pii_detected' | 'escalated';

export interface AIAction {
  type: AIActionType;
  label: string;
  description: string;
  payload: Record<string, unknown>;
  risk: 'safe' | 'review_recommended' | 'requires_approval';
  automated: boolean;
}

export interface PIIFinding {
  id: string;
  ticket_id: string;
  project_id: string;
  category: PIICategory;
  severity: PIISeverity;
  field: string;
  matched_text: string;
  context: string;
  remediation: string;
  status: PIIFindingStatus;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  ai_confidence: number;
  ai_reasoning: string;
  ai_severity_explanation: string;
  ai_actions: AIAction[];
  ai_model: string;
}

export interface PIIStats {
  total_open: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  tickets_affected: number;
  avg_resolution_hours: number;
  resolved_last_7d: number;
  opened_last_7d: number;
}

export interface PIITrackerRow {
  ticket_id: string;
  ticket_key: string;
  ticket_title: string;
  assignee_name: string;
  assignee_id?: string;
  findings_count: number;
  highest_severity: PIISeverity;
  last_scanned: string;
  status: PIIFindingStatus;
  ownership_flag: OwnershipFlag;
}

export interface PIIWorkflowStep {
  step: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending' | 'skipped';
  details: Record<string, unknown>;
}

export interface PIIWorkflowData {
  ticket_id: string;
  ticket_title: string;
  scan_source: string;
  steps: PIIWorkflowStep[];
  findings: PIIFinding[];
  dismissed: { candidate_text: string; field: string; reasoning: string }[];
  notifications_sent: { type: string; recipient: string; sent_at: string }[];
  actions_taken: { action: string; actor: string; timestamp: string }[];
  current_status: string;
}

export interface TicketAuditEvent {
  id: string;
  ticket_id: string;
  project_id: string;
  event_type: TicketAuditEventType;
  actor_id?: string;
  actor_name?: string;
  old_value: string;
  new_value: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProjectSettings {
  vuln_scan_enabled: boolean;
  scan_titles: boolean;
  scan_descriptions: boolean;
  scan_comments: boolean;
  severity_threshold: PIISeverity;
  auto_dismiss_low_conf: boolean;
  notify_owner_enabled: boolean;
  notify_admin_enabled: boolean;
  escalation_hours: number;
  disabled_categories: PIICategory[];
  allowed_domains: string[];
}

export interface InAppNotification {
  id: string;
  org_id: string;
  user_id?: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  link: string;
  read_at?: string;
  created_at: string;
}

export function getProjectSettings(projectID: string): Promise<ProjectSettings> {
  return fetchAPI<ProjectSettings>(`/v1/projects/${projectID}/settings`);
}

export function updateProjectSettings(projectID: string, settings: Partial<ProjectSettings>): Promise<ProjectSettings> {
  return fetchAPI<ProjectSettings>(`/v1/projects/${projectID}/settings`, { method: 'PUT', body: JSON.stringify(settings) });
}

export function enableVulnScan(projectID: string): Promise<ProjectSettings> {
  return fetchAPI<ProjectSettings>(`/v1/projects/${projectID}/vuln-scan/enable`, { method: 'POST' });
}

export function disableVulnScan(projectID: string): Promise<ProjectSettings> {
  return fetchAPI<ProjectSettings>(`/v1/projects/${projectID}/vuln-scan/disable`, { method: 'POST' });
}

export function getPIIFindings(projectID: string, params?: Record<string, string>): Promise<PIIFinding[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchAPI<PIIFinding[]>(`/v1/projects/${projectID}/pii/findings${qs}`);
}

export function getPIIStats(projectID: string): Promise<PIIStats> {
  return fetchAPI<PIIStats>(`/v1/projects/${projectID}/pii/stats`);
}

export function getPIITracker(projectID: string): Promise<PIITrackerRow[]> {
  return fetchAPI<PIITrackerRow[]>(`/v1/projects/${projectID}/pii/tracker`);
}

export function getPIIWorkflow(projectID: string, ticketID: string): Promise<PIIWorkflowData> {
  return fetchAPI<PIIWorkflowData>(`/v1/projects/${projectID}/pii/workflow/${ticketID}`);
}

export function getTicketPIIFindings(projectID: string, ticketID: string): Promise<PIIFinding[]> {
  return fetchAPI<PIIFinding[]>(`/v1/projects/${projectID}/tickets/${ticketID}/pii`);
}

export function resolvePIIFinding(projectID: string, findingID: string, status: 'remediated' | 'dismissed', reason?: string): Promise<PIIFinding> {
  return fetchAPI<PIIFinding>(`/v1/projects/${projectID}/pii/findings/${findingID}/resolve`, { method: 'POST', body: JSON.stringify({ status, reason }) });
}

export function executeAIAction(projectID: string, findingID: string, actionIndex: number): Promise<{ success: boolean; message: string }> {
  return fetchAPI<{ success: boolean; message: string }>(`/v1/projects/${projectID}/pii/findings/${findingID}/execute-action`, { method: 'POST', body: JSON.stringify({ action_index: actionIndex, confirm: true }) });
}

export function askAIAboutFinding(projectID: string, findingID: string, question: string): Promise<{ answer: string }> {
  return fetchAPI<{ answer: string }>(`/v1/projects/${projectID}/pii/findings/${findingID}/ask-ai`, { method: 'POST', body: JSON.stringify({ question }) });
}

export function triggerPIIScan(projectID: string): Promise<{ status: string; findings_count: number }> {
  return fetchAPI<{ status: string; findings_count: number }>(`/v1/projects/${projectID}/pii/scan`, { method: 'POST' });
}

export function getTicketAudit(projectID: string, ticketID: string): Promise<TicketAuditEvent[]> {
  return fetchAPI<TicketAuditEvent[]>(`/v1/projects/${projectID}/tickets/${ticketID}/audit`);
}

export function getOwnershipChanges(projectID: string): Promise<TicketAuditEvent[]> {
  return fetchAPI<TicketAuditEvent[]>(`/v1/projects/${projectID}/audit/ownership-changes`);
}

export function getFlaggedTickets(projectID: string): Promise<PIITrackerRow[]> {
  return fetchAPI<PIITrackerRow[]>(`/v1/projects/${projectID}/audit/flagged-tickets`);
}

export function getInAppNotifications(limit?: number, offset?: number): Promise<InAppNotification[]> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  const qs = params.toString();
  return fetchAPI<InAppNotification[]>(`/v1/notifications${qs ? `?${qs}` : ''}`, { service: 'atlas' });
}

export function getInAppUnreadCount(): Promise<{ count: number }> {
  return fetchAPI<{ count: number }>('/v1/notifications/unread-count', { service: 'atlas' });
}

export function markInAppNotificationRead(id: string): Promise<{ read: boolean }> {
  return fetchAPI<{ read: boolean }>(`/v1/notifications/${id}/read`, { method: 'POST', service: 'atlas' });
}

export function markAllInAppNotificationsRead(): Promise<{ read_count: number }> {
  return fetchAPI<{ read_count: number }>('/v1/notifications/read-all', { method: 'POST', service: 'atlas' });
}

// ── Search API ───────────────────────────────────────────────────────────────

export interface SearchResultBadge {
  type: string;
  label: string;
  color: string;
}

export interface SearchResultLinks {
  voatomy?: string;
  external?: string;
  external_tool?: string;
}

export interface SearchResult {
  id: string;
  entity_type: string;
  entity_id: string;
  product: string;
  score: number;
  title: string;
  subtitle: string;
  highlight?: string;
  metadata?: Record<string, unknown>;
  badges: SearchResultBadge[];
  links: SearchResultLinks;
}

export interface SearchResultGroup {
  name: string;
  results: SearchResult[];
}

export interface SearchQueryMeta {
  raw: string;
  normalized: string;
  intent: string;
}

export interface SearchSuggestions {
  did_you_mean: string | null;
  related_queries: string[];
}

export interface SearchMeta {
  latency_ms: number;
  keyword_hits: number;
  fuzzy_hits: number;
  total_results: number;
  cached: boolean;
}

export interface SearchResponse {
  query: SearchQueryMeta;
  groups: SearchResultGroup[];
  suggestions: SearchSuggestions;
  meta: SearchMeta;
}

export interface SearchSuggestion {
  text: string;
  entity_type?: string;
  product?: string;
  context?: string;
  url?: string;
}

export interface SuggestResponse {
  query: string;
  suggestions: SearchSuggestion[];
  recent: { text: string; searched_at: string }[];
}

export interface SearchRequestBody {
  query: string;
  filters?: {
    products?: string[];
    entity_types?: string[];
    revenue_min?: number;
    date_from?: string;
    date_to?: string;
    status?: string[];
  };
  context?: {
    current_product?: string;
    current_page?: string;
    source?: string;
  };
  options?: {
    limit?: number;
    offset?: number;
    include_federation?: boolean;
    include_suggestions?: boolean;
    highlight?: boolean;
  };
}

export function searchAll(body: SearchRequestBody): Promise<SearchResponse> {
  return fetchAPI<SearchResponse>('/v1/search', {
    method: 'POST',
    body: JSON.stringify(body),
    service: 'atlas',
  });
}

export function searchSuggest(query: string, limit = 6): Promise<SuggestResponse> {
  return fetchAPI<SuggestResponse>(`/v1/search/suggest?q=${encodeURIComponent(query)}&limit=${limit}`, {
    service: 'atlas',
  });
}

export function indexProjectTickets(projectID: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/projects/${projectID}/search/index-tickets`, {
    method: 'POST',
    service: 'atlas',
  });
}

export function indexProjectSprints(projectID: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/projects/${projectID}/search/index-sprints`, {
    method: 'POST',
    service: 'atlas',
  });
}

// ── Ticket Activity & Meeting Tracking ──

// Activity types
export interface TicketComment {
  id: string;
  ticket_id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  body: string;
  external_id?: string;
  external_url?: string;
  source: 'jira' | 'linear' | 'atlas';
  created_at: string;
  updated_at: string;
}

export interface CommentActivityStats {
  user_id: string;
  owned_in_progress_count: number;
  stale_ticket_count: number;
  last_comment_at?: string;
  avg_days_between_comments: number;
}

export interface UserStaleInfo {
  assignee_id?: string;
  stale_count: number;
  stale_tickets: {
    id: string;
    title: string;
    external_id: string;
    external_url?: string;
    assignee_id?: string;
    status: string;
  }[];
}

export interface ActivityStats {
  total_in_progress: number;
  stale_count: number;
  users_with_stale: UserStaleInfo[];
  avg_comment_frequency_days: number;
}

export interface StaleTicketResponse {
  ticket: {
    id: string;
    project_id: string;
    external_id: string;
    external_url?: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignee_id?: string;
    labels?: string[];
    created_at: string;
    updated_at: string;
  };
  last_comment_at?: string;
  days_since_update: number;
}

export interface StaleTicket {
  ticket_id: string;
  ticket_title: string;
  external_id: string;
  external_url?: string;
  assignee_id?: string;
  assignee_name?: string;
  status: string;
  last_comment_at?: string;
  days_since_update: number;
}

export function mapStaleTicketResponse(resp: StaleTicketResponse, assigneeName?: string): StaleTicket {
  return {
    ticket_id: resp.ticket.id,
    ticket_title: resp.ticket.title,
    external_id: resp.ticket.external_id,
    external_url: resp.ticket.external_url,
    assignee_id: resp.ticket.assignee_id,
    assignee_name: assigneeName,
    status: resp.ticket.status,
    last_comment_at: resp.last_comment_at,
    days_since_update: resp.days_since_update,
  };
}

export interface CommentReminder {
  id: string;
  project_id: string;
  assignee_id: string;
  external_ticket_id?: string;
  external_url?: string;
  stale_ticket_ids: string[];
  status: 'open' | 'closed';
  created_at: string;
  closed_at?: string;
}

// Meeting types
export interface Meeting {
  id: string;
  org_id: string;
  project_id: string;
  title: string;
  description?: string;
  calendar_event_id?: string;
  calendar_provider?: 'google' | 'outlook';
  start_time: string;
  end_time: string;
  meeting_url?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_by_id: string;
  participants?: MeetingParticipant[];
  ticket_links?: MeetingTicketLink[];
  notes?: MeetingNote[];
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id?: string;
  name: string;
  email: string;
  role: 'organizer' | 'required' | 'optional';
}

export interface MeetingTicketLink {
  id: string;
  meeting_id: string;
  ticket_id: string;
  link_type: 'discussed' | 'created' | 'blocked';
}

export interface MeetingNote {
  id: string;
  meeting_id: string;
  author_id: string;
  content: string;
  ai_analysis?: MeetingAnalysis;
  ai_recommendations?: TicketRecommendation[];
  created_at: string;
}

export interface MeetingAnalysis {
  summary: string;
  decisions: string[];
  action_items: MeetingActionItem[];
  blockers: string[];
  ticket_recommendations: TicketRecommendation[];
}

export interface MeetingActionItem {
  title: string;
  assignee?: string;
  due_date?: string;
  status: 'pending' | 'done';
}

export interface TicketRecommendation {
  title: string;
  description: string;
  priority: string;
  rationale: string;
}

// Channel types
export type ChannelType = 'slack' | 'teams';

export interface ChannelConfig {
  id: string;
  org_id: string;
  project_id: string;
  channel_type: ChannelType;
  webhook_url: string;
  channel_id?: string;
  channel_name?: string;
  enabled: boolean;
  events: string[];
  created_at: string;
  updated_at: string;
}

// Activity API
export function getActivityStats(projectId: string, sprintId?: string): Promise<ActivityStats> {
  const qs = sprintId ? `?sprint_id=${sprintId}` : '';
  return fetchAPI<ActivityStats>(`/v1/projects/${projectId}/activity/stats${qs}`);
}

export function getStaleTickets(projectId: string, sprintId?: string): Promise<StaleTicketResponse[]> {
  const qs = sprintId ? `?sprint_id=${sprintId}` : '';
  return fetchAPI<StaleTicketResponse[]>(`/v1/projects/${projectId}/activity/stale-tickets${qs}`);
}

export function getReminders(projectId: string): Promise<CommentReminder[]> {
  return fetchAPI<CommentReminder[]>(`/v1/projects/${projectId}/activity/reminders`);
}

export function createReminder(projectId: string, data: { assignee_id: string; stale_ticket_ids: string[] }): Promise<CommentReminder> {
  return fetchAPI<CommentReminder>(`/v1/projects/${projectId}/activity/reminders`, { method: 'POST', body: JSON.stringify(data) });
}

export function closeReminder(projectId: string, reminderId: string): Promise<CommentReminder> {
  return fetchAPI<CommentReminder>(`/v1/projects/${projectId}/activity/reminders/${reminderId}/close`, { method: 'POST' });
}

export function getUserActivityStats(projectId: string, userId: string, sprintId?: string): Promise<CommentActivityStats> {
  const qs = sprintId ? `?sprint_id=${sprintId}` : '';
  return fetchAPI<CommentActivityStats>(`/v1/projects/${projectId}/activity/user/${userId}/stats${qs}`);
}

export function getTeamActivityStats(projectId: string, sprintId?: string): Promise<CommentActivityStats[]> {
  const qs = sprintId ? `?sprint_id=${sprintId}` : '';
  return fetchAPI<CommentActivityStats[]>(`/v1/projects/${projectId}/activity/team-stats${qs}`);
}

export function getTicketComments(projectId: string, ticketId: string): Promise<TicketComment[]> {
  return fetchAPI<TicketComment[]>(`/v1/projects/${projectId}/tickets/${ticketId}/comments`);
}

// Meetings API
export function getMeetings(projectId: string, from?: string, to?: string): Promise<Meeting[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return fetchAPI<Meeting[]>(`/v1/projects/${projectId}/meetings${qs ? `?${qs}` : ''}`);
}

export function createMeeting(projectId: string, data: Partial<Meeting>): Promise<Meeting> {
  return fetchAPI<Meeting>(`/v1/projects/${projectId}/meetings`, { method: 'POST', body: JSON.stringify(data) });
}

export function getMeeting(projectId: string, meetingId: string): Promise<Meeting> {
  return fetchAPI<Meeting>(`/v1/projects/${projectId}/meetings/${meetingId}`);
}

export function updateMeeting(projectId: string, meetingId: string, data: Partial<Meeting>): Promise<Meeting> {
  return fetchAPI<Meeting>(`/v1/projects/${projectId}/meetings/${meetingId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function addMeetingNote(projectId: string, meetingId: string, content: string): Promise<MeetingNote> {
  return fetchAPI<MeetingNote>(`/v1/projects/${projectId}/meetings/${meetingId}/notes`, { method: 'POST', body: JSON.stringify({ content }) });
}

export function analyzeMeetingNotes(projectId: string, meetingId: string): Promise<MeetingAnalysis> {
  return fetchAPI<MeetingAnalysis>(`/v1/projects/${projectId}/meetings/${meetingId}/analyze`, { method: 'POST' });
}

export function acceptRecommendation(projectId: string, meetingId: string, index: number): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/v1/projects/${projectId}/meetings/${meetingId}/recommendations/${index}/accept`, { method: 'POST' });
}

export function getTicketMeetings(projectId: string, ticketId: string): Promise<Meeting[]> {
  return fetchAPI<Meeting[]>(`/v1/projects/${projectId}/tickets/${ticketId}/meetings`);
}

export function syncCalendar(projectId: string): Promise<{ status: string; synced: number }> {
  return fetchAPI<{ status: string; synced: number }>(`/v1/projects/${projectId}/meetings/sync-calendar`, { method: 'POST' });
}

export interface TeamAvailabilityMember {
  member_id: string;
  name: string;
  initials: string;
  availability_pct: number;
  adjustments: { type: string; label: string; impact_pct: number }[];
}

export interface TeamAvailability {
  members: TeamAvailabilityMember[];
  total_capacity_pts: number;
  adjusted_capacity_pts: number;
  calendar_synced: boolean;
}

export async function getTeamAvailability(projectId: string): Promise<TeamAvailability> {
  const overview = await getTeamOverview(projectId);
  const teamId = overview.team?.id;
  if (!teamId) {
    return { members: [], total_capacity_pts: 0, adjusted_capacity_pts: 0, calendar_synced: false };
  }
  const capacity = await getTeamCapacity(teamId);
  const members: TeamAvailabilityMember[] = capacity.members.map((m) => {
    const member = overview.members.find((tm) => tm.id === m.member_id);
    return {
      member_id: m.member_id,
      name: member?.name ?? 'Unknown',
      initials: member?.initials ?? '??',
      availability_pct: m.base_capacity > 0 ? Math.round((m.effective_capacity / m.base_capacity) * 100) : 100,
      adjustments: m.adjustments.map((a) => ({ type: a.type, label: a.label, impact_pct: a.impact_pct })),
    };
  });
  return {
    members,
    total_capacity_pts: Math.round(capacity.total_capacity),
    adjusted_capacity_pts: Math.round(capacity.adjusted_capacity),
    calendar_synced: true,
  };
}

// Channels API
export function getChannels(projectId: string): Promise<ChannelConfig[]> {
  return fetchAPI<ChannelConfig[]>(`/v1/projects/${projectId}/channels`);
}

export function addChannel(projectId: string, data: { channel_type: ChannelType; webhook_url: string; channel_name?: string; events?: string[] }): Promise<ChannelConfig> {
  return fetchAPI<ChannelConfig>(`/v1/projects/${projectId}/channels`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateChannel(projectId: string, channelId: string, data: Partial<ChannelConfig>): Promise<ChannelConfig> {
  return fetchAPI<ChannelConfig>(`/v1/projects/${projectId}/channels/${channelId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteChannel(projectId: string, channelId: string): Promise<{ deleted: boolean }> {
  return fetchAPI<{ deleted: boolean }>(`/v1/projects/${projectId}/channels/${channelId}`, { method: 'DELETE' });
}

export function testChannel(projectId: string, channelId: string): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>(`/v1/projects/${projectId}/channels/${channelId}/test`, { method: 'POST' });
}

// ---------------------------------------------------------------------------
// Workflow API
// ---------------------------------------------------------------------------

export type WorkflowScenario = 'ticket_activity' | 'meeting_insights' | 'sprint_health' | 'pii_detection' | 'custom';

export interface WorkflowPort {
  id: string;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  color?: string;
  config?: Record<string, unknown>;
  ports?: WorkflowPort[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  source_port?: string;
  target: string;
  target_port?: string;
  label?: string;
  animated?: boolean;
  condition?: string;
}

export interface WorkflowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Workflow {
  id: string;
  org_id: string;
  project_id: string;
  name: string;
  description?: string;
  scenario: WorkflowScenario;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: WorkflowViewport;
  is_template: boolean;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStats {
  total_created: number;
  in_progress: number;
  stale_count: number;
  active_count: number;
  reminders_open: number;
  meeting_suggestions: number;
  meetings_total: number;
  meetings_with_notes: number;
  ai_analyzed: number;
  pii_total: number;
  pii_open: number;
  pii_resolved: number;
  notifications_sent: number;
  done_count: number;
  blocked_count: number;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  scenario?: WorkflowScenario;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  viewport?: WorkflowViewport;
  is_template?: boolean;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  scenario?: WorkflowScenario;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  viewport?: WorkflowViewport;
  is_template?: boolean;
}

export function getWorkflows(projectId: string): Promise<Workflow[]> {
  return fetchAPI<Workflow[]>(`/v1/projects/${projectId}/workflows`);
}

export function getWorkflow(projectId: string, workflowId: string): Promise<Workflow> {
  return fetchAPI<Workflow>(`/v1/projects/${projectId}/workflows/${workflowId}`);
}

export function createWorkflow(projectId: string, data: CreateWorkflowInput): Promise<Workflow> {
  return fetchAPI<Workflow>(`/v1/projects/${projectId}/workflows`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateWorkflow(projectId: string, workflowId: string, data: UpdateWorkflowInput): Promise<Workflow> {
  return fetchAPI<Workflow>(`/v1/projects/${projectId}/workflows/${workflowId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteWorkflow(projectId: string, workflowId: string): Promise<{ deleted: boolean }> {
  return fetchAPI<{ deleted: boolean }>(`/v1/projects/${projectId}/workflows/${workflowId}`, { method: 'DELETE' });
}

export function getWorkflowTemplates(projectId: string): Promise<Workflow[]> {
  return fetchAPI<Workflow[]>(`/v1/projects/${projectId}/workflows/templates`);
}

export function getPipelineStats(projectId: string): Promise<PipelineStats> {
  return fetchAPI<PipelineStats>(`/v1/projects/${projectId}/workflows/pipeline-stats`);
}

// ── Billing & Trials ──

export interface TrialOutput {
  subscription: {
    id: string;
    org_id: string;
    plan_tier: string;
    status: string;
    trial_end: string;
  };
  trial_ends_at: string;
  days_left: number;
}

export function startTrial(planTier: 'pro' | 'business'): Promise<TrialOutput> {
  return fetchAPI<TrialOutput>('/v1/billing/start-trial', {
    method: 'POST',
    body: JSON.stringify({ plan_tier: planTier }),
    service: 'onboarding',
  });
}

// ── Invitations (onboarding-service) ──

export interface InvitationPayload {
  email: string;
  role: string;
  team_id?: string;
  project_ids?: string[];
}

export interface Invitation {
  id: string;
  org_id: string;
  team_id?: string;
  email: string;
  role: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  created_at: string;
  accepted_at?: string;
  expires_at: string;
  project_ids?: string[];
}

export function sendInvitations(invitations: InvitationPayload[]): Promise<Invitation[]> {
  return fetchAPI<Invitation[]>('/v1/invitations', {
    method: 'POST',
    body: JSON.stringify({ invitations }),
    service: 'onboarding',
  });
}

export function listInvitations(): Promise<Invitation[]> {
  return fetchAPI<Invitation[]>('/v1/invitations', { service: 'onboarding' });
}

// ── ClickUp Team Member Sync (atlas-service) ──

/** @deprecated Use {@link syncTeamMembers} instead. */
export function syncClickUpMembers(projectId: string): Promise<{ synced: number; added: number; updated: number }> {
  return syncTeamMembers(projectId);
}

export function syncTeamMembers(projectId: string): Promise<{ synced: number; added: number; updated: number }> {
  return fetchAPI<{ synced: number; added: number; updated: number }>(`/v1/projects/${projectId}/team/sync-members`, {
    method: 'POST',
  });
}

export interface DiscoverableMember {
  email: string;
  display_name: string;
  avatar_url?: string;
  already_member: boolean;
}

export function getDiscoverableMembers(projectId: string): Promise<DiscoverableMember[]> {
  return fetchAPI<DiscoverableMember[]>(`/v1/projects/${projectId}/team/discoverable-members`);
}

// ── Generic Provider Discovery (Phase 4) ────────────────────────────────────

export interface DiscoveryWorkspace {
  id: string;
  name: string;
  icon?: string;
}

export interface DiscoveryProject {
  id: string;
  name: string;
  key?: string;
}

export interface DiscoveryBoard {
  id: string;
  name: string;
  has_sprints?: boolean;
  ticket_count?: number;
}

// ── Write-back APIs (Phase 3) ───────────────────────────────────────────────

export function pushCreateTicket(projectId: string, ticket: { title: string; description?: string; status?: string; priority?: string; assignee_id?: string }): Promise<{ external_id: string }> {
  return fetchAPI<{ external_id: string }>(`/v1/projects/${projectId}/push-ticket`, {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
}

