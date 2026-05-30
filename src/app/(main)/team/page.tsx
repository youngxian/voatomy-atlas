'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  Zap,
  Target,
  X,
  Check,
  Loader2,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import {
  getTeamOverview,
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  syncTeamMembers,
  APIError,
  type TeamMember,
  type TeamOverview,
  type AddTeamMemberInput,
  type UpdateTeamMemberInput,
  type RoleType,
} from '@/lib/api';
import { TeamIllustration } from '@/components/EmptyIllustrations';

const AVATAR_COLORS = [
  { bg: 'bg-emerald-500/12', ring: 'ring-emerald-500/25', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-500/12', ring: 'ring-violet-500/25', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  { bg: 'bg-sky-500/12', ring: 'ring-sky-500/25', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
  { bg: 'bg-amber-500/12', ring: 'ring-amber-500/25', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  { bg: 'bg-rose-500/12', ring: 'ring-rose-500/25', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
  { bg: 'bg-teal-500/12', ring: 'ring-teal-500/25', text: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
  { bg: 'bg-indigo-500/12', ring: 'ring-indigo-500/25', text: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500' },
  { bg: 'bg-cyan-500/12', ring: 'ring-cyan-500/25', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500' },
];

const ROLE_TYPE_LABELS: Record<RoleType, { label: string; color: string }> = {
  em: { label: 'Engineering Manager', color: 'bg-primary/10 text-primary border-primary/20' },
  tl: { label: 'Tech Lead', color: 'bg-info/10 text-info border-info/20' },
  ic: { label: 'IC', color: 'bg-success/10 text-success border-success/20' },
};

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function TeamEmptyState({ onAddMember, onSync, syncing }: { onAddMember: () => void; onSync: () => void; syncing: boolean }) {
  return (
    <Reveal>
      <div className="flex flex-col items-center text-center py-20 px-6">
        <TeamIllustration className="w-[240px] h-[180px] mb-8" />
        <h2 className="text-2xl sm:text-[28px] font-bold text-foreground mb-2 tracking-tight">
          Build your team
        </h2>
        <p className="text-[15px] text-muted-foreground max-w-md mb-10 leading-relaxed">
          Add team members to track capacity, velocity, and workload. ATLAS uses team data to generate smarter sprint plans.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={onAddMember}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.75} />
            Add First Member
          </button>
          <button
            onClick={onSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-card text-foreground text-[14px] font-medium border border-border/60 hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            Sync from Board
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {[
            { icon: Target, label: 'Velocity Tracking', desc: 'Per-member throughput', iconBg: 'bg-emerald-500/12', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { icon: Zap, label: 'Capacity Planning', desc: 'Allocate sprint points', iconBg: 'bg-sky-500/12', iconColor: 'text-sky-600 dark:text-sky-400' },
            { icon: Activity, label: 'Load Balancing', desc: 'Prevent burnout', iconBg: 'bg-violet-500/12', iconColor: 'text-violet-600 dark:text-violet-400' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border/40 hover:border-border/60 hover:shadow-md transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={1.75} />
              </div>
              <span className="text-[13px] font-semibold text-foreground">{item.label}</span>
              <span className="text-[12px] text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Modal
// ---------------------------------------------------------------------------

function MemberModal({
  open,
  member,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onSave: (data: AddTeamMemberInput | UpdateTeamMemberInput) => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [roleType, setRoleType] = useState<RoleType>('ic');
  const [velocity, setVelocity] = useState('10');
  const [availability, setAvailability] = useState('100');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email ?? '');
      setRole(member.role);
      setRoleType(member.role_type);
      setVelocity(String(member.base_velocity));
      setAvailability(String(member.availability));
      setSkills(member.skills?.join(', ') ?? '');
    } else {
      setName('');
      setEmail('');
      setRole('');
      setRoleType('ic');
      setVelocity('10');
      setAvailability('100');
      setSkills('');
    }
  }, [member, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data: AddTeamMemberInput = {
      name: name.trim(),
      initials: getInitials(name.trim()),
      email: email.trim() || undefined,
      role: role.trim() || undefined,
      role_type: roleType,
      base_velocity: Number(velocity) || 10,
      availability: Number(availability) || 100,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
          <h3 className="text-lg font-semibold text-foreground">{member ? 'Edit Member' : 'Add Team Member'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-2">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all"
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-2">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all"
                placeholder="jane@company.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-2">Role Title</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all"
                placeholder="Frontend Engineer"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-2">Role Type</label>
              <div className="flex gap-2">
                {(['ic', 'tl', 'em'] as RoleType[]).map((rt) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setRoleType(rt)}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-[12px] font-medium border transition-all ${
                      roleType === rt
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-muted/50 border-border/60 text-muted-foreground hover:border-border'
                    }`}
                  >
                    {rt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-2">Base Velocity (pts/sprint)</label>
              <input
                value={velocity}
                onChange={(e) => setVelocity(e.target.value)}
                type="number"
                min="0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-2">Availability (%)</label>
              <input
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                type="number"
                min="0"
                max="100"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted-foreground mb-2">Skills (comma-separated)</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all"
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} /> : <Check className="w-4 h-4" strokeWidth={1.75} />}
              {member ? 'Update' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member Card
// ---------------------------------------------------------------------------

function MemberCard({
  member,
  index,
  onEdit,
  onRemove,
  readOnly,
}: {
  member: TeamMember;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
  readOnly?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const palette = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const effectiveCapacity = Math.round(member.base_velocity * (member.availability / 100));
  const capacityPct = member.base_velocity > 0
    ? Math.min(100, Math.round((effectiveCapacity / member.base_velocity) * 100))
    : 0;

  // Status reflects capacity allocation (availability %), not presence
  const capacityStatus = member.availability >= 80 ? 'high' : member.availability >= 40 ? 'medium' : 'low';
  const statusColor = capacityStatus === 'high' ? 'bg-[#22C55E]' : capacityStatus === 'medium' ? 'bg-[#F59E0B]' : 'bg-muted-foreground/40';
  const barColor = capacityPct >= 80 ? 'bg-primary' : capacityPct >= 50 ? 'bg-primary/70' : 'bg-primary/40';
  const capacityLabel = `${member.availability}% capacity`;

  return (
    <div className="group relative rounded-2xl bg-card border border-border/40 hover:border-border/70 hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Three-dot menu */}
      {!readOnly && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-muted/80 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-card rounded-xl border border-border/60 shadow-xl z-20 py-1 overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} /> Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onRemove(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Remove
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
        {/* Avatar with capacity indicator */}
        <div className="relative mb-5">
          <div className={`w-[84px] h-[84px] rounded-full ring-[3px] ${palette.ring} flex items-center justify-center ${palette.bg}`}>
            <span className={`text-[22px] font-bold ${palette.text} select-none`}>
              {member.initials || getInitials(member.name)}
            </span>
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${statusColor} ring-2 ring-card shrink-0`}
            title={capacityLabel}
            aria-label={capacityLabel}
          />
        </div>

        {/* Name */}
        <h3 className="text-[15px] font-semibold text-foreground leading-tight mb-1 max-w-full truncate px-2">
          {member.name}
        </h3>

        {/* Email / Role subtitle */}
        <p className="text-[12px] text-muted-foreground leading-snug mb-5 max-w-full truncate px-2">
          {member.email || member.role || '—'}
        </p>

        {/* Capacity bar */}
        <div className="w-full flex items-center gap-3 mb-5 px-2" title={capacityLabel}>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor}`} aria-hidden />
          <div className="flex-1 flex gap-[3px] h-[6px]">
            {Array.from({ length: 5 }).map((_, i) => {
              const segmentThreshold = (i + 1) * 20;
              const filled = capacityPct >= segmentThreshold;
              const partial = !filled && capacityPct > segmentThreshold - 20;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-300 ${
                    filled ? barColor : partial ? 'bg-primary/25' : 'bg-border/40'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-[12px] font-semibold text-foreground tabular-nums shrink-0 w-9 text-right">
            {capacityPct}%
          </span>
        </div>

        {/* Skills (compact) */}
        {member.skills && member.skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-1 px-1">
            {member.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="text-[11px] px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground font-medium">
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted/40 text-muted-foreground/70 font-medium">
                +{member.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer — Role */}
      <div className="border-t border-border/30 px-6 py-3.5 bg-muted/20">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
          {member.role || (ROLE_TYPE_LABELS[member.role_type]?.label ?? 'Team Member')}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TeamPage() {
  const { activeProjectId, loading: ctxLoading } = useProject();
  const { isDemo } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<RoleType | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!activeProjectId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [ov, mems] = await Promise.all([
        getTeamOverview(activeProjectId).catch(() => null),
        getTeamMembers(activeProjectId).catch(() => []),
      ]);
      setOverview(ov);
      setMembers(Array.isArray(mems) ? mems : []);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (!ctxLoading) fetchTeam();
  }, [ctxLoading, fetchTeam]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.type === 'error' ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSync = async () => {
    if (!activeProjectId || isDemo) return;
    setSyncing(true);
    setToast(null);
    try {
      await syncTeamMembers(activeProjectId);
      await fetchTeam();
      setToast({ type: 'success', message: 'Team members synced successfully' });
    } catch (err: unknown) {
      const msg = err instanceof APIError ? err.message : (err instanceof Error ? err.message : 'Failed to sync team members');
      setToast({ type: 'error', message: msg });
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async (data: AddTeamMemberInput | UpdateTeamMemberInput) => {
    if (!activeProjectId || isDemo) return;
    setSaving(true);
    setToast(null);
    try {
      if (editingMember) {
        const update: UpdateTeamMemberInput = {
          name: data.name,
          initials: data.initials,
          email: data.email,
          role: data.role,
          role_type: data.role_type,
          base_velocity: data.base_velocity,
          availability: data.availability,
          skills: data.skills,
        };
        await updateTeamMember(activeProjectId, editingMember.id, update);
      } else {
        await addTeamMember(activeProjectId, data as AddTeamMemberInput);
      }
      setModalOpen(false);
      setEditingMember(null);
      await fetchTeam();
      setToast({ type: 'success', message: editingMember ? 'Member updated' : 'Member added' });
    } catch (err: unknown) {
      const msg = err instanceof APIError ? err.message : (err instanceof Error ? err.message : (editingMember ? 'Failed to update member' : 'Failed to add member'));
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!activeProjectId || isDemo) return;
    setToast(null);
    try {
      await removeTeamMember(activeProjectId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setToast({ type: 'success', message: 'Member removed' });
    } catch (err: unknown) {
      const msg = err instanceof APIError ? err.message : (err instanceof Error ? err.message : 'Failed to remove member');
      setToast({ type: 'error', message: msg });
    }
  };

  const filtered = members.filter((m) => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || m.role_type === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalCapacity = members.reduce((sum, m) => sum + Math.round(m.base_velocity * (m.availability / 100)), 0);
  const avgVelocity = members.length ? Math.round(members.reduce((s, m) => s + m.base_velocity, 0) / members.length) : 0;

  // No project
  if (!ctxLoading && !activeProjectId) {
    return (
      <div className="flex flex-col items-center text-center py-24 px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-6">
          <Users className="w-8 h-8 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No project selected</h2>
        <p className="text-[15px] text-muted-foreground mb-8 max-w-sm">Select or create a project to manage your team.</p>
        <Link href="/projects" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 transition-colors">
          Go to Projects <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-7 w-24 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-muted rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[68px] bg-muted/60 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/40 animate-pulse overflow-hidden">
              <div className="flex flex-col items-center pt-7 pb-5 px-5">
                <div className="w-[88px] h-[88px] rounded-full bg-muted mb-4" />
                <div className="h-4 w-32 bg-muted rounded mb-1.5" />
                <div className="h-3 w-40 bg-muted rounded mb-5" />
                <div className="w-full flex items-center gap-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <div className="flex-1 flex gap-[3px] h-[6px]">
                    {[0, 1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex-1 rounded-full bg-muted" />
                    ))}
                  </div>
                  <div className="w-9 h-3.5 bg-muted rounded" />
                </div>
              </div>
              <div className="border-t border-border/30 px-5 py-3 flex justify-center">
                <div className="h-2.5 w-28 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty
  if (members.length === 0) {
    return (
      <>
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-card border-border text-foreground'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
            <button type="button" onClick={() => setToast(null)} className="ml-2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <TeamEmptyState
          onAddMember={() => { setEditingMember(null); setModalOpen(true); }}
          onSync={handleSync}
          syncing={syncing}
        />
        <MemberModal
          open={modalOpen}
          member={null}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          saving={saving}
        />
      </>
    );
  }

  const statConfig = [
    { label: 'Members', value: String(members.length), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Capacity', value: `${totalCapacity} pts`, icon: Target, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Avg Velocity', value: `${avgVelocity} pts`, icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Avg Accuracy', value: overview?.avg_accuracy ? `${Math.round(overview.avg_accuracy)}%` : '—', icon: Shield, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-card border-border text-foreground'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
          <button type="button" onClick={() => setToast(null)} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-foreground tracking-tight">Team</h1>
          <p className="text-[15px] text-muted-foreground mt-1">{members.length} member{members.length !== 1 ? 's' : ''} · {totalCapacity} pts total capacity</p>
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/60 text-[13px] font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                Sync
              </button>
              <button
                onClick={() => { setEditingMember(null); setModalOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                Add Member
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-card border border-border/40 p-5 flex items-center gap-4 hover:border-border/60 transition-colors">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${stat.color}`} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums truncate">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/60 text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'ic', 'tl', 'em'] as const).map((rt) => (
            <button
              key={rt}
              onClick={() => setFilterRole(rt)}
              className={`px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
                filterRole === rt
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30'
              }`}
            >
              {rt === 'all' ? 'All' : rt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((member, idx) => (
          <MemberCard
            key={member.id}
            member={member}
            index={idx}
            onEdit={() => { setEditingMember(member); setModalOpen(true); }}
            onRemove={() => handleRemove(member.id)}
            readOnly={isDemo}
          />
        ))}
      </div>

      {filtered.length === 0 && members.length > 0 && (
        <div className="flex flex-col items-center text-center py-16 px-6 rounded-2xl bg-card border border-border/40">
          <Search className="w-8 h-8 text-muted-foreground/60 mb-4" strokeWidth={1.5} />
          <p className="text-[15px] font-medium text-foreground mb-1">No members match your search</p>
          <p className="text-[13px] text-muted-foreground">Try a different query or clear filters</p>
        </div>
      )}

      <MemberModal
        open={modalOpen}
        member={editingMember}
        onClose={() => { setModalOpen(false); setEditingMember(null); }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
