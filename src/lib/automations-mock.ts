import {
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  Code,
  Database,
  FileText,
  GitBranch,
  Globe,
  Layers,
  Mail,
  Save,
  Shield,
  Sparkles,
  Terminal,
  Webhook,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface ActionBlock {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

export interface ActionCategory {
  name: string;
  icon: React.ElementType;
  blocks: ActionBlock[];
  expanded?: boolean;
}

export type NodeType = 'trigger' | 'action' | 'condition' | 'webhook' | 'email' | 'http' | 'code' | 'ai';

export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  color: string;
  icon: React.ElementType;
  status?: 'running' | 'success' | 'error' | 'pending';
  connections: string[];
}

export interface Automation {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  lastRun?: string;
  runs: number;
  nodes: FlowNode[];
}

/* ------------------------------------------------------------------ */
/*  Action Block Categories                                             */
/* ------------------------------------------------------------------ */

export const ACTION_CATEGORIES: ActionCategory[] = [
  {
    name: 'Action Blocks',
    icon: Layers,
    expanded: true,
    blocks: [
      { id: 'request', name: 'HTTP Request', icon: Globe, color: '#22C55E', description: 'Make API calls' },
      { id: 'code', name: 'Code', icon: Code, color: '#8b5cf6', description: 'Run custom scripts' },
      { id: 'data-input', name: 'Data Input', icon: Database, color: '#06b6d4', description: 'Transform data' },
      { id: 'event', name: 'Event Trigger', icon: Zap, color: '#f59e0b', description: 'Listen for events' },
      { id: 'save', name: 'Save to Story', icon: Save, color: '#10b981', description: 'Persist results' },
      { id: 'webhook', name: 'Webhook', icon: Webhook, color: '#C75C63', description: 'Receive webhooks' },
      { id: 'terminal', name: 'Terminal', icon: Terminal, color: '#6b7280', description: 'Run commands' },
    ],
  },
  {
    name: 'Board Sync',
    icon: GitBranch,
    blocks: [
      { id: 'jira-sync', name: 'Jira Sync', icon: FileText, color: '#2684FF', description: 'Sync Jira tickets' },
      { id: 'linear-sync', name: 'Linear Sync', icon: FileText, color: '#5E6AD2', description: 'Sync Linear issues' },
      { id: 'github-pr', name: 'GitHub PR', icon: GitBranch, color: '#8b949e', description: 'Monitor pull requests' },
    ],
  },
  {
    name: 'AI Intelligence',
    icon: Bot,
    blocks: [
      { id: 'ai-estimate', name: 'AI Estimate', icon: Bot, color: '#22C55E', description: 'Auto-estimate tickets' },
      { id: 'ai-risk', name: 'Risk Detector', icon: Shield, color: '#C75C63', description: 'Detect sprint risks' },
      { id: 'ai-suggest', name: 'AI Suggest', icon: Sparkles, color: '#f59e0b', description: 'Suggest improvements' },
    ],
  },
  {
    name: 'Notifications',
    icon: Bell,
    blocks: [
      { id: 'slack-notify', name: 'Slack Message', icon: Bell, color: '#E01E5A', description: 'Send Slack alerts' },
      { id: 'email-notify', name: 'Email', icon: Mail, color: '#22C55E', description: 'Send email updates' },
      { id: 'webhook-out', name: 'Outgoing Webhook', icon: Globe, color: '#8b5cf6', description: 'Call external API' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sample Automation Flow                                              */
/* ------------------------------------------------------------------ */

export const SAMPLE_AUTOMATION: Automation = {
  id: 'auto-1',
  name: 'Sprint Risk Auto-Detector',
  status: 'active',
  lastRun: '3 min ago',
  runs: 247,
  nodes: [
    {
      id: 'n1', type: 'webhook', label: 'Webhook', sublabel: 'Receive URLs',
      x: 420, y: 40, color: '#22C55E', icon: Webhook, status: 'success', connections: ['n2'],
    },
    {
      id: 'n2', type: 'action', label: 'Check submit', sublabel: '',
      x: 620, y: 40, color: '#C75C63', icon: CheckCircle2, status: 'success', connections: ['n3'],
    },
    {
      id: 'n3', type: 'trigger', label: 'Trigger', sublabel: 'If scan submitted',
      x: 480, y: 160, color: '#f59e0b', icon: Zap, status: 'running', connections: ['n4', 'n7'],
    },
    {
      id: 'n4', type: 'email', label: 'Email', sublabel: 'Send notification',
      x: 300, y: 280, color: '#22C55E', icon: Mail, status: 'pending', connections: ['n6'],
    },
    {
      id: 'n5', type: 'trigger', label: 'Trigger', sublabel: 'On auth issue',
      x: 140, y: 160, color: '#C75C63', icon: AlertTriangle, status: 'success', connections: ['n4'],
    },
    {
      id: 'n6', type: 'action', label: 'Check submit', sublabel: '',
      x: 440, y: 380, color: '#C75C63', icon: CheckCircle2, status: 'pending', connections: ['n8'],
    },
    {
      id: 'n7', type: 'trigger', label: 'Trigger', sublabel: 'If scan presented',
      x: 680, y: 160, color: '#f59e0b', icon: Zap, status: 'pending', connections: ['n9'],
    },
    {
      id: 'n8', type: 'ai', label: 'Event transform', sublabel: 'Get URL/Scan Results',
      x: 580, y: 460, color: '#8b5cf6', icon: Bot, status: 'pending', connections: [],
    },
    {
      id: 'n9', type: 'email', label: 'Send email', sublabel: 'Notify team',
      x: 720, y: 280, color: '#22C55E', icon: Mail, status: 'pending', connections: [],
    },
  ],
};
