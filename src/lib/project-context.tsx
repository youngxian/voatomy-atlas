'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { getProjects, getProject, getClickUpSpaces, importClickUpSpaces, getProviderWorkspaces, importProviderBoard, getCurrentSprint, getSprint, getSprints, type Project, type Sprint, type SprintDetail, type BoardStructure } from './api';
import { detectBoardStructure } from './board-utils';

export interface SwitchProjectResult {
  sprints: Sprint[];
  boardStructure: BoardStructure | null;
  project: Project;
}

interface ProjectContextValue {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  loading: boolean;
  setActiveProject: (id: string) => void;
  setDefaultProject: (id: string | null) => void;
  defaultProjectId: string | null;
  refreshProjects: () => Promise<void>;
  activeSprint: SprintDetail | null;
  sprintLoading: boolean;
  setActiveSprint: (sprint: SprintDetail | null) => void;
  refreshSprint: () => Promise<SprintDetail | null>;
  switchProject: (id: string) => Promise<SwitchProjectResult>;
  boardStructure: BoardStructure | null;
  refreshBoardStructure: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
}

const LS_ACTIVE = 'atlas_active_project';
const LS_DEFAULT = 'atlas_default_project';

function sprintStorageKey(projectId: string) {
  return `atlas_active_sprint_${projectId}`;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LS_DEFAULT) || localStorage.getItem(LS_ACTIVE);
  });
  const [defaultProjectId, setDefaultProjectIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LS_DEFAULT);
  });
  const [loading, setLoading] = useState(true);
  const [activeSprint, setActiveSprintState] = useState<SprintDetail | null>(null);
  const [sprintLoading, setSprintLoading] = useState(false);
  const [boardStructure, setBoardStructure] = useState<BoardStructure | null>(null);
  const skipAutoFetchRef = useRef(false);

  const loadProjects = useCallback(async () => {
    try {
      let list = await getProjects().catch(() => [] as Project[]);
      if (!Array.isArray(list)) list = [];

      if (list.length === 0) {
        try {
          const spaces = await getClickUpSpaces();
          const unimported = spaces.filter((s) => !s.imported);
          if (unimported.length > 0) {
            const result = await importClickUpSpaces(unimported.map((s) => s.space_id), unimported[0]?.team_id);
            if (result.created?.length > 0) {
              list = await getProjects().catch(() => []);
              if (!Array.isArray(list)) list = [];
            }
          }
        } catch {
          // ClickUp not connected — try other providers
          try {
            const providers = ['jira', 'linear', 'asana', 'monday', 'github_projects', 'azuredevops', 'shortcut'];
            for (const prov of providers) {
              const workspaces = await getProviderWorkspaces(prov).catch(() => []);
              if (workspaces.length > 0) break;
            }
          } catch {
            // No provider connected
          }
        }
      }

      setProjects(list);

      if (list.length > 0) {
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const projectParam = searchParams?.get('project');
        const fromOnboarding = searchParams?.get('from') === 'onboarding';
        const fromInvite = searchParams?.get('from') === 'invite';
        let chosen: Project;

        const projectMatch = projectParam ? list.find((p) => p.id === projectParam) : null;
        if (projectMatch) {
          chosen = projectMatch;
          if (fromOnboarding || fromInvite) {
            localStorage.setItem(LS_DEFAULT, chosen.id);
            setDefaultProjectIdState(chosen.id);
          }
          if (typeof window !== 'undefined' && (fromOnboarding || fromInvite)) {
            const url = new URL(window.location.href);
            url.searchParams.delete('from');
            url.searchParams.delete('project');
            window.history.replaceState({}, '', url.toString());
          }
        } else if (fromOnboarding) {
          chosen = list[0];
          localStorage.setItem(LS_DEFAULT, chosen.id);
          setDefaultProjectIdState(chosen.id);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('from');
            window.history.replaceState({}, '', url.toString());
          }
        } else {
          const defId = localStorage.getItem(LS_DEFAULT);
          const storedId = localStorage.getItem(LS_ACTIVE);
          const preferred = defId || storedId;
          const match = preferred ? list.find((p) => p.id === preferred) : null;
          chosen = match || list[0];
        }

        setActiveProjectId(chosen.id);
        localStorage.setItem(LS_ACTIVE, chosen.id);
      } else {
        setActiveProjectId(null);
        localStorage.removeItem(LS_ACTIVE);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const fetchSprint = useCallback(async (): Promise<SprintDetail | null> => {
    if (!activeProjectId) {
      setActiveSprintState(null);
      return null;
    }
    setSprintLoading(true);
    const key = sprintStorageKey(activeProjectId);
    try {
      const storedId = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      let sprint: SprintDetail | null = null;
      if (storedId) {
        try {
          sprint = await getSprint(activeProjectId, storedId);
        } catch {
          sprint = null;
        }
      }
      if (!sprint) {
        sprint = await getCurrentSprint(activeProjectId);
      }
      setActiveSprintState(sprint);
      if (sprint) localStorage.setItem(key, sprint.id);
      else localStorage.removeItem(key);
      return sprint;
    } catch {
      setActiveSprintState(null);
      localStorage.removeItem(key);
      return null;
    } finally {
      setSprintLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (skipAutoFetchRef.current) {
      skipAutoFetchRef.current = false;
      return;
    }
    fetchSprint();
  }, [fetchSprint]);

  const setActiveProject = useCallback((id: string) => {
    setActiveProjectId(id);
    localStorage.setItem(LS_ACTIVE, id);
  }, []);

  const setActiveSprint = useCallback((sprint: SprintDetail | null) => {
    setActiveSprintState(sprint);
    if (activeProjectId && typeof window !== 'undefined') {
      const key = sprintStorageKey(activeProjectId);
      if (sprint) {
        localStorage.setItem(key, sprint.id);
      } else {
        localStorage.removeItem(key);
      }
    }
  }, [activeProjectId]);

  const setDefaultProject = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(LS_DEFAULT, id);
    } else {
      localStorage.removeItem(LS_DEFAULT);
    }
    setDefaultProjectIdState(id);
  }, []);

  const refreshBoardStructure = useCallback(async () => {
    if (!activeProjectId) {
      setBoardStructure(null);
      return;
    }
    try {
      const project = await getProject(activeProjectId);
      const structure = await detectBoardStructure(project);
      setBoardStructure(structure);
    } catch {
      setBoardStructure(null);
    }
  }, [activeProjectId]);

  const switchProject = useCallback(async (id: string): Promise<SwitchProjectResult> => {
    skipAutoFetchRef.current = true;
    setActiveProjectId(id);
    localStorage.setItem(LS_ACTIVE, id);

    const project = projects.find((p) => p.id === id)!;

    const [sprints, structure] = await Promise.all([
      getSprints(id).catch(() => [] as Sprint[]),
      detectBoardStructure(project).catch(() => null),
    ]);

    setBoardStructure(structure);
    return { sprints, boardStructure: structure, project };
  }, [projects]);

  useEffect(() => {
    if (!activeProjectId) {
      setBoardStructure(null);
      return;
    }
    refreshBoardStructure();
  }, [activeProjectId, refreshBoardStructure]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProjectId,
      activeProject,
      loading,
      setActiveProject,
      setDefaultProject,
      defaultProjectId,
      refreshProjects: loadProjects,
      activeSprint,
      sprintLoading,
      setActiveSprint,
      refreshSprint: fetchSprint,
      switchProject,
      boardStructure,
      refreshBoardStructure,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
