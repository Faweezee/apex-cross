'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { HealthIndicator } from './HealthIndicator';
import { ThemeToggle } from './ThemeToggle';

export type AppView = 'workspace' | 'ledger';

const TABS: { id: AppView; label: string; shortcut: string }[] = [
  { id: 'workspace', label: 'Workspace', shortcut: '1' },
  { id: 'ledger', label: 'Ledger', shortcut: '2' },
];

interface HeaderProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  rightSlot?: React.ReactNode;
}

/**
 * Fixed institutional header — DESIGN_SYSTEM.md §8.
 * 56px tall, glass surface, two text-only tabs with a mint accent bar beneath the
 * active label, live signal status, and theme toggle. Never scrolls.
 */
export function Header({ view, onViewChange, rightSlot }: HeaderProps) {
  /* Keyboard shortcuts: Cmd/Ctrl + 1 -> Workspace, Cmd/Ctrl + 2 -> Ledger */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key === '1') {
        event.preventDefault();
        onViewChange('workspace');
      } else if (event.key === '2') {
        event.preventDefault();
        onViewChange('ledger');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onViewChange]);

  return (
    <header
      data-testid="app-header"
      className="fixed inset-x-0 top-0 z-40 h-header border-b border-glass"
      style={{
        background: 'rgba(7, 25, 30, 0.78)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
      }}
    >
      {/* Hero mesh glow behind the header */}
      <div aria-hidden="true" className="hero-mesh pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex h-full max-w-content items-center gap-6 px-6">
        {/* Wordmark */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-sm"
            style={{
              background: 'linear-gradient(135deg, #02F5A1 0%, #0284C7 100%)',
              boxShadow: '0 0 16px rgba(2,245,161,0.35)',
            }}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#07191E" aria-hidden="true">
              <path d="M12 2 2 21h5.2l1.9-3.9h5.8l1.9 3.9H22L12 2Zm0 6.4 2.1 4.5h-4.2L12 8.4Z" />
            </svg>
          </span>
          <span className="text-h4 font-semibold uppercase tracking-[0.14em] text-text-primary">
            ApexCross
          </span>
        </div>

        {/* Tabs */}
        <nav aria-label="Primary" className="flex h-full items-stretch gap-1">
          {TABS.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`nav-${tab.id}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onViewChange(tab.id)}
                title={`${tab.label} (Ctrl/Cmd + ${tab.shortcut})`}
                className={cn(
                  'relative flex items-center px-3 text-small transition-colors duration-200',
                  active ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {tab.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-2 bottom-0 h-0.5 rounded-sm transition-opacity duration-200',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{ background: 'linear-gradient(90deg, #02F5A1 0%, #0284C7 100%)' }}
                />
              </button>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {rightSlot}
          <span aria-hidden="true" className="h-5 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <HealthIndicator />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default Header;
