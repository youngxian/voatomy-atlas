'use client';

import { useState } from 'react';
import { X, Database } from 'lucide-react';

interface DataRetentionBannerProps {
  needsPrompt: boolean;
  onConfigure: () => void;
  onDismiss: () => void;
}

export default function DataRetentionBanner({ needsPrompt, onConfigure, onDismiss }: DataRetentionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!needsPrompt || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b bg-blue-50 border-blue-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <Database className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="text-sm font-medium truncate text-blue-800">
          Stale data is auto-deleted after 6 months by default. Configure your retention period or turn it off entirely.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onConfigure}
          className="rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
        >
          Configure
        </button>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          className="p-1 rounded-md transition-colors hover:bg-black/5 text-blue-800"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
