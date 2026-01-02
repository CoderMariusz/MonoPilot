/**
 * Gantt Service (Story 03.15)
 * Service for Gantt chart data operations
 *
 * Contains both:
 * - Server-side functions (accept SupabaseClient for API routes)
 * - Client-side functions (call API endpoints for frontend)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  GanttFilters,
  GanttDataResponse,
  GanttSwimlane,
  GanttWorkOrder,
  GetGanttDataParams,
  RescheduleParams,
  RescheduleResponse,
  AvailabilityCheckParams,
  AvailabilityCheckResponse,
  ExportParams,
} from '@/lib/types/gantt';
import { DEFAULT_STATUS_FILTER, getDefaultDateRange } from '@/lib/validation/gantt-schemas';

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class GanttError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number = 400) {
    super(message);
    this.name = 'GanttError';
    this.code = code;
    this.status = status;
  }
}

// ============================================================================
// SERVER-SIDE FUNCTIONS (for API routes)
// ============================================================================

/**
 * Get Gantt data grouped by production line or machine
 * Used by GET /api/planning/work-orders/gantt
 */
export async function getGanttData(
  supabase: SupabaseClient,
  params: GetGanttDataParams
): Promise<GanttDataResponse> {
  // Apply defaults
  const defaults = getDefaultDateRange();
  const viewBy = params.view_by || 'line';
  const fromDate = params.from_date || defaults.from_date;
  const toDate = params.to_date || defaults.to_date;
  const statusFilter = params.status && params.status.length > 0
    ? params.status
    : DEFAULT_STATUS_FILTER;

  // Query work orders with filters
  let woQuery = supabase
    .from('work_orders')
    .select(`
      id,
      wo_number,
      status,
      priority,
      planned_quantity,
      produced_quantity,
      uom,
      planned_start_date,
      scheduled_start_time,
      scheduled_end_time,
      production_line_id,
      machine_id,
      created_at,
      product:products!inner(id, code, name)
    `)
    .gte('planned_start_date', fromDate)
    .lte('planned_start_date', toDate)
    .in('status', statusFilter)
    .order('scheduled_start_time', { ascending: true });

  // Apply optional filters
  if (params.line_id) {
    woQuery = woQuery.eq('production_line_id', params.line_id);
  }
  if (params.product_id) {
    woQuery = woQuery.eq('product_id', params.product_id);
  }
  if (params.search) {
    woQuery = woQuery.or(`wo_number.ilike.%${params.search}%`);
  }

  const { data: workOrders, error: woError } = await woQuery;

  if (woError) {
    throw new GanttError(`Failed to fetch work orders: ${woError.message}`, 'FETCH_ERROR', 500);
  }

  // Query swimlanes based on view_by
  let swimlanes: GanttSwimlane[] = [];

  if (viewBy === 'line') {
    // Get production lines
    let lineQuery = supabase
      .from('production_lines')
      .select('id, name, capacity_hours_per_day')
      .eq('is_active', true)
      .order('name');

    if (params.line_id) {
      lineQuery = lineQuery.eq('id', params.line_id);
    }

    const { data: lines, error: lineError } = await lineQuery;

    if (lineError) {
      throw new GanttError(`Failed to fetch production lines: ${lineError.message}`, 'FETCH_ERROR', 500);
    }

    swimlanes = (lines || []).map(line => ({
      id: line.id,
      name: line.name,
      type: 'line' as const,
      capacity_hours_per_day: line.capacity_hours_per_day,
      work_orders: [],
    }));
  } else {
    // Get machines
    const { data: machines, error: machineError } = await supabase
      .from('machines')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (machineError) {
      throw new GanttError(`Failed to fetch machines: ${machineError.message}`, 'FETCH_ERROR', 500);
    }

    swimlanes = (machines || []).map(machine => ({
      id: machine.id,
      name: machine.name,
      type: 'machine' as const,
      capacity_hours_per_day: null,
      work_orders: [],
    }));
  }

  // Group work orders into swimlanes
  const now = new Date();

  for (const wo of workOrders || []) {
    const swimlaneId = viewBy === 'line' ? wo.production_line_id : wo.machine_id;
    const swimlane = swimlanes.find(s => s.id === swimlaneId);

    if (swimlane) {
      // Calculate derived fields
      const progressPercent = wo.planned_quantity > 0
        ? Math.round((wo.produced_quantity / wo.planned_quantity) * 100)
        : 0;

      const scheduledEnd = wo.scheduled_end_time && wo.planned_start_date
        ? new Date(`${wo.planned_start_date}T${wo.scheduled_end_time}`)
        : null;

      const isOverdue = scheduledEnd
        ? scheduledEnd < now && !['completed', 'closed'].includes(wo.status)
        : false;

      // Calculate duration
      let durationHours = 0;
      if (wo.scheduled_start_time && wo.scheduled_end_time) {
        const [startH, startM] = wo.scheduled_start_time.split(':').map(Number);
        const [endH, endM] = wo.scheduled_end_time.split(':').map(Number);
        durationHours = (endH * 60 + endM - startH * 60 - startM) / 60;
      }

      const product = wo.product as any;

      const ganttWO: GanttWorkOrder = {
        id: wo.id,
        wo_number: wo.wo_number,
        product: {
          id: product?.id || '',
          code: product?.code || '',
          name: product?.name || '',
        },
        status: wo.status,
        priority: wo.priority || 'normal',
        quantity: wo.planned_quantity,
        uom: wo.uom,
        scheduled_date: wo.planned_start_date,
        scheduled_start_time: wo.scheduled_start_time || '08:00',
        scheduled_end_time: wo.scheduled_end_time || '16:00',
        duration_hours: durationHours,
        progress_percent: progressPercent,
        material_status: 'ok', // TODO: Calculate from wo_materials
        is_overdue: isOverdue,
        created_at: wo.created_at,
      };

      swimlane.work_orders.push(ganttWO);
    }
  }

  // Filter out empty swimlanes (unless specifically requested line_id)
  if (!params.line_id) {
    swimlanes = swimlanes.filter(s => s.work_orders.length > 0);
  }

  return {
    swimlanes,
    date_range: {
      from_date: fromDate,
      to_date: toDate,
    },
    filters_applied: {
      view_by: viewBy,
      status: statusFilter,
      line_id: params.line_id || null,
      product_id: params.product_id || null,
    },
  };
}

