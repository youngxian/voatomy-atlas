'use client';

import { useCallback, useEffect, useState } from 'react';
import { getProjectAccess, type ProjectRole } from '@/lib/api';

/** Permission matrix per plan: admin|manager|member|viewer */
const CAN_EDIT = new Set<ProjectRole>(['admin', 'manager', 'member']);
const CAN_MANAGE = new Set<ProjectRole>(['admin', 'manager']);
const CAN_ADMIN = new Set<ProjectRole>(['admin']);

export interface ProjectRoleState {
  role: ProjectRole | null;
  loading: boolean;
  error: string | null;
  canEdit: boolean;
  canManage: boolean;
  isAdmin: boolean;
  refetch: () => Promise<void>;
}

export function useProjectRole(projectId: string | null): ProjectRoleState {
  const [role, setRole] = useState<ProjectRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    if (!projectId) {
      setRole(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getProjectAccess(projectId);
      setRole(res.role);
    } catch (err) {
      setRole(null);
      setError(err instanceof Error ? err.message : 'Failed to load role');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const canEdit = role !== null && CAN_EDIT.has(role);
  const canManage = role !== null && CAN_MANAGE.has(role);
  const isAdmin = role !== null && CAN_ADMIN.has(role);

  return {
    role,
    loading,
    error,
    canEdit,
    canManage,
    isAdmin,
    refetch: fetchRole,
  };
}
