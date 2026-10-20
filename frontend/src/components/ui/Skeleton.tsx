import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

/**
 * Skeleton loader primitive — DESIGN_SYSTEM.md §5, radius 8px shimmer.
 */
export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton', className)}
      style={{ width, height }}
    />
  );
}

/**
 * Chat message skeleton — three stacked lines representing a streaming agent reply.
 */
export function MessageSkeleton() {
  return (
    <div className="glass-card card-sheen w-full max-w-[520px] space-y-3 p-4" data-testid="message-skeleton">
      <Skeleton width="60%" height="12px" />
      <Skeleton width="92%" height="12px" />
      <Skeleton width="78%" height="12px" />
    </div>
  );
}

/**
 * Table row skeleton for the audit ledger.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" data-testid="table-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height="44px" />
      ))}
    </div>
  );
}

export default Skeleton;