/**
 * Check line availability for a time slot
 * Used by POST /api/planning/work-orders/check-availability
 */
export async function checkLineAvailability(
  supabase: SupabaseClient,
  params: AvailabilityCheckParams
): Promise<AvailabilityCheckResponse> {
  // Query for overlapping work orders
  let query = supabase
    .from('work_orders')
    .select(`
      id,
      wo_number,
      scheduled_start_time,
      scheduled_end_time,
      product:products(name)
    `)
    .eq('production_line_id', params.line_id)
    .eq('planned_start_date', params.scheduled_date)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .neq('status', 'closed');

  // Exclude the WO being dragged
  if (params.exclude_wo_id) {
    query = query.neq('id', params.exclude_wo_id);
  }

  const { data: existingWOs, error } = await query;

  if (error) {
    throw new GanttError(`Failed to check availability: ${error.message}`, 'CHECK_ERROR', 500);
  }

  // Check for time overlaps
  const conflicts = [];
  const newStartMinutes = timeToMinutes(params.scheduled_start_time);
  const newEndMinutes = timeToMinutes(params.scheduled_end_time);

  for (const wo of existingWOs || []) {
    if (!wo.scheduled_start_time || !wo.scheduled_end_time) continue;

    const woStartMinutes = timeToMinutes(wo.scheduled_start_time);
    const woEndMinutes = timeToMinutes(wo.scheduled_end_time);

    // Check if times overlap
    if (newStartMinutes < woEndMinutes && newEndMinutes > woStartMinutes) {
      const product = wo.product as any;
      conflicts.push({
        wo_id: wo.id,
        wo_number: wo.wo_number,
        product_name: product?.name || 'Unknown',
        scheduled_start_time: wo.scheduled_start_time,
        scheduled_end_time: wo.scheduled_end_time,
      });
    }
  }

  // Calculate capacity utilization
  const totalScheduledMinutes = (existingWOs || []).reduce((total, wo) => {
    if (!wo.scheduled_start_time || !wo.scheduled_end_time) return total;
    return total + (timeToMinutes(wo.scheduled_end_time) - timeToMinutes(wo.scheduled_start_time));
  }, 0);

  // Get line capacity
  const { data: line } = await supabase
    .from('production_lines')
    .select('capacity_hours_per_day')
    .eq('id', params.line_id)
    .single();

  const capacityMinutes = (line?.capacity_hours_per_day || 8) * 60;
  const capacityUtilization = Math.min(totalScheduledMinutes / capacityMinutes, 1.0);

  // Generate warnings
  const warnings: string[] = [];
  if (capacityUtilization > 0.8) {
    warnings.push(`Line capacity is ${Math.round(capacityUtilization * 100)}% utilized on this date`);
  }

  return {
    is_available: conflicts.length === 0,
    conflicts,
    capacity_utilization: capacityUtilization,
    warnings,
  };
}

