'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <>
      {/* Desktop tabs */}
      <div className="hidden sm:flex items-center gap-0 border-b border-border/60">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'text-foreground font-bold'
                  : 'text-muted-foreground hover:text-secondary-foreground'
              )}
            >
              {/* Active pill background */}
              {isActive && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-x-1.5 inset-y-1.5 bg-secondary/60 rounded-lg -z-10"
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <motion.span
                  key={tab.badge}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={clsx(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.badge}
                </motion.span>
              )}
              {/* Active underline */}
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile dropdown */}
      <div className="sm:hidden relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center justify-between w-full px-4 py-3.5 border-b border-border/60 text-sm font-bold text-foreground min-h-[48px]"
        >
          <span className="flex items-center gap-2">
            {activeTabData?.label}
            {activeTabData?.badge !== undefined && activeTabData.badge > 0 && (
              <motion.span
                key={activeTabData.badge}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary"
              >
                {activeTabData.badge}
              </motion.span>
            )}
          </span>
          <ChevronDown
            className={clsx(
              'w-4 h-4 text-muted-foreground transition-transform',
              dropdownOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
              transition={reduceMotion ? { duration: 0.12 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 z-20 bg-card border border-border rounded-b-lg shadow-lg"
            >
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setDropdownOpen(false);
                    }}
                    className={clsx(
                      'flex items-center justify-between w-full px-4 py-3.5 text-sm transition-colors min-h-[48px]',
                      isActive
                        ? 'text-primary bg-primary/5 font-semibold'
                        : 'text-muted-foreground hover:text-secondary-foreground hover:bg-secondary'
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <motion.span
                        key={tab.badge}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className={clsx(
                          'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {tab.badge}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
