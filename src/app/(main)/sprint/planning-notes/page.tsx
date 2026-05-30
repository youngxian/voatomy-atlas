'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Clock,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Target,
  CalendarDays,
  User,
  AlertCircle,
  FileText,
  ListChecks,
  Scale,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MessageSquareWarning,
  Lightbulb,
  CircleDot,
  SkipForward,
  Timer,
  Shield,
  TrendingUp,
  Hash,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { Reveal } from '@/components/Reveal';
import { getSprintNotes, updateSprintNotes } from '@/lib/api';
import { useProject } from '@/lib/project-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgendaItem {
  id: number;
  title: string;
  duration: number;
  status: 'discussed' | 'deferred' | 'skipped';
  notes: string;
}

interface Decision {
  id: number;
  text: string;
  category: 'atlas' | 'capacity' | 'process' | 'risk';
  impact: 'high' | 'medium' | 'low';
}

interface TicketComparison {
  id: string;
  title: string;
  teamPts: number;
  atlasPts: number;
  finalPts: number;
  decision: 'Accepted' | 'Overridden';
}

interface ParkingItem {
  id: number;
  text: string;
  owner: string;
  ownerColor: string;
  dueDate: string;
}

interface PreviousSession {
  sprint: string;
  date: string;
  duration: number;
  ticketsPlanned: number;
  totalPoints: number;
  goalSummary: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const attendees = [
  { name: 'Alex Chen', role: 'EM', color: '#f16e2c' },
  { name: 'Sarah Kim', role: 'IC', color: '#8b5cf6' },
  { name: 'Jordan Lee', role: 'TL', color: '#06b6d4' },
  { name: 'Priya Patel', role: 'IC', color: '#10b981' },
  { name: 'Marcus Wright', role: 'IC', color: '#f59e0b' },
];

const agendaItems: AgendaItem[] = [
  {
    id: 1,
    title: 'Sprint 24 Review',
    duration: 10,
    status: 'discussed',
    notes: 'Key takeaways from retrospective. Team delivered 87% accuracy. Auth overhaul and payment flow carry-over identified. Action items from retro captured in tracker.',
  },
  {
    id: 2,
    title: 'ATLAS Recommendations Review',
    duration: 8,
    status: 'discussed',
    notes: 'Reviewed AI-suggested sprint composition. ATLAS recommended excluding 2 tickets due to high debt multiplier. Team discussed trade-offs and accepted majority of suggestions.',
  },
  {
    id: 3,
    title: 'Capacity Planning',
    duration: 5,
    status: 'discussed',
    notes: 'Sarah on PTO during Week 1. Jordan on-call rotation during Week 2. Adjusted capacity from 42 to 38 available points. Buffer accounted for.',
  },
  {
    id: 4,
    title: 'Ticket Grooming',
    duration: 15,
    status: 'discussed',
    notes: '9 tickets reviewed and estimated. 2 tickets excluded based on ATLAS debt analysis. All remaining tickets have acceptance criteria confirmed.',
  },
  {
    id: 5,
    title: 'Risk Discussion',
    duration: 5,
    status: 'discussed',
    notes: 'Payment module technical debt flagged as primary risk. Zendesk integration dependency noted as stale. Mitigation strategies defined for both.',
  },
  {
    id: 6,
    title: 'Revenue Impact Review',
    duration: 0,
    status: 'deferred',
    notes: 'Moved to stakeholder sync on Feb 19. Revenue data not yet finalized for Sprint 25 pipeline.',
  },
];

const decisions: Decision[] = [
  {
    id: 1,
    text: 'Accept ATLAS recommendation to exclude COMP-230 (payment gateway migration) due to 2.8x debt multiplier',
    category: 'atlas',
    impact: 'high',
  },
  {
    id: 2,
    text: 'Front-load Sarah\'s tickets to Week 1 before PTO starts',
    category: 'capacity',
    impact: 'medium',
  },
  {
    id: 3,
    text: 'Add 2-point buffer for COMP-217 (payment flow) given module complexity',
    category: 'risk',
    impact: 'high',
  },
  {
    id: 4,
    text: 'Schedule mid-sprint checkpoint on Feb 24 to assess pacing',
    category: 'process',
    impact: 'medium',
  },
];

const ticketComparisons: TicketComparison[] = [
  { id: 'COMP-217', title: 'Payment flow v2', teamPts: 8, atlasPts: 8, finalPts: 10, decision: 'Overridden' },
  { id: 'COMP-218', title: 'Auth token refresh fix', teamPts: 3, atlasPts: 3, finalPts: 3, decision: 'Accepted' },
  { id: 'COMP-219', title: 'User avatar upload', teamPts: 5, atlasPts: 3, finalPts: 3, decision: 'Accepted' },
  { id: 'COMP-220', title: 'Dashboard query caching', teamPts: 5, atlasPts: 5, finalPts: 5, decision: 'Accepted' },
  { id: 'COMP-221', title: 'Email notification system', teamPts: 5, atlasPts: 5, finalPts: 5, decision: 'Accepted' },
  { id: 'COMP-222', title: 'Mobile nav refactor', teamPts: 3, atlasPts: 2, finalPts: 3, decision: 'Overridden' },
  { id: 'COMP-223', title: 'Search autocomplete', teamPts: 5, atlasPts: 5, finalPts: 5, decision: 'Accepted' },
  { id: 'COMP-224', title: 'Customer escalation #1', teamPts: 2, atlasPts: 2, finalPts: 2, decision: 'Accepted' },
  { id: 'COMP-225', title: 'Customer escalation #2', teamPts: 3, atlasPts: 2, finalPts: 2, decision: 'Accepted' },
];

const parkingLot: ParkingItem[] = [
  {
    id: 1,
    text: 'Elasticsearch cluster provisioning ETA from infrastructure team',
    owner: 'Alex Chen',
    ownerColor: '#f16e2c',
    dueDate: 'Feb 19',
  },
  {
    id: 2,
    text: 'Sendgrid API key provisioning from DevOps',
    owner: 'Marcus Wright',
    ownerColor: '#f59e0b',
    dueDate: 'Feb 18',
  },
  {
    id: 3,
    text: 'DBA availability for index review on COMP-220',
    owner: 'Jordan Lee',
    ownerColor: '#06b6d4',
    dueDate: 'Feb 20',
  },
];

const previousSessions: PreviousSession[] = [
  {
    sprint: 'Sprint 24',
    date: 'Feb 3, 2025',
    duration: 50,
    ticketsPlanned: 11,
    totalPoints: 46,
    goalSummary: 'Complete auth overhaul, begin payment flow, resolve 3 customer escalations.',
  },
  {
    sprint: 'Sprint 23',
    date: 'Jan 20, 2025',
    duration: 40,
    ticketsPlanned: 9,
    totalPoints: 42,
    goalSummary: 'Ship billing module, mobile performance improvements, API rate limiting.',
  },
  {
    sprint: 'Sprint 22',
    date: 'Jan 6, 2025',
    duration: 55,
    ticketsPlanned: 13,
    totalPoints: 58,
    goalSummary: 'Dashboard v2 launch, incident response tooling, notification preferences.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const categoryConfig = {
  atlas: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', label: 'ATLAS', icon: Sparkles },
  capacity: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', label: 'Capacity', icon: Users },
  risk: { bg: 'bg-destructive/10', border: 'border-destructive/20', text: 'text-destructive', label: 'Risk', icon: Shield },
  process: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', label: 'Process', icon: ListChecks },
};

const impactConfig = {
  high: { bg: 'bg-destructive/15', text: 'text-destructive', border: 'border-destructive/20' },
  medium: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/20' },
  low: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

const statusIcons = {
  discussed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  deferred: { icon: SkipForward, color: 'text-warning', bg: 'bg-warning/10' },
  skipped: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SprintPlanningNotesPage() {
  const { activeProjectId, activeSprint: ctxSprint } = useProject();
  const [sprintNotes, setSprintNotes] = useState<string | null>(null);
  const [sprintName, setSprintName] = useState('Sprint 25');
  const [loading, setLoading] = useState(true);
  const [expandedAgenda, setExpandedAgenda] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: true,
    5: false,
    6: false,
  });
  const [expandedDecisions, setExpandedDecisions] = useState(true);
  const [expandedComparison, setExpandedComparison] = useState(true);
  const [expandedParking, setExpandedParking] = useState(true);

  useEffect(() => {
    if (!activeProjectId || !ctxSprint) { setLoading(false); return; }
    setSprintName(ctxSprint.name);
    getSprintNotes(activeProjectId, ctxSprint.id)
      .then(data => {
        if (data?.notes) setSprintNotes(data.notes);
      })
      .catch((err) => console.error('Failed to load planning notes', err))
      .finally(() => setLoading(false));
  }, [activeProjectId, ctxSprint?.id]);

  const toggleAgenda = (id: number) =>
    setExpandedAgenda((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalTeamPts = ticketComparisons.reduce((s, t) => s + t.teamPts, 0);
  const totalAtlasPts = ticketComparisons.reduce((s, t) => s + t.atlasPts, 0);
  const totalFinalPts = ticketComparisons.reduce((s, t) => s + t.finalPts, 0);
  const acceptedCount = ticketComparisons.filter((t) => t.decision === 'Accepted').length;
  const overriddenCount = ticketComparisons.filter((t) => t.decision === 'Overridden').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes planning-pulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary) 0%, transparent); }
          50% { box-shadow: 0 0 20px 6px color-mix(in srgb, var(--primary) 15%, transparent); }
        }
        @keyframes planning-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes planning-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes planning-scale-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes planning-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes planning-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes planning-border-pulse {
          0%, 100% { border-color: color-mix(in srgb, var(--primary) 15%, transparent); }
          50% { border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
        }
        @keyframes planning-bar-grow {
          from { width: 0; }
        }
        .planning-glass {
          background: hsl(var(--card));
        }
        .planning-shimmer-bg {
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 4%, transparent), transparent);
          background-size: 200% 100%;
          animation: planning-shimmer 4s linear infinite;
        }
      `}</style>

      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center"
              style={{ animation: 'planning-pulse 3s ease-in-out infinite' }}
            >
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sprint Planning Notes</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Meeting Minutes & Decisions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="orange">{sprintName}</Badge>
            <Button variant="secondary" size="md">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Meeting Details Card */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.05}>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ animation: 'planning-border-pulse 4s ease-in-out infinite' }}
        >
          <div className="planning-shimmer-bg px-6 py-4 border-b border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <h2 className="text-lg font-bold text-foreground">{sprintName} Planning Session</h2>
            </div>
          </div>

          <div className="bg-muted/30 p-6 space-y-5">
            {/* Meta row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Date</p>
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  Feb 17, 2025
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Duration</p>
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                  45 min
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Facilitator</p>
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Alex Chen
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Attendees</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {attendees.map((a) => (
                      <div
                        key={a.name}
                        className="w-6 h-6 rounded-full border-2 border-muted/30 flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: a.color }}
                        title={a.name}
                      >
                        {a.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">5 members</span>
                </div>
              </div>
            </div>

            {/* Sprint Goal */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Sprint Goal</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                Deliver payment flow, search autocomplete, and clear 2 high-priority customer escalations.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Agenda Items */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.1}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Agenda</h2>
            <span className="text-xs text-muted-foreground">
              {agendaItems.filter((a) => a.status === 'discussed').length} of {agendaItems.length} discussed
            </span>
          </div>

          <div className="space-y-2">
            {agendaItems.map((item, idx) => {
              const isOpen = expandedAgenda[item.id] ?? false;
              const statusCfg = statusIcons[item.status];
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                    item.status === 'deferred'
                      ? 'bg-muted/30 border-warning/20'
                      : 'bg-muted/30 border-border hover:border-border'
                  }`}
                  style={{
                    animation: `planning-slide-up 0.4s ease-out ${idx * 0.05}s both`,
                  }}
                >
                  <button
                    onClick={() => toggleAgenda(item.id)}
                    className="w-full text-left p-4 flex items-center gap-3"
                  >
                    {/* Number */}
                    <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">{item.id}</span>
                    </div>

                    {/* Status icon */}
                    <div className={`w-6 h-6 rounded-full ${statusCfg.bg} flex items-center justify-center shrink-0`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${statusCfg.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${item.status === 'deferred' ? 'text-warning/80' : 'text-foreground'}`}>
                          {item.title}
                        </span>
                        {item.status === 'deferred' && (
                          <Badge variant="warning">Deferred</Badge>
                        )}
                      </div>
                    </div>

                    {item.duration > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.duration} min
                      </span>
                    )}

                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="border-t border-border px-4 py-3 pl-[72px]"
                      style={{ animation: 'planning-fade-in 0.25s ease-out' }}
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Decisions Made */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.15}>
        <div className="space-y-4">
          <button
            onClick={() => setExpandedDecisions(!expandedDecisions)}
            className="flex items-center gap-2 group"
          >
            <Lightbulb className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Decisions Made</h2>
            <span className="text-xs text-muted-foreground">{decisions.length} decisions</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                expandedDecisions ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedDecisions && (
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-3"
              style={{ animation: 'planning-fade-in 0.3s ease-out' }}
            >
              {decisions.map((decision, idx) => {
                const cat = categoryConfig[decision.category];
                const imp = impactConfig[decision.impact];
                const CatIcon = cat.icon;

                return (
                  <div
                    key={decision.id}
                    className="planning-glass rounded-xl border border-border p-4 space-y-3 hover:border-border transition-colors"
                    style={{
                      animation: `planning-scale-in 0.4s ease-out ${idx * 0.08}s both`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cat.bg} border ${cat.border} flex items-center justify-center shrink-0 mt-0.5`}>
                        <CatIcon className={`w-4 h-4 ${cat.text}`} />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1">
                        {decision.text}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pl-11">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${cat.bg} ${cat.text} ${cat.border}`}>
                        {cat.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${imp.bg} ${imp.text} ${imp.border}`}>
                        {decision.impact.charAt(0).toUpperCase() + decision.impact.slice(1)} Impact
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* ATLAS vs Team Comparison */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.2}>
        <div className="space-y-4">
          <button
            onClick={() => setExpandedComparison(!expandedComparison)}
            className="flex items-center gap-2 group"
          >
            <Scale className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">ATLAS vs Team Estimates</h2>
            <span className="text-xs text-muted-foreground">
              {acceptedCount} accepted, {overriddenCount} overridden
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                expandedComparison ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedComparison && (
            <div style={{ animation: 'planning-fade-in 0.3s ease-out' }}>
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-muted/30 border border-border p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Team Total</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{totalTeamPts}<span className="text-xs text-muted-foreground"> pts</span></p>
                </div>
                <div className="rounded-xl bg-muted/30 border border-primary/20 p-4 text-center">
                  <p className="text-[10px] text-primary uppercase tracking-wider font-semibold mb-1">ATLAS Total</p>
                  <p className="text-xl font-bold text-primary tabular-nums">{totalAtlasPts}<span className="text-xs text-primary/60"> pts</span></p>
                </div>
                <div className="rounded-xl bg-muted/30 border border-success/20 p-4 text-center">
                  <p className="text-[10px] text-success uppercase tracking-wider font-semibold mb-1">Final Plan</p>
                  <p className="text-xl font-bold text-success tabular-nums">{totalFinalPts}<span className="text-xs text-success/60"> pts</span></p>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  <div className="col-span-4">Ticket</div>
                  <div className="col-span-2 text-center">Team</div>
                  <div className="col-span-2 text-center">ATLAS</div>
                  <div className="col-span-2 text-center">Final</div>
                  <div className="col-span-2 text-center">Decision</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-border/60 bg-muted/30">
                  {ticketComparisons.map((ticket, idx) => {
                    const delta = ticket.finalPts - ticket.atlasPts;

                    return (
                      <div
                        key={ticket.id}
                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/50 transition-colors"
                        style={{
                          animation: `planning-slide-up 0.3s ease-out ${idx * 0.04}s both`,
                        }}
                      >
                        <div className="col-span-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-primary">{ticket.id}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.title}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-bold text-foreground tabular-nums">{ticket.teamPts}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-bold text-primary tabular-nums">{ticket.atlasPts}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-bold text-success tabular-nums">{ticket.finalPts}</span>
                          {delta !== 0 && (
                            <span className={`ml-1 text-[10px] font-medium ${delta > 0 ? 'text-warning' : 'text-success'}`}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                              ticket.decision === 'Accepted'
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-warning/10 text-warning border-warning/20'
                            }`}
                          >
                            {ticket.decision === 'Accepted' ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            )}
                            {ticket.decision}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer totals */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 border-t border-border items-center">
                  <div className="col-span-4">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Totals</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-bold text-foreground tabular-nums">{totalTeamPts}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-bold text-primary tabular-nums">{totalAtlasPts}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-bold text-success tabular-nums">{totalFinalPts}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[10px] text-muted-foreground">
                      {acceptedCount}A / {overriddenCount}O
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual bar comparison */}
              <div className="mt-4 space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Point Allocation Comparison</p>
                <div className="space-y-2">
                  {ticketComparisons.map((ticket) => {
                    const maxPts = Math.max(ticket.teamPts, ticket.atlasPts, ticket.finalPts);
                    return (
                      <div key={ticket.id} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0 truncate">{ticket.id}</span>
                        <div className="flex-1 space-y-1">
                          {/* Team bar */}
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full bg-muted flex-1 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-white/30"
                                style={{
                                  width: `${(ticket.teamPts / 10) * 100}%`,
                                  animation: 'planning-bar-grow 0.6s ease-out',
                                }}
                              />
                            </div>
                          </div>
                          {/* ATLAS bar */}
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full bg-muted flex-1 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary/60"
                                style={{
                                  width: `${(ticket.atlasPts / 10) * 100}%`,
                                  animation: 'planning-bar-grow 0.6s ease-out 0.1s both',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full bg-white/30" /> Team
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full bg-primary/60" /> ATLAS
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Open Questions / Parking Lot */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.25}>
        <div className="space-y-4">
          <button
            onClick={() => setExpandedParking(!expandedParking)}
            className="flex items-center gap-2 group"
          >
            <MessageSquareWarning className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">Open Questions / Parking Lot</h2>
            <span className="text-xs text-muted-foreground">{parkingLot.length} items</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                expandedParking ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedParking && (
            <div
              className="space-y-2"
              style={{ animation: 'planning-fade-in 0.3s ease-out' }}
            >
              {parkingLot.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-muted/30 border border-warning/10 hover:border-warning/20 transition-colors p-4 flex items-start gap-3"
                  style={{
                    animation: `planning-slide-up 0.3s ease-out ${idx * 0.06}s both`,
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-warning" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                          style={{ backgroundColor: item.ownerColor }}
                        >
                          {item.owner.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.owner}</span>
                      </div>
                      <span className="text-xs text-muted-foreground/50">|</span>
                      <span className="text-xs text-muted-foreground">Follow up by {item.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------- */}
      {/* Previous Planning Sessions */}
      {/* ----------------------------------------------------------------- */}
      <Reveal delay={0.3}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Previous Planning Sessions</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {previousSessions.map((session, idx) => (
              <div
                key={session.sprint}
                className="planning-glass bento-card rounded-xl border border-border hover:border-border transition-all duration-300 p-5 space-y-3 cursor-pointer group"
                style={{
                  animation: `planning-scale-in 0.4s ease-out ${idx * 0.1}s both`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {session.sprint}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{session.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {session.goalSummary}
                </p>

                <div className="flex items-center gap-4 pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{session.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Hash className="w-3 h-3" />
                    <span>{session.ticketsPlanned} tickets</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>{session.totalPoints} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
