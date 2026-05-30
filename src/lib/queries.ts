'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getMe,
  getProjects,
  getCurrentSprint,
  getSprints,
  getAccuracyHistory,
  getTeamMembers,
  getTickets,
  getDependencies,
  getClickUpSpaceDetails,
  type MeResponse,
  type Project,
  type Sprint,
  type SprintDetail,
  type AccuracyHistory,
  type TeamMember,
  type Ticket,
  type Dependency,
  type ClickUpSpaceDetails,
} from './api';

// ── Query keys (centralized for cache invalidation) ──

export const queryKeys = {
  me: ['me'] as const,
  projects: ['projects'] as const,
  currentSprint: (projectId: string) => ['sprint', 'current', projectId] as const,
  sprints: (projectId: string) => ['sprints', projectId] as const,
  accuracyHistory: (projectId: string) => ['accuracy', 'history', projectId] as const,
  teamMembers: (projectId: string) => ['team', 'members', projectId] as const,
  tickets: (projectId: string, filters?: Record<string, string>) =>
    ['tickets', projectId, filters ?? {}] as const,
  dependencies: (projectId: string) => ['dependencies', projectId] as const,
  clickUpSpaceDetails: (spaceId: string) =>
    ['clickup', 'space', spaceId] as const,
};

// ── Hooks ──

export function useMe() {
  return useQuery<MeResponse>({
    queryKey: queryKeys.me,
    queryFn: getMe,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: queryKeys.projects,
    queryFn: () => getProjects().then((p) => (Array.isArray(p) ? p : [])),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentSprint(projectId: string | null | undefined) {
  return useQuery<SprintDetail | null>({
    queryKey: queryKeys.currentSprint(projectId!),
    queryFn: () => getCurrentSprint(projectId!).catch(() => null),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTeamMembers(projectId: string | null | undefined) {
  return useQuery<TeamMember[]>({
    queryKey: queryKeys.teamMembers(projectId!),
    queryFn: () => getTeamMembers(projectId!).then((m) => m ?? []),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTickets(
  projectId: string | null | undefined,
  filters?: { status?: string; sprint?: string }
) {
  return useQuery<Ticket[]>({
    queryKey: queryKeys.tickets(projectId!, filters as Record<string, string>),
    queryFn: () => getTickets(projectId!, filters).then((t) => t ?? []),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDependencies(projectId: string | null | undefined) {
  return useQuery<Dependency[]>({
    queryKey: queryKeys.dependencies(projectId!),
    queryFn: () => getDependencies(projectId!).then((d) => d ?? []),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useClickUpSpaceDetails(spaceId: string | null | undefined) {
  return useQuery<ClickUpSpaceDetails>({
    queryKey: queryKeys.clickUpSpaceDetails(spaceId!),
    queryFn: () => getClickUpSpaceDetails(spaceId!),
    enabled: !!spaceId,
    staleTime: 3 * 60 * 1000,
  });
}

export function useSprints(projectId: string | null | undefined) {
  return useQuery<Sprint[]>({
    queryKey: queryKeys.sprints(projectId!),
    queryFn: () => getSprints(projectId!).then((s) => Array.isArray(s) ? s : []),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAccuracyHistory(projectId: string | null | undefined) {
  return useQuery<AccuracyHistory>({
    queryKey: queryKeys.accuracyHistory(projectId!),
    queryFn: () => getAccuracyHistory(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
