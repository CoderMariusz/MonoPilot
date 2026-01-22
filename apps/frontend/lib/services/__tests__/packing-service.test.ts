/**
 * Packing Service - Unit Tests (Story 07.11)
 * Purpose: Test shipment CRUD, box management, LP assignment, and packing completion
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests the PackingService which handles:
 * - Creating shipment from sales order (with auto-numbered shipment_number)
 * - Adding boxes to shipment (auto-incremented box_number)
 * - Assigning license plates to boxes (with lot_number traceability)
 * - Updating box weight and dimensions
 * - Completing packing (validation, status update, totals)
 * - Getting available LPs for packing
 * - Allergen separation warnings
 *
 * Coverage Target: 80%+
 * Test Count: 55+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1 to AC-4: Shipment creation and management
 * - AC-5 to AC-7: Box and LP assignment
 * - AC-8: Weight/dimensions capture
 * - AC-9: Allergen separation warnings
 * - AC-10 to AC-12: Packing completion validation
 *
 * Security: All tests include orgId parameter for Defense in Depth (ADR-013)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * RED Phase Pattern:
 * Tests are written to import from a service that doesn't exist yet.
 * All tests will fail with "module not found" until implementation is created.
 * This is the expected behavior in TDD RED phase.
 */

// Helper to safely import the service (will throw until implemented)
async function importPackingService() {
  try {
    return await import('../packing-service')
  } catch {
    throw new Error('packing-service module not implemented yet - RED phase')
  }
}

