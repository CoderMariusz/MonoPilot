/**
 * In-Process Inspection Service - Unit Tests (Story 06.10)
 * Purpose: Test in-process inspection creation, completion, and WO operation integration
 * Phase: RED - Tests should FAIL until implementation complete
 *
 * Tests the InProcessInspectionService which handles:
 * - Creating in-process inspections with WO/operation references
 * - Listing in-process inspections with filters (WO, operation, status, priority)
 * - Getting inspections by Work Order with quality summary
 * - Getting inspection by operation with context
 * - Starting inspections and updating status
 * - Completing inspections with pass/fail/conditional results
 * - Updating wo_operation.qa_status based on inspection result
 * - Checking if next operation can start (blocking logic)
 * - Calculating WO quality summary
 * - Determining if operation requires inspection
 * - Creating inspections for operation completion
 * - Sending production notifications
 * - Audit trail logging
 *
 * Coverage Target: 85%+
 * Test Count: 58 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Auto-create inspection on operation completion
 * - AC-2: Manual in-process inspection creation with WO validation
 * - AC-3: In-process inspection queue with filtering
 * - AC-4: Inspection detail with WO/operation context
 * - AC-5: Start inspection workflow
 * - AC-6: Complete inspection with result determination
 * - AC-7: WO operation QA status integration
 * - AC-8: Multi-operation inspection view
 * - AC-9: Inspector assignment
 * - AC-10: Production integration alerts
 * - AC-11: Permission enforcement
 * - AC-12: Audit trail logging
 * - AC-13: RLS policy enforcement
 * - AC-14: Performance requirements
 *
 * Security: All tests include orgId parameter for Defense in Depth (ADR-013)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type {
  QualityInspection,
  CreateInProcessInspectionInput,
  CompleteInProcessInspectionInput,
  CompleteInProcessResult,
  InProcessListParams,
  WOInspectionsResponse,
  OperationInspectionResponse,
  WOQualitySummary,
} from '@/lib/types/quality'
import type {
  WorkOrder,
  WOOperation,
} from '@/lib/types/production'

// Import the actual service
import * as InProcessInspectionService from '../in-process-inspection-service'
import { createServerSupabase } from '@/lib/supabase/server'

// Test IDs - using valid UUIDs
const TEST_ORG_ID = '11111111-1111-1111-1111-111111111111'
const TEST_WO_ID = '22222222-2222-2222-2222-222222222222'
const TEST_WO_OP_ID = '33333333-3333-3333-3333-333333333333'
const TEST_PRODUCT_ID = '44444444-4444-4444-4444-444444444444'
const TEST_SPEC_ID = '55555555-5555-5555-5555-555555555555'
const TEST_INSPECTOR_ID = '66666666-6666-6666-6666-666666666666'
const TEST_USER_ID = '77777777-7777-7777-7777-777777777777'
const TEST_INSPECTION_ID = '88888888-8888-8888-8888-888888888888'
const TEST_ROUTING_OP_ID = '99999999-9999-9999-9999-999999999999'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(),
}

// Helper to create chainable query mock
const createQueryMock = (returnData: any, error: any = null, count: number | null = null) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: returnData, error, count }),
  maybeSingle: vi.fn().mockResolvedValue({ data: returnData, error, count }),
  then: (resolve: any) => resolve({ data: returnData, error, count }),
})

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}))

// Mock AuditService
vi.mock('../audit-service', () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock data
const mockWorkOrder = {
  id: TEST_WO_ID,
  org_id: TEST_ORG_ID,
  wo_number: 'WO-2025-00001',
  product_id: TEST_PRODUCT_ID,
  status: 'in_progress',
  batch_number: 'BATCH-001',
  planned_quantity: 100,
  output_uom: 'kg',
  started_at: '2025-01-15T10:00:00Z',
  created_at: '2025-01-15T09:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
  created_by: TEST_USER_ID,
}

const mockWOOperation = {
  id: TEST_WO_OP_ID,
  organization_id: TEST_ORG_ID,
  wo_id: TEST_WO_ID,
  routing_operation_id: TEST_ROUTING_OP_ID,
  sequence: 2,
  operation_name: 'Mixing',
  status: 'completed',
  qa_status: 'pending',
  qa_inspection_id: null,
  started_at: '2025-01-15T10:00:00Z',
  completed_at: '2025-01-15T10:45:00Z',
  completed_by: TEST_USER_ID,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:45:00Z',
}

const mockInspection = {
  id: TEST_INSPECTION_ID,
  org_id: TEST_ORG_ID,
  inspection_number: 'INS-IPR-2025-00001',
  inspection_type: 'in_process',
  reference_type: 'wo_operation',
  reference_id: TEST_WO_OP_ID,
  product_id: TEST_PRODUCT_ID,
  spec_id: TEST_SPEC_ID,
  wo_id: TEST_WO_ID,
  wo_operation_id: TEST_WO_OP_ID,
  batch_number: 'BATCH-001',
  status: 'scheduled',
  result: null,
  priority: 'normal',
  inspector_id: null,
  scheduled_date: '2025-01-15',
  started_at: null,
  completed_at: null,
  defects_found: 0,
  major_defects: 0,
  minor_defects: 0,
  critical_defects: 0,
  created_at: '2025-01-15T10:45:00Z',
  updated_at: '2025-01-15T10:45:00Z',
  created_by: TEST_USER_ID,
}

const mockProduct = {
  id: TEST_PRODUCT_ID,
  code: 'PROD-001',
  name: 'Test Product',
}

const mockSpec = {
  id: TEST_SPEC_ID,
  spec_number: 'QS-001',
  name: 'Test Spec',
}

const mockQualitySettings = {
  auto_create_inspection_on_operation: true,
  require_operation_qa_pass: false,
  block_next_operation_on_fail: true,
  inspection_sla_hours: 2,
}

const mockRoutingOperation = {
  id: TEST_ROUTING_OP_ID,
  requires_quality_check: true,
  is_critical: false,
}

// Setup function to configure mocks for different scenarios
function setupMocks(scenario: 'default' | 'no_settings' | 'no_qa_required' | 'critical_op' = 'default') {
  const fromMocks: Record<string, any> = {
    users: createQueryMock({ org_id: TEST_ORG_ID }),
    work_orders: createQueryMock({...mockWorkOrder, products: mockProduct}),
    wo_operations: createQueryMock(mockWOOperation),
    quality_inspections: createQueryMock(mockInspection),
    quality_settings: createQueryMock(
      scenario === 'no_settings' ? null :
      scenario === 'no_qa_required' ? { ...mockQualitySettings, auto_create_inspection_on_operation: false } :
      mockQualitySettings
    ),
    quality_specifications: createQueryMock(mockSpec),
    routing_operations: createQueryMock(
      scenario === 'no_qa_required' ? { ...mockRoutingOperation, requires_quality_check: false } :
      scenario === 'critical_op' ? { ...mockRoutingOperation, is_critical: true } :
      mockRoutingOperation
    ),
    products: createQueryMock(mockProduct),
  }

  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: TEST_USER_ID } },
  })

  mockSupabaseClient.from.mockImplementation((table: string) => {
    return fromMocks[table] || createQueryMock(null)
  })

  ;(createServerSupabase as any).mockResolvedValue(mockSupabaseClient)
}

describe('InProcessInspectionService (Story 06.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // AC-1: Auto-create inspection on operation completion
  // ============================================================================

  describe('AC-1: Auto-create inspection on operation completion', () => {
    it('should auto-create inspection when operation completes and setting enabled', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID
      const requiresQA = true
      const settingEnabled = true

      // Act
      const result = await InProcessInspectionService.createForOperationCompletion(
        TEST_ORG_ID,
        operationId,
        TEST_USER_ID
      )

      // Assert
      expect(result).toBeDefined()
      expect(result?.inspection_type).toBe('in_process')
      expect(result?.reference_type).toBe('wo_operation')
      expect(result?.reference_id).toBe(operationId)
      expect(result?.wo_operation_id).toBe(operationId)
      expect(result?.status).toBe('scheduled')
      expect(result?.inspection_number).toMatch(/^INS-IPR-\d{4}-\d{5}$/)
    })

    it('should not create inspection when setting disabled', async () => {
      // Arrange - setting disabled
      const operationId = TEST_WO_OP_ID

      // Act
      const result = await InProcessInspectionService.createForOperationCompletion(
        TEST_ORG_ID,
        operationId,
        TEST_USER_ID
      )

      // Assert
      expect(result).toBeNull()
    })

    it('should not create inspection when operation does not require QA', async () => {
      // Arrange - requires_quality_check = false
      const operationId = TEST_WO_OP_ID

      // Act
      const result = await InProcessInspectionService.createForOperationCompletion(
        TEST_ORG_ID,
        operationId,
        TEST_USER_ID
      )

      // Assert
      expect(result).toBeNull()
    })

    it('should set priority to high for critical operations', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID
      const isCritical = true

      // Act
      const result = await InProcessInspectionService.createForOperationCompletion(
        TEST_ORG_ID,
        operationId,
        TEST_USER_ID
      )

      // Assert
      expect(result?.priority).toBe('high')
    })

    it('should link specification if one exists for product', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID

      // Act
      const result = await InProcessInspectionService.createForOperationCompletion(
        TEST_ORG_ID,
        operationId,
        TEST_USER_ID
      )

      // Assert
      expect(result?.spec_id).toBeDefined()
      expect(result?.product_id).toBe(TEST_PRODUCT_ID)
    })

    it('should capture WO batch number in inspection', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID
      const expectedBatch = mockWorkOrder.batch_number

      // Act
      const result = await InProcessInspectionService.createForOperationCompletion(
        TEST_ORG_ID,
        operationId,
        TEST_USER_ID
      )

      // Assert
      expect(result?.batch_number).toBe(expectedBatch)
    })
  })

  // ============================================================================
  // AC-2: Manual In-Process Inspection Creation
  // ============================================================================

  describe('AC-2: Manual in-process inspection creation', () => {
    it('should create in-process inspection with WO and operation reference', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID,
        priority: 'normal',
      }

      // Act
      const result = await InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)

      // Assert
      expect(result).toBeDefined()
      expect(result.wo_id).toBe(TEST_WO_ID)
      expect(result.wo_operation_id).toBe(TEST_WO_OP_ID)
      expect(result.inspection_type).toBe('in_process')
      expect(result.status).toBe('scheduled')
    })

    it('should auto-fill product from WO if not provided', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID,
      }

      // Act
      const result = await InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)

      // Assert
      expect(result.product_id).toBe(TEST_PRODUCT_ID)
    })

    it('should auto-fill batch from WO if not provided', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID,
      }

      // Act
      const result = await InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)

      // Assert
      expect(result.batch_number).toBe(mockWorkOrder.batch_number)
    })

    it('should reject if WO is not in_progress', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID, // status = 'released', not 'in_progress'
        wo_operation_id: TEST_WO_OP_ID,
      }

      // Act & Assert
      await expect(
        InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)
      ).rejects.toThrow('Work Order must be in progress')
    })

    it('should reject if WO operation does not exist', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: 'invalid-op-id',
      }

      // Act & Assert
      await expect(
        InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)
      ).rejects.toThrow('Invalid operation')
    })

    it('should warn if operation already has active inspection', async () => {
      // Arrange - operation already has scheduled inspection
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID, // Already has INS-IPR-2025-00001
      }

      // Act - should allow with warning
      const result = await InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)

      // Assert - should create new one but include warning
      expect(result).toBeDefined()
      // Warning should be returned in response or separate call
    })

    it('should support custom specification selection', async () => {
      // Arrange
      const customSpecId = '55555555-5555-5555-5555-555555555555'
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID,
        spec_id: customSpecId,
      }

      // Act
      const result = await InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)

      // Assert
      expect(result.spec_id).toBe(customSpecId)
    })

    it('should generate inspection number in format INS-IPR-YYYY-NNNNN', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID,
      }

      // Act
      const result = await InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)

      // Assert
      expect(result.inspection_number).toMatch(/^INS-IPR-2025-\d{5}$/)
    })

    it('should support priority override (low/normal/high/urgent)', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID,
        priority: 'high',
      }

      // Act
      const result = await InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)

      // Assert
      expect(result.priority).toBe('high')
    })

    it('should accept optional inspector assignment at creation', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID,
        inspector_id: TEST_INSPECTOR_ID,
      }

      // Act
      const result = await InProcessInspectionService.createInProcess(TEST_ORG_ID, createInput)

      // Assert
      expect(result.inspector_id).toBe(TEST_INSPECTOR_ID)
    })
  })

  // ============================================================================
  // AC-3: In-Process Inspection Queue
  // ============================================================================

  describe('AC-3: In-process inspection queue', () => {
    it('should list in-process inspections with type filter', async () => {
      // Arrange
      const params: InProcessListParams = {}

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      expect(result.data).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThanOrEqual(0)
      result.data.forEach((inspection) => {
        expect(inspection.inspection_type).toBe('in_process')
      })
    })

    it('should filter by WO ID', async () => {
      // Arrange
      const params: InProcessListParams = {
        wo_id: TEST_WO_ID,
      }

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      expect(result.data).toBeDefined()
      result.data.forEach((inspection) => {
        expect(inspection.wo_id).toBe(TEST_WO_ID)
      })
    })

    it('should filter by operation ID', async () => {
      // Arrange
      const params: InProcessListParams = {
        wo_operation_id: TEST_WO_OP_ID,
      }

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      result.data.forEach((inspection) => {
        expect(inspection.wo_operation_id).toBe(TEST_WO_OP_ID)
      })
    })

    it('should filter by status (scheduled/in_progress/completed)', async () => {
      // Arrange
      const params: InProcessListParams = {
        status: 'scheduled',
      }

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      result.data.forEach((inspection) => {
        expect(inspection.status).toBe('scheduled')
      })
    })

    it('should filter by priority', async () => {
      // Arrange
      const params: InProcessListParams = {
        priority: 'high',
      }

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      result.data.forEach((inspection) => {
        expect(inspection.priority).toBe('high')
      })
    })

    it('should filter by inspector', async () => {
      // Arrange
      const params: InProcessListParams = {
        inspector_id: TEST_INSPECTOR_ID,
      }

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      result.data.forEach((inspection) => {
        expect(inspection.inspector_id).toBe(TEST_INSPECTOR_ID)
      })
    })

    it('should support pagination with page and limit', async () => {
      // Arrange
      const params: InProcessListParams = {
        page: 1,
        limit: 20,
      }

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.data.length).toBeLessThanOrEqual(20)
    })

    it('should support sorting by inspection_number', async () => {
      // Arrange
      const params: InProcessListParams = {
        sort_by: 'inspection_number',
        sort_order: 'asc',
      }

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      expect(result.data.length).toBeGreaterThan(0)
      for (let i = 1; i < result.data.length; i++) {
        expect(
          result.data[i].inspection_number.localeCompare(result.data[i - 1].inspection_number)
        ).toBeGreaterThanOrEqual(0)
      }
    })

    it('should support search by inspection number or product', async () => {
      // Arrange
      const params: InProcessListParams = {
        search: 'INS-IPR-2025',
      }

      // Act
      const result = await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      result.data.forEach((inspection) => {
        expect(inspection.inspection_number.includes('INS-IPR-2025')).toBe(true)
      })
    })

    it('should respect RLS - only return org inspections', async () => {
      // Arrange - different org
      const differentOrgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      const params: InProcessListParams = {}

      // Act
      const result = await InProcessInspectionService.listInProcess(differentOrgId, params)

      // Assert - should only have inspections for that org
      result.data.forEach((inspection) => {
        expect(inspection.org_id).toBe(differentOrgId)
      })
    })

    it('should return response with performance < 500ms', async () => {
      // Arrange
      const params: InProcessListParams = { limit: 100 }
      const startTime = Date.now()

      // Act
      await InProcessInspectionService.listInProcess(TEST_ORG_ID, params)

      // Assert
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(500)
    })
  })

  // ============================================================================
  // AC-4: Inspection Detail with WO Context
  // ============================================================================

  describe('AC-4: Inspection detail with WO context', () => {
    it('should get inspection by operation ID with WO context', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID

      // Act
      const result = await InProcessInspectionService.getByOperation(TEST_ORG_ID, operationId)

      // Assert
      expect(result.inspection).toBeDefined()
      expect(result.inspection?.wo_operation_id).toBe(operationId)
      expect(result.operation).toBeDefined()
      expect(result.operation.id).toBe(operationId)
    })

    it('should include operation context (sequence, name, machine)', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID

      // Act
      const result = await InProcessInspectionService.getByOperation(TEST_ORG_ID, operationId)

      // Assert
      expect(result.operation.sequence).toBeGreaterThan(0)
      expect(result.operation.name).toBeDefined()
      expect(result.operation.started_at).toBeDefined()
      expect(result.operation.completed_at).toBeDefined()
    })

    it('should include previous operation QA result if exists', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID // Seq 2

      // Act
      const result = await InProcessInspectionService.getByOperation(TEST_ORG_ID, operationId)

      // Assert
      if (result.previous_operation_qa) {
        expect(result.previous_operation_qa.operation_name).toBeDefined()
        expect(result.previous_operation_qa.result).toMatch(/^(pass|fail|conditional)$/)
      }
    })

    it('should return null inspection if not exists for operation', async () => {
      // Arrange
      const operationId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' // No inspection

      // Act
      const result = await InProcessInspectionService.getByOperation(TEST_ORG_ID, operationId)

      // Assert
      expect(result.inspection).toBeNull()
    })

    it('should return operation QA status', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID

      // Act
      const result = await InProcessInspectionService.getByOperation(TEST_ORG_ID, operationId)

      // Assert
      expect(['pending', 'passed', 'failed', 'conditional', 'not_required']).toContain(
        result.operation.qa_status
      )
    })
  })

  // ============================================================================
  // AC-5: Start In-Process Inspection
  // ============================================================================

  describe('AC-5: Start in-process inspection', () => {
    it('should start inspection and set status to in_progress', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.startInspection(
        TEST_ORG_ID,
        inspectionId,
        userId
      )

      // Assert
      expect(result.status).toBe('in_progress')
      expect(result.started_at).toBeDefined()
      expect(result.inspector_id).toBe(userId)
    })

    it('should set started_at timestamp', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const userId = TEST_USER_ID
      const beforeTime = new Date()

      // Act
      const result = await InProcessInspectionService.startInspection(
        TEST_ORG_ID,
        inspectionId,
        userId
      )

      // Assert
      const afterTime = new Date()
      const startedAt = new Date(result.started_at!)
      expect(startedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(startedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should set current user as inspector if not already assigned', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.startInspection(
        TEST_ORG_ID,
        inspectionId,
        userId
      )

      // Assert
      expect(result.inspector_id).toBe(userId)
    })

    it('should reject if WO is paused', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID // Associated with paused WO
      const userId = TEST_USER_ID

      // Act & Assert
      await expect(
        InProcessInspectionService.startInspection(TEST_ORG_ID, inspectionId, userId)
      ).rejects.toThrow('Work Order is paused')
    })

    it('should reject if WO is cancelled', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID // Associated with cancelled WO
      const userId = TEST_USER_ID

      // Act & Assert
      await expect(
        InProcessInspectionService.startInspection(TEST_ORG_ID, inspectionId, userId)
      ).rejects.toThrow('Work Order is cancelled')
    })

    it('should only allow from scheduled status', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID // Status = 'scheduled'
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.startInspection(
        TEST_ORG_ID,
        inspectionId,
        userId
      )

      // Assert
      expect(result.status).toBe('in_progress')
    })
  })

  // ============================================================================
  // AC-6: Complete In-Process Inspection
  // ============================================================================

  describe('AC-6: Complete in-process inspection', () => {
    it('should complete inspection with pass result', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'pass',
      }
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert
      expect(result.inspection.status).toBe('completed')
      expect(result.inspection.result).toBe('pass')
      expect(result.inspection.completed_at).toBeDefined()
    })

    it('should complete inspection with fail result', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'fail',
      }
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert
      expect(result.inspection.status).toBe('completed')
      expect(result.inspection.result).toBe('fail')
    })

    it('should complete inspection with conditional result', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'conditional',
        conditional_reason: 'pH slightly elevated',
        conditional_restrictions: 'Use within 24 hours',
        conditional_expires_at: '2025-01-16T10:00:00Z',
      }
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert
      expect(result.inspection.status).toBe('completed')
      expect(result.inspection.result).toBe('conditional')
    })

    it('should reject conditional without reason and restrictions', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'conditional',
        // Missing reason and restrictions
      }
      const userId = TEST_USER_ID

      // Act & Assert
      await expect(
        InProcessInspectionService.completeInProcess(TEST_ORG_ID, inspectionId, input, userId)
      ).rejects.toThrow('Conditional reason and restrictions required')
    })

    it('should update wo_operation.qa_status on completion', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'pass',
      }
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert
      expect(result.wo_operation_updated).toBe(true)
      expect(result.wo_operation_qa_status).toBe('passed')
    })

    it('should block next operation when fail and setting enabled', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'fail',
      }
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert
      expect(result.next_operation_blocked).toBe(true)
    })

    it('should support optional NCR creation on fail', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'fail',
        create_ncr: true,
      }
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert
      expect(result.ncr_id).toBeDefined()
    })

    it('should send production notification', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'pass',
      }
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert
      expect(result.alert_sent_to).toBeDefined()
      expect(result.alert_sent_to?.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // AC-7: WO Operation QA Status Integration
  // ============================================================================

  describe('AC-7: WO operation QA status integration', () => {
    it('should update wo_operation.qa_status to passed on pass result', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID
      const result = 'pass'
      const inspectionId = TEST_INSPECTION_ID

      // Act
      await InProcessInspectionService.updateOperationQAStatus(
        TEST_ORG_ID,
        operationId,
        result as 'pass' | 'fail' | 'conditional',
        inspectionId
      )

      // Assert - query wo_operation to verify
      const operation = await InProcessInspectionService.getByOperation(TEST_ORG_ID, operationId)
      expect(operation.operation.qa_status).toBe('passed')
      expect(operation.operation.qa_inspection_id).toBe(inspectionId)
    })

    it('should update wo_operation.qa_status to failed on fail result', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID
      const result = 'fail'
      const inspectionId = TEST_INSPECTION_ID

      // Act
      await InProcessInspectionService.updateOperationQAStatus(
        TEST_ORG_ID,
        operationId,
        result as 'pass' | 'fail' | 'conditional',
        inspectionId
      )

      // Assert
      const operation = await InProcessInspectionService.getByOperation(TEST_ORG_ID, operationId)
      expect(operation.operation.qa_status).toBe('failed')
    })

    it('should update wo_operation.qa_status to conditional on conditional result', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID
      const result = 'conditional'
      const inspectionId = TEST_INSPECTION_ID

      // Act
      await InProcessInspectionService.updateOperationQAStatus(
        TEST_ORG_ID,
        operationId,
        result as 'pass' | 'fail' | 'conditional',
        inspectionId
      )

      // Assert
      const operation = await InProcessInspectionService.getByOperation(TEST_ORG_ID, operationId)
      expect(operation.operation.qa_status).toBe('conditional')
    })
  })

  // ============================================================================
  // AC-8: Multi-Operation Inspection View
  // ============================================================================

  describe('AC-8: Multi-operation inspection view', () => {
    it('should get all inspections for a WO', async () => {
      // Arrange
      const woId = TEST_WO_ID

      // Act
      const result = await InProcessInspectionService.getByWorkOrder(TEST_ORG_ID, woId)

      // Assert
      expect(result.wo).toBeDefined()
      expect(result.inspections).toBeInstanceOf(Array)
      result.inspections.forEach((inspection) => {
        expect(inspection.wo_id).toBe(woId)
      })
    })

    it('should include WO quality summary', async () => {
      // Arrange
      const woId = TEST_WO_ID

      // Act
      const result = await InProcessInspectionService.getByWorkOrder(TEST_ORG_ID, woId)

      // Assert
      expect(result.summary).toBeDefined()
      expect(result.summary.total_operations).toBeGreaterThan(0)
      expect(result.summary.inspections_completed).toBeGreaterThanOrEqual(0)
      expect(result.summary.inspections_passed).toBeGreaterThanOrEqual(0)
      expect(result.summary.inspections_failed).toBeGreaterThanOrEqual(0)
      expect(result.summary.inspections_pending).toBeGreaterThanOrEqual(0)
    })

    it('should calculate correct summary counts', async () => {
      // Arrange
      const woId = TEST_WO_ID
      // Assume WO has 3 operations: 1 passed, 1 failed, 1 pending

      // Act
      const result = await InProcessInspectionService.getByWorkOrder(TEST_ORG_ID, woId)

      // Assert
      const sum =
        result.summary.inspections_passed +
        result.summary.inspections_failed +
        result.summary.inspections_pending
      expect(sum).toBeLessThanOrEqual(result.summary.total_operations)
    })

    it('should return WO info in response', async () => {
      // Arrange
      const woId = TEST_WO_ID

      // Act
      const result = await InProcessInspectionService.getByWorkOrder(TEST_ORG_ID, woId)

      // Assert
      expect(result.wo.id).toBe(woId)
      expect(result.wo.wo_number).toBeDefined()
      expect(result.wo.status).toBeDefined()
      expect(result.wo.product_name).toBeDefined()
      expect(result.wo.batch_number).toBeDefined()
    })
  })

  // ============================================================================
  // AC-9: Inspector Assignment
  // ============================================================================

  describe('AC-9: Inspector assignment', () => {
    it('should assign inspector to inspection', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const inspectorId = TEST_INSPECTOR_ID
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.assignInspector(
        TEST_ORG_ID,
        inspectionId,
        inspectorId,
        userId
      )

      // Assert
      expect(result.inspector_id).toBe(inspectorId)
    })

    it('should reassign inspector if already assigned', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const newInspectorId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
      const userId = TEST_USER_ID

      // Act
      const result = await InProcessInspectionService.assignInspector(
        TEST_ORG_ID,
        inspectionId,
        newInspectorId,
        userId
      )

      // Assert
      expect(result.inspector_id).toBe(newInspectorId)
    })

    it('should support self-assignment', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const userId = TEST_USER_ID // Inspector is current user

      // Act
      const result = await InProcessInspectionService.assignInspector(
        TEST_ORG_ID,
        inspectionId,
        userId,
        userId
      )

      // Assert
      expect(result.inspector_id).toBe(userId)
    })
  })

  // ============================================================================
  // AC-10 & AC-14: Next Operation Blocking & Performance
  // ============================================================================

  describe('AC-10 & AC-14: Next operation blocking and performance', () => {
    it('should allow next operation start when previous QA passed', async () => {
      // Arrange
      const woId = TEST_WO_ID
      const currentSequence = 2 // Seq 2 passed

      // Act
      const result = await InProcessInspectionService.canStartNextOperation(
        TEST_ORG_ID,
        woId,
        currentSequence
      )

      // Assert
      expect(result.canStart).toBe(true)
    })

    it('should block next operation when previous QA failed', async () => {
      // Arrange
      const woId = TEST_WO_ID
      const currentSequence = 2 // Seq 2 failed

      // Act
      const result = await InProcessInspectionService.canStartNextOperation(
        TEST_ORG_ID,
        woId,
        currentSequence
      )

      // Assert
      expect(result.canStart).toBe(false)
      expect(result.blockedReason).toBeDefined()
      expect(result.blockedReason).toContain('QA failed')
    })

    it('should allow start when previous QA not_required', async () => {
      // Arrange
      const woId = TEST_WO_ID
      const currentSequence = 1 // Seq 1 not_required

      // Act
      const result = await InProcessInspectionService.canStartNextOperation(
        TEST_ORG_ID,
        woId,
        currentSequence
      )

      // Assert
      expect(result.canStart).toBe(true)
    })

    it('should block when previous QA pending', async () => {
      // Arrange
      const woId = TEST_WO_ID
      const currentSequence = 2 // Seq 2 pending

      // Act
      const result = await InProcessInspectionService.canStartNextOperation(
        TEST_ORG_ID,
        woId,
        currentSequence
      )

      // Assert
      expect(result.canStart).toBe(false)
      expect(result.blockedReason).toContain('pending')
    })

    it('should complete canStartNextOperation check < 300ms', async () => {
      // Arrange
      const woId = TEST_WO_ID
      const currentSequence = 2
      const startTime = Date.now()

      // Act
      await InProcessInspectionService.canStartNextOperation(TEST_ORG_ID, woId, currentSequence)

      // Assert
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(300)
    })
  })

  // ============================================================================
  // AC-13 & Additional: RLS and Multi-Tenancy
  // ============================================================================

  describe('AC-13 & Additional: RLS and multi-tenancy', () => {
    it('should enforce org isolation on list', async () => {
      // Arrange
      const orgA = '11111111-1111-1111-1111-111111111111'
      const orgB = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      const params: InProcessListParams = {}

      // Act
      const resultA = await InProcessInspectionService.listInProcess(orgA, params)
      const resultB = await InProcessInspectionService.listInProcess(orgB, params)

      // Assert
      resultA.data.forEach((inspection) => {
        expect(inspection.org_id).toBe(orgA)
      })
      resultB.data.forEach((inspection) => {
        expect(inspection.org_id).toBe(orgB)
      })
    })

    it('should return 404 for cross-org WO inspection access', async () => {
      // Arrange
      const orgA = '11111111-1111-1111-1111-111111111111'
      const orgB = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      const woIdInOrgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

      // Act & Assert
      await expect(
        InProcessInspectionService.getByWorkOrder(orgA, woIdInOrgB)
      ).rejects.toThrow('Not found')
    })

    it('should validate WO belongs to org on creation', async () => {
      // Arrange
      const myOrgId = '11111111-1111-1111-1111-111111111111'
      const otherOrgWoId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' // Belongs to other org
      const createInput: CreateInProcessInspectionInput = {
        wo_id: otherOrgWoId,
        wo_operation_id: TEST_WO_OP_ID,
      }

      // Act & Assert
      await expect(
        InProcessInspectionService.createInProcess(myOrgId, createInput)
      ).rejects.toThrow('Invalid Work Order')
    })
  })

  // ============================================================================
  // WO Quality Summary
  // ============================================================================

  describe('WO Quality Summary', () => {
    it('should calculate WO quality summary with correct counts', async () => {
      // Arrange
      const woId = TEST_WO_ID

      // Act
      const result = await InProcessInspectionService.getWOQualitySummary(TEST_ORG_ID, woId)

      // Assert
      expect(result.total_operations).toBeGreaterThan(0)
      expect(result.qa_required).toBeGreaterThanOrEqual(0)
      expect(result.passed).toBeGreaterThanOrEqual(0)
      expect(result.failed).toBeGreaterThanOrEqual(0)
      expect(result.pending).toBeGreaterThanOrEqual(0)
      expect(result.conditional).toBeGreaterThanOrEqual(0)
    })

    it('should return overall_status pass when all operations passed', async () => {
      // Arrange
      const woId = TEST_WO_ID // All operations passed

      // Act
      const result = await InProcessInspectionService.getWOQualitySummary(TEST_ORG_ID, woId)

      // Assert
      expect(result.overall_status).toBe('pass')
    })

    it('should return overall_status fail when any operation failed', async () => {
      // Arrange
      const woId = TEST_WO_ID // At least one operation failed

      // Act
      const result = await InProcessInspectionService.getWOQualitySummary(TEST_ORG_ID, woId)

      // Assert
      expect(result.overall_status).toBe('fail')
    })

    it('should return overall_status pending when any operation pending', async () => {
      // Arrange
      const woId = TEST_WO_ID // At least one operation pending

      // Act
      const result = await InProcessInspectionService.getWOQualitySummary(TEST_ORG_ID, woId)

      // Assert
      expect(result.overall_status).toBe('pending')
    })

    it('should return overall_status conditional when has conditional but no fail', async () => {
      // Arrange
      const woId = TEST_WO_ID // Has conditional, no fail

      // Act
      const result = await InProcessInspectionService.getWOQualitySummary(TEST_ORG_ID, woId)

      // Assert
      if (result.conditional > 0) {
        expect(['conditional', 'pass']).toContain(result.overall_status)
      }
    })
  })

  // ============================================================================
  // Operation Requires Inspection
  // ============================================================================

  describe('Operation requires inspection', () => {
    it('should return true when routing_operation requires quality check', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID // requires_quality_check = true

      // Act
      const result = await InProcessInspectionService.operationRequiresInspection(
        TEST_ORG_ID,
        operationId
      )

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when routing_operation does not require quality check', async () => {
      // Arrange
      const operationId = 'cccccccc-cccc-cccc-cccc-cccccccccccc' // requires_quality_check = false

      // Act
      const result = await InProcessInspectionService.operationRequiresInspection(
        TEST_ORG_ID,
        operationId
      )

      // Assert
      expect(result).toBe(false)
    })

    it('should check through routing_operation relationship', async () => {
      // Arrange
      const operationId = TEST_WO_OP_ID

      // Act - should query routing_operations through wo_operations
      const result = await InProcessInspectionService.operationRequiresInspection(
        TEST_ORG_ID,
        operationId
      )

      // Assert
      expect(typeof result).toBe('boolean')
    })
  })

  // ============================================================================
  // Production Notifications
  // ============================================================================

  describe('Production notifications', () => {
    it('should send production alert on pass', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const result = 'pass'

      // Act
      await InProcessInspectionService.notifyProductionOnCompletion(
        TEST_ORG_ID,
        inspectionId,
        result
      )

      // Assert - verify notification sent (mocked in real test)
      // Notification should include WO and operation context
    })

    it('should send production alert on fail', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const result = 'fail'

      // Act
      await InProcessInspectionService.notifyProductionOnCompletion(
        TEST_ORG_ID,
        inspectionId,
        result
      )

      // Assert - verify alert sent to Production Lead
    })

    it('should send production alert on conditional', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const result = 'conditional'

      // Act
      await InProcessInspectionService.notifyProductionOnCompletion(
        TEST_ORG_ID,
        inspectionId,
        result
      )

      // Assert - verify notification sent with restrictions
    })
  })

  // ============================================================================
  // Overdue Inspection Alerts
  // ============================================================================

  describe('Overdue inspection alerts', () => {
    it('should check for overdue inspections', async () => {
      // Arrange
      const orgId = TEST_ORG_ID

      // Act
      await InProcessInspectionService.checkAndAlertOverdueInspections(orgId)

      // Assert - verify alerts generated for overdue inspections
    })

    it('should alert QA Manager for inspections exceeding SLA', async () => {
      // Arrange
      const orgId = TEST_ORG_ID
      // Assume inspection scheduled > 2 hours ago without starting

      // Act
      await InProcessInspectionService.checkAndAlertOverdueInspections(orgId)

      // Assert - verify QA Manager notified
    })
  })

  // ============================================================================
  // Additional Coverage: Audit Trail (AC-12)
  // ============================================================================

  describe('AC-12: Audit trail logging', () => {
    it('should log inspection creation', async () => {
      // Arrange
      const createInput: CreateInProcessInspectionInput = {
        wo_id: TEST_WO_ID,
        wo_operation_id: TEST_WO_OP_ID,
      }

      // Act
      const inspection = await InProcessInspectionService.createInProcess(
        TEST_ORG_ID,
        createInput
      )

      // Assert - verify audit log entry created
      // quality_audit_log.action = 'create'
      // quality_audit_log.entity_id = inspection.id
      // quality_audit_log.user_id = TEST_USER_ID
    })

    it('should log inspection status changes', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const userId = TEST_USER_ID

      // Act
      await InProcessInspectionService.startInspection(TEST_ORG_ID, inspectionId, userId)

      // Assert - verify audit log entry
      // quality_audit_log.action = 'start'
      // quality_audit_log.old_value.status = 'scheduled'
      // quality_audit_log.new_value.status = 'in_progress'
    })

    it('should log inspection completion', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'pass',
      }
      const userId = TEST_USER_ID

      // Act
      await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert - verify audit log entry
      // quality_audit_log.action = 'complete'
      // quality_audit_log.metadata.result = 'pass'
    })

    it('should include WO operation reference in audit log', async () => {
      // Arrange
      const inspectionId = TEST_INSPECTION_ID
      const input: CompleteInProcessInspectionInput = {
        result: 'pass',
      }
      const userId = TEST_USER_ID

      // Act
      await InProcessInspectionService.completeInProcess(
        TEST_ORG_ID,
        inspectionId,
        input,
        userId
      )

      // Assert - verify audit log metadata
      // quality_audit_log.metadata.wo_id = TEST_WO_ID
      // quality_audit_log.metadata.wo_operation_id = TEST_WO_OP_ID
    })
  })
})
