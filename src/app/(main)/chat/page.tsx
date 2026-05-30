'use client';

import { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Gauge,
  GitBranch,
  Hexagon,
  Kanban,
  Layers,
  MessageSquare,
  Mic,
  Paperclip,
  Radio,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  Activity,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { usePlan } from '@/lib/plan';
import SectionGate from '@/components/SectionGate';
import LimitWall from '@/components/LimitWall';
import { getChatHistory, sendChatMessage, getMe, type ChatMessage as APIChatMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { normalizeProfileDisplay, getCanonicalEmail, getNameFromBoardByEmail } from '@/lib/utils';
import { useProject } from '@/lib/project-context';
import { useTeamMembers } from '@/lib/queries';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  richContent?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Rich Response Components (kept for demo / reference messages)
// ---------------------------------------------------------------------------
function RiskAssessmentResponse() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/90 leading-relaxed">
        Based on my analysis of <span className="text-primary font-semibold">6 signal sources</span>, here&apos;s the Sprint 25 risk assessment:
      </p>
      <div className="rounded-xl bg-muted border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Overall Risk</span>
          <Badge variant="warning">Medium-High</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-warning" style={{ width: '62%', animation: 'barFill 1.2s ease-out forwards' }} />
          </div>
          <span className="text-lg font-bold text-warning tabular-nums">6.2<span className="text-xs text-muted-foreground font-normal">/10</span></span>
        </div>
      </div>
      <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-destructive">Critical Risks</span>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90 leading-relaxed">
            <span className="font-mono text-xs text-destructive/90 bg-destructive/10 px-1.5 py-0.5 rounded">COMP-217</span> (Stripe payment flow) has only{' '}
            <span className="text-destructive font-semibold">62% confidence</span> due to payments/ module debt (2.8x multiplier).
            This ticket blocks <span className="text-primary font-semibold">$120K</span> in pipeline revenue.
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-warning/5 border border-warning/15 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-warning shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-warning">Moderate Risks</span>
        </div>
        <div className="space-y-2.5">
          {[
            "Sarah Kim's PTO in Week 1 reduces capacity by 8 points",
            'Jordan Lee on-call Week 2 (-4 points effective capacity)',
            'Zendesk integration stale for 3 days (customer signal degraded)',
          ].map((risk, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-warning/60 shrink-0 mt-1.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">{risk}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-success/5 border border-success/15 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-success">Mitigated</span>
        </div>
        <div className="space-y-2.5">
          {[
            'Sprint buffer of 3 points built into plan',
            'COMP-230 excluded from sprint (debt risk too high)',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Recommendation</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">
          Front-load high-risk tickets and schedule a mid-sprint checkpoint on <span className="text-foreground font-semibold">Feb 24</span>.
        </p>
      </div>
    </div>
  );
}

function CapacityBreakdownResponse() {
  const teamData = [
    { name: 'Sarah Kim', role: 'Sr. Backend', capacity: 13, allocated: 11, utilization: 85, status: 'high' as const },
    { name: 'Mike Rivera', role: 'Full Stack', capacity: 13, allocated: 9, utilization: 69, status: 'normal' as const },
    { name: 'Priya Shah', role: 'Backend', capacity: 10, allocated: 10, utilization: 100, status: 'over' as const },
    { name: 'Alex Dunn', role: 'Frontend', capacity: 10, allocated: 7, utilization: 70, status: 'normal' as const },
    { name: 'Jordan Lee', role: 'DevOps', capacity: 8, allocated: 8, utilization: 100, status: 'over' as const },
  ];
  const getBarColor = (s: string) => s === 'over' ? 'from-destructive to-destructive/80' : s === 'high' ? 'from-warning to-warning/80' : 'from-success to-success/80';
  const getTextColor = (s: string) => s === 'over' ? 'text-destructive' : s === 'high' ? 'text-warning' : 'text-success';

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/90 leading-relaxed">
        Here&apos;s the team capacity breakdown for <span className="text-primary font-semibold">Sprint 25</span>:
      </p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Capacity', value: '54 pts', color: 'text-foreground' },
          { label: 'Allocated', value: '45 pts', color: 'text-primary' },
          { label: 'Buffer', value: '9 pts', color: 'text-success' },
        ].map((stat, idx) => (
          <div key={idx} className="rounded-lg bg-muted border border-border p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-muted border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/80 border-b border-border">
          <div className="col-span-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Member</div>
          <div className="col-span-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-center">Capacity</div>
          <div className="col-span-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-center">Allocated</div>
          <div className="col-span-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Utilization</div>
        </div>
        {teamData.map((member, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors">
            <div className="col-span-4">
              <p className="text-sm font-medium text-foreground">{member.name}</p>
              <p className="text-[10px] text-muted-foreground">{member.role}</p>
            </div>
            <div className="col-span-2 flex items-center justify-center">
              <span className="text-sm text-foreground/90 font-mono tabular-nums">{member.capacity} pts</span>
            </div>
            <div className="col-span-2 flex items-center justify-center">
              <span className="text-sm text-foreground font-mono font-semibold tabular-nums">{member.allocated} pts</span>
            </div>
            <div className="col-span-4 flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${getBarColor(member.status)}`} style={{ width: `${member.utilization}%`, animation: `barFill 1s ease-out ${idx * 0.1}s forwards` }} />
              </div>
              <span className={`text-xs font-bold tabular-nums ${getTextColor(member.status)}`}>{member.utilization}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-warning/5 border border-warning/15 p-3">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning/80 leading-relaxed">
          <span className="font-semibold text-warning">2 engineers at 100% allocation</span> -- Priya Shah and Jordan Lee have zero sprint buffer.
        </p>
      </div>
    </div>
  );
}

function ConcernTicketsResponse() {
  const tickets = [
    { id: 'COMP-217', title: 'Stripe Payment Flow Refactor', confidence: 62, risk: 'critical' as const, signals: ['Code debt: 2.8x', 'Revenue: $120K blocked', 'PR stale 4 days'], owner: 'Sarah Kim', points: 8 },
    { id: 'COMP-203', title: 'SSO Auth Timeout Fix', confidence: 68, risk: 'high' as const, signals: ['3 enterprise escalations', 'Zendesk tickets: 12', 'P1 since Feb 14'], owner: 'Mike Rivera', points: 5 },
    { id: 'COMP-291', title: 'Webhook Retry Mechanism', confidence: 71, risk: 'high' as const, signals: ['Integration partner SLA breach risk', 'No test coverage', 'Dependency on COMP-217'], owner: 'Priya Shah', points: 5 },
  ];
  const getRiskBadge = (r: string) => (r === 'critical' ? 'danger' : 'warning') as 'danger' | 'warning';
  const getConfColor = (c: number) => c < 65 ? 'text-destructive' : c < 75 ? 'text-warning' : 'text-success';
  const getConfBar = (c: number) => c < 65 ? 'bg-destructive' : c < 75 ? 'bg-warning' : 'bg-success';

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/90 leading-relaxed">
        Here are the <span className="text-primary font-semibold">top 3 tickets</span> that need immediate attention:
      </p>
      {tickets.map((ticket, idx) => (
        <div key={ticket.id} className="rounded-xl bg-muted border border-border overflow-hidden" style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.15}s both` }}>
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">{ticket.id}</span>
              {ticket.title}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={getRiskBadge(ticket.risk)}>{ticket.risk}</Badge>
              <span className="text-xs text-muted-foreground">{ticket.points} pts</span>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
              <span className="text-xs text-muted-foreground">Owner: <span className="text-foreground/90">{ticket.owner}</span></span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getConfBar(ticket.confidence)}`} style={{ width: `${ticket.confidence}%`, animation: `barFill 1s ease-out ${idx * 0.2}s forwards` }} />
              </div>
              <span className={`text-sm font-bold tabular-nums ${getConfColor(ticket.confidence)}`}>{ticket.confidence}%</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ticket.signals.map((signal, sIdx) => (
                <span key={sIdx} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground">
                  <Radio className="w-2.5 h-2.5 text-primary" />
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/90 leading-relaxed">
          Want me to generate a <span className="text-primary font-semibold">mitigation plan</span> or run a <span className="text-primary font-semibold">what-if scenario</span>?
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing Indicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex gap-3.5">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Hexagon className="w-4.5 h-4.5 text-primary" strokeWidth={1.75} />
      </div>
      <div className="flex items-center gap-2 px-5 py-4 rounded-2xl rounded-bl-md bg-card border border-border/40 shadow-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground/40" style={{ animation: `typingBounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome Screen (empty state inspired by the reference design)
// ---------------------------------------------------------------------------
function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const { user } = useAuth();
  const { activeProjectId } = useProject();
  const { data: teamMembers = [] } = useTeamMembers(activeProjectId);
  const normalized = user ? normalizeProfileDisplay(user) : { full_name: '', email: '' };
  const canonicalEmail = user ? getCanonicalEmail(user) : '';
  const boardName = getNameFromBoardByEmail(canonicalEmail, teamMembers);
  const displayName = (boardName ?? normalized.full_name) || '';
  const firstName = displayName.split(' ')[0] || '';

  const capabilities = [
    { icon: Shield, text: 'Sprint risk assessment' },
    { icon: Users, text: 'Team capacity analysis' },
    { icon: TrendingUp, text: 'Velocity forecasting' },
    { icon: Gauge, text: 'Estimation accuracy review' },
  ];

  const quickActions = [
    { icon: CalendarRange, label: 'Sprint Summary', color: 'text-primary', bg: 'bg-primary/8', prompt: "Give me a summary of the current sprint's progress" },
    { icon: Shield, label: 'Risk Analysis', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/8', prompt: "What are the biggest risks in the current sprint?" },
    { icon: Users, label: 'Team Capacity', color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/8', prompt: 'Show me the team capacity breakdown' },
    { icon: Target, label: 'Accuracy Report', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/8', prompt: 'How accurate were our estimates in the last sprint?' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full">
      {/* Hero */}
      <motion.div
        className="flex flex-col items-center text-center mb-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 mb-5">
          <Hexagon className="w-7 h-7 text-white" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-foreground tracking-tight">
          Hi{firstName ? `, ${firstName}` : ' there'}
        </h1>
        <p className="text-[15px] text-muted-foreground mt-1.5 max-w-sm">
          Ask anything about your sprint—risk, capacity, accuracy—and I&apos;ll help you make sense of it.
        </p>
      </motion.div>

      {/* Quick action pills — primary CTA row */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-2.5 w-full"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onSuggestionClick(action.prompt)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-card border border-border/60 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 hover:shadow-sm shadow-sm group"
            >
              <div className={`w-8 h-8 rounded-lg ${action.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${action.color}`} strokeWidth={1.75} />
              </div>
              <span className="text-[13px] font-medium text-foreground/90 group-hover:text-foreground">{action.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Capabilities + prompt card */}
      <motion.div
        className="mt-8 w-full space-y-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">ATLAS AI</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">Sprint Intelligence</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capabilities.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div key={cap.text} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary/80 shrink-0" strokeWidth={1.75} />
                    <span className="text-[13px] text-foreground/85">{cap.text}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => onSuggestionClick("What are the biggest risks in the current sprint and what should I do about them?")}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-muted/40 border border-border/40 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200 text-left group"
            >
              <p className="text-[13px] text-foreground/85 leading-relaxed flex-1">
                What are the biggest risks in the current sprint and what should I do about them?
              </p>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context Panel
// ---------------------------------------------------------------------------
function ContextPanel() {
  const signals = [
    { name: 'Jira', icon: Kanban, status: 'live' as const, label: 'Live' },
    { name: 'GitHub', icon: GitBranch, status: 'live' as const, label: 'Live' },
    { name: 'HubSpot', icon: Target, status: 'live' as const, label: 'Live' },
    { name: 'Slack', icon: MessageSquare, status: 'live' as const, label: 'Live' },
    { name: 'Datadog', icon: Activity, status: 'stale' as const, label: 'Stale' },
    { name: 'Zendesk', icon: FileCode2, status: 'stale' as const, label: 'Stale' },
  ];

  const recentActivity = [
    { text: 'Risk model updated for COMP-217', time: '2m ago', icon: Shield },
    { text: 'Capacity recalculated (Sarah PTO)', time: '8m ago', icon: BarChart3 },
    { text: 'New Zendesk signal ingested', time: '15m ago', icon: Zap },
    { text: 'Sprint 25 confidence recalculated', time: '22m ago', icon: Brain },
  ];

  const sources = [
    'Sprint velocity (last 6 sprints)',
    'Ticket complexity scoring',
    'Code debt analysis (Git)',
    'Team availability calendar',
    'CRM pipeline data',
    'Customer support signals',
  ];

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-2">
      <div className="flex items-center gap-2.5 pb-2" style={{ animation: 'fadeIn 0.4s ease-out both' }}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Database className="w-4 h-4 text-primary" strokeWidth={1.75} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Active Context</h3>
      </div>

      <div className="rounded-xl bg-card border border-border/40 p-4" style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Sprint</span>
          <Badge variant="orange">Active</Badge>
        </div>
        <h4 className="text-[15px] font-bold text-foreground mb-0.5">Sprint 25</h4>
        <p className="text-[12px] text-muted-foreground mb-4">ACME Backend · Feb 24 – Mar 9</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Tickets', value: '9' },
            { label: 'Points', value: '45' },
            { label: 'Days Left', value: '6' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center rounded-lg bg-muted/60 border border-border/30 py-2.5">
              <p className="text-sm font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/40 p-4" style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Signal Health</span>
          <span className="text-[11px] font-semibold text-success">4/6 Live</span>
        </div>
        <div className="space-y-2.5">
          {signals.map((signal, idx) => {
            const Icon = signal.icon;
            return (
              <div key={idx} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                  <span className="text-[12px] text-foreground/90">{signal.name}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${signal.status === 'live' ? 'text-success' : 'text-warning'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${signal.status === 'live' ? 'bg-success' : 'bg-warning'}`} />
                  {signal.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/40 p-4" style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</span>
        <div className="space-y-3.5 mt-3">
          {[
            { label: 'Accuracy', value: 87, color: 'bg-primary' },
            { label: 'Confidence', value: 78, color: 'bg-primary' },
            { label: 'Capacity', value: 76, color: 'bg-primary' },
          ].map((stat, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-muted-foreground">{stat.label}</span>
                <span className="text-[12px] font-bold tabular-nums text-foreground">{stat.value}%</span>
              </div>
              <div className="h-2 bg-muted/80 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${stat.color} transition-all duration-700`} style={{ width: `${stat.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/40 p-4" style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</span>
        <div className="space-y-3 mt-3">
          {recentActivity.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-primary/80 shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-[12px] text-foreground/90 leading-relaxed">{item.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/40 p-4" style={{ animation: 'fadeIn 0.4s ease-out 0.25s both' }}>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-primary" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sources</span>
        </div>
        <div className="space-y-2">
          {sources.map((source, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
              <span className="text-[12px] text-muted-foreground">{source}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Input Bar
// ---------------------------------------------------------------------------
function ChatInputBar({
  inputValue,
  onInputChange,
  onSend,
  onKeyDown,
  textareaRef,
  disabled,
}: {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
}) {
  return (
    <div className="shrink-0 px-6 sm:px-8 pb-6 pt-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden transition-all duration-200 focus-within:shadow-md focus-within:border-primary/25">
          <div className="flex items-end gap-3 px-5 pt-4 pb-3">
            <Sparkles className="w-4 h-4 text-primary/50 shrink-0 mb-1.5" strokeWidth={1.75} />
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder="Ask about sprint risk, capacity, accuracy..."
              rows={1}
              disabled={disabled}
              className="flex-1 bg-transparent text-[15px] text-foreground placeholder-muted-foreground/50 resize-none outline-none min-h-[28px] max-h-[160px] leading-relaxed disabled:opacity-50"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/30 bg-muted/20">
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
                <ChevronDown className="w-3.5 h-3.5" />
                Source
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Attach</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voice</span>
              </button>
            </div>
            <button
              onClick={onSend}
              disabled={!inputValue.trim() || disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
              Send
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-muted-foreground/50 mt-3">
          ATLAS may produce inaccurate info. Always verify important decisions.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Page
// ---------------------------------------------------------------------------
const FREE_MESSAGE_LIMIT = 5;

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<APIChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [orgId, setOrgId] = useState('');
  const [userId, setUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isFreeTier } = usePlan();
  const [messageCount, setMessageCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const atMessageLimit = isFreeTier && messageCount >= FREE_MESSAGE_LIMIT;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    getMe()
      .then(me => {
        setOrgId(me.org_id);
        setUserId(me.id);
        return getChatHistory(me.org_id, me.id, 50);
      })
      .then((history) => {
        setChatHistory(history);
        setMessageCount(history.length);
      })
      .catch((err) => console.error('Failed to load chat history', err))
      .finally(() => setChatLoading(false));
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || atMessageLimit) return;
    const content = inputValue.trim();
    setMessageCount((c) => c + 1);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: APIChatMessage = {
      id: `temp-${Date.now()}`,
      org_id: orgId,
      user_id: userId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, userMsg]);

    if (orgId && userId) {
      setIsTyping(true);
      sendChatMessage({ org_id: orgId, user_id: userId, content })
        .then((response) => {
          setChatHistory((prev) => [...prev, response]);
          setMessageCount((c) => c + 1);
        })
        .catch(() => {
          const errMsg: APIChatMessage = {
            id: `err-${Date.now()}`,
            org_id: orgId,
            user_id: userId,
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
            created_at: new Date().toISOString(),
          };
          setChatHistory((prev) => [...prev, errMsg]);
        })
        .finally(() => setIsTyping(false));
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const messages: ChatMessage[] = chatHistory
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 overflow-hidden">
      {/* Main content: Chat + Context Panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT: Chat area */}
        <div className="flex flex-col flex-1 lg:w-3/4 min-w-0">
          {/* Messages container or Welcome screen */}
          {chatLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                  <Hexagon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground/60">Loading conversation...</p>
              </div>
            </div>
          ) : !hasMessages ? (
            <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8">
              <div className="max-w-2xl mx-auto space-y-6">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    style={{ animation: `messageSlideIn 0.4s ease-out ${Math.min(idx * 0.04, 0.3)}s both` }}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Hexagon className="w-4.5 h-4.5 text-primary" strokeWidth={1.75} />
                      </div>
                    )}

                    <div
                      className={`relative max-w-[85%] min-w-[120px] ${
                        msg.role === 'user'
                          ? 'rounded-2xl rounded-br-md bg-foreground text-background px-5 py-3.5 shadow-sm'
                          : 'rounded-2xl rounded-bl-md bg-card border border-border/40 px-5 py-4 shadow-sm'
                      }`}
                    >
                      {msg.richContent ? (
                        msg.richContent
                      ) : (
                        <p className={`text-[15px] leading-relaxed ${msg.role === 'user' ? 'text-background/95' : 'text-foreground/90'}`}>
                          {msg.content}
                        </p>
                      )}
                      <p className={`text-[11px] mt-2.5 ${msg.role === 'user' ? 'text-background/50 text-right' : 'text-muted-foreground/60'}`}>
                        {msg.timestamp}
                      </p>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-9 h-9 rounded-xl bg-muted/80 border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[11px] font-semibold text-foreground/70">You</span>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input area */}
          {atMessageLimit ? (
            <div className="shrink-0 px-6 pb-4 pt-2">
              <LimitWall
                used={messageCount}
                max={FREE_MESSAGE_LIMIT}
                noun="free AI messages"
              />
            </div>
          ) : (
            <ChatInputBar
              inputValue={inputValue}
              onInputChange={handleTextareaInput}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
              textareaRef={textareaRef}
            />
          )}
        </div>

        {/* RIGHT: Context panel (desktop only) */}
        <div className="hidden lg:block w-1/4 min-w-[280px] border-l border-border/40 bg-muted/20 px-5 py-5 overflow-hidden">
          <SectionGate requiredTier="pro" label="Unlock Context Panel with Pro">
            <ContextPanel />
          </SectionGate>
        </div>
      </div>
    </div>
  );
}
