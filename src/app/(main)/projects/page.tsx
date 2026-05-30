'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  AlertTriangle,
  Zap,
  TrendingUp,
  BarChart3,
  Target,
  Users,
  Calendar,
  Clock,
  Activity,
  Layers,
  ArrowUpRight,
  FolderKanban,
  X,
  ChevronLeft,
  Check,
  Loader2,
  List,
  CalendarRange,
} from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import { ProjectsIllustration } from '@/components/EmptyIllustrations';
import { Reveal } from '@/components/Reveal';
import {
  getProjects,
  getClickUpSpaces,
  getClickUpSpaceDetails,
  importClickUpSpaces,
  updateProject,
  type Project as APIProject,
  type ClickUpSpaceInfo,
  type ClickUpSpaceDetails,
  type ClickUpListInfo,
} from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { getProviderLabel } from '@/lib/project-utils';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Project {
  id: string;
  name: string;
  description: string;
  role: string;
  board: string;
  sprintLabel: string;
  sprintDuration: string;
  ticketCount: number;
  points: number | null;
  accuracy: number;
  accuracyTrend: 'up' | 'down' | 'flat';
  teamSize: number;
  velocity: number;
  health: 'green' | 'yellow' | 'red';
  lastActivity: string;
  planAction: string;
}

