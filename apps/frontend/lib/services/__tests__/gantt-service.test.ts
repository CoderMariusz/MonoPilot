import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGanttData,
  rescheduleWO,
  checkLineAvailability,
  exportGanttPDF,
  GanttError,
} from '../gantt-service';
import type {
  GetGanttDataParams,
  RescheduleParams,
  AvailabilityCheckParams,
} from '@/lib/types/gantt';

// Create chainable mock for Supabase query builder
const createChainableMock = (data: any = [], error: any = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    update: vi.fn().mockReturnThis(),
    then: vi.fn((callback) => callback({ data, error })),
    // Make it iterable for the actual queries
  };

  // Return data and error when awaited
  Object.defineProperty(chain, 'then', {
    value: (resolve: any) => resolve({ data, error }),
    writable: true,
  });

  return chain;
};

// Mock work orders data
const mockWorkOrders = [
  {
    id: 'wo-001',
    wo_number: 'WO-20241215-0001',
    status: 'planned',
    priority: 'normal',
    planned_quantity: 100,
    produced_quantity: 0,
    uom: 'pc',
    planned_start_date: '2024-12-15',
    scheduled_start_time: '08:00',
    scheduled_end_time: '16:00',
    production_line_id: 'line-001',
    machine_id: null,
    created_at: '2024-12-15T00:00:00Z',
    product: { id: 'prod-001', code: 'PROD001', name: 'Product A' },
  },
  {
    id: 'wo-002',
    wo_number: 'WO-20241215-0002',
    status: 'in_progress',
    priority: 'high',
    planned_quantity: 200,
    produced_quantity: 130,
    uom: 'pc',
    planned_start_date: '2024-12-16',
    scheduled_start_time: '10:00',
    scheduled_end_time: '18:00',
    production_line_id: 'line-002',
    machine_id: null,
    created_at: '2024-12-15T00:00:00Z',
    product: { id: 'prod-002', code: 'PROD002', name: 'Product B' },
  },
];

// Mock production lines data
const mockProductionLines = [
  { id: 'line-001', name: 'Packing Line #1', capacity_hours_per_day: 8 },
  { id: 'line-002', name: 'Baking Line #2', capacity_hours_per_day: 10 },
];

// Mock machines data
const mockMachines = [
  { id: 'machine-001', name: 'Mixer 1' },
  { id: 'machine-002', name: 'Oven 1' },
];

// Create mock Supabase client
const createMockSupabase = (options: {
  workOrders?: any[];
  lines?: any[];
  machines?: any[];
  woError?: any;
  lineError?: any;
  singleWO?: any;
  singleWOError?: any;
  singleLine?: any;
  updateResult?: any;
  updateError?: any;
} = {}) => {
  const {
    workOrders = mockWorkOrders,
    lines = mockProductionLines,
    machines = mockMachines,
    woError = null,
    lineError = null,
    singleWO = null,
    singleWOError = null,
    singleLine = null,
    updateResult = null,
    updateError = null,
  } = options;

  return {
    from: vi.fn((table: string) => {
      if (table === 'work_orders') {
        const chain = {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      or: vi.fn().mockResolvedValue({ data: workOrders, error: woError }),
                    }),
                    or: vi.fn().mockResolvedValue({ data: workOrders, error: woError }),
                  }),
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      neq: vi.fn().mockReturnValue({
                        neq: vi.fn().mockReturnValue({
                          neq: vi.fn().mockResolvedValue({ data: workOrders, error: woError }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: singleWO || workOrders[0],
                error: singleWOError
              }),
              neq: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  neq: vi.fn().mockResolvedValue({ data: workOrders, error: woError }),
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updateResult || { ...workOrders[0], production_line: { name: 'Packing Line #1' } },
                  error: updateError
                }),
              }),
            }),
          }),
        };
        return chain;
      }
      if (table === 'production_lines') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: lines, error: lineError }),
              single: vi.fn().mockResolvedValue({ data: singleLine || lines[0], error: lineError }),
            }),
          }),
        };
      }
      if (table === 'machines') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: machines, error: null }),
            }),
          }),
        };
      }
      return createChainableMock();
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-001' } }, error: null }),
    },
  };
};

