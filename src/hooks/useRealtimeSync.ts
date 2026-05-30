'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries';
import { useProject } from '@/lib/project-context';
import { config } from '@/lib/config';

interface SyncEvent {
  type: string;
  project_id: string;
  entity_id?: string;
  provider: string;
  timestamp: string;
}

const SSE_EVENT_TYPES = [
  'ticket_upserted',
  'ticket_deleted',
  'sprint_updated',
  'comment_added',
  'dependency_changed',
  'team_updated',
  'full_sync_completed',
] as const;

/**
 * Connects to the atlas SSE endpoint for the active project and
 * invalidates React Query caches when sync events arrive. Drop this
 * hook into the top-level layout/shell so every page benefits from
 * real-time updates without per-page wiring.
 */
export function useRealtimeSync() {
  const { activeProject } = useProject();
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const projectId = activeProject?.id;
    if (!projectId) return;

    const url = `${config.atlasApiBase}/v1/projects/${projectId}/events`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    const handleEvent = (e: MessageEvent) => {
      let event: SyncEvent;
      try {
        event = JSON.parse(e.data);
      } catch {
        return;
      }

      switch (event.type) {
        case 'ticket_upserted':
        case 'ticket_deleted':
          queryClient.invalidateQueries({ queryKey: queryKeys.tickets(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.currentSprint(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.dependencies(projectId) });
          break;

        case 'sprint_updated':
          queryClient.invalidateQueries({ queryKey: queryKeys.currentSprint(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.sprints(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.accuracyHistory(projectId) });
          break;

        case 'comment_added':
          queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
          break;

        case 'dependency_changed':
          queryClient.invalidateQueries({ queryKey: queryKeys.dependencies(projectId) });
          break;

        case 'team_updated':
          queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(projectId) });
          break;

        case 'full_sync_completed':
          queryClient.invalidateQueries({
            predicate: (q) =>
              Array.isArray(q.queryKey) && q.queryKey.includes(projectId),
          });
          break;
      }
    };

    for (const type of SSE_EVENT_TYPES) {
      es.addEventListener(type, handleEvent);
    }

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [activeProject?.id, queryClient]);
}
