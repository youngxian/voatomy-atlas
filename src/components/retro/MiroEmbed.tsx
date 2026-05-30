'use client';

import { useState, useCallback, useEffect } from 'react';
import { ExternalLink, Link2, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { getRetroBoardConfig, saveRetroBoardConfig } from '@/lib/api';

const MIRO_EMBED_BASE = 'https://miro.com/app/live-embed/';

function extractBoardId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/miro\.com\/app\/(?:board|live-embed)\/([a-zA-Z0-9_-]+=?)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]+=?$/.test(trimmed)) return trimmed;
  return null;
}

function buildEmbedUrl(boardId: string): string {
  return `${MIRO_EMBED_BASE}${boardId}/?autoplay=true`;
}

interface MiroEmbedProps {
  projectId?: string | null;
  sprintId?: string | null;
  isDemo?: boolean;
}

export function MiroEmbed({ projectId, sprintId, isDemo }: MiroEmbedProps) {
  const [urlInput, setUrlInput] = useState('');
  const [boardId, setBoardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || isDemo) return;
    let cancelled = false;
    setLoading(true);

    getRetroBoardConfig(projectId, sprintId ?? undefined)
      .then((cfg) => {
        if (cancelled) return;
        if (cfg.miro_board_url) {
          setUrlInput(cfg.miro_board_url);
          const id = extractBoardId(cfg.miro_board_url);
          if (id) {
            setBoardId(id);
            setSaved(true);
          }
        }
      })
      .catch((err) => console.error('Miro embed failed', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId, sprintId, isDemo]);

  const handleSubmit = useCallback(() => {
    setError(null);
    const id = extractBoardId(urlInput);
    if (!id) {
      setError('Paste a valid Miro board URL (e.g. https://miro.com/app/board/xxx)');
      return;
    }
    setBoardId(id);
  }, [urlInput]);

  const handleSave = useCallback(async () => {
    if (!projectId || !urlInput.trim()) return;
    setSaving(true);
    try {
      await saveRetroBoardConfig(projectId, urlInput.trim(), sprintId ?? undefined);
      setSaved(true);
    } catch {
      setError('Failed to save board configuration');
    } finally {
      setSaving(false);
    }
  }, [projectId, sprintId, urlInput]);

  const handleClear = useCallback(() => {
    setUrlInput('');
    setBoardId(null);
    setError(null);
    setSaved(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bento-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ffd02f 0%, #ea580c 100%)',
              border: '1px solid rgba(234,88,12,0.3)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-white"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.392 0H13.9L17 4.808 10.444 0H6.949l3.102 6.3L3.494 0H0l3.05 8.131L0 24h3.494L10.05 6.985 6.949 24h3.494L17 5.494 13.899 24h3.493L24 3.672 17.392 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Miro Board</h3>
            <p className="text-xs text-muted-foreground">
              Embed a collaborative Miro board for your retrospective
            </p>
          </div>
        </div>

        {!boardId ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="Paste Miro board URL (e.g. https://miro.com/app/board/xxx)"
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button onClick={handleSubmit} size="sm">
                Embed
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Get the URL from your Miro board: Share → Copy link to board
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                {saved ? (
                  <>
                    <span className="shrink-0"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></span>
                    <span>Saved — included in retro reminders</span>
                  </>
                ) : (
                  <span>Board embedded (not yet saved)</span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {!saved && projectId && (
                  <Button onClick={handleSave} size="sm" variant="secondary" disabled={saving}>
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                    Save for notifications
                  </Button>
                )}
                <a
                  href={`https://miro.com/app/board/${boardId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Open in Miro
                </a>
                <button
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Change board
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        )}
      </Card>

      {boardId && (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
          <iframe
            src={buildEmbedUrl(boardId)}
            title="Miro retrospective board"
            className="w-full aspect-video min-h-[480px]"
            frameBorder={0}
            scrolling="no"
            allowFullScreen
            allow="clipboard-write"
          />
        </div>
      )}

      {!boardId && (
        <div className="rounded-xl border border-dashed border-border p-12 flex flex-col items-center justify-center gap-3 bg-muted/30 min-h-[300px]">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center opacity-60"
            style={{
              background: 'linear-gradient(135deg, #ffd02f 0%, #ea580c 100%)',
            }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
              <path d="M17.392 0H13.9L17 4.808 10.444 0H6.949l3.102 6.3L3.494 0H0l3.05 8.131L0 24h3.494L10.05 6.985 6.949 24h3.494L17 5.494 13.899 24h3.493L24 3.672 17.392 0z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Paste a Miro board URL above to collaborate on a live whiteboard during your retrospective
          </p>
        </div>
      )}
    </div>
  );
}