function mapApiProject(p: APIProject): Project {
  const board = getProviderLabel(p);
  const duration = p.sprint_duration_days <= 7 ? '1wk' : p.sprint_duration_days <= 14 ? '2wk' : '3wk';
  return {
    id: p.id,
    name: p.name,
    description: p.slug,
    role: '',
    board,
    sprintLabel: 'Current Sprint',
    sprintDuration: duration,
    ticketCount: 0,
    points: null,
    accuracy: 0,
    accuracyTrend: 'flat',
    teamSize: 0,
    velocity: 0,
    health: 'green',
    lastActivity: p.last_synced_at ? new Date(p.last_synced_at).toLocaleDateString() : 'Never',
    planAction: 'Plan Sprint',
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function boardConfig(board: string) {
  switch (board) {
    case 'Jira': return { color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/20', accent: 'var(--primary)' };
    case 'Linear': return { color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/20', accent: '#5E6AD2' };
    case 'ClickUp': return { color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/20', accent: '#7B68EE' };
    default: return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', accent: 'var(--muted-foreground)' };
  }
}

function healthDot(health: string) {
  switch (health) {
    case 'green': return 'bg-success';
    case 'yellow': return 'bg-warning';
    case 'red': return 'bg-destructive';
    default: return 'bg-muted-foreground';
  }
}

function healthLabel(health: string) {
  switch (health) {
    case 'green': return 'Healthy';
    case 'yellow': return 'Needs Attention';
    case 'red': return 'At Risk';
    default: return 'Unknown';
  }
}

function accuracyColor(pct: number) {
  if (pct >= 80) return 'text-success';
  if (pct >= 70) return 'text-warning';
  return 'text-destructive';
}

function accuracyBarColor(pct: number) {
  if (pct >= 80) return 'bg-success';
  if (pct >= 70) return 'bg-warning';
  return 'bg-destructive';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type PickerStep = 'closed' | 'spaces' | 'folders' | 'lists';

interface FolderEntry {
  id: string;
  name: string;
  lists: ClickUpListInfo[];
  list_ids?: string[];
  has_sprint?: boolean;
  sprint_list_ids?: string[];
}

export default function ProjectsPage() {
  const projectCtx = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiReturnsEmpty, setApiReturnsEmpty] = useState(false);

  // Space/Folder picker state
  const [pickerStep, setPickerStep] = useState<PickerStep>('closed');
  const [spaces, setSpaces] = useState<ClickUpSpaceInfo[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<ClickUpSpaceInfo | null>(null);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [folderlessLists, setFolderlessLists] = useState<ClickUpListInfo[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderEntry | null>(null);
  const [listsInFolder, setListsInFolder] = useState<ClickUpListInfo[]>([]);
  const [importing, setImporting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProjects()
      .then(apiProjects => {
        if (apiProjects.length === 0) setApiReturnsEmpty(true);
        if (apiProjects.length > 0) {
          setProjects(apiProjects.map(mapApiProject));
        }
      })
      .catch((err) => console.error('Failed to load project', err))
      .finally(() => setLoading(false));
  }, []);

  // Close modal on outside click
  useEffect(() => {
    if (pickerStep === 'closed') return;
    function onMouseDown(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setPickerStep('closed');
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [pickerStep]);

  const openPicker = async () => {
    setPickerStep('spaces');
    setSpacesLoading(true);
    setSpaces([]);
    setSelectedSpace(null);
    setFolders([]);
    setFolderlessLists([]);
    setSelectedFolder(null);
    setListsInFolder([]);
    try {
      const s = await getClickUpSpaces();
      setSpaces(s);
    } catch {
      // no ClickUp connected
    } finally {
      setSpacesLoading(false);
    }
  };

  const selectSpace = async (space: ClickUpSpaceInfo) => {
    setSelectedSpace(space);
    setPickerStep('folders');
    setFoldersLoading(true);
    setSelectedFolder(null);
    setListsInFolder([]);
    try {
      const details = await getClickUpSpaceDetails(space.space_id);
      setFolders(details.folders?.map(f => ({ ...f, lists: f.lists ?? [] })) ?? []);
      setFolderlessLists(details.folderless_lists ?? []);
    } catch {
      setFolders([]);
      setFolderlessLists([]);
    } finally {
      setFoldersLoading(false);
    }
  };

  const selectFolder = (folder: FolderEntry) => {
    setSelectedFolder(folder);
    setListsInFolder(folder.lists ?? []);
    setPickerStep('lists');
  };

  const selectFolderlessList = (list: ClickUpListInfo) => {
    importList(list.id);
  };

  const selectList = (list: ClickUpListInfo) => {
    importList(list.id);
  };

  const importList = async (listId: string) => {
    if (!selectedSpace) return;
    setImporting(true);
    try {
      if (!selectedSpace.imported) {
        const result = await importClickUpSpaces([selectedSpace.space_id], selectedSpace.team_id);
        if (result.created?.length > 0) {
          await updateProject(result.created[0].id, { clickup_list_id: listId });
        }
      } else {
        const apiProjects = await getProjects();
        const match = apiProjects.find(
          (p) => p.clickup_space_id === selectedSpace.space_id
        );
        if (match) {
          await updateProject(match.id, { clickup_list_id: listId });
        }
      }
      await projectCtx.refreshProjects();
      setPickerStep('closed');
      window.location.reload();
    } catch {
      // ignore
    } finally {
      setImporting(false);
    }
  };

  const totalProjects = projects.length;
  const totalActiveSprints = projects.length;
  const totalTeamMembers = projects.reduce((sum, p) => sum + p.teamSize, 0);
  const avgAccuracy = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.accuracy, 0) / projects.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (apiReturnsEmpty) {
    return (
      <EmptyState
        illustration={<ProjectsIllustration className="w-[220px] h-[176px]" />}
        title="No projects yet"
        description="Create your first project to start tracking sprints, tickets, and team velocity. Connect Jira, Linear, or ClickUp to import existing projects."
        actionLabel="Create Project"
      />
    );
  }

  return (
    <Reveal>
      <div className="space-y-8">
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center"
              style={{ animation: 'iconFloat 3s ease-in-out infinite' }}
            >
              <FolderKanban className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1
                className="text-3xl font-extrabold text-foreground"
                style={{ fontFamily: 'var(--font-serif)', animation: 'fadeSlideIn 0.6s ease-out forwards' }}
              >
                All Projects
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage and monitor all your active projects</p>
            </div>
          </div>
        </div>

        {/* ---- Summary Bar ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="bento-card rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-3"
            style={{ animation: 'cardSlideUp 0.4s ease-out 0s both' }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{totalProjects}</p>
              <p className="text-xs text-muted-foreground">Total Projects</p>
            </div>
          </div>
          <div
            className="bento-card rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-3"
            style={{ animation: 'cardSlideUp 0.4s ease-out 0.06s both' }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{totalActiveSprints}</p>
              <p className="text-xs text-muted-foreground">Active Sprints</p>
            </div>
          </div>
          <div
            className="bento-card rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-3"
            style={{ animation: 'cardSlideUp 0.4s ease-out 0.12s both' }}
          >
            <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{totalTeamMembers}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </div>
          <div
            className="bento-card rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-3"
            style={{ animation: 'cardSlideUp 0.4s ease-out 0.18s both' }}
          >
            <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{avgAccuracy}%</p>
              <p className="text-xs text-muted-foreground">Avg Accuracy</p>
            </div>
          </div>
        </div>

        {/* ---- Project Cards Grid ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project, i) => {
            const bc = boardConfig(project.board);
            return (
              <div
                key={project.id}
                className="group bento-card rounded-2xl bg-card border border-border/50 p-5 space-y-4 transition-all duration-300"
                style={{
                  animation: `cardSlideUp 0.4s ease-out ${i * 0.08}s both`,
                  borderLeft: `3px solid ${bc.accent}`,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                      {project.role && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">
                          {project.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{project.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${bc.bg} ${bc.color} ${bc.border}`}>
                    {project.board}
                  </span>
                </div>

                {/* Sprint + Health */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{project.sprintLabel} &middot; {project.sprintDuration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${healthDot(project.health)}`}
                      style={project.health === 'green' ? { animation: 'healthPulse 2s ease-in-out infinite' } : {}}
                    />
                    <span className="text-[10px] text-muted-foreground">{healthLabel(project.health)}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg bg-muted border border-border p-2.5 text-center">
                    <p className="text-muted-foreground mb-0.5">Team</p>
                    <p className="text-foreground font-bold flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      {project.teamSize}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted border border-border p-2.5 text-center">
                    <p className="text-muted-foreground mb-0.5">Velocity</p>
                    <p className="text-foreground font-bold flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-primary" />
                      {project.velocity}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted border border-border p-2.5 text-center">
                    <p className="text-muted-foreground mb-0.5">Tickets</p>
                    <p className="text-foreground font-bold">
                      {project.ticketCount}
                      {project.points !== null && (
                        <span className="text-muted-foreground font-normal"> &middot; {project.points}pt</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Accuracy</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${accuracyColor(project.accuracy)}`}>
                        {project.accuracy}%
                      </span>
                      {project.accuracyTrend === 'up' && (
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                      )}
                      {project.accuracyTrend === 'down' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${accuracyBarColor(project.accuracy)}`}
                      style={{
                        width: `${project.accuracy}%`,
                        animation: `barFillIn 1s ease-out ${i * 0.1}s both`,
                      }}
                    />
                  </div>
                </div>

                {/* Last Activity + Plan Button */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Last activity: {project.lastActivity}</span>
                  </div>
                  <Link href="/sprint/plan">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 group-hover:translate-x-0">
                      {project.planAction}
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* ---- Create New Project CTA ---- */}
          <div
            onClick={openPicker}
            className="group rounded-xl border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-3 min-h-[280px] transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
            style={{ animation: `cardSlideUp 0.4s ease-out ${projects.length * 0.08}s both` }}
          >
            <div
              className="w-14 h-14 rounded-2xl border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary/40 transition-colors"
            >
              <Plus className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Create New Project</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Connect Jira, Linear, or ClickUp</p>
            </div>
          </div>
        </div>

        {/* ---- Space / Folder Picker Modal ---- */}
        {pickerStep !== 'closed' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div ref={modalRef} className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  {pickerStep === 'folders' && (
                    <button onClick={() => { setPickerStep('spaces'); setFolders([]); setFolderlessLists([]); setSelectedSpace(null); }} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  {pickerStep === 'lists' && (
                    <button onClick={() => { setPickerStep('folders'); setSelectedFolder(null); setListsInFolder([]); }} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {pickerStep === 'spaces' && 'Select a ClickUp Space'}
                      {pickerStep === 'folders' && `Folders in ${selectedSpace?.space_name}`}
                      {pickerStep === 'lists' && `Lists in ${selectedFolder?.name}`}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {pickerStep === 'spaces' && 'Choose a space to import'}
                      {pickerStep === 'folders' && 'Pick a folder to see its lists'}
                      {pickerStep === 'lists' && 'Select a list to import'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setPickerStep('closed')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[360px] overflow-y-auto">
                {pickerStep === 'spaces' && (
                  spacesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  ) : spaces.length === 0 ? (
                    <div className="py-12 text-center px-5">
                      <FolderKanban className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No ClickUp spaces found. Connect ClickUp in Settings first.</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {spaces.map((space) => (
                        <button
                          key={space.space_id}
                          onClick={() => selectSpace(space)}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-secondary transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#7B68EE]/15 flex items-center justify-center shrink-0">
                            <FolderKanban className="w-4 h-4 text-[#7B68EE]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{space.space_name}</p>
                            <p className="text-[11px] text-muted-foreground">{space.team_name}</p>
                          </div>
                          {space.imported && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/20 shrink-0">Imported</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )
                )}

                {pickerStep === 'folders' && (
                  foldersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  ) : folders.length === 0 && folderlessLists.length === 0 ? (
                    <div className="py-12 text-center px-5">
                      <FolderKanban className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No folders or lists found in this space.</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {folders.map((folder) => {
                        const hasSprint = folder.has_sprint === true;
                        const listCount = folder.lists?.length ?? folder.list_ids?.length ?? 0;
                        return (
                          <button
                            key={folder.id}
                            disabled={listCount === 0}
                            onClick={() => selectFolder(folder)}
                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                              listCount > 0
                                ? 'hover:bg-secondary'
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <FolderKanban className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                              <p className="text-[11px] text-muted-foreground">{listCount} list{listCount !== 1 ? 's' : ''}</p>
                            </div>
                            {hasSprint && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/20 shrink-0">Sprint</span>
                            )}
                          </button>
                        );
                      })}

                      {folderlessLists.length > 0 && (
                        <>
                          <div className="px-5 pt-3 pb-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Folderless Lists</p>
                          </div>
                          {folderlessLists.map((list) => (
                            <button
                              key={list.id}
                              disabled={importing}
                              onClick={() => selectFolderlessList(list)}
                              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary"
                            >
                              <List className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{list.name}</p>
                              </div>
                              {list.has_sprint ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/20 shrink-0">Sprint</span>
                              ) : (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border shrink-0">List</span>
                              )}
                              {importing && (
                                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                              )}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )
                )}

                {pickerStep === 'lists' && (
                  listsInFolder.length === 0 ? (
                    <div className="py-12 text-center px-5">
                      <List className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No lists found in this folder.</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {listsInFolder.map((list) => (
                        <button
                          key={list.id}
                          disabled={importing}
                          onClick={() => selectList(list)}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary"
                        >
                          {list.has_sprint ? (
                            <CalendarRange className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <List className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{list.name}</p>
                          </div>
                          {list.has_sprint ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/20 shrink-0">Sprint</span>
                          ) : (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border shrink-0">List</span>
                          )}
                          {importing && (
                            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- Keyframes ---- */}
        <style>{`
          @keyframes iconFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes cardSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes barFillIn {
            from { width: 0%; }
          }
          @keyframes healthPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </Reveal>
  );
}
