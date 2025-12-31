/**
 * WO Operation Types (Story 03.12)
 * Type definitions for Work Order Operations
 */

// ============================================================================
// ENUMS
// ============================================================================

export type WOOperationStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

// ============================================================================
// STATUS CONFIG
// ============================================================================

export const WO_OPERATION_STATUS_CONFIG: Record<WOOperationStatus, {
  label: string;
  bgColor: string;
  textColor: string;
}> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  skipped: {
    label: 'Skipped',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

// ============================================================================
// BASE TYPES
// ============================================================================

export interface WOOperation {
  id: string;
  wo_id: string;
  sequence: number;
  operation_name: string;
  description: string | null;
  machine_id: string | null;
  machine_code: string | null;
  machine_name: string | null;
  line_id: string | null;
  line_code: string | null;
  line_name: string | null;
  expected_duration_minutes: number | null;
  expected_yield_percent: number | null;
  actual_duration_minutes: number | null;
  actual_yield_percent: number | null;
  status: WOOperationStatus;
  started_at: string | null;
  completed_at: string | null;
  started_by: string | null;
  completed_by: string | null;
  started_by_user: { name: string } | null;
  completed_by_user: { name: string } | null;
  skip_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WOOperationDetail extends WOOperation {
  instructions: string | null;
  machine: {
    id: string;
    code: string;
    name: string;
  } | null;
  line: {
    id: string;
    code: string;
    name: string;
  } | null;
  duration_variance_minutes: number | null;
  yield_variance_percent: number | null;
  started_by_user: {
    id: string;
    name: string;
  } | null;
  completed_by_user: {
    id: string;
    name: string;
  } | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface WOOperationsListResponse {
  operations: WOOperation[];
  total: number;
}

export interface CopyRoutingResponse {
  success: boolean;
  operations_created: number;
  message: string;
}

// ============================================================================
// ROUTING OPERATION (Source for copy)
// ============================================================================

export interface RoutingOperation {
  id: string;
  routing_id: string;
  sequence: number;
  name: string;
  description: string | null;
  machine_id: string | null;
  line_id: string | null;
  duration: number;
  setup_time: number;
  cleanup_time: number;
  instructions: string | null;
  created_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format status for display
 */
export function formatOperationStatus(status: WOOperationStatus): string {
  return WO_OPERATION_STATUS_CONFIG[status]?.label ?? status;
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Calculate progress percentage from operations array
 */
export function calculateOperationsProgress(operations: WOOperation[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = operations.length;
  const completed = operations.filter(
    op => op.status === 'completed' || op.status === 'skipped'
  ).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

/**
 * Get the next pending operation in sequence
 */
export function getNextPendingOperation(operations: WOOperation[]): WOOperation | null {
  const sortedOps = [...operations].sort((a, b) => a.sequence - b.sequence);
  return sortedOps.find(op => op.status === 'pending') || null;
}

/**
 * Check if operation can be started (based on sequence)
 */
export function canStartOperation(
  operation: WOOperation,
  operations: WOOperation[],
  sequenceRequired: boolean = true
): boolean {
  if (operation.status !== 'pending') return false;

  if (!sequenceRequired) return true;

  // Check if all previous operations are completed
  const sortedOps = [...operations].sort((a, b) => a.sequence - b.sequence);
  const opIndex = sortedOps.findIndex(op => op.id === operation.id);

  if (opIndex <= 0) return true;

  const previousOps = sortedOps.slice(0, opIndex);
  return previousOps.every(op => op.status === 'completed' || op.status === 'skipped');
}
