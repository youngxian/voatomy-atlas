'use client';

import { useState } from 'react';
import {
  Bell,
  Moon,
  Lock,
  Hash,
  Monitor,
  Mail,
  MessageSquare,
  Webhook,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Toggle, Select, Input, SectionHeader, SaveBar } from './SettingsFormControls';
import { usePlan } from '@/lib/plan';

export function NotificationsTab() {
  const { isFreeTier, canAccess } = usePlan();
  const hasSlackTeams = canAccess('slack_teams_notifs');
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    sprintReady: true, revenueAlert: true, debtDetected: true, syncFail: true,
    accuracyReport: false, teamChange: false, capacityAlert: true, deployNotify: false,
    aiFollowUp: true, moveDecision: true, depBlocked: true, retroReminder: true,
    stakeholderEscalation: true, planningNoteAdded: true,
  });
  const toggle = (k: string) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  const [digestFreq, setDigestFreq] = useState('Daily');
  const [quietStart, setQuietStart] = useState('10:00 PM');
  const [quietEnd, setQuietEnd] = useState('8:00 AM');
  const [slackChannel, setSlackChannel] = useState('#eng-sprint');
  const [slackFreq, setSlackFreq] = useState('Instant');
  const [teamsFreq, setTeamsFreq] = useState('Instant');
  const [teamsWebhook, setTeamsWebhook] = useState('');

  const NOTIF_GROUPS = [
    { group: 'Sprint & Planning', items: [
      { key: 'sprintReady', label: 'Sprint plan ready for review', channel: 'Email + Slack' },
      { key: 'accuracyReport', label: 'Weekly accuracy report', channel: 'Email' },
      { key: 'retroReminder', label: 'Retrospective reminder', channel: 'Slack' },
      { key: 'planningNoteAdded', label: 'Sprint planning note recorded', channel: 'In-app' },
    ]},
    { group: 'AI Intelligence', items: [
      { key: 'aiFollowUp', label: 'AI follow-up generated for ticket', channel: 'In-app + Slack' },
      { key: 'moveDecision', label: 'Move-to-sprint decision recorded', channel: 'In-app' },
      { key: 'revenueAlert', label: 'Revenue-critical ticket flagged', channel: 'Email + Slack + Push' },
      { key: 'capacityAlert', label: 'Sprint capacity threshold exceeded', channel: 'Slack' },
      { key: 'stakeholderEscalation', label: 'Stakeholder escalated a ticket', channel: 'Email + Slack + Push' },
    ]},
    { group: 'Board & Integrations', items: [
      { key: 'syncFail', label: 'Integration sync failure', channel: 'Email + Push' },
      { key: 'deployNotify', label: 'Deployment completed', channel: 'Slack' },
      { key: 'depBlocked', label: 'Dependency chain blocked', channel: 'In-app + Slack' },
      { key: 'debtDetected', label: 'High tech debt detected', channel: 'Email' },
    ]},
    { group: 'Team', items: [
      { key: 'teamChange', label: 'Team member joins or leaves', channel: 'Email' },
    ]},
  ];

  return (
    <div className="space-y-5">
      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Bell} title="Notification Preferences" />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">Choose which events trigger notifications and through which channels.</p>
        {NOTIF_GROUPS.map(g => (
          <div key={g.group} className="mb-4 last:mb-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 mt-3">{g.group}</p>
            <div className="space-y-0.5">
              {g.items.map(item => {
                const channelNeedsSlack = item.channel.includes('Slack');
                const isLocked = channelNeedsSlack && !hasSlackTeams;
                return (
                  <div key={item.key} className={`flex items-center justify-between group ${isLocked ? 'opacity-50' : ''}`}>
                    <Toggle checked={isLocked ? false : prefs[item.key]} onChange={() => !isLocked && toggle(item.key)} label={item.label} />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] text-muted-foreground font-medium hidden sm:block">{item.channel}</span>
                      {isLocked && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">Pro</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {isFreeTier && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Slack &amp; Teams notification channels require the <span className="font-semibold text-primary">Pro</span> plan.
              Free tier includes Email and In-app notifications only.
            </p>
          </div>
        )}
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Mail} title="Delivery Settings" />
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Email Digest" value={digestFreq} onChange={setDigestFreq} icon={Mail} options={['Instant', 'Hourly', 'Daily', 'Weekly', 'Never']} hint="How often to batch email notifications" />
            <div />
            <div />
          </div>

          <div className={`rounded-lg border p-4 space-y-3 ${hasSlackTeams ? 'border-border/60 bg-card' : 'border-primary/15 bg-primary/[0.02]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Slack Notifications</span>
              </div>
              {!hasSlackTeams && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  <Lock className="w-2.5 h-2.5" /> Pro
                </span>
              )}
            </div>
            {hasSlackTeams ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Default Channel" value={slackChannel} onChange={setSlackChannel} icon={Hash} hint="e.g. #eng-sprint" />
                <Select label="Frequency" value={slackFreq} onChange={setSlackFreq} options={['Instant', 'Batched (hourly)', 'Daily summary']} hint="How Slack messages are sent" />
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Send sprint alerts, AI insights, and team updates directly to your Slack channels.
                Upgrade to Pro to enable.
              </p>
            )}
          </div>

          <div className={`rounded-lg border p-4 space-y-3 ${hasSlackTeams ? 'border-border/60 bg-card' : 'border-primary/15 bg-primary/[0.02]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Microsoft Teams Notifications</span>
              </div>
              {!hasSlackTeams && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  <Lock className="w-2.5 h-2.5" /> Pro
                </span>
              )}
            </div>
            {hasSlackTeams ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Webhook URL" value={teamsWebhook} onChange={setTeamsWebhook} icon={Webhook} hint="Teams incoming webhook URL" />
                <Select label="Frequency" value={teamsFreq} onChange={setTeamsFreq} options={['Instant', 'Batched (hourly)', 'Daily summary']} hint="How Teams messages are sent" />
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Push real-time sprint updates and AI alerts to Microsoft Teams channels.
                Upgrade to Pro to enable.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Moon} title="Quiet Hours" />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">Suppress non-critical notifications during these hours.</p>
        <div className="flex items-center gap-3">
          <Input label="From" value={quietStart} onChange={setQuietStart} />
          <span className="text-xs text-muted-foreground mt-5">to</span>
          <Input label="To" value={quietEnd} onChange={setQuietEnd} />
          <span className="text-xs text-muted-foreground mt-5">local time</span>
        </div>
      </Card>

      <SaveBar />
    </div>
  );
}
