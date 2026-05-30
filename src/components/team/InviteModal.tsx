'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, Badge, Button } from '@/components/ui';
import { SectionHeader } from '@/components/settings/SettingsFormControls';
import {
  Users,
  Mail,
  Loader2,
  Check,
  UserPlus,
  X,
} from 'lucide-react';
import {
  getDiscoverableMembers,
  getProjects,
  sendInvitations,
  type DiscoverableMember,
  type Project,
} from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { usePlan } from '@/lib/plan';
import { APIError } from '@/lib/api';

type Tab = 'board' | 'manual';
type Role = 'admin' | 'manager' | 'member' | 'viewer';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string | null;
  onSuccess?: () => void;
}

export function InviteModal({ open, onClose, projectId: propProjectId, onSuccess }: InviteModalProps) {
  const { projects, activeProjectId } = useProject();
  const { limits, usage } = usePlan();
  const projectId = propProjectId ?? activeProjectId;

  const [tab, setTab] = useState<Tab>('board');
  const [role, setRole] = useState<Role>('member');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [boardMembers, setBoardMembers] = useState<DiscoverableMember[]>([]);
  const [selectedBoardEmails, setSelectedBoardEmails] = useState<Set<string>>(new Set());
  const [manualEmails, setManualEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgProjects, setOrgProjects] = useState<Project[]>([]);

  const seatLimit = limits?.maxMembers ?? 8;
  const usedSeats = usage?.membersUsed ?? 0;
  const seatText = seatLimit > 0 ? `Using ${usedSeats} of ${seatLimit} seats` : 'Unlimited seats';

  useEffect(() => {
    if (open) {
      setError(null);
      setSelectedBoardEmails(new Set());
      setManualEmails('');
      setSelectedProjectIds(projectId ? [projectId] : []);
    }
  }, [open, projectId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await getProjects().catch(() => []);
        if (!cancelled) setOrgProjects(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setOrgProjects([]);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open || !projectId || tab !== 'board') return;
    let cancelled = false;
    setDiscoverLoading(true);
    getDiscoverableMembers(projectId)
      .then((members) => {
        if (!cancelled) setBoardMembers(members ?? []);
      })
      .catch(() => {
        if (!cancelled) setBoardMembers([]);
      })
      .finally(() => {
        if (!cancelled) setDiscoverLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, projectId, tab]);

  const toggleBoardMember = (email: string) => {
    setSelectedBoardEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const parseManualEmails = (): string[] => {
    return manualEmails
      .split(/[,\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  };

  const getInvitePayloads = (): { email: string; role: string; project_ids?: string[] }[] => {
    const projectIds = selectedProjectIds.length > 0 ? selectedProjectIds : (projectId ? [projectId] : []);
    if (tab === 'board') {
      return Array.from(selectedBoardEmails).map((email) => ({
        email,
        role,
        project_ids: projectIds,
      }));
    }
    return parseManualEmails().map((email) => ({
      email,
      role,
      project_ids: projectIds,
    }));
  };

  const handleSend = async () => {
    const payloads = getInvitePayloads();
    if (payloads.length === 0) {
      setError(tab === 'board' ? 'Select at least one member to invite' : 'Enter at least one valid email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendInvitations(
        payloads.map((p) => ({
          email: p.email,
          role: p.role,
          project_ids: p.project_ids,
        }))
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof APIError ? err.message : 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const payloads = getInvitePayloads();
  const canSend = payloads.length > 0 && !loading;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invite team members</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5">
          <div className="flex gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setTab('board')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'board' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" /> From Board
            </button>
            <button
              type="button"
              onClick={() => setTab('manual')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'manual' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-4 h-4" /> Manual Invite
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Projects</label>
            <div className="max-h-32 overflow-y-auto space-y-1.5 border border-border rounded-lg p-2">
              {orgProjects.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No projects found</p>
              ) : (
                orgProjects.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="rounded border-border"
                    />
                    <span className="text-sm truncate">{p.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {tab === 'board' ? (
            <div className="space-y-2">
              <SectionHeader icon={Users} title="Board members" />
              {!projectId ? (
                <p className="text-xs text-muted-foreground">Select a project to discover board members</p>
              ) : discoverLoading ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : boardMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No board members found or project has no integration</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {boardMembers.map((m) => (
                    <label
                      key={m.email}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${
                        selectedBoardEmails.has(m.email) ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
                      } ${m.already_member ? 'opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBoardEmails.has(m.email)}
                        onChange={() => !m.already_member && toggleBoardMember(m.email)}
                        disabled={m.already_member}
                        className="rounded border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.display_name || m.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                      {m.already_member && (
                        <Badge variant="muted" className="shrink-0">Member</Badge>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <SectionHeader icon={Mail} title="Email addresses" />
              <textarea
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground resize-none"
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">{seatText}</p>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSend} disabled={!canSend} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Send Invitations
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
