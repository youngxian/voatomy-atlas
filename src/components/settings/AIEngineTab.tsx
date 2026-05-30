'use client';

import { useState } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  Brain,
  Sparkles,
  Gauge,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Toggle, Select, SectionHeader, SaveBar } from './SettingsFormControls';

export function AIEngineTab() {
  const [behaviors, setBehaviors] = useState<Record<string, boolean>>({
    autoRescore: true, revenueFlag: true, sprintComments: true, debtLabels: false,
    capacityWarn: true, followUpStalled: true, followUpBlocked: true, followUpOverdue: true,
    autoStakeholderNotify: true, moveToSprintPrompt: true, scopeCreepDetect: true,
    depChainAnalysis: true, crossTeamAlerts: true, sprintPlanningAI: true,
    velocityPrediction: true, riskScoring: true,
  });
  const toggle = (k: string) => setBehaviors(p => ({ ...p, [k]: !p[k] }));
  const [confThreshold, setConfThreshold] = useState('70%');
  const [stalledDays, setStalledDays] = useState('3 days');
  const [overduePct, setOverduePct] = useState('50%');

  return (
    <div className="space-y-5">
      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Brain} title="AI Ticket Follow-ups" badge="Core intelligence" />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">ATLAS AI monitors every ticket and proactively flags issues. Configure detection thresholds and automation rules.</p>
        <div className="space-y-0.5">
          <Toggle checked={behaviors.followUpStalled} onChange={() => toggle('followUpStalled')} label="Detect stalled tickets" description="Flag tickets with no commits, comments, or status changes" />
          <Toggle checked={behaviors.followUpBlocked} onChange={() => toggle('followUpBlocked')} label="Detect blocked tickets" description="Identify tickets blocked by dependency chains" />
          <Toggle checked={behaviors.followUpOverdue} onChange={() => toggle('followUpOverdue')} label="Detect overdue tickets" description="Flag when actual effort exceeds estimate by threshold" />
          <Toggle checked={behaviors.scopeCreepDetect} onChange={() => toggle('scopeCreepDetect')} label="Detect scope creep" description="Alert when new subtasks are added mid-sprint" />
          <Toggle checked={behaviors.moveToSprintPrompt} onChange={() => toggle('moveToSprintPrompt')} label="Move-to-sprint prompts" description="Show interactive prompts on flagged tickets asking users to move to next sprint" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/60">
          <Select label="Stalled threshold" value={stalledDays} onChange={setStalledDays} icon={Clock} options={['1 day', '2 days', '3 days', '5 days', '7 days']} hint="No activity for this period triggers stalled flag" />
          <Select label="Overdue threshold" value={overduePct} onChange={setOverduePct} icon={AlertTriangle} options={['25%', '50%', '75%', '100%']} hint="Effort exceeds estimate by this % to flag overdue" />
          <Select label="Min confidence to show" value={confThreshold} onChange={setConfThreshold} icon={Gauge} options={['50%', '60%', '70%', '80%', '90%']} hint="Only show AI suggestions above this confidence" />
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Bell} title="Stakeholder Notifications" />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">When AI detects an issue, ATLAS can automatically notify relevant stakeholders based on their role.</p>
        <div className="space-y-0.5">
          <Toggle checked={behaviors.autoStakeholderNotify} onChange={() => toggle('autoStakeholderNotify')} label="Auto-notify stakeholders" description="Automatically send notifications when AI flags a ticket. Stakeholders are matched by role (EM, PM, CTO)." />
          <Toggle checked={behaviors.crossTeamAlerts} onChange={() => toggle('crossTeamAlerts')} label="Cross-team dependency alerts" description="Notify team leads when their team's tickets are blocked by another team" />
        </div>
        <div className="mt-3 rounded-lg bg-card border border-border/60 p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Notification routing rules</p>
          <div className="space-y-1.5">
            {[
              { trigger: 'Stalled (>3d)', recipients: 'Assignee, EM', channel: 'In-app + Slack' },
              { trigger: 'Blocked by dependency', recipients: 'Assignee, EM, Blocking team EM', channel: 'In-app + Slack + Email' },
              { trigger: 'Overdue (>50%)', recipients: 'Assignee, EM, PM', channel: 'In-app + Slack' },
              { trigger: 'Revenue at risk (>$100K)', recipients: 'PM, VP Eng, CTO', channel: 'In-app + Slack + Email + Push' },
              { trigger: 'Critical path blocked', recipients: 'EM, CTO', channel: 'In-app + Slack + Email' },
            ].map(r => (
              <div key={r.trigger} className="flex items-center gap-3 text-[10px]">
                <span className="text-foreground font-medium w-40 shrink-0">{r.trigger}</span>
                <span className="text-muted-foreground flex-1">→ {r.recipients}</span>
                <span className="text-muted-foreground shrink-0">{r.channel}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Sparkles} title="AI Behaviors" badge="Sprint intelligence" />
        <div className="space-y-0.5 mt-3">
          <Toggle checked={behaviors.autoRescore} onChange={() => toggle('autoRescore')} label="Auto re-score tickets" description="Recalculate story points when code signals change (complexity, PR size, test coverage)" />
          <Toggle checked={behaviors.revenueFlag} onChange={() => toggle('revenueFlag')} label="Flag revenue-critical tickets" description="Auto-tag tickets linked to LOOP pipeline data above $100K" />
          <Toggle checked={behaviors.sprintComments} onChange={() => toggle('sprintComments')} label="Post sprint plan to board" description="Push ATLAS sprint plan as comments to Jira/Linear/ClickUp tickets" />
          <Toggle checked={behaviors.debtLabels} onChange={() => toggle('debtLabels')} label="Add tech-debt labels" description="Automatically label tickets touching high-debt modules" />
          <Toggle checked={behaviors.capacityWarn} onChange={() => toggle('capacityWarn')} label="Capacity warnings" description="Alert when sprint load exceeds team capacity" />
          <Toggle checked={behaviors.depChainAnalysis} onChange={() => toggle('depChainAnalysis')} label="Dependency chain analysis" description="Identify and track multi-ticket dependency chains and critical paths" />
          <Toggle checked={behaviors.sprintPlanningAI} onChange={() => toggle('sprintPlanningAI')} label="AI sprint planning" description="Generate sprint plan suggestions based on backlog priority, capacity, and velocity" />
          <Toggle checked={behaviors.velocityPrediction} onChange={() => toggle('velocityPrediction')} label="Velocity prediction" description="Predict sprint velocity based on historical data and current signals" />
          <Toggle checked={behaviors.riskScoring} onChange={() => toggle('riskScoring')} label="Risk scoring" description="Score each ticket for delivery risk based on complexity, dependencies, and assignee load" />
        </div>
      </Card>

      <SaveBar hint="AI behavior changes take effect on next sync cycle." />
    </div>
  );
}