/**
 * Reschedule a work order
 * Used by POST /api/planning/work-orders/:id/reschedule
 */
export async function rescheduleWO(
  supabase: SupabaseClient,
  woId: string,
  params: RescheduleParams
): Promise<RescheduleResponse> {
  // 1. Get WO to verify it exists and check status
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, production_line_id')
    .eq('id', woId)
    .single();

  if (woError || !wo) {
    throw new GanttError('Work order not found', 'WO_NOT_FOUND', 404);
  }

  // 2. Check if WO can be rescheduled
  if (['completed', 'closed', 'cancelled'].includes(wo.status)) {
    throw new GanttError('Cannot reschedule completed or closed work orders', 'WO_STATUS_INVALID', 400);
  }

  // 3. Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledDate = new Date(params.scheduled_date);
  scheduledDate.setHours(0, 0, 0, 0);

  if (scheduledDate < today) {
    throw new GanttError('Cannot schedule in the past', 'PAST_DATE', 400);
  }

  // 4. Check line availability
  const lineId = params.production_line_id || wo.production_line_id;

  if (lineId) {
    const availability = await checkLineAvailability(supabase, {
      line_id: lineId,
      scheduled_date: params.scheduled_date,
      scheduled_start_time: params.scheduled_start_time,
      scheduled_end_time: params.scheduled_end_time,
      exclude_wo_id: woId,
    });

    if (!availability.is_available) {
      throw new GanttError('Line already scheduled for this time slot', 'LINE_CONFLICT', 409);
    }
  }

  // 5. Update work order
  const updateData: Record<string, any> = {
    planned_start_date: params.scheduled_date,
    scheduled_start_time: params.scheduled_start_time,
    scheduled_end_time: params.scheduled_end_time,
    updated_at: new Date().toISOString(),
  };

  if (params.production_line_id) {
    updateData.production_line_id = params.production_line_id;
  }

  const { data: updatedWO, error: updateError } = await supabase
    .from('work_orders')
    .update(updateData)
    .eq('id', woId)
    .select(`
      id,
      wo_number,
      planned_start_date,
      scheduled_start_time,
      scheduled_end_time,
      production_line_id,
      production_line:production_lines(name)
    `)
    .single();

  if (updateError) {
    throw new GanttError(`Failed to reschedule work order: ${updateError.message}`, 'UPDATE_ERROR', 500);
  }

  // Calculate duration
  const durationHours = calculateDuration(params.scheduled_start_time, params.scheduled_end_time);
  const productionLine = updatedWO.production_line as any;

  return {
    success: true,
    data: {
      id: updatedWO.id,
      wo_number: updatedWO.wo_number,
      scheduled_date: updatedWO.planned_start_date,
      scheduled_start_time: updatedWO.scheduled_start_time,
      scheduled_end_time: updatedWO.scheduled_end_time,
      production_line_id: updatedWO.production_line_id,
      line_name: productionLine?.name || '',
      duration_hours: durationHours,
    },
    warnings: [],
    conflicts: [],
  };
}

