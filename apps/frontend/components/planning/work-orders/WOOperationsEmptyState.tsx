/**
 * WO Operations Empty State
 * Story 03.12: WO Operations (Routing Copy)
 *
 * Empty state when no operations exist for a Work Order
 */

'use client';

import { PackageOpen } from 'lucide-react';

interface WOOperationsEmptyStateProps {
  className?: string;
}

export function WOOperationsEmptyState({ className }: WOOperationsEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center ${className || ''}`}
      role="status"
      aria-label="No operations"
    >
      <PackageOpen
        className="h-12 w-12 text-muted-foreground/50 mb-4"
        aria-hidden="true"
      />
      <h3 className="text-lg font-medium">No Operations</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        No routing operations defined for this work order.
        Operations are copied from the routing when the WO is released.
      </p>
    </div>
  );
}

export default WOOperationsEmptyState;