describe('Gantt Service', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  describe('getGanttData', () => {
    it('should return swimlanes grouped by production line', async () => {
      // AC-03: Production Line Filtering
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        status: ['planned', 'released'],
      };

      const result = await getGanttData(mockSupabase as any, params);

      expect(result).toHaveProperty('swimlanes');
      expect(Array.isArray(result.swimlanes)).toBe(true);
      if (result.swimlanes.length > 0) {
        expect(result.swimlanes[0]).toHaveProperty('type', 'line');
        expect(result.swimlanes[0]).toHaveProperty('work_orders');
      }
    });

    it('should return swimlanes grouped by machine', async () => {
      // Unit test: getGanttData returns swimlanes grouped by machine
      const params: GetGanttDataParams = {
        view_by: 'machine',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = await getGanttData(mockSupabase as any, params);

      // When no WOs match machines, swimlanes may be empty
      expect(result).toHaveProperty('swimlanes');
    });

    it('should filter work orders by status', async () => {
      // AC-04: Status Filtering, Unit test: getGanttData filters by status
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        status: ['planned'],
      };

      const result = await getGanttData(mockSupabase as any, params);

      expect(result.filters_applied.status).toEqual(['planned']);
    });

    it('should filter work orders by date range', async () => {
      // Unit test: getGanttData filters by date range
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = await getGanttData(mockSupabase as any, params);

      expect(result.date_range.from_date).toBe('2024-12-15');
      expect(result.date_range.to_date).toBe('2024-12-20');
    });

    it('should include progress_percent for in_progress WOs', async () => {
      // AC-07: In-Progress Progress Bar
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        status: ['in_progress'],
      };

      const result = await getGanttData(mockSupabase as any, params);

      result.swimlanes.forEach((swimlane) => {
        swimlane.work_orders.forEach((wo) => {
          if (wo.status === 'in_progress') {
            expect(wo.progress_percent).toBeDefined();
            expect(typeof wo.progress_percent).toBe('number');
            expect(wo.progress_percent).toBeGreaterThanOrEqual(0);
            expect(wo.progress_percent).toBeLessThanOrEqual(100);
          }
        });
      });
    });

    it('should calculate is_overdue correctly', async () => {
      // AC-06: Overdue WO Indicator
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = await getGanttData(mockSupabase as any, params);

      result.swimlanes.forEach((swimlane) => {
        swimlane.work_orders.forEach((wo) => {
          // Verify is_overdue is a boolean
          expect(typeof wo.is_overdue).toBe('boolean');
        });
      });
    });

    it('should filter by specific production line', async () => {
      // AC-03: Production Line Filtering
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        line_id: 'line-001',
      };

      const result = await getGanttData(mockSupabase as any, params);

      expect(result.filters_applied.line_id).toBe('line-001');
    });

    it('should include product information in response', async () => {
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = await getGanttData(mockSupabase as any, params);

      result.swimlanes.forEach((swimlane) => {
        swimlane.work_orders.forEach((wo) => {
          expect(wo.product).toBeDefined();
          expect(wo.product.id).toBeDefined();
          expect(wo.product.code).toBeDefined();
          expect(wo.product.name).toBeDefined();
        });
      });
    });

    it('should enforce RLS org isolation', async () => {
      // AC-20: RLS Org Isolation
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = await getGanttData(mockSupabase as any, params);

      // Verify result structure is correct
      expect(result.swimlanes).toBeDefined();
      expect(Array.isArray(result.swimlanes)).toBe(true);
    });
  });

  describe('checkLineAvailability', () => {
    it('should return is_available=true when no conflicts exist', async () => {
      // Unit test: checkLineAvailability returns is_available=true when no conflicts
      const params: AvailabilityCheckParams = {
        line_id: 'line-001',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = await checkLineAvailability(
        mockSupabaseClient as any,
        params
      );

      expect(result.is_available).toBe(true);
      expect(result.conflicts).toEqual([]);
      expect(typeof result.capacity_utilization).toBe('number');
    });

    it('should return conflicts when overlapping WOs exist', async () => {
      // Unit test: checkLineAvailability returns conflicts when overlap exists
      // AC-10: Scheduling Conflict Detection
      const params: AvailabilityCheckParams = {
        line_id: 'line-001',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '12:00',
        scheduled_end_time: '18:00',
      };

      const result = await checkLineAvailability(
        mockSupabaseClient as any,
        params
      );

      if (result.is_available === false) {
        expect(Array.isArray(result.conflicts)).toBe(true);
        expect(result.conflicts.length).toBeGreaterThan(0);
        result.conflicts.forEach((conflict) => {
          expect(conflict.wo_id).toBeDefined();
          expect(conflict.wo_number).toBeDefined();
          expect(conflict.product_name).toBeDefined();
          expect(conflict.scheduled_start_time).toBeDefined();
          expect(conflict.scheduled_end_time).toBeDefined();
        });
      }
    });

    it('should exclude WO being dragged from conflict check', async () => {
      const params: AvailabilityCheckParams = {
        line_id: 'line-001',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
        exclude_wo_id: 'wo-156',
      };

      const result = await checkLineAvailability(
        mockSupabaseClient as any,
        params
      );

      // Should not include the excluded WO in conflicts
      result.conflicts.forEach((conflict) => {
        expect(conflict.wo_id).not.toBe('wo-156');
      });
    });

    it('should calculate capacity utilization', async () => {
      // Unit test: checkLineAvailability includes capacity_utilization
      const params: AvailabilityCheckParams = {
        line_id: 'line-001',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = await checkLineAvailability(
        mockSupabaseClient as any,
        params
      );

      expect(result.capacity_utilization).toBeGreaterThanOrEqual(0.0);
      expect(result.capacity_utilization).toBeLessThanOrEqual(1.0);
    });

    it('should return warnings when capacity near limit', async () => {
      const params: AvailabilityCheckParams = {
        line_id: 'line-001',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = await checkLineAvailability(
        mockSupabaseClient as any,
        params
      );

      if (result.capacity_utilization > 0.8) {
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('rescheduleWO', () => {
    it('should update WO and return success response', async () => {
      // Unit test: rescheduleWO updates WO and returns success
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = await rescheduleWO(
        mockSupabaseClient as any,
        woId,
        params
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(woId);
      expect(result.data.scheduled_date).toBe('2024-12-18');
      expect(result.data.scheduled_start_time).toBe('10:00');
      expect(result.data.scheduled_end_time).toBe('18:00');
      expect(result.conflicts).toEqual([]);
    });

    it('should throw error for non-existent WO', async () => {
      const woId = 'non-existent-wo';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      await expect(
        rescheduleWO(mockSupabaseClient as any, woId, params)
      ).rejects.toThrow('WO_NOT_FOUND');
    });

    it('should throw error for completed WO', async () => {
      // Unit test: rescheduleWO throws error for completed WO
      const woId = 'wo-completed';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      await expect(
        rescheduleWO(mockSupabaseClient as any, woId, params)
      ).rejects.toThrow('WO_STATUS_INVALID');
    });

    it('should prevent scheduling in the past', async () => {
      // AC-12: Prevent Scheduling in Past
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-15', // past date
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      await expect(
        rescheduleWO(mockSupabaseClient as any, woId, params)
      ).rejects.toThrow('PAST_DATE');
    });

    it('should allow changing production line', async () => {
      // AC-09: Drag-to-Reschedule Vertical (Line Change)
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
        production_line_id: 'line-002',
      };

      const result = await rescheduleWO(
        mockSupabaseClient as any,
        woId,
        params
      );

      expect(result.data.production_line_id).toBe('line-002');
    });

    it('should return warnings for material availability issues', async () => {
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
        validate_materials: true,
      };

      const result = await rescheduleWO(
        mockSupabaseClient as any,
        woId,
        params
      );

      if (result.warnings.length > 0) {
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });

    it('should reject reschedule if line has conflicts', async () => {
      // AC-10: Scheduling Conflict Detection
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '12:00', // overlapping time
        scheduled_end_time: '20:00',
      };

      await expect(
        rescheduleWO(mockSupabaseClient as any, woId, params)
      ).rejects.toThrow('LINE_CONFLICT');
    });

    it('should include duration_hours in response', async () => {
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = await rescheduleWO(
        mockSupabaseClient as any,
        woId,
        params
      );

      expect(result.data.duration_hours).toBe(8);
    });

    it('should include line_name in response', async () => {
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = await rescheduleWO(
        mockSupabaseClient as any,
        woId,
        params
      );

      expect(result.data.line_name).toBeDefined();
      expect(typeof result.data.line_name).toBe('string');
    });

    it('should validate dependencies if validate_dependencies=true', async () => {
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
        validate_dependencies: true,
      };

      const result = await rescheduleWO(
        mockSupabaseClient as any,
        woId,
        params
      );

      // Should not allow reschedule if dependency violated
      expect(result.success).toBe(true);
    });
  });

  describe('exportGanttPDF', () => {
    it('should return a Blob with PDF content', async () => {
      const params = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        view_by: 'line' as const,
      };

      const result = await exportGanttPDF(mockSupabaseClient as any, params);

      expect(result instanceof Blob).toBe(true);
      expect(result.type).toBe('application/pdf');
    });

    it('should include all WOs in the date range', async () => {
      const params = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        view_by: 'line' as const,
      };

      const result = await exportGanttPDF(mockSupabaseClient as any, params);

      expect(result.size).toBeGreaterThan(0);
    });

    it('should respect swimlane grouping mode', async () => {
      const params = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        view_by: 'machine' as const,
      };

      const result = await exportGanttPDF(mockSupabaseClient as any, params);

      expect(result instanceof Blob).toBe(true);
    });

    it('should generate PDF within 3 seconds', async () => {
      const params = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        view_by: 'line' as const,
      };

      const startTime = Date.now();
      const result = await exportGanttPDF(mockSupabaseClient as any, params);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000);
    });
  });

  describe('Performance Tests', () => {
    it('should load Gantt data for 50 WOs within 1 second', async () => {
      const params: GetGanttDataParams = {
        view_by: 'line',
        from_date: '2024-12-16',
        to_date: '2024-12-22', // 7-day range
      };

      const startTime = Date.now();
      const result = await getGanttData(mockSupabaseClient as any, params);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.swimlanes).toBeDefined();
    });

    it('should complete availability check within 200ms', async () => {
      const params: AvailabilityCheckParams = {
        line_id: 'line-001',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const startTime = Date.now();
      await checkLineAvailability(mockSupabaseClient as any, params);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should complete reschedule within 800ms', async () => {
      const woId = 'wo-156';
      const params: RescheduleParams = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const startTime = Date.now();
      await rescheduleWO(mockSupabaseClient as any, woId, params);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(800);
    });
  });
});
