'use client';

import { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  KeyRound,
  Link2,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ClickUpSetupGuideProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
  redirectUri: string;
}

export default function ClickUpSetupGuide({ open, onClose, onProceed, redirectUri }: ClickUpSetupGuideProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [copiedUri, setCopiedUri] = useState(false);

  if (!open) return null;

  const copyUri = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#12121a] border border-[#2a2a3a] shadow-2xl shadow-black/50 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border"
              style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)', borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)' }}
            >
              C
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Connect ClickUp</h2>
              <p className="text-xs text-muted-foreground">One-time setup for your workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#1a1a25] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-[#2a2a3a]" />

        {/* Steps */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-2">

          {/* Step 1: Create OAuth App */}
          <StepAccordion
            number={1}
            title="Create a ClickUp OAuth App"
            icon={KeyRound}
            expanded={expandedStep === 1}
            onToggle={() => setExpandedStep(expandedStep === 1 ? null : 1)}
          >
            <p className="text-sm text-muted-foreground mb-3">
              A workspace <span className="text-foreground font-medium">Owner</span> or{' '}
              <span className="text-foreground font-medium">Admin</span> needs to create an
              OAuth app in ClickUp. This is a one-time setup.
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                Log in to{' '}
                <a
                  href="https://app.clickup.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  ClickUp <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Click your avatar (top-right) &rarr; <span className="text-foreground">Settings</span></li>
              <li>In the sidebar, click <span className="text-foreground">Apps</span></li>
              <li>Click <span className="text-foreground">Create new app</span></li>
              <li>
                Name it something like{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#1a1a25] text-primary text-xs">ATLAS Integration</code>
              </li>
            </ol>
          </StepAccordion>

          {/* Step 2: Set Redirect URI */}
          <StepAccordion
            number={2}
            title="Set the Redirect URI"
            icon={Link2}
            expanded={expandedStep === 2}
            onToggle={() => setExpandedStep(expandedStep === 2 ? null : 2)}
          >
            <p className="text-sm text-muted-foreground mb-3">
              When creating the app, ClickUp asks for a{' '}
              <span className="text-foreground font-medium">Redirect URL</span>.
              Paste this value:
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] px-3 py-2.5">
              <code className="flex-1 text-xs text-primary break-all font-mono">
                {redirectUri}
              </code>
              <button
                onClick={copyUri}
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#1a1a25] transition-colors"
                title="Copy to clipboard"
              >
                {copiedUri ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-secondary-foreground mt-2">
              This tells ClickUp where to send you back after authorization.
            </p>
          </StepAccordion>

          {/* Admin notice */}
          <div className="rounded-xl bg-success/5 border border-success/15 px-4 py-3 flex items-start gap-3 mt-3">
            <Shield className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="text-success font-medium">Credentials are configured on the server.</span>{' '}
              Your admin has set the ClickUp Client ID and Secret as environment variables.
              Just click Connect below to authorize.
            </p>
          </div>
        </div>

        <div className="h-px bg-[#2a2a3a]" />

        {/* Footer */}
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center gap-3">
          <a
            href="https://developer.clickup.com/docs/authentication"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-secondary-foreground hover:text-muted-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            ClickUp OAuth Docs
          </a>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-[#1a1a25] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            Connect ClickUp
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step accordion sub-component
// ---------------------------------------------------------------------------

function StepAccordion({
  number,
  title,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a3a] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#16161f] transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{number}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-secondary-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-secondary-foreground shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
