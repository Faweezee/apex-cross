'use client';

import { useCallback, useState } from 'react';
import { Header, type AppView } from '@/components/Header';
import { WorkspaceView } from '@/components/WorkspaceView';
import { AuditTable } from '@/components/AuditTable';

/**
 * ApexCross application shell — DESIGN_SYSTEM.md §8.
 * One workspace, two surfaces (Workspace / Ledger). The fixed 56px header never scrolls.
 * View switching is an instant cross-fade; no route transitions, no breadcrumbs.
 */
export default function Home() {
  const [view, setView] = useState<AppView>('workspace');

  const handleViewChange = useCallback((next: AppView) => {
    setView(next);
  }, []);

  return (
    <div className="relative min-h-screen bg-abyss">
      {/* Backdrop texture layers */}
      <div aria-hidden="true" className="grid-pattern pointer-events-none fixed inset-0 opacity-60" />
      <div aria-hidden="true" className="hero-mesh pointer-events-none fixed inset-x-0 top-0 h-[420px]" />

      <Header view={view} onViewChange={handleViewChange} />

      <main className="relative pt-[calc(56px+64px)]" data-view={view}>
        <div key={view} className="animate-fade-in">
          {view === 'workspace' ? <WorkspaceView /> : <AuditTable />}
        </div>
      </main>
    </div>
  );
}