describe('PackingService (Story 07.11)', () => {
  let mockSupabase: any
  let mockQuery: any

  // Test org_id for multi-tenant isolation (ADR-013)
  const TEST_ORG_ID = 'org-11111111-1111-1111-1111-111111111111'
  const TEST_USER_ID = 'user-22222222-2222-2222-2222-222222222222'

  // Sample shipment data
  const mockShipment = {
    id: 'shipment-33333333-3333-3333-3333-333333333333',
    org_id: TEST_ORG_ID,
    shipment_number: 'SH-2025-00001',
    sales_order_id: 'so-44444444-4444-4444-4444-444444444444',
    customer_id: 'cust-55555555-5555-5555-5555-555555555555',
    shipping_address_id: 'addr-66666666-6666-6666-6666-666666666666',
    status: 'pending',
    carrier: null,
    service_level: null,
    tracking_number: null,
    sscc: null,
    total_weight: null,
    total_boxes: 0,
    dock_door_id: null,
    staged_location_id: null,
    packed_at: null,
    packed_by: null,
    shipped_at: null,
    delivered_at: null,
    created_at: '2025-01-22T10:00:00Z',
    created_by: TEST_USER_ID,
  }

  const mockBox = {
    id: 'box-77777777-7777-7777-7777-777777777777',
    org_id: TEST_ORG_ID,
    shipment_id: mockShipment.id,
    box_number: 1,
    sscc: null,
    weight: null,
    length: null,
    width: null,
    height: null,
    tracking_number: null,
    created_at: '2025-01-22T10:05:00Z',
  }

  const mockBoxContent = {
    id: 'content-88888888-8888-8888-8888-888888888888',
    org_id: TEST_ORG_ID,
    shipment_box_id: mockBox.id,
    sales_order_line_id: 'sol-99999999-9999-9999-9999-999999999999',
    product_id: 'prod-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    license_plate_id: 'lp-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    lot_number: 'LOT-2025-001',
    quantity: 50,
    created_at: '2025-01-22T10:10:00Z',
  }

  const mockAvailableLP = {
    id: 'lp-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    lp_number: 'LP-2025-00001',
    product_id: 'prod-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    product_name: 'Organic Flour 5lb',
    lot_number: 'LOT-2025-001',
    quantity_available: 100,
    location_id: 'loc-cccccccc-cccc-cccc-cccc-cccccccccccc',
    location_name: 'ZONE-A-AISLE-01-BIN-001',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Create chainable query mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [mockShipment],
        error: null,
        count: 1,
      }),
      single: vi.fn().mockResolvedValue({ data: mockShipment, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      sum: vi.fn().mockReturnThis(),
    }

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
  })

  // ============================================
  // ORG_ID ENFORCEMENT TESTS (ADR-013 Defense in Depth)
  // ============================================
  describe('org_id Enforcement - Defense in Depth', () => {
    it('createShipment should throw error when orgId is missing', async () => {
      const { createShipment } = await importPackingService()
      const createData = { sales_order_id: 'so-123' }

      await expect(createShipment(mockSupabase, createData, '', TEST_USER_ID)).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('getShipment should throw error when orgId is missing', async () => {
      const { getShipment } = await importPackingService()

      await expect(getShipment(mockSupabase, mockShipment.id, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('listShipments should throw error when orgId is missing', async () => {
      const { listShipments } = await importPackingService()

      await expect(listShipments(mockSupabase, {}, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('addBox should throw error when orgId is missing', async () => {
      const { addBox } = await importPackingService()

      await expect(addBox(mockSupabase, mockShipment.id, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('updateBox should throw error when orgId is missing', async () => {
      const { updateBox } = await importPackingService()
      const updateData = { weight: 15.5 }

      await expect(updateBox(mockSupabase, mockShipment.id, mockBox.id, updateData, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('addContent should throw error when orgId is missing', async () => {
      const { addContent } = await importPackingService()
      const contentData = {
        license_plate_id: mockAvailableLP.id,
        sales_order_line_id: mockBoxContent.sales_order_line_id,
        quantity: 50,
      }

      await expect(addContent(mockSupabase, mockShipment.id, mockBox.id, contentData, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('completePacking should throw error when orgId is missing', async () => {
      const { completePacking } = await importPackingService()

      await expect(completePacking(mockSupabase, mockShipment.id, '', TEST_USER_ID)).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('getAvailableLPs should throw error when orgId is missing', async () => {
      const { getAvailableLPs } = await importPackingService()

      await expect(getAvailableLPs(mockSupabase, mockShipment.id, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('listShipments should include org_id filter in query', async () => {
      const { listShipments } = await importPackingService()

      await listShipments(mockSupabase, {}, TEST_ORG_ID)
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', TEST_ORG_ID)
    })

    it('getShipment should include org_id filter in query', async () => {
      const { getShipment } = await importPackingService()

      await getShipment(mockSupabase, mockShipment.id, TEST_ORG_ID)
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', TEST_ORG_ID)
    })
  })

  // ============================================
  // CREATE SHIPMENT TESTS (AC-1, AC-2)
  // ============================================
  describe('createShipment - Create from Sales Order', () => {
    it('should create shipment with auto-generated shipment_number SH-YYYY-NNNNN', async () => {
      const { createShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, shipment_number: 'SH-2025-00001' },
        error: null,
      })

      const result = await createShipment(
        mockSupabase,
        { sales_order_id: mockShipment.sales_order_id },
        TEST_ORG_ID,
        TEST_USER_ID
      )

      expect(result.shipment_number).toMatch(/^SH-\d{4}-\d{5}$/)
      expect(result.status).toBe('pending')
    })

    it('should set shipment status to pending on creation', async () => {
      const { createShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, status: 'pending' },
        error: null,
      })

      const result = await createShipment(
        mockSupabase,
        { sales_order_id: mockShipment.sales_order_id },
        TEST_ORG_ID,
        TEST_USER_ID
      )

      expect(result.status).toBe('pending')
    })

    it('should reject if sales order does not exist', async () => {
      const { createShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Sales order not found' },
      })

      await expect(
        createShipment(
          mockSupabase,
          { sales_order_id: 'non-existent-so' },
          TEST_ORG_ID,
          TEST_USER_ID
        )
      ).rejects.toThrow('INVALID_SALES_ORDER')
    })

    it('should reject if sales order status is not picked', async () => {
      const { createShipment } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: { status: 'draft' },
        error: null,
      })

      await expect(
        createShipment(
          mockSupabase,
          { sales_order_id: mockShipment.sales_order_id },
          TEST_ORG_ID,
          TEST_USER_ID
        )
      ).rejects.toThrow('Sales order must be in picked status')
    })

    it('should reject if shipment already exists for sales order', async () => {
      const { createShipment } = await importPackingService()

      mockQuery.maybeSingle.mockResolvedValueOnce({
        data: mockShipment,
        error: null,
      })

      await expect(
        createShipment(
          mockSupabase,
          { sales_order_id: mockShipment.sales_order_id },
          TEST_ORG_ID,
          TEST_USER_ID
        )
      ).rejects.toThrow('CONFLICT')
    })

    it('should copy customer_id and shipping_address_id from sales order', async () => {
      const { createShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: mockShipment,
        error: null,
      })

      const result = await createShipment(
        mockSupabase,
        { sales_order_id: mockShipment.sales_order_id },
        TEST_ORG_ID,
        TEST_USER_ID
      )

      expect(result.customer_id).toBeDefined()
      expect(result.shipping_address_id).toBeDefined()
    })

    it('should include org_id and created_by in insert payload', async () => {
      const { createShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: mockShipment,
        error: null,
      })

      await createShipment(
        mockSupabase,
        { sales_order_id: mockShipment.sales_order_id },
        TEST_ORG_ID,
        TEST_USER_ID
      )

      expect(mockQuery.insert).toHaveBeenCalled()
      const insertCall = mockQuery.insert.mock.calls[0][0]
      expect(insertCall.org_id).toBe(TEST_ORG_ID)
      expect(insertCall.created_by).toBe(TEST_USER_ID)
    })
  })

  // ============================================
  // LIST SHIPMENTS TESTS (AC-3)
  // ============================================
  describe('listShipments - List with Filters', () => {
    it('should list shipments with default pagination', async () => {
      const { listShipments } = await importPackingService()

      const result = await listShipments(mockSupabase, { page: 1, limit: 20 }, TEST_ORG_ID)

      expect(result).toBeDefined()
      expect(result.shipments).toBeDefined()
      expect(result.total).toBeDefined()
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('should filter shipments by status', async () => {
      const { listShipments } = await importPackingService()

      await listShipments(mockSupabase, { status: 'packing' }, TEST_ORG_ID)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'packing')
    })

    it('should filter shipments by multiple statuses', async () => {
      const { listShipments } = await importPackingService()

      await listShipments(mockSupabase, { status: 'packing,packed' }, TEST_ORG_ID)

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['packing', 'packed'])
    })

    it('should filter shipments by customer_id', async () => {
      const { listShipments } = await importPackingService()

      await listShipments(mockSupabase, { customer_id: mockShipment.customer_id }, TEST_ORG_ID)

      expect(mockQuery.eq).toHaveBeenCalledWith('customer_id', mockShipment.customer_id)
    })

    it('should filter shipments by date range', async () => {
      const { listShipments } = await importPackingService()

      await listShipments(
        mockSupabase,
        { date_from: '2025-01-01', date_to: '2025-01-31' },
        TEST_ORG_ID
      )

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2025-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2025-01-31')
    })

    it('should sort shipments by created_at descending by default', async () => {
      const { listShipments } = await importPackingService()

      await listShipments(mockSupabase, {}, TEST_ORG_ID)

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should include customer and sales_order in response', async () => {
      const { listShipments } = await importPackingService()

      mockQuery.range.mockResolvedValueOnce({
        data: [{ ...mockShipment, customer: { name: 'Acme Corp' } }],
        error: null,
        count: 1,
      })

      const result = await listShipments(mockSupabase, {}, TEST_ORG_ID)

      expect(result.shipments[0].customer).toBeDefined()
    })
  })

  // ============================================
  // GET SHIPMENT DETAIL TESTS (AC-4)
  // ============================================
  describe('getShipment - Get Detail with Boxes and Contents', () => {
    it('should return shipment with boxes and contents', async () => {
      const { getShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: {
          ...mockShipment,
          shipment_boxes: [mockBox],
        },
        error: null,
      })

      const result = await getShipment(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.shipment).toBeDefined()
      expect(result.boxes).toBeDefined()
    })

    it('should return 404 if shipment not found', async () => {
      const { getShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(getShipment(mockSupabase, 'non-existent', TEST_ORG_ID)).rejects.toThrow('NOT_FOUND')
    })

    it('should include sales_order details', async () => {
      const { getShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: {
          ...mockShipment,
          sales_orders: { order_number: 'SO-2025-00001' },
        },
        error: null,
      })

      const result = await getShipment(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.sales_order).toBeDefined()
    })

    it('should include box contents with lot_number', async () => {
      const { getShipment } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: {
          ...mockShipment,
          shipment_boxes: [
            {
              ...mockBox,
              shipment_box_contents: [mockBoxContent],
            },
          ],
        },
        error: null,
      })

      const result = await getShipment(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.contents).toBeDefined()
      expect(result.contents[0].lot_number).toBe('LOT-2025-001')
    })
  })

  // ============================================
  // ADD BOX TESTS (AC-5)
  // ============================================
  describe('addBox - Add Box to Shipment', () => {
    it('should create box with auto-incremented box_number', async () => {
      const { addBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockBox, box_number: 1 },
        error: null,
      })

      const result = await addBox(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.box_number).toBe(1)
    })

    it('should auto-increment box_number for existing boxes', async () => {
      const { addBox } = await importPackingService()

      // First box already exists
      mockQuery.limit.mockResolvedValueOnce({
        data: [{ box_number: 2 }],
        error: null,
      })

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockBox, box_number: 3 },
        error: null,
      })

      const result = await addBox(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.box_number).toBe(3)
    })

    it('should update shipment status to packing if pending', async () => {
      const { addBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, status: 'pending' },
        error: null,
      })

      mockQuery.single.mockResolvedValueOnce({
        data: mockBox,
        error: null,
      })

      await addBox(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(mockQuery.update).toHaveBeenCalled()
    })

    it('should not update shipment status if already packing', async () => {
      const { addBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, status: 'packing' },
        error: null,
      })

      mockQuery.single.mockResolvedValueOnce({
        data: mockBox,
        error: null,
      })

      await addBox(mockSupabase, mockShipment.id, TEST_ORG_ID)

      // Should not have called update on shipment status
      const updateCalls = mockQuery.update.mock.calls.filter(
        (call: any) => call[0]?.status === 'packing'
      )
      expect(updateCalls.length).toBe(0)
    })

    it('should return box with NULL weight and dimensions', async () => {
      const { addBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: mockBox,
        error: null,
      })

      const result = await addBox(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.weight).toBeNull()
      expect(result.length).toBeNull()
      expect(result.width).toBeNull()
      expect(result.height).toBeNull()
    })

    it('should reject if shipment not found', async () => {
      const { addBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(addBox(mockSupabase, 'non-existent', TEST_ORG_ID)).rejects.toThrow('SHIPMENT_NOT_FOUND')
    })
  })

  // ============================================
  // UPDATE BOX TESTS (AC-6, AC-8)
  // ============================================
  describe('updateBox - Update Weight and Dimensions', () => {
    it('should update box weight', async () => {
      const { updateBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockBox, weight: 15.5 },
        error: null,
      })

      const result = await updateBox(
        mockSupabase,
        mockShipment.id,
        mockBox.id,
        { weight: 15.5 },
        TEST_ORG_ID
      )

      expect(result.weight).toBe(15.5)
    })

    it('should update box dimensions', async () => {
      const { updateBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockBox, length: 60, width: 40, height: 30 },
        error: null,
      })

      const result = await updateBox(
        mockSupabase,
        mockShipment.id,
        mockBox.id,
        { length: 60, width: 40, height: 30 },
        TEST_ORG_ID
      )

      expect(result.length).toBe(60)
      expect(result.width).toBe(40)
      expect(result.height).toBe(30)
    })

    it('should reject weight <= 0', async () => {
      const { updateBox } = await importPackingService()

      await expect(
        updateBox(mockSupabase, mockShipment.id, mockBox.id, { weight: 0 }, TEST_ORG_ID)
      ).rejects.toThrow('Weight must be greater than 0')
    })

    it('should reject weight > 25kg (default capacity)', async () => {
      const { updateBox } = await importPackingService()

      await expect(
        updateBox(mockSupabase, mockShipment.id, mockBox.id, { weight: 30 }, TEST_ORG_ID)
      ).rejects.toThrow('Weight must be less than or equal to 25kg')
    })

    it('should reject dimension < 10cm', async () => {
      const { updateBox } = await importPackingService()

      await expect(
        updateBox(mockSupabase, mockShipment.id, mockBox.id, { length: 5 }, TEST_ORG_ID)
      ).rejects.toThrow('Dimensions must be between 10 and 200 cm')
    })

    it('should reject dimension > 200cm', async () => {
      const { updateBox } = await importPackingService()

      await expect(
        updateBox(mockSupabase, mockShipment.id, mockBox.id, { width: 250 }, TEST_ORG_ID)
      ).rejects.toThrow('Dimensions must be between 10 and 200 cm')
    })

    it('should return 404 if box not found', async () => {
      const { updateBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(
        updateBox(mockSupabase, mockShipment.id, 'non-existent', { weight: 10 }, TEST_ORG_ID)
      ).rejects.toThrow('BOX_NOT_FOUND')
    })

    it('should reject update if shipment is packed', async () => {
      const { updateBox } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: { status: 'packed' },
        error: null,
      })

      await expect(
        updateBox(mockSupabase, mockShipment.id, mockBox.id, { weight: 10 }, TEST_ORG_ID)
      ).rejects.toThrow('Cannot update box after shipment is packed')
    })
  })

  // ============================================
  // ADD CONTENT TESTS (AC-7)
  // ============================================
  describe('addContent - Add LP to Box', () => {
    it('should create content record with LP and lot_number', async () => {
      const { addContent } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: mockBoxContent,
        error: null,
      })

      const result = await addContent(
        mockSupabase,
        mockShipment.id,
        mockBox.id,
        {
          license_plate_id: mockAvailableLP.id,
          sales_order_line_id: mockBoxContent.sales_order_line_id,
          quantity: 50,
        },
        TEST_ORG_ID
      )

      expect(result.license_plate_id).toBe(mockAvailableLP.id)
      expect(result.lot_number).toBe('LOT-2025-001')
    })

    it('should capture lot_number from license_plate', async () => {
      const { addContent } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockBoxContent, lot_number: 'LOT-2025-002' },
        error: null,
      })

      const result = await addContent(
        mockSupabase,
        mockShipment.id,
        mockBox.id,
        {
          license_plate_id: mockAvailableLP.id,
          sales_order_line_id: mockBoxContent.sales_order_line_id,
          quantity: 50,
        },
        TEST_ORG_ID
      )

      expect(result.lot_number).toBe('LOT-2025-002')
    })

    it('should reject quantity <= 0', async () => {
      const { addContent } = await importPackingService()

      await expect(
        addContent(
          mockSupabase,
          mockShipment.id,
          mockBox.id,
          {
            license_plate_id: mockAvailableLP.id,
            sales_order_line_id: mockBoxContent.sales_order_line_id,
            quantity: 0,
          },
          TEST_ORG_ID
        )
      ).rejects.toThrow('Quantity must be greater than 0')
    })

    it('should reject quantity exceeding LP available qty', async () => {
      const { addContent } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: { quantity_available: 50 },
        error: null,
      })

      await expect(
        addContent(
          mockSupabase,
          mockShipment.id,
          mockBox.id,
          {
            license_plate_id: mockAvailableLP.id,
            sales_order_line_id: mockBoxContent.sales_order_line_id,
            quantity: 100,
          },
          TEST_ORG_ID
        )
      ).rejects.toThrow('Quantity exceeds available quantity in LP')
    })

    it('should reject if LP not found', async () => {
      const { addContent } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(
        addContent(
          mockSupabase,
          mockShipment.id,
          mockBox.id,
          {
            license_plate_id: 'non-existent',
            sales_order_line_id: mockBoxContent.sales_order_line_id,
            quantity: 50,
          },
          TEST_ORG_ID
        )
      ).rejects.toThrow('LICENSE_PLATE_NOT_FOUND')
    })

    it('should include org_id in content insert', async () => {
      const { addContent } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: mockBoxContent,
        error: null,
      })

      await addContent(
        mockSupabase,
        mockShipment.id,
        mockBox.id,
        {
          license_plate_id: mockAvailableLP.id,
          sales_order_line_id: mockBoxContent.sales_order_line_id,
          quantity: 50,
        },
        TEST_ORG_ID
      )

      expect(mockQuery.insert).toHaveBeenCalled()
      const insertCall = mockQuery.insert.mock.calls[0][0]
      expect(insertCall.org_id).toBe(TEST_ORG_ID)
    })
  })

  // ============================================
  // GET AVAILABLE LPS TESTS (AC-5)
  // ============================================
  describe('getAvailableLPs - Get Picked LPs for Packing', () => {
    it('should return picked LPs not yet packed', async () => {
      const { getAvailableLPs } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [mockAvailableLP],
        error: null,
      })

      const result = await getAvailableLPs(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.license_plates).toBeDefined()
      expect(result.license_plates.length).toBeGreaterThan(0)
    })

    it('should exclude LPs already in shipment_box_contents', async () => {
      const { getAvailableLPs } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await getAvailableLPs(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.license_plates).toHaveLength(0)
    })

    it('should include LP#, product, lot, qty, location in response', async () => {
      const { getAvailableLPs } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [mockAvailableLP],
        error: null,
      })

      const result = await getAvailableLPs(mockSupabase, mockShipment.id, TEST_ORG_ID)

      const lp = result.license_plates[0]
      expect(lp.lp_number).toBeDefined()
      expect(lp.product_name).toBeDefined()
      expect(lp.lot_number).toBeDefined()
      expect(lp.quantity_available).toBeDefined()
      expect(lp.location_name).toBeDefined()
    })

    it('should return pack progress counts', async () => {
      const { getAvailableLPs } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [mockAvailableLP],
        error: null,
      })

      const result = await getAvailableLPs(mockSupabase, mockShipment.id, TEST_ORG_ID)

      expect(result.total_count).toBeDefined()
      expect(result.packed_count).toBeDefined()
      expect(result.remaining_count).toBeDefined()
    })

    it('should return 404 if shipment not found', async () => {
      const { getAvailableLPs } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(getAvailableLPs(mockSupabase, 'non-existent', TEST_ORG_ID)).rejects.toThrow(
        'SHIPMENT_NOT_FOUND'
      )
    })
  })

  // ============================================
  // COMPLETE PACKING TESTS (AC-10, AC-11, AC-12)
  // ============================================
  describe('completePacking - Validate and Complete', () => {
    it('should update shipment status to packed on completion', async () => {
      const { completePacking } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: {
          ...mockShipment,
          status: 'packed',
          packed_at: '2025-01-22T12:00:00Z',
          packed_by: TEST_USER_ID,
          total_weight: 45.5,
          total_boxes: 2,
        },
        error: null,
      })

      const result = await completePacking(mockSupabase, mockShipment.id, TEST_ORG_ID, TEST_USER_ID)

      expect(result.status).toBe('packed')
      expect(result.packed_at).toBeDefined()
      expect(result.packed_by).toBe(TEST_USER_ID)
    })

    it('should calculate total_weight from all boxes', async () => {
      const { completePacking } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, total_weight: 45.5 },
        error: null,
      })

      const result = await completePacking(mockSupabase, mockShipment.id, TEST_ORG_ID, TEST_USER_ID)

      expect(result.total_weight).toBe(45.5)
    })

    it('should calculate total_boxes count', async () => {
      const { completePacking } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, total_boxes: 2 },
        error: null,
      })

      const result = await completePacking(mockSupabase, mockShipment.id, TEST_ORG_ID, TEST_USER_ID)

      expect(result.total_boxes).toBe(2)
    })

    it('should reject if any box has NULL weight', async () => {
      const { completePacking } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: { boxes_without_weight: 1 },
        error: null,
      })

      await expect(
        completePacking(mockSupabase, mockShipment.id, TEST_ORG_ID, TEST_USER_ID)
      ).rejects.toThrow('MISSING_WEIGHT')
    })

    it('should reject if not all picked LPs are packed', async () => {
      const { completePacking } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: { unpacked_lps: 3 },
        error: null,
      })

      await expect(
        completePacking(mockSupabase, mockShipment.id, TEST_ORG_ID, TEST_USER_ID)
      ).rejects.toThrow('UNPACKED_ITEMS')
    })

    it('should reject if shipment is not in packing status', async () => {
      const { completePacking } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, status: 'pending' },
        error: null,
      })

      await expect(
        completePacking(mockSupabase, mockShipment.id, TEST_ORG_ID, TEST_USER_ID)
      ).rejects.toThrow('INVALID_STATUS')
    })

    it('should update sales_order status to packed', async () => {
      const { completePacking } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, status: 'packed' },
        error: null,
      })

      await completePacking(mockSupabase, mockShipment.id, TEST_ORG_ID, TEST_USER_ID)

      // Verify sales_order update was called
      expect(mockQuery.update).toHaveBeenCalled()
    })

    it('should return shipment_number in success message', async () => {
      const { completePacking } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockShipment, status: 'packed' },
        error: null,
      })

      const result = await completePacking(mockSupabase, mockShipment.id, TEST_ORG_ID, TEST_USER_ID)

      expect(result.shipment_number).toBeDefined()
      expect(result.message).toContain(result.shipment_number)
    })
  })

  // ============================================
  // ALLERGEN SEPARATION TESTS (AC-9)
  // ============================================
  describe('checkAllergenSeparation - Allergen Warnings', () => {
    it('should return warning if product contains allergen in customer restrictions', async () => {
      const { checkAllergenSeparation } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          has_conflict: true,
          product_allergens: ['Gluten', 'Dairy'],
          customer_restrictions: ['Gluten'],
          conflicting_allergens: ['Gluten'],
        },
        error: null,
      })

      const result = await checkAllergenSeparation(
        mockSupabase,
        mockBox.id,
        mockAvailableLP.product_id,
        mockShipment.customer_id,
        TEST_ORG_ID
      )

      expect(result.has_conflict).toBe(true)
      expect(result.conflicting_allergens).toContain('Gluten')
    })

    it('should return no warning if no allergen conflict', async () => {
      const { checkAllergenSeparation } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          has_conflict: false,
          product_allergens: ['Dairy'],
          customer_restrictions: ['Gluten'],
          conflicting_allergens: [],
        },
        error: null,
      })

      const result = await checkAllergenSeparation(
        mockSupabase,
        mockBox.id,
        mockAvailableLP.product_id,
        mockShipment.customer_id,
        TEST_ORG_ID
      )

      expect(result.has_conflict).toBe(false)
      expect(result.conflicting_allergens).toHaveLength(0)
    })

    it('should be non-blocking warning (allow proceed)', async () => {
      const { checkAllergenSeparation } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          has_conflict: true,
          is_blocking: false,
        },
        error: null,
      })

      const result = await checkAllergenSeparation(
        mockSupabase,
        mockBox.id,
        mockAvailableLP.product_id,
        mockShipment.customer_id,
        TEST_ORG_ID
      )

      expect(result.is_blocking).toBe(false)
    })

    it('should check allergens of existing products in box', async () => {
      const { checkAllergenSeparation } = await importPackingService()

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          has_conflict: true,
          box_allergens: ['Gluten', 'Dairy', 'Nuts'],
          conflicting_allergens: ['Nuts'],
        },
        error: null,
      })

      const result = await checkAllergenSeparation(
        mockSupabase,
        mockBox.id,
        mockAvailableLP.product_id,
        mockShipment.customer_id,
        TEST_ORG_ID
      )

      expect(result.box_allergens).toBeDefined()
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const { listShipments } = await importPackingService()

      mockQuery.range.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      })

      await expect(listShipments(mockSupabase, {}, TEST_ORG_ID)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should return meaningful error for invalid UUID', async () => {
      const { getShipment } = await importPackingService()

      await expect(getShipment(mockSupabase, 'invalid-uuid', TEST_ORG_ID)).rejects.toThrow()
    })

    it('should handle concurrent updates gracefully', async () => {
      const { updateBox } = await importPackingService()

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Row was updated by another user' },
      })

      await expect(
        updateBox(mockSupabase, mockShipment.id, mockBox.id, { weight: 10 }, TEST_ORG_ID)
      ).rejects.toThrow()
    })
  })
})
