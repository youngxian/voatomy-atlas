'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  searchQuery: string;
  createdAt: number;
}

const STORAGE_KEY = 'atlas_backlog_saved_filters';

function loadFilters(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistFilters(filters: SavedFilter[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch { /* quota exceeded — silently ignore */ }
}

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  useEffect(() => {
    setSavedFilters(loadFilters());
  }, []);

  const saveFilter = useCallback((name: string, filters: Record<string, string[]>, searchQuery: string) => {
    const entry: SavedFilter = {
      id: `sf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      filters,
      searchQuery,
      createdAt: Date.now(),
    };
    setSavedFilters(prev => {
      const next = [entry, ...prev].slice(0, 20);
      persistFilters(next);
      return next;
    });
    return entry;
  }, []);

  const deleteFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const next = prev.filter(f => f.id !== id);
      persistFilters(next);
      return next;
    });
  }, []);

  const renameFilter = useCallback((id: string, newName: string) => {
    setSavedFilters(prev => {
      const next = prev.map(f => (f.id === id ? { ...f, name: newName } : f));
      persistFilters(next);
      return next;
    });
  }, []);

  return { savedFilters, saveFilter, deleteFilter, renameFilter };
}
