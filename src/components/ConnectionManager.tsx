'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import {
  Plus,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Plug,
  Clock,
  AlertTriangle,
  Check,
} from 'lucide-react';
import {
  getProjectConnections,
  removeProjectConnection,
  updateProjectConnection,
  syncConnection,
  type ProviderConnection,
} from '@/lib/api';
import { getProviderLabelByKey, getProviderColorByKey } from '@/lib/project-utils';

interface ConnectionManagerProps {
  projectId: string;
  onAddConnection?: () => void;
  readOnly?: boolean;
}

function formatSyncTime(iso?: string): string {
  if (!iso) return 'Never';
  const ago = Date.now() - new Date(iso).getTime();
  if (ago < 60_000) return 'Just now';
  if (ago < 3_600_000) return `${Math.round(ago / 60_000)}m ago`;
  if (ago < 86_400_000) return `${Math.round(ago / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ConnectionManager({ projectId, onAddConnection, readOnly }: ConnectionManagerProps) {
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const conns = await getProjectConnections(projectId);
      setConnections(conns);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const handleSync = async (connId: string) => {
    setSyncingId(connId);
    try {
      await syncConnection(projectId, connId);
      await fetchConnections();
    } catch {
      // ignore
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggle = async (conn: ProviderConnection) => {
    setTogglingId(conn.id);
    try {
      await updateProjectConnection(projectId, conn.id, { sync_enabled: !conn.sync_enabled });
      await fetchConnections();
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  const handleRemove = async (connId: string) => {
    setRemovingId(connId);
    try {
      await removeProjectConnection(projectId, connId);
      setConnections((prev) => prev.filter((c) => c.id !== connId));
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
      setConfirmRemoveId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Provider Connections</h3>
          <span className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-secondary border border-border">
            {connections.length}
          </span>
        </div>
        {!readOnly && onAddConnection && (
          <button
            onClick={onAddConnection}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Connection
          </button>
        )}
      </div>

      {connections.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-secondary/30 py-8 text-center">
          <Plug className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No provider connections yet.</p>
          {!readOnly && onAddConnection && (
            <button
              onClick={onAddConnection}
              className="mt-3 text-xs text-primary hover:underline font-medium"
            >
              Connect a provider
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => {
            const label = getProviderLabelByKey(conn.provider);
            const color = getProviderColorByKey(conn.provider);
            const isSyncing = syncingId === conn.id;
            const isToggling = togglingId === conn.id;
            const isRemoving = removingId === conn.id;

            return (
              <div
                key={conn.id}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                  conn.sync_enabled
                    ? 'bg-card border-border/60'
                    : 'bg-secondary/40 border-border/40 opacity-70',
                )}
              >
                <span className={clsx('text-[9px] font-bold text-white px-1.5 py-0.5 rounded shrink-0', color)}>
                  {label}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conn.external_project_id}
                    {conn.external_board_id && (
                      <span className="text-muted-foreground"> / {conn.external_board_id}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    Synced {formatSyncTime(conn.last_synced_at)}
                    {!conn.sync_enabled && (
                      <>
                        <span className="w-px h-2.5 bg-border" />
                        <span className="flex items-center gap-1 text-warning">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Disabled
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(conn)}
                      disabled={isToggling}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      title={conn.sync_enabled ? 'Disable sync' : 'Enable sync'}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : conn.sync_enabled ? (
                        <ToggleRight className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleSync(conn.id)}
                      disabled={isSyncing || !conn.sync_enabled}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
                      title="Trigger sync"
                    >
                      <RefreshCw className={clsx('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                    </button>

                    {confirmRemoveId === conn.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemove(conn.id)}
                          disabled={isRemoving}
                          className="px-2 py-1 rounded text-[10px] font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="px-1.5 py-1 rounded text-[10px] text-muted-foreground hover:bg-secondary transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(conn.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        title="Remove connection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {conn.sync_enabled && (
                  <span className="w-2 h-2 rounded-full bg-success shrink-0" title="Active" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
