/**
 * LP Status Audit Trail Component
 * Story: 05.4 - LP Status Management
 * Displays history of status and QA status changes with audit details
 *
 * States:
 * - Loading: Shows skeleton placeholders
 * - Empty: No audit history
 * - Success: Displays audit entries in table
 * - Error: Failed to load audit history
 *
 * SECURITY (verified 2026-01-02):
 * - XSS Protection: SAFE - React auto-escapes all values rendered via JSX.
 *   All user-provided data (reason, changed_by_user.name, changed_by_user.email)
 *   is rendered via {entry.field} syntax which React auto-escapes.
 *   No dangerouslySetInnerHTML or html-react-parser used.
 * - No direct DOM manipulation with user data.
 *
 * Per wireframe WH-004 and Story 05.4 AC-14.
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface StatusAuditEntry {
  id: string;
  lp_id: string;
  field_name: 'status' | 'qa_status';
  old_value: string;
  new_value: string;
  reason: string | null;
  changed_by: string; // User ID
  changed_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  changed_at: string; // ISO timestamp
  created_at?: string;
}

interface LPStatusAuditTrailProps {
  lpId: string;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDateTime(isoString);
}

function getStatusBadgeColor(value: string): string {
  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800 border-green-300',
    reserved: 'bg-blue-100 text-blue-800 border-blue-300',
    consumed: 'bg-gray-100 text-gray-800 border-gray-300',
    blocked: 'bg-red-100 text-red-800 border-red-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    passed: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    quarantine: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  return statusColors[value.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Clock className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        No Status History
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        This license plate has no status change history yet.
      </p>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Failed to Load Audit Trail</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LPStatusAuditTrail({ lpId, className }: LPStatusAuditTrailProps) {
  const [auditEntries, setAuditEntries] = useState<StatusAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuditTrail() {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/warehouse/license-plates/${lpId}/status-audit`);
        // if (!response.ok) throw new Error('Failed to fetch audit trail');
        // const data = await response.json();
        // setAuditEntries(data);

        // Simulate API call with mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockEntries: StatusAuditEntry[] = [
          {
            id: '1',
            lp_id: lpId,
            field_name: 'qa_status',
            old_value: 'pending',
            new_value: 'passed',
            reason: 'QA inspection passed - visual check OK',
            changed_by: 'user-123',
            changed_by_user: {
              id: 'user-123',
              name: 'John Smith',
              email: 'john.smith@example.com',
            },
            changed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
          {
            id: '2',
            lp_id: lpId,
            field_name: 'status',
            old_value: 'available',
            new_value: 'reserved',
            reason: 'Reserved for Work Order WO-2024-00089',
            changed_by: 'user-456',
            changed_by_user: {
              id: 'user-456',
              name: 'Sarah Johnson',
              email: 'sarah.j@example.com',
            },
            changed_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          },
          {
            id: '3',
            lp_id: lpId,
            field_name: 'status',
            old_value: 'blocked',
            new_value: 'available',
            reason: 'Issue resolved - packaging repaired',
            changed_by: 'user-123',
            changed_by_user: {
              id: 'user-123',
              name: 'John Smith',
              email: 'john.smith@example.com',
            },
            changed_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            id: '4',
            lp_id: lpId,
            field_name: 'status',
            old_value: 'available',
            new_value: 'blocked',
            reason: 'Damaged packaging detected',
            changed_by: 'user-789',
            changed_by_user: {
              id: 'user-789',
              name: 'Mike Chen',
              email: 'mike.c@example.com',
            },
            changed_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          },
          {
            id: '5',
            lp_id: lpId,
            field_name: 'qa_status',
            old_value: 'pending',
            new_value: 'pending',
            reason: 'Auto-set on LP creation',
            changed_by: 'system',
            changed_by_user: {
              id: 'system',
              name: 'System',
              email: 'system@monopilot.com',
            },
            changed_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          },
        ];

        setAuditEntries(mockEntries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit trail');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAuditTrail();
  }, [lpId]);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <h3 className="text-lg font-semibold">Status History</h3>
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <h3 className="text-lg font-semibold">Status History</h3>
        <ErrorState error={error} />
      </div>
    );
  }

  if (auditEntries.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <h3 className="text-lg font-semibold">Status History</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Status History</h3>
        <Badge variant="outline" className="text-xs">
          {auditEntries.length} {auditEntries.length === 1 ? 'change' : 'changes'}
        </Badge>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900">
              <TableHead className="font-semibold">Field</TableHead>
              <TableHead className="font-semibold">Old Value</TableHead>
              <TableHead className="font-semibold">New Value</TableHead>
              <TableHead className="font-semibold">Reason</TableHead>
              <TableHead className="font-semibold">Changed By</TableHead>
              <TableHead className="font-semibold">Changed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditEntries.map((entry) => (
              <TableRow key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <TableCell className="font-medium">
                  <Badge variant="outline" className="whitespace-nowrap">
                    {entry.field_name === 'status' ? 'LP Status' : 'QA Status'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'whitespace-nowrap border',
                      getStatusBadgeColor(entry.old_value)
                    )}
                  >
                    {entry.old_value}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'whitespace-nowrap border',
                      getStatusBadgeColor(entry.new_value)
                    )}
                  >
                    {entry.new_value}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  {entry.reason ? (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {entry.reason}
                    </span>
                  ) : (
                    <span className="text-sm italic text-gray-400">No reason provided</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {entry.changed_by_user?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.changed_by_user?.email || entry.changed_by}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{formatDateTime(entry.changed_at)}</span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(entry.changed_at)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>Showing all status changes, sorted by most recent first</span>
      </div>
    </div>
  );
}
