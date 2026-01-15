/**
 * Gantt Chart Types (Story 03.15)
 * TypeScript interfaces for WO Gantt Chart View
 */

// ============================================================================
// ENUMS / LITERAL TYPES
// ============================================================================

export type ZoomLevel = 'day' | 'week' | 'month';
export type ViewBy = 'line' | 'machine';
export type WOStatus = 'draft' | 'planned' | 'released' | 'in_progress' | 'on_hold' | 'completed' | 'closed';
export type MaterialStatus = 'ok' | 'low' | 'insufficient';

// ============================================================================
// DATA TYPES
// ============================================================================

export interface GanttProduct {
  id: string;
  code: string;
  name: string;
}

export interface GanttWorkOrder {
  id: string;
  wo_number: string;
  product: GanttProduct;
  status: WOStatus;
  priority: string;
  quantity: number;
  uom: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_hours: number;
  progress_percent: number | null;
  material_status: MaterialStatus;
  is_overdue: boolean;
  created_at: string;
}

export interface GanttSwimlane {
  id: string;
  name: string;
  type: ViewBy;
  capacity_hours_per_day?: number;
  work_orders: GanttWorkOrder[];
}

export interface GanttDateRange {
  from_date: string;
  to_date: string;
}

export interface GanttFilters {
  view_by: ViewBy;
  status: string[];
  line_id?: string | null;
  product_id?: string | null;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface GetGanttDataParams {
  view_by?: ViewBy;
  from_date?: string;
  to_date?: string;
  status?: string[];
  line_id?: string | null;
  product_id?: string | null;
  search?: string;
}

export interface ExportParams {
  from_date: string;
  to_date: string;
  view_by?: ViewBy;
  status?: string[];
}

export interface GanttDataResponse {
  swimlanes: GanttSwimlane[];
  date_range: GanttDateRange;
  filters_applied: GanttFilters;
}

// ============================================================================
// RESCHEDULE TYPES
// ============================================================================

export interface RescheduleParams {
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  production_line_id?: string;
  validate_dependencies?: boolean;
  validate_materials?: boolean;
}

export interface RescheduleResponse {
  success: boolean;
  data: {
    id: string;
    wo_number: string;
    scheduled_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    production_line_id: string;
    line_name: string;
    duration_hours: number;
  };
  warnings: string[];
  conflicts: AvailabilityConflict[];
}

export interface AvailabilityConflict {
  wo_id: string;
  wo_number: string;
  product_name: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
}

export interface AvailabilityCheckParams {
  line_id: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  exclude_wo_id?: string;
}

export interface AvailabilityCheckResponse {
  is_available: boolean;
  conflicts: AvailabilityConflict[];
  capacity_utilization: number;
  warnings: string[];
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface BarPosition {
  left: number;
  width: number;
  top?: number;
}

export interface DragPosition {
  date: string;
  startTime: string;
  endTime: string;
  swimlaneId?: string;
}

export interface GanttChartState {
  zoomLevel: ZoomLevel;
  selectedWO: GanttWorkOrder | null;
  draggingWO: GanttWorkOrder | null;
  hoveredWO: GanttWorkOrder | null;
  quickViewOpen: boolean;
  rescheduleDialogOpen: boolean;
  pendingReschedule: {
    workOrder: GanttWorkOrder;
    newPosition: DragPosition;
    warnings: string[];
  } | null;
}

// ============================================================================
// STATUS COLORS (per PLAN-016 wireframe)
// ============================================================================

export const STATUS_COLORS: Record<WOStatus | 'overdue', {
  bg: string;
  border: string;
  text: string;
  borderStyle: 'solid' | 'dashed';
}> = {
  draft: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700', borderStyle: 'dashed' },
  planned: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800', borderStyle: 'solid' },
  released: { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-800', borderStyle: 'solid' },
  in_progress: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-800', borderStyle: 'solid' },
  on_hold: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-800', borderStyle: 'solid' },
  completed: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', borderStyle: 'solid' },
  closed: { bg: 'bg-gray-200', border: 'border-gray-500', text: 'text-gray-700', borderStyle: 'solid' },
  overdue: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', borderStyle: 'solid' },
};

export const STATUS_HEX_COLORS: Record<WOStatus | 'overdue', { bg: string; border: string }> = {
  draft: { bg: '#F3F4F6', border: '#9CA3AF' },
  planned: { bg: '#DBEAFE', border: '#3B82F6' },
  released: { bg: '#CFFAFE', border: '#06B6D4' },
  in_progress: { bg: '#EDE9FE', border: '#8B5CF6' },
  on_hold: { bg: '#FED7AA', border: '#F97316' },
  completed: { bg: '#D1FAE5', border: '#10B981' },
  closed: { bg: '#E5E7EB', border: '#6B7280' },
  overdue: { bg: '#FEE2E2', border: '#EF4444' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get status color config for a work order
 */
export function getStatusColorConfig(workOrder: GanttWorkOrder) {
  // Overdue takes precedence (only if not completed/closed)
  if (workOrder.is_overdue && !['completed', 'closed'].includes(workOrder.status)) {
    return STATUS_COLORS.overdue;
  }
  return STATUS_COLORS[workOrder.status] || STATUS_COLORS.draft;
}

/**
 * Check if a WO is overdue
 */
export function isWorkOrderOverdue(workOrder: GanttWorkOrder): boolean {
  if (['completed', 'closed'].includes(workOrder.status)) {
    return false;
  }

  const now = new Date();
  const scheduledEnd = new Date(`${workOrder.scheduled_date}T${workOrder.scheduled_end_time}`);

  return scheduledEnd < now;
}

/**
 * Calculate duration in hours between two times
 */
export function calculateDurationHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return (endMinutes - startMinutes) / 60;
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour, 10);
  const period = hourNum >= 12 ? 'PM' : 'AM';
  const hour12 = hourNum % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

/**
 * Get label for work order based on zoom level
 */
export function getWOLabel(workOrder: GanttWorkOrder, zoomLevel: ZoomLevel): string {
  switch (zoomLevel) {
    case 'day':
      // Full: WO-00156: Chocolate Bar (1000pc)
      return `${workOrder.wo_number}: ${workOrder.product.name} (${workOrder.quantity}${workOrder.uom})`;
    case 'week': {
      // Truncated: WO-00156: Choc...
      const truncatedName = workOrder.product.name.length > 8
        ? workOrder.product.name.substring(0, 8) + '...'
        : workOrder.product.name;
      return `${workOrder.wo_number}: ${truncatedName}`;
    }
    case 'month':
      // Minimal: WO-156
      return workOrder.wo_number.replace('WO-00', 'WO-');
    default:
      return workOrder.wo_number;
  }
}

/**
 * Get default date range based on zoom level
 */
export function getDefaultDateRange(zoomLevel: ZoomLevel): GanttDateRange {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  switch (zoomLevel) {
    case 'day':
      // Show 3 days
      from.setDate(today.getDate() - 1);
      to.setDate(today.getDate() + 1);
      break;
    case 'week': {
      // Show current week (Monday to Sunday)
      const dayOfWeek = today.getDay();
      const monday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      from.setDate(today.getDate() + monday);
      to.setDate(from.getDate() + 6);
      break;
    }
    case 'month':
      // Show current month
      from.setDate(1);
      to.setMonth(today.getMonth() + 1);
      to.setDate(0); // Last day of current month
      break;
  }

  return {
    from_date: from.toISOString().split('T')[0],
    to_date: to.toISOString().split('T')[0],
  };
}
