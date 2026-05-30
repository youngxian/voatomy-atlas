'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Trash2,
  UserPlus,
  Check,
  Shield,
  Eye,
  Edit3,
  Crown,
  Loader2,
  Clock,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { SectionHeader } from './SettingsFormControls';
import { InviteModal } from '@/components/team/InviteModal';
import {
  getTeamMembers,
  listInvitations,
  type TeamMember,
  type Invitation,
} from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { usePlan } from '@/lib/plan';

const ROLE_ICONS: Record<string, typeof Crown> = {
  admin: Crown,
  manager: Edit3,
  member: Edit3,
  viewer: Eye,
};

const ROLE_VARIANTS: Record<string, 'accent' | 'info' | 'muted'> = {
  admin: 'accent',
  manager: 'info',
  member: 'info',
  viewer: 'muted',
};

export function TeamTab() {
  const { activeProjectId } = useProject();
  const { limits, usage } = usePlan();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const seatLimit = limits?.maxMembers ?? 8;
  const usedSeats = usage?.membersUsed ?? 0;
  const totalUsed = usedSeats + invitations.length;
  const seatBadge = seatLimit > 0 ? `${totalUsed}/${seatLimit} seats` : `${totalUsed} members`;

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        activeProjectId ? getTeamMembers(activeProjectId) : Promise.resolve([]),
        listInvitations(),
      ]);
      setMembers(Array.isArray(membersRes) ? membersRes : []);
      setInvitations(Array.isArray(invitesRes) ? invitesRes : []);
    } catch {
      setMembers([]);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProjectId]);

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return '?';
  };

  const getRoleDisplay = (role: string) => {
    const r = (role || 'member').toLowerCase();
    return r === 'em' ? 'EM' : r === 'tl' ? 'TL' : r === 'ic' ? 'IC' : r.charAt(0).toUpperCase() + r.slice(1);
  };

  const mapRoleToPerms = (role: string): string[] => {
    const r = (role || 'member').toLowerCase();
    if (r === 'admin') return ['Full Access', 'Billing', 'Integrations'];
    if (r === 'manager') return ['Sprint Planning', 'Team management', 'Reports'];
    if (r === 'viewer') return ['View Only'];
    return ['Sprint Planning', 'Reports', 'Board'];
  };

  return (
    <div className="space-y-5">
      <Card className="bento-card rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={Users} title="Team Members" badge={seatBadge} />
          <Button size="sm" variant="primary" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-3.5 h-3.5" /> Invite
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !activeProjectId ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Select a project to view team members
          </div>
        ) : members.length === 0 && invitations.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <p className="mb-4">No team members yet</p>
            <Button size="sm" variant="primary" onClick={() => setInviteOpen(true)}>
              <UserPlus className="w-3.5 h-3.5" /> Invite team members
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  {['Member', 'Role', 'Permissions', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border/30 last:border-b-0 hover:bg-card transition-colors"
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-muted text-muted-foreground">
                          {getInitials('', inv.email)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{inv.email}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Pending
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <Badge variant={ROLE_VARIANTS[inv.role] ?? 'info'}>
                        {getRoleDisplay(inv.role)}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {mapRoleToPerms(inv.role).map((p) => (
                          <span
                            key={p}
                            className="text-[9px] font-medium bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <Badge variant="warning" dot>
                        Invited
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <span className="text-[10px] text-muted-foreground">—</span>
                    </td>
                  </tr>
                ))}
                {members.map((m) => {
                  const RoleIcon = ROLE_ICONS[m.role?.toLowerCase()] ?? Edit3;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-border/30 last:border-b-0 hover:bg-card transition-colors"
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: m.avatar_color || 'var(--primary)' }}
                          >
                            {m.initials || getInitials(m.name, m.email ?? '')}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <Badge variant={ROLE_VARIANTS[m.role?.toLowerCase()] ?? 'info'}>
                          <RoleIcon className="w-2.5 h-2.5" />
                          {getRoleDisplay(m.role)}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {mapRoleToPerms(m.role).map((p) => (
                            <span
                              key={p}
                              className="text-[9px] font-medium bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="text-[10px] text-muted-foreground">Active</span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Shield} title="Role Permissions" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {[
            {
              role: 'Admin',
              icon: Crown,
              colorClass: 'bg-primary/15 text-primary',
              desc: 'Full access including billing and team management',
              perms: [
                'Manage team',
                'Billing',
                'Delete project',
                'All integrations',
                'Security settings',
                'AI configuration',
              ],
            },
            {
              role: 'Member',
              icon: Edit3,
              colorClass: 'bg-warning/15 text-warning',
              desc: 'Can plan sprints, edit tickets, and manage integrations',
              perms: [
                'Edit sprints',
                'View reports',
                'Code review',
                'Connect tools',
                'Board management',
                'Move tickets',
              ],
            },
            {
              role: 'Viewer',
              icon: Eye,
              colorClass: 'bg-muted-foreground/15 text-muted-foreground',
              desc: 'Read-only access to dashboards and reports',
              perms: ['View dashboards', 'View reports', 'Export data', 'View board'],
            },
          ].map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.role}
                className="rounded-lg bg-card border border-border/60 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.colorClass.split(' ')[0]}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${r.colorClass.split(' ')[1]}`} />
                  </div>
                  <p className="text-sm font-bold text-foreground">{r.role}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                <div className="space-y-1">
                  {r.perms.map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-1.5 text-[10px] text-secondary-foreground"
                    >
                      <Check className="w-2.5 h-2.5 text-success" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        projectId={activeProjectId}
        onSuccess={loadData}
      />
    </div>
  );
}
