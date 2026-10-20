'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Broadcast } from '@/components/icons';
import { getHealth } from '@/lib/api';
import { cn } from '@/lib/utils';

export type HealthState = 'checking' | 'connected' | 'disconnected';

interface HealthIndicatorProps {
  /** Poll interval in ms. Default 30000 per DESIGN_SYSTEM.md §8.3. */
  intervalMs?: number;
  className?: string;
}

const STATE_STYLE: Record<HealthState, { color: string; label: string; iconClass: string }> = {
  connected: { color: '#02F5A1', label: 'Connected', iconClass: 'animate-signal-pulse' },
  disconnected: { color: '#DC2626', label: 'Offline', iconClass: '' },
  checking: { color: '#D97706', label: 'Checking', iconClass: 'animate-[spin_1.5s_linear_infinite]' },
};

/**
 * Live backend health indicator — DESIGN_SYSTEM.md §8.3.
 * Uses the Phosphor `Broadcast` signal icon (never a generic heartbeat dot).
 * Polls `GET /api/health` on an interval and surfaces connect/offline/checking states.
 */
export function HealthIndicator({ intervalMs = 30000, className }: HealthIndicatorProps) {
  const [state, setState] = useState<HealthState>('checking');
  const mounted = useRef(true);

  const check = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const result = await getHealth(controller.signal);
      if (!mounted.current) return;
      setState(result.status === 'healthy' ? 'connected' : 'disconnected');
    } catch {
      if (!mounted.current) return;
      setState('disconnected');
    } finally {
      clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void check();
    const id = setInterval(() => void check(), intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [check, intervalMs]);

  const style = STATE_STYLE[state];

  return (
    <div
      data-testid="health-indicator"
      data-state={state}
      className={cn('glass-inline flex items-center gap-2 px-2.5 py-1.5', className)}
      title={`Backend status: ${style.label}`}
    >
      <Broadcast
        aria-hidden="true"
        size={15}
        weight="fill"
        className={style.iconClass}
        style={{ color: style.color }}
      />
      <span
        className="text-caption font-medium uppercase tracking-[0.05em]"
        style={{ color: style.color }}
      >
        {style.label}
      </span>
    </div>
  );
}

export default HealthIndicator;
