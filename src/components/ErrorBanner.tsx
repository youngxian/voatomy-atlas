'use client';

import { useEffect } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, onDismiss, className = '' }: ErrorBannerProps) {
  useEffect(() => {
    if (!onDismiss) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 shadow-lg animate-in fade-in ${className}`}
    >
      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
      <span className="text-sm text-destructive">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline">
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="ml-1 p-0.5 rounded hover:bg-destructive/10 text-destructive">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