/**
 * Export Gantt chart to PDF
 * Used by GET /api/planning/work-orders/gantt/export
 * Note: This is a placeholder - actual PDF generation would require a PDF library
 */
export async function exportGanttPDF(
  supabase: SupabaseClient,
  params: ExportParams
): Promise<Blob> {
  // Get Gantt data
  const ganttData = await getGanttData(supabase, {
    view_by: params.view_by || 'line',
    from_date: params.from_date,
    to_date: params.to_date,
    status: params.status,
  });

  // For now, return a simple text representation as a blob
  // In production, this would use a PDF library like pdf-lib or jspdf
  const content = JSON.stringify(ganttData, null, 2);
  const blob = new Blob([content], { type: 'application/pdf' });

  return blob;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert time string (HH:mm) to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Calculate duration in hours between two time strings
 */
function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return (endMinutes - startMinutes) / 60;
}

// ============================================================================
// CLIENT-SIDE API FUNCTIONS
// ============================================================================

/**
 * Fetch Gantt chart data with filters (client-side)
 */
export async function fetchGanttData(filters: GanttFilters): Promise<GanttDataResponse> {
  const params = new URLSearchParams();

  if (filters.view_by) params.append('view_by', filters.view_by);
  if (filters.from_date) params.append('from_date', filters.from_date);
  if (filters.to_date) params.append('to_date', filters.to_date);
  if (filters.status && filters.status.length > 0) {
    filters.status.forEach(s => params.append('status[]', s));
  }
  if (filters.line_id) params.append('line_id', filters.line_id);
  if (filters.product_id) params.append('product_id', filters.product_id);
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = `/api/planning/work-orders/gantt${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch Gantt data');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Reschedule a work order via drag-and-drop (client-side)
 */
export async function rescheduleWOClient(
  woId: string,
  params: RescheduleParams
): Promise<RescheduleResponse> {
  const response = await fetch(`/api/planning/work-orders/${woId}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to reschedule work order');
  }

  return response.json();
}

/**
 * Check line availability before dropping (client-side)
 */
export async function checkAvailabilityClient(
  params: AvailabilityCheckParams
): Promise<AvailabilityCheckResponse> {
  const response = await fetch('/api/planning/work-orders/check-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to check availability');
  }

  return response.json();
}

/**
 * Export Gantt chart to PDF (client-side)
 */
export async function exportGanttToPDFClient(
  filters: GanttFilters
): Promise<Blob> {
  const params = new URLSearchParams();

  params.append('format', 'pdf');
  if (filters.from_date) params.append('from_date', filters.from_date);
  if (filters.to_date) params.append('to_date', filters.to_date);
  if (filters.view_by) params.append('view_by', filters.view_by);

  const response = await fetch(`/api/planning/work-orders/gantt/export?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to export PDF');
  }

  return response.blob();
}

/**
 * Download exported PDF (client-side utility)
 */
export function downloadPDF(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `gantt-schedule-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// EXPORT SERVICE OBJECT (for client-side usage)
// ============================================================================

export const GanttClientService = {
  fetchGanttData,
  rescheduleWO: rescheduleWOClient,
  checkAvailability: checkAvailabilityClient,
  exportGanttToPDF: exportGanttToPDFClient,
  downloadPDF,
};

// Also export server-side service for API routes
export const GanttService = {
  getGanttData,
  rescheduleWO,
  checkLineAvailability,
  exportGanttPDF,
};

export default GanttService;
