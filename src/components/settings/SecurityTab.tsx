'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Trash2,
  Shield,
  ShieldAlert,
  Copy,
  Key,
  Lock,
  Activity,
  Timer,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { Toggle, Select, SectionHeader, SaveBar } from './SettingsFormControls';

export function SecurityTab() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('24 hours');
  const [ipWhitelist, setIpWhitelist] = useState(false);
  const [auditLog, setAuditLog] = useState(true);
  const [passwordPolicy, setPasswordPolicy] = useState('Strong (12+ chars, mixed)');

  return (
    <div className="space-y-5">
      <Card className="bento-card rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Ticket Vulnerability Scanner</h3>
              <p className="text-[11px] text-muted-foreground">AI-powered PII and sensitive data detection across all tickets</p>
            </div>
          </div>
          <Link href="/settings/security" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Settings className="w-3.5 h-3.5" />
            Configure
          </Link>
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Lock} title="Authentication" />
        <div className="space-y-0.5 mt-3">
          <Toggle checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} label="Two-factor authentication (2FA)" description="Require all team members to use 2FA. Supports authenticator apps and hardware keys." />
          <Toggle checked={ssoEnabled} onChange={() => setSsoEnabled(!ssoEnabled)} label="Single Sign-On (SSO)" description="Enable SAML 2.0 or OIDC SSO for enterprise authentication. Requires Pro plan." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/60">
          <Select label="Session Timeout" value={sessionTimeout} onChange={setSessionTimeout} icon={Timer} options={['1 hour', '4 hours', '12 hours', '24 hours', '7 days', '30 days']} hint="Inactive sessions are automatically ended" />
          <Select label="Password Policy" value={passwordPolicy} onChange={setPasswordPolicy} icon={Key} options={['Basic (8+ chars)', 'Medium (10+ chars, mixed)', 'Strong (12+ chars, mixed)', 'Custom']} />
        </div>
        <div className="mt-3">
          <Toggle checked={ipWhitelist} onChange={() => setIpWhitelist(!ipWhitelist)} label="IP Allowlist" description="Restrict access to specific IP addresses or CIDR ranges" />
        </div>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Key} title="API Keys" />
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">Manage API keys for programmatic access to ATLAS data.</p>
        <div className="space-y-2">
          {[
            { name: 'Production Key', prefix: 'atlas_prod_...x4f2', created: 'Jan 15, 2026', lastUsed: '2h ago', scopes: ['read', 'write'] },
            { name: 'CI/CD Pipeline', prefix: 'atlas_ci_...m8k1', created: 'Feb 1, 2026', lastUsed: '5m ago', scopes: ['read'] },
          ].map(k => (
            <div key={k.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border/60">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-xs font-semibold text-foreground">{k.name}</span>
                  {k.scopes.map(s => <Badge key={s} variant={s === 'write' ? 'warning' : 'info'}>{s}</Badge>)}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                  <span className="font-mono">{k.prefix}</span>
                  <span>Created {k.created}</span>
                  <span>Last used {k.lastUsed}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost"><Copy className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost"><Trash2 className="w-3 h-3 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <Button size="sm" variant="secondary" className="mt-3"><Key className="w-3.5 h-3.5" /> Generate New Key</Button>
      </Card>

      <Card className="bento-card rounded-2xl">
        <SectionHeader icon={Activity} title="Audit Log" />
        <Toggle checked={auditLog} onChange={() => setAuditLog(!auditLog)} label="Enable audit logging" description="Track all user actions, API calls, and configuration changes. Retained for 90 days." />
        <div className="mt-3 space-y-1.5">
          {[
            { action: 'Sprint 25 plan pushed to Jira', user: 'Sarah C.', time: '2h ago', type: 'sprint' },
            { action: 'API key "CI/CD Pipeline" used', user: 'System', time: '5m ago', type: 'api' },
            { action: 'Marcus J. role changed to Member', user: 'Sarah C.', time: '1d ago', type: 'team' },
            { action: 'Slack integration reconnected', user: 'Elena R.', time: '2d ago', type: 'integration' },
            { action: 'AI follow-up settings updated', user: 'Sarah C.', time: '3d ago', type: 'settings' },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card transition-colors text-[10px]" style={{ animation: `fadeSlideIn 0.2s ease-out ${i * 0.03}s both` }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-foreground font-medium flex-1">{e.action}</span>
              <span className="text-muted-foreground">{e.user}</span>
              <span className="text-muted-foreground">{e.time}</span>
            </div>
          ))}
        </div>
        <Link href="#" className="text-[10px] text-primary hover:underline font-medium mt-2 inline-block">View full audit log →</Link>
      </Card>

      <SaveBar />
    </div>
  );
}
