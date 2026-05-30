'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBoardColumns, type BoardColumn } from '@/lib/api';

const DEFAULT_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
  blocked: 'Blocked',
};

export function useBoardColumnLabels(projectId: string | undefined) {
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [statusToLabel, setStatusToLabel] = useState<Record<string, string>>(DEFAULT_LABELS);

  const fetchColumns = useCallback(async () => {
    if (!projectId) {
      setColumns([]);
      setStatusToLabel(DEFAULT_LABELS);
      return;
    }
    try {
      const res = await getBoardColumns(projectId);
      const cols = res.columns ?? [];
      setColumns(cols);

      const map: Record<string, string> = { ...DEFAULT_LABELS };
      for (const c of cols) {
        if (c.mapped_status && c.provider_name) {
          map[c.mapped_status] = c.provider_name;
        }
      }
      setStatusToLabel(map);
    } catch {
      setColumns([]);
      setStatusToLabel(DEFAULT_LABELS);
    }
  }, [projectId]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const getStatusLabel = (atlasStatus: string): string => {
    return statusToLabel[atlasStatus] ?? DEFAULT_LABELS[atlasStatus] ?? atlasStatus;
  };

  return { columns, statusToLabel, getStatusLabel };
}
