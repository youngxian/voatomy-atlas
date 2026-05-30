'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Bell,
  CreditCard,
  Shield,
  Brain,
  Kanban,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { ToggleIcon } from '@/components/ui/animated-state-icons';
import { useProject } from '@/lib/project-context';
import { useProjectRole } from '@/hooks/useProjectRole';

import { GeneralTab } from '@/components/settings/GeneralTab';
import { AIEngineTab } from '@/components/settings/AIEngineTab';
import { SprintBoardTab } from '@/components/settings/SprintBoardTab';
import { TeamTab } from '@/components/settings/TeamTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { BillingTab } from '@/components/settings/BillingTab';

const ALL_TABS = [
  { id: 'general', label: 'General', icon: Settings, requiresAdmin: false },
  { id: 'ai', label: 'AI Engine', icon: Brain, requiresAdmin: false },
  { id: 'sprint', label: 'Sprint & Board', icon: Kanban, requiresAdmin: false },
  { id: 'team', label: 'Team', icon: Users, requiresManage: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, requiresAdmin: false },
  { id: 'security', label: 'Security', icon: Shield, requiresAdmin: false },
  { id: 'billing', label: 'Billing', icon: CreditCard, requiresAdmin: true },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const { activeProjectId } = useProject();
  const { canManage, isAdmin } = useProjectRole(activeProjectId);

  const TABS = ALL_TABS.filter((t) => {
    if (t.requiresAdmin && !isAdmin) return false;
    if (t.requiresManage && !canManage) return false;
    return true;
  });

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (!tab) return;
    const visible = ALL_TABS.filter((t) => {
      if (t.requiresAdmin && !isAdmin) return false;
      if (t.requiresManage && !canManage) return false;
      return true;
    });
    if (visible.some((t) => t.id === tab)) setActiveTab(tab);
  }, [isAdmin, canManage]);

  const effectiveTab = TABS.some((t) => t.id === activeTab) ? activeTab : TABS[0]?.id ?? 'general';

  return (
    <>
      <Reveal>
        <div className="space-y-5 pb-10">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ToggleIcon size={20} color="var(--primary)" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Settings</h1>
              <p className="text-sm text-muted-foreground">Manage every aspect of your ATLAS project</p>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/40 border border-border/40 overflow-x-auto w-fit">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = effectiveTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-lg transition-all ${isActive ? 'text-primary bg-card shadow-sm border border-border/60' : 'text-muted-foreground hover:text-secondary-foreground hover:bg-secondary/60'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {effectiveTab === 'general' && <GeneralTab />}
          {effectiveTab === 'ai' && <AIEngineTab />}
          {effectiveTab === 'sprint' && <SprintBoardTab />}
          {effectiveTab === 'team' && <TeamTab />}
          {effectiveTab === 'notifications' && <NotificationsTab />}
          {effectiveTab === 'security' && <SecurityTab />}
          {effectiveTab === 'billing' && <BillingTab />}
        </div>
      </Reveal>
    </>
  );
}
