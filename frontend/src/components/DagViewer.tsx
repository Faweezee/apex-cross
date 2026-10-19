'use client';

import { useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  ShieldAlert,
} from 'lucide-react';
import type { DagTask, SecurityTier } from '@/types';
import { cn, tierShort } from '@/lib/utils';
import { Badge, type BadgeTone } from './ui/Badge';
import { Button } from './ui/Button';

interface DagViewerProps {
  tasks: DagTask[];
  requiredTier?: SecurityTier | null;
  onExecute?: () => void;
  executeLabel?: string;
  executeDisabled?: boolean;
  executeDisabledReason?: string;
}

interface StatusStyle {
  tone: BadgeTone;
  label: string;
  icon: React.ReactNode;
  accent: string;
}

function statusStyle(status: string): StatusStyle {
  switch (status) {
    case 'COMPLETED':
      return {
        tone: 'success',
        label: 'Completed',
        icon: <CircleCheck size={12} strokeWidth={2} aria-hidden="true" />,
        accent: '#059669',
      };
    case 'RUNNING':
      return {
        tone: 'cobalt',
        label: 'Running',
        icon: <Activity size={12} strokeWidth={2} aria-hidden="true" />,
        accent: '#0284C7',
      };
    case 'BLOCKED':
      return {
        tone: 'danger',
        label: 'Blocked',
        icon: <ShieldAlert size={12} strokeWidth={2} aria-hidden="true" />,
        accent: '#DC2626',
      };
    case 'FAILED':
      return {
        tone: 'danger',
        label: 'Failed',
        icon: <CircleX size={12} strokeWidth={2} aria-hidden="true" />,
        accent: '#DC2626',
      };
    default:
      return {
        tone: 'warning',
        label: 'Pending',
        icon: <CircleDashed size={12} strokeWidth={2} aria-hidden="true" />,
        accent: '#D97706',
      };
  }
}

/**
 * Deterministic 4-step DAG visualizer — DESIGN_SYSTEM.md §7 / Flow 1.
 * Steps animate in sequence (ValidateStudent -> CheckQuota -> CompareCorridors ->
 * AwaitAuthorization). The final step surfaces the tier-appropriate execute action.
 */
export function DagViewer({
  tasks,
  requiredTier,
  onExecute,
  executeLabel = 'Authorize and execute',
  executeDisabled = false,
  executeDisabledReason,
}: DagViewerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (tasks.length === 0) return null;

  const blocked = tasks.some((task) => task.status === 'BLOCKED' || task.status === 'FAILED');

  return (
    <div data-testid="dag-viewer" className="glass-card card-sheen w-full max-w-chat p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity size={15} strokeWidth={1.5} className="text-cobalt" aria-hidden="true" />
          <h3 className="text-h4 font-semibold uppercase tracking-[0.05em] text-text-primary">
            Execution plan
          </h3>
        </div>
        {requiredTier ? (
          <Badge tone={requiredTier === 'TIER_3_BIOMETRIC' ? 'danger' : 'cobalt'}>
            {tierShort(requiredTier)} required
          </Badge>
        ) : null}
      </div>

      <div className="rule-hairline my-4" />

      {/* Steps */}
      <ol className="stagger flex flex-col gap-2" data-testid="dag-steps">
        {tasks.map((task, index) => {
          const style = statusStyle(task.status);
          const isOpen = expanded === task.task_id;
          const isLast = index === tasks.length - 1;
          const canExecute = isLast && task.status === 'PENDING' && !blocked && Boolean(onExecute);

          return (
            <li
              key={task.task_id}
              data-testid={`dag-step-${task.task_id}`}
              data-status={task.status}
              className="glass-inline card-sheen relative p-4"
              style={{ borderLeft: `2px solid ${style.accent}` }}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm font-mono text-mono-sm"
                  style={{ background: `${style.accent}22`, color: style.accent }}
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-small font-medium text-text-primary">{task.title}</h4>
                    <Badge tone={style.tone} icon={style.icon} animate>
                      {style.label}
                    </Badge>
                    <Badge tone="neutral">{tierShort(task.required_tier)}</Badge>
                  </div>

                  <p className="mt-1 text-small text-text-secondary">{task.description}</p>

                  {task.output ? (
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : task.task_id)}
                      aria-expanded={isOpen}
                      data-testid={`dag-step-toggle-${task.task_id}`}
                      className="mt-2 flex items-center gap-1 text-caption uppercase tracking-[0.05em] text-text-muted transition-colors duration-200 hover:text-mint"
                    >
                      {isOpen ? (
                        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <ChevronRight size={12} strokeWidth={2} aria-hidden="true" />
                      )}
                      {isOpen ? 'Hide details' : 'View details'}
                    </button>
                  ) : null}

                  {isOpen && task.output ? (
                    <pre
                      data-testid={`dag-step-output-${task.task_id}`}
                      className="mt-2 max-h-56 overflow-auto rounded-sm border border-glass p-3 font-mono text-mono-sm text-text-secondary"
                      style={{ background: 'rgba(7, 25, 30, 0.7)' }}
                    >
                      {JSON.stringify(task.output, null, 2)}
                    </pre>
                  ) : null}

                  {canExecute ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button onClick={onExecute} data-testid="dag-execute">
                        {executeLabel}
                      </Button>
                      {executeDisabled && executeDisabledReason ? (
                        <span className="text-caption text-text-muted">{executeDisabledReason}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 left-[34px] h-2 w-px"
                  style={{ background: 'rgba(255,255,255,0.10)' }}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {blocked ? (
        <p
          data-testid="dag-blocked-note"
          className={cn('mt-4 rounded-md p-3 text-small text-danger')}
          style={{ background: 'rgba(220, 38, 38, 0.10)', border: '1px solid rgba(220,38,38,0.28)' }}
        >
          This plan is blocked. Adjust the amount or resolve the flagged condition, then resubmit.
        </p>
      ) : null}
    </div>
  );
}

export default DagViewer;

