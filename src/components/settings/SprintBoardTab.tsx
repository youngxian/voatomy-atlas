'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  Hash,
  Plug,
  Target,
  Kanban,
  RefreshCw,
  CalendarRange,
  Gauge,
  ArrowRightLeft,
  Sparkles,
  ChevronDown,
  Loader2,
  Check,
  Save,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { Toggle, Select, Input, SectionHeader } from './SettingsFormControls';
import { useProject } from '@/lib/project-context';
import {
  getBoardColumns,
  patchBoardColumns,
  getProjectConnections,
  type BoardColumn,
  type ProviderConnection,
} from '@/lib/api';

const ATLAS_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'blocked', label: 'Blocked' },
] as const;

export function SprintBoardTab() {
  const { activeProjectId } = useProject();
  const [duration, setDuration] = useState('2 weeks');
  const [scale, setScale] = useState('Fibonacci (1, 2, 3, 5, 8, 13, 21)');
  const [velocityTarget, setVelocityTarget] = useState('54');
  const [maxCapPct, setMaxCapPct] = useState('85%');
  const [syncFreq, setSyncFreq] = useState('Every 5 minutes');
  const [writeBack, setWriteBack] = useState(true);
  const [autoClose, setAutoClose] = useState(true);
  const [sprintGoals, setSprintGoals] = useState(true);
  const [retroReminder, setRetroReminder] = useState(true);
  const [planningNotes, setPlanningNotes] = useState(true);
  const [statusMapping, setStatusMapping] = useState(true);
  const [autoPlan, setAutoPlan] = useState(false);
  const [autoPush, setAutoPush] = useState(false);

  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [columnsSaving, setColumnsSaving] = useState(false);
  const [columnsSaved, setColumnsSaved] = useState(false);
  const [columnEdits, setColumnEdits] = useState<Record<string, string>>({});

  const fetchColumns = useCallback(async () => {
    if (!activeProjectId) return;
    setColumnsLoading(true);
    try {
      const [colsRes, connsRes] = await Promise.all([
        getBoardColumns(activeProjectId),
        getProjectConnections(activeProjectId),
      ]);
      setColumns(colsRes.columns ?? []);
      setConnections(connsRes ?? []);
      setColumnEdits({});
    } catch {
      setColumns([]);
      setConnections([]);
    } finally {
      setColumnsLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const providerName = connections[0]?.provider
    ? String(connections[0].provider).charAt(0).toUpperCase() + String(connections[0].provider).slice(1)
    : null;

  const handleColumnMapChange = (columnId: string, mappedStatus: string) => {
    setColumnEdits((prev) => ({ ...prev, [columnId]: mappedStatus }));
  };

  const handleSaveColumnMapping = async () => {
    if (!activeProjectId) return;
    const toSave = columns.map((c, i) => ({
      provider_name: c.provider_name,
      provider_id: c.provider_id || `pos-${i}`,
      mapped_status: columnEdits[c.id] ?? c.mapped_status,
      position: i,
      is_done: c.is_done,
      is_initial: c.is_initial,
    }));
    setColumnsSaving(true);
    try {
      const res = await patchBoardColumns(activeProjectId, { columns: toSave });
      setColumns(res.columns ?? []);
      setColumnEdits({});
      setColumnsSaved(true);
      setTimeout(() => setColumnsSaved(false), 2500);
    } catch {
      // Error handled by API
    } finally {
      setColumnsSaving(false);
    }
  };

  const hasColumnEdits = Object.keys(columnEdits).length > 0;

  return (
    <div className="space-y-5">
      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={CalendarRange} title="Sprint Configuration" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Select label="Sprint Duration" value={duration} onChange={setDuration} icon={Clock} options={['1 week', '2 weeks', '3 weeks', '4 weeks']} />
          <Select label="Story Point Scale" value={scale} onChange={setScale} icon={Hash} options={['Linear (1-10)', 'Fibonacci (1, 2, 3, 5, 8, 13, 21)', 'T-Shirt (XS, S, M, L, XL)', 'Powers of 2 (1, 2, 4, 8, 16)']} />
          <Input label="Velocity Target (pts)" value={velocityTarget} onChange={setVelocityTarget} icon={Target} hint="Target points per sprint" type="number" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Select label="Max Capacity Utilization" value={maxCapPct} onChange={setMaxCapPct} icon={Gauge} options={['70%', '75%', '80%', '85%', '90%', '95%', '100%']} hint="ATLAS warns when sprint load exceeds this %" />
          <div />
        </div>
        <div className="mt-4 space-y-0.5 border-t border-border/60 pt-4">
          <Toggle checked={sprintGoals} onChange={() => setSprintGoals(!sprintGoals)} label="Sprint goals" description="Require sprint goals to be defined before plan is pushed to board" />
          <Toggle checked={retroReminder} onChange={() => setRetroReminder(!retroReminder)} label="Retrospective reminders" description="Auto-remind team to complete retrospective after each sprint" />
          <Toggle checked={planningNotes} onChange={() => setPlanningNotes(!planningNotes)} label="Sprint planning notes" description="Record move-to-sprint decisions and AI recommendations as planning notes" />
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Sparkles} title="Sprint Planning" />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">
          Configure AI-powered sprint planning automation.
        </p>
        <div className="space-y-0.5">
          <Toggle
            checked={autoPlan}
            onChange={() => {
              const next = !autoPlan;
              setAutoPlan(next);
              if (!next) setAutoPush(false);
            }}
            label="Auto-plan when sprint starts"
            description="ATLAS generates a sprint plan when a new sprint is detected via webhook"
          />
          {autoPlan && (
            <div className="pl-4 border-l-2 border-primary/20 ml-1">
              <Toggle
                checked={autoPush}
                onChange={() => setAutoPush(!autoPush)}
                label="Also push plan to board"
                description="Automatically push the generated plan — no manual review step"
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={ArrowRightLeft} title="Status Column Mapping" badge={providerName ? `Detected from ${providerName}` : undefined} />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">
          Map your board&apos;s status columns to ATLAS workflow stages. Override any mapping below.
        </p>
        {columnsLoading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading board columns…</span>
          </div>
        ) : columns.length === 0 ? (
          <div className="py-6 px-4 rounded-xl bg-muted/30 border border-dashed border-border/60 text-center">
            <Kanban className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No board columns detected yet</p>
            <p className="text-[11px] text-muted-foreground/80 mt-1">
              Sync your board to detect workflow columns, or connect a board integration first.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {columns.map((col, idx) => (
              <div
                key={col.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border/60"
              >
                <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">{idx + 1}.</span>
                <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate" title={col.provider_name}>
                  {col.provider_name}
                </span>
                <ArrowRightLeft className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="relative shrink-0 min-w-[140px]">
                  <select
                    value={columnEdits[col.id] ?? col.mapped_status}
                    onChange={(e) => handleColumnMapChange(col.id, e.target.value)}
                    className="w-full appearance-none px-3 py-1.5 rounded-lg bg-white border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 cursor-pointer"
                  >
                    {ATLAS_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
                {col.is_initial && <Badge variant="muted" className="text-[9px]">Initial</Badge>}
                {col.is_done && <Badge variant="success" className="text-[9px]">Done</Badge>}
              </div>
            ))}
            {hasColumnEdits && (
              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleSaveColumnMapping}
                  disabled={columnsSaving}
                  className="gap-2"
                >
                  {columnsSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : columnsSaved ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {columnsSaving ? 'Saving…' : columnsSaved ? 'Saved' : 'Save mapping'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Plug} title="Board Connection & Sync" />
        <div className="mt-4 space-y-3">
          {connections.length > 0 ? (
            connections.map((conn) => (
              <div key={conn.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border/60">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-primary">
                  {String(conn.provider).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{String(conn.provider)}</span>
                    <Badge variant="success">Connected</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {conn.external_project_id}
                    {conn.last_synced_at ? ` · Synced ${new Date(conn.last_synced_at).toLocaleDateString()}` : ''}
                  </span>
                </div>
                <Link href={`/integrations/${conn.provider}`} className="text-[10px] text-primary hover:underline font-medium">
                  Configure →
                </Link>
              </div>
            ))
          ) : (
            [
              { name: 'Jira', project: 'Connect your board', status: 'disconnected', color: '#2684FF' },
              { name: 'Linear', project: 'Connect your board', status: 'disconnected', color: '#5E6AD2' },
              { name: 'ClickUp', project: 'Connect your board', status: 'disconnected', color: '#7B68EE' },
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border/60 opacity-75">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: tool.color }}>
                  {tool.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{tool.name}</span>
                    <Badge variant="muted">Not connected</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{tool.project}</span>
                </div>
                <Link href={`/integrations/${tool.name.toLowerCase()}`} className="text-[10px] text-primary hover:underline font-medium">
                  Connect →
                </Link>
              </div>
            ))
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/60">
          <Select label="Sync Frequency" value={syncFreq} onChange={setSyncFreq} icon={RefreshCw} options={['Real-time (webhook)', 'Every 1 minute', 'Every 5 minutes', 'Every 15 minutes', 'Every 30 minutes', 'Hourly', 'Manual only']} hint="How often ATLAS pulls data from connected boards" />
          <div />
        </div>
        <div className="mt-3 space-y-0.5">
          <Toggle checked={writeBack} onChange={() => setWriteBack(!writeBack)} label="Write-back to board" description="Allow ATLAS to push sprint plans, labels, and comments back to your connected board" />
          <Toggle checked={autoClose} onChange={() => setAutoClose(!autoClose)} label="Auto-close sprints" description="Automatically close sprint in ATLAS when board sprint is completed" />
          <Toggle checked={statusMapping} onChange={() => setStatusMapping(!statusMapping)} label="Status mapping sync" description="Keep ATLAS board columns in sync with your board's workflow statuses" />
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={ArrowRightLeft} title="Field Mapping" />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">Map board fields to ATLAS concepts for accurate intelligence.</p>
        <div className="space-y-2">
          {[
            { atlas: 'Story Points', board: 'Story Points (board)', mapped: true },
            { atlas: 'Priority', board: 'Priority (board)', mapped: true },
            { atlas: 'Assignee', board: 'Assignee (board)', mapped: true },
            { atlas: 'Sprint', board: 'Sprint / Cycle (board)', mapped: true },
            { atlas: 'Epic Link', board: 'Epic / Parent (board)', mapped: true },
            { atlas: 'Module', board: 'Component / Label (board)', mapped: true },
            { atlas: 'Dependencies', board: 'Links / Relations (board)', mapped: true },
            { atlas: 'Revenue Impact', board: '— (from LOOP)', mapped: false },
          ].map((m) => (
            <div key={m.atlas} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border/60">
              <span className="text-xs font-medium text-foreground w-32 shrink-0">{m.atlas}</span>
              <ArrowRightLeft className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground flex-1">{m.board}</span>
              {m.mapped ? <Badge variant="success">Mapped</Badge> : <Badge variant="muted">Not mapped</Badge>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
