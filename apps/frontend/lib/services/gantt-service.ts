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
      capacity_hours_per_day: undefined,
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
 * Generates a real PDF with Gantt chart visualization using jsPDF
 */
export async function exportGanttPDF(
  supabase: SupabaseClient,
  params: ExportParams
): Promise<Blob> {
  // Dynamically import jsPDF (server-side compatible)
  const { jsPDF } = await import('jspdf');

  // Get Gantt data
  const ganttData = await getGanttData(supabase, {
    view_by: params.view_by || 'line',
    from_date: params.from_date,
    to_date: params.to_date,
    status: params.status,
  });

  // Create PDF document (landscape for better Gantt display)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Constants for layout
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const headerHeight = 25;
  const swimlaneHeight = 20;
  const timelineHeight = 12;
  const barHeight = 14;

  // Colors (RGB arrays)
  const statusColors: Record<string, [number, number, number]> = {
    draft: [243, 244, 246],       // gray #F3F4F6
    planned: [219, 234, 254],     // blue #DBEAFE
    released: [207, 250, 254],    // cyan #CFFAFE
    in_progress: [237, 233, 254], // purple #EDE9FE
    on_hold: [254, 215, 170],     // orange #FED7AA
    completed: [209, 250, 229],   // green #D1FAE5
    overdue: [254, 226, 226],     // red #FEE2E2
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Work Order Gantt Schedule', margin, margin);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Date Range: ${ganttData.date_range.from_date} to ${ganttData.date_range.to_date}`,
    margin,
    margin + 7
  );
  doc.text(
    `View By: ${ganttData.filters_applied.view_by} | Generated: ${new Date().toISOString().split('T')[0]}`,
    margin,
    margin + 12
  );

  // Calculate timeline dimensions
  const fromDate = new Date(ganttData.date_range.from_date);
  const toDate = new Date(ganttData.date_range.to_date);
  const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const swimlaneLabelWidth = 45;
  const chartStartX = margin + swimlaneLabelWidth;
  const chartWidth = pageWidth - chartStartX - margin;
  const dayWidth = chartWidth / Math.max(totalDays, 1);

  let currentY = margin + headerHeight;

  // Draw timeline header
  doc.setFillColor(240, 240, 240);
  doc.rect(chartStartX, currentY, chartWidth, timelineHeight, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);

  for (let i = 0; i < totalDays && i < 31; i++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);
    const dayLabel = `${date.getDate()}`;
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
    const x = chartStartX + (i * dayWidth) + (dayWidth / 2);

    // Show month for first day or start of month
    if (i === 0 || date.getDate() === 1) {
      doc.text(monthLabel, x, currentY + 4, { align: 'center' });
    }
    doc.text(dayLabel, x, currentY + 9, { align: 'center' });

    // Draw vertical grid line
    doc.setDrawColor(220, 220, 220);
    doc.line(chartStartX + (i * dayWidth), currentY, chartStartX + (i * dayWidth), currentY + timelineHeight);
  }

  currentY += timelineHeight;

  // Draw swimlanes and WO bars
  for (const swimlane of ganttData.swimlanes) {
    // Check if we need a new page
    if (currentY + swimlaneHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }

    // Swimlane background
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, currentY, pageWidth - (2 * margin), swimlaneHeight, 'F');

    // Swimlane border
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, currentY, pageWidth - (2 * margin), swimlaneHeight);

    // Swimlane label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    const label = swimlane.name.length > 15
      ? swimlane.name.substring(0, 14) + '...'
      : swimlane.name;
    doc.text(label, margin + 2, currentY + (swimlaneHeight / 2) + 2);

    // Draw WO bars
    for (const wo of swimlane.work_orders) {
      if (!wo.scheduled_date) continue;

      const woDate = new Date(wo.scheduled_date);
      const dayOffset = Math.floor((woDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayOffset < 0 || dayOffset >= totalDays) continue;

      // Calculate bar position based on time
      const startMinutes = timeToMinutes(wo.scheduled_start_time || '08:00');
      const endMinutes = timeToMinutes(wo.scheduled_end_time || '16:00');
      const dayFraction = (startMinutes - 480) / 960; // 8:00 = 480, 8:00-24:00 = 960
      const durationFraction = (endMinutes - startMinutes) / 960;

      const barX = chartStartX + (dayOffset * dayWidth) + (dayFraction * dayWidth);
      const barWidth = Math.max(durationFraction * dayWidth, dayWidth * 0.3); // Minimum width
      const barY = currentY + 3;

      // Get status color
      const status = wo.is_overdue ? 'overdue' : wo.status;
      const color = statusColors[status] || statusColors.planned;

      // Draw bar
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');

      // Draw border
      doc.setDrawColor(150, 150, 150);
      doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1);

      // WO label
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      const woLabel = wo.wo_number.replace('WO-', '');
      if (barWidth > 8) {
        doc.text(woLabel, barX + 1, barY + 5);
      }

      // Progress bar for in_progress WOs
      if (wo.status === 'in_progress' && wo.progress_percent && wo.progress_percent > 0) {
        const progressWidth = barWidth * (wo.progress_percent / 100);
        doc.setFillColor(100, 100, 200);
        doc.rect(barX, barY + barHeight - 2, progressWidth, 2, 'F');
      }
    }

    currentY += swimlaneHeight;
  }

  // Legend
  if (currentY + 20 > pageHeight - margin) {
    doc.addPage();
    currentY = margin;
  }

  currentY += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Legend:', margin, currentY);

  let legendX = margin + 15;
  const legendY = currentY - 2;
  const legendEntries = [
    { label: 'Planned', color: statusColors.planned },
    { label: 'Released', color: statusColors.released },
    { label: 'In Progress', color: statusColors.in_progress },
    { label: 'On Hold', color: statusColors.on_hold },
    { label: 'Completed', color: statusColors.completed },
    { label: 'Overdue', color: statusColors.overdue },
  ];

  doc.setFont('helvetica', 'normal');
  for (const entry of legendEntries) {
    doc.setFillColor(entry.color[0], entry.color[1], entry.color[2]);
    doc.rect(legendX, legendY, 8, 4, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.rect(legendX, legendY, 8, 4);
    doc.setTextColor(60, 60, 60);
    doc.text(entry.label, legendX + 10, legendY + 3);
    legendX += 35;
  }

  // Convert to blob
  const pdfOutput = doc.output('arraybuffer');
  const blob = new Blob([pdfOutput], { type: 'application/pdf' });

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
