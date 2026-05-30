'use client';

import { X, FolderGit2 } from 'lucide-react';
import { Button } from '@/components/ui';
import ProjectReposPanel from '@/components/ProjectReposPanel';

interface Props {
  provider?: string;
  onClose: () => void;
  onLinked?: () => void;
}

export default function RepoAttachmentModal({ provider, onClose, onLinked }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Attach repositories to project"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
              <FolderGit2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Attach Repos to Project
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {provider
                  ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected — link repositories to your active project`
                  : 'Select which repositories to link to your active project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ProjectReposPanel onLinked={onLinked} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border px-6 py-4 shrink-0">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
