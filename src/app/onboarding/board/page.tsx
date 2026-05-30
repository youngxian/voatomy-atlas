'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import ProviderProjectPicker from '@/components/ProviderProjectPicker';
import {
  connectIntegration,
  completeOAuthCallback,
  listIntegrations,
  type ConnectedIntegration,
  type ImportProviderResult,
} from '@/lib/api';

// ---------------------------------------------------------------------------
// Board providers the user can connect during onboarding
// ---------------------------------------------------------------------------

interface BoardProvider {
  key: string;
  name: string;
  description: string;
  letter: string;
  color: string;
  popular?: boolean;
}

const BOARD_PROVIDERS: BoardProvider[] = [
  {
    key: 'clickup',
    name: 'ClickUp',
    description: 'Spaces, lists, tasks & sprints',
    letter: 'C',
    color: '#7B68EE',
    popular: true,
  },
  {
    key: 'jira',
    name: 'Jira',
    description: 'Projects, boards & sprints',
    letter: 'J',
    color: '#2684FF',
    popular: true,
  },
  {
    key: 'linear',
    name: 'Linear',
    description: 'Teams, cycles & issues',
    letter: 'L',
    color: '#5E6AD2',
    popular: true,
  },
  {
    key: 'asana',
    name: 'Asana',
    description: 'Projects, sections & tasks',
    letter: 'A',
    color: '#F06A6A',
  },
  {
    key: 'monday',
    name: 'Monday',
    description: 'Boards, groups & items',
    letter: 'M',
    color: '#FF3D57',
  },
  {
    key: 'github_projects',
    name: 'GitHub Projects',
    description: 'Project V2, issues & iterations',
    letter: 'GH',
    color: '#238636',
  },
  {
    key: 'azuredevops',
    name: 'Azure DevOps',
    description: 'Work items, iterations & boards',
    letter: 'Az',
    color: '#0078D7',
  },
  {
    key: 'shortcut',
    name: 'Shortcut',
    description: 'Stories, iterations & epics',
    letter: 'Sc',
    color: '#58B1E4',
  },
];

const TRUST_SIGNALS = [
  { icon: Shield, text: 'Read-only access — ATLAS never modifies your board' },
  { icon: Zap, text: 'One-click OAuth — no API keys to copy' },
  { icon: Sparkles, text: 'AI analysis begins immediately after connection' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PM_PROVIDER_KEYS = new Set(BOARD_PROVIDERS.map((p) => p.key));

type FlowState = 'idle' | 'connecting' | 'callback' | 'connected' | 'success' | 'error';

function BoardSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [connectedProvider, setConnectedProvider] = useState<ConnectedIntegration | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Check if we're returning from an OAuth redirect
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const providerParam = searchParams.get('provider');

  const handleOAuthReturn = useCallback(async () => {
    if (!code || !state || !providerParam) return;
    setFlowState('callback');
    setActiveProvider(providerParam);

    try {
      const integration = await completeOAuthCallback(providerParam, code, state);
      setConnectedProvider(integration);
      setFlowState('connected');
      setShowPicker(true);
    } catch {
      setErrorMessage('Could not complete the connection. Please try again.');
      setFlowState('error');
    }
  }, [code, state, providerParam]);

  useEffect(() => {
    handleOAuthReturn();
  }, [handleOAuthReturn]);

  // Check for existing connections
  useEffect(() => {
    if (code) return;
    (async () => {
      try {
        const conns = await listIntegrations();
        const pmConn = conns.find(
          (c) => c.status === 'connected' && PM_PROVIDER_KEYS.has(c.provider),
        );
        if (pmConn) {
          setConnectedProvider(pmConn);
          setFlowState('connected');
          setActiveProvider(pmConn.provider);
          setShowPicker(true);
        }
      } catch {
        // no-op: user just hasn't connected yet
      }
    })();
  }, [code]);

  const handleProviderClick = (provider: BoardProvider) => {
    initiateOAuth(provider);
  };

  const initiateOAuth = async (provider: BoardProvider) => {
    setFlowState('connecting');
    setActiveProvider(provider.key);
    setErrorMessage('');

    try {
      const result = await connectIntegration(provider.key, {
        redirect_url: `${window.location.origin}/onboarding/board?provider=${provider.key}`,
      });
      if (result.auth_url) {
        window.location.href = result.auth_url;
      }
    } catch {
      setErrorMessage('Failed to start the connection. Please try again.');
      setFlowState('error');
    }
  };

  const handleImported = (_result: ImportProviderResult) => {
    setShowPicker(false);
    setFlowState('success');
  };

  const handleContinue = () => {
    const name = connectedProvider?.display_name ?? connectedProvider?.provider ?? '';
    router.push(`/onboarding/analyzing${name ? `?provider=${encodeURIComponent(name)}` : ''}`);
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <Reveal>
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
        <div className="w-full max-w-xl flex flex-col items-center text-center">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === 0
                      ? 'w-8 bg-[#f16e2c]'
                      : 'w-1.5 bg-[#2a2a3a]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#6b6b80] ml-2">Step 1 of 4</span>
          </div>

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Connect your project board
          </h1>
          <p className="text-[#8b8ba0] text-base mb-10 max-w-md">
            ATLAS connects to your board to analyze sprints, estimate complexity,
            and generate AI-powered sprint plans. Connect Slack or Teams to receive
            sprint alerts and AI insights in your team channels.
          </p>

          {/* ── Connected state (picker open) ── */}
          {flowState === 'connected' && connectedProvider && !showPicker && (
            <Reveal variant="scale">
              <div className="w-full max-w-lg mb-8">
                <div className="rounded-2xl bg-[#22c55e]/5 border border-[#22c55e]/20 p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#22c55e]" />
                    <span className="text-lg font-semibold text-[#22c55e]">
                      {connectedProvider.display_name} connected
                    </span>
                  </div>
                  <p className="text-sm text-[#8b8ba0] mb-6">
                    Select a board to import into ATLAS.
                  </p>
                  <button
                    onClick={() => setShowPicker(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#f16e2c] text-white font-semibold hover:bg-[#c85a22] transition-colors shadow-lg shadow-[#f16e2c]/20"
                  >
                    Select Board
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Reveal>
          )}

          {/* ── Success state (import complete) ── */}
          {flowState === 'success' && connectedProvider && (
            <Reveal variant="scale">
              <div className="w-full max-w-lg mb-8">
                <div className="rounded-2xl bg-[#22c55e]/5 border border-[#22c55e]/20 p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#22c55e]" />
                    <span className="text-lg font-semibold text-[#22c55e]">
                      {connectedProvider.display_name} connected
                    </span>
                  </div>
                  {connectedProvider.account_id && (
                    <p className="text-sm text-[#6b6b80] mb-4">
                      Workspace: {connectedProvider.account_id}
                    </p>
                  )}
                  <p className="text-sm text-[#8b8ba0] mb-4">
                    ATLAS is ready to analyze your backlog. Continue to start
                    the intelligence engine.
                  </p>
                  <p className="text-xs text-[#6b6b80] mb-6">
                    Tip: Connect Slack or Teams in Settings → Integrations to receive sprint alerts, AI insights, and standup reminders in your channels.
                  </p>
                  <button
                    onClick={handleContinue}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#f16e2c] text-white font-semibold hover:bg-[#c85a22] transition-colors shadow-lg shadow-[#f16e2c]/20"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Reveal>
          )}

          {/* ── Callback in progress ── */}
          {flowState === 'callback' && (
            <div className="w-full max-w-lg mb-8">
              <div className="rounded-2xl bg-[#12121a] border border-[#2a2a3a] p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#f16e2c] animate-spin" />
                <p className="text-sm text-[#8b8ba0]">
                  Completing connection to {activeProvider}…
                </p>
              </div>
            </div>
          )}

          {/* ── Error state ── */}
          {flowState === 'error' && (
            <div className="w-full max-w-lg mb-6">
              <div className="rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/20 px-5 py-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-[#ef4444] font-medium">{errorMessage}</p>
                  <button
                    onClick={() => { setFlowState('idle'); setActiveProvider(null); }}
                    className="text-xs text-[#ef4444]/70 underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Provider cards ── */}
          {(flowState === 'idle' || flowState === 'error') && (
            <div className="w-full max-w-lg space-y-3 mb-8">
              {BOARD_PROVIDERS.map((provider) => (
                <button
                  key={provider.key}
                  onClick={() => handleProviderClick(provider)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-[#12121a] border border-[#2a2a3a] hover:border-[#3a3a4a] hover:bg-[#16161f] transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 border transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: provider.color + '15',
                      color: provider.color,
                      borderColor: provider.color + '30',
                    }}
                  >
                    {provider.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#e8e8ed]">
                        {provider.name}
                      </span>
                      {provider.popular && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f16e2c]/10 text-[#f16e2c]">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6b80] mt-0.5">{provider.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#3a3a4a] group-hover:text-[#6b6b80] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* ── Connecting state ── */}
          {flowState === 'connecting' && (
            <div className="w-full max-w-lg mb-8">
              <div className="rounded-2xl bg-[#12121a] border border-[#2a2a3a] p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#f16e2c] animate-spin" />
                <p className="text-sm text-[#8b8ba0]">
                  Redirecting to {activeProvider}…
                </p>
              </div>
            </div>
          )}

          {/* ── Trust signals ── */}
          {flowState !== 'success' && (
            <div className="w-full max-w-lg rounded-2xl bg-[#12121a] border border-[#2a2a3a] p-5 mb-8">
              <div className="flex flex-col gap-3">
                {TRUST_SIGNALS.map((signal) => (
                  <div key={signal.text} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/10 flex items-center justify-center shrink-0">
                      <signal.icon className="w-3.5 h-3.5 text-[#22c55e]" />
                    </div>
                    <span className="text-xs text-[#8b8ba0]">{signal.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Skip link ── */}
          {flowState !== 'success' && (
            <button
              onClick={handleSkip}
              className="text-sm text-[#6b6b80] hover:text-[#8b8ba0] transition-colors"
            >
              Skip for now — connect later from Settings
            </button>
          )}

          {/* ── Help link ── */}
          <a
            href="https://docs.voatomy.com/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 mt-6 text-xs text-[#4a4a5a] hover:text-[#6b6b80] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Integration documentation
          </a>
        </div>
      </div>

      {activeProvider && (
        <ProviderProjectPicker
          provider={activeProvider}
          open={showPicker}
          onClose={() => setShowPicker(false)}
          onImported={handleImported}
        />
      )}
    </Reveal>
  );
}

export default function BoardSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#f16e2c]/10 border border-[#f16e2c]/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#f16e2c] animate-spin" />
        </div>
      </div>
    }>
      <BoardSelectionContent />
    </Suspense>
  );
}
