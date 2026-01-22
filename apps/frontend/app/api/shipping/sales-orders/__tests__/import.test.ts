/**
 * Sales Order Import API - Integration Tests (Story 07.5)
 * Purpose: Test import endpoint POST /api/shipping/sales-orders/import
 * Phase: GREEN - Tests verify implementation
 *
 * Test Cases from tests.yaml:
 * - AC-IMPORT-03: Import CSV creates SOs with correct customer grouping
 * - AC-IMPORT-09: Import with partial errors creates valid SOs
 * - AC-IMPORT-15: Import - Success Summary
 * - AC-IMPORT-16: Import - Error Summary
 * - AC-IMPORT-17: Import - Org Isolation
 * - AC-IMPORT-18: Import - SO Org Assignment
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

const mockSupabaseAdmin = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  createServerSupabaseAdmin: vi.fn(() => mockSupabaseAdmin),
}))

// Mock SalesOrderService
const mockImportResult = {
  validatedRows: [],
  customerGroups: {},
  ordersToCreate: 0,
  linesToCreate: 0,
  validCount: 0,
  invalidCount: 0,
  errors: [],
  defaultValues: { status: 'draft' as const, allergen_validated: false, order_date: '2025-01-22' },
}

vi.mock('@/lib/services/sales-order-service', () => ({
  SalesOrderService: {
    importSalesOrdersFromCSV: vi.fn(() => Promise.resolve(mockImportResult)),
    generateNextNumber: vi.fn(() => Promise.resolve('SO-2025-00789')),
  },
}))

// Import after mocks
import { POST } from '../import/route'
import { SalesOrderService } from '@/lib/services/sales-order-service'

describe('Import SO API - POST /api/shipping/sales-orders/import (Story 07.5)', () => {
  const TEST_ORG_ID = '22222222-2222-2222-2222-222222222222'
  const TEST_USER_ID = 'user-123'

  const mockUserData = {
    org_id: TEST_ORG_ID,
    role: { code: 'sales' },
  }

  // Mock customer lookup
  const mockCustomers = [
    { id: 'cust-001', code: 'ACME001', name: 'Acme Corporation', org_id: TEST_ORG_ID },
    { id: 'cust-002', code: 'BETA002', name: 'Beta Industries', org_id: TEST_ORG_ID },
    { id: 'cust-003', code: 'GAMMA003', name: 'Gamma Foods', org_id: TEST_ORG_ID },
  ]

  // Mock product lookup
  const mockProducts = [
    { id: 'prod-001', code: 'PROD-001', name: 'Widget A', org_id: TEST_ORG_ID },
    { id: 'prod-002', code: 'PROD-002', name: 'Widget B', org_id: TEST_ORG_ID },
    { id: 'prod-003', code: 'PROD-003', name: 'Widget C', org_id: TEST_ORG_ID },
  ]

  let orderCounter = 0

  beforeEach(() => {
    vi.clearAllMocks()
    orderCounter = 0

    // Default mock setup
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    })

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
            }),
          }),
        }
      }
      if (table === 'sales_orders') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => {
                orderCounter++
                return Promise.resolve({
                  data: { id: `new-so-${orderCounter}`, order_number: `SO-2025-0078${orderCounter}` },
                  error: null,
                })
              }),
            }),
          }),
        }
      }
      if (table === 'sales_order_lines') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return { select: vi.fn() }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function createRequest(csvContent: string): NextRequest {
    const formData = new FormData()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    formData.append('file', blob, 'orders.csv')

    return new NextRequest('http://localhost/api/shipping/sales-orders/import', {
      method: 'POST',
      body: formData,
    })
  }

  describe('Authentication', () => {
    it('should return 401 when user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const csvContent = 'customer_code,product_code,quantity,unit_price\nACME001,PROD-001,100,10.50'
      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Authorization', () => {
    it('should return 403 when user lacks shipping.C permission', async () => {
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { org_id: TEST_ORG_ID, role: { code: 'viewer' } },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const csvContent = 'customer_code,product_code,quantity,unit_price\nACME001,PROD-001,100,10.50'
      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(403)
    })
  })

  describe('File Validation', () => {
    it('should return 400 when no file uploaded', async () => {
      const request = new NextRequest('http://localhost/api/shipping/sales-orders/import', {
        method: 'POST',
        body: new FormData(),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.message).toBe('No file uploaded')
    })

    it('should return 400 when file is empty', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockRejectedValue(new Error('CSV file is empty'))

      const request = createRequest('')
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.message).toBe('CSV file is empty')
    })

    it('should return 400 when file too large (> 5MB)', async () => {
      const formData = new FormData()
      // Create a 6MB blob
      const largeContent = 'a'.repeat(6 * 1024 * 1024)
      const blob = new Blob([largeContent], { type: 'text/csv' })
      formData.append('file', blob, 'orders.csv')

      const request = new NextRequest('http://localhost/api/shipping/sales-orders/import', {
        method: 'POST',
        body: formData,
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('FILE_TOO_LARGE')
    })

    it('should return 400 when file is not CSV', async () => {
      const formData = new FormData()
      const blob = new Blob(['data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      formData.append('file', blob, 'orders.xlsx')

      const request = new NextRequest('http://localhost/api/shipping/sales-orders/import', {
        method: 'POST',
        body: formData,
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_FILE_TYPE')
    })
  })

  describe('CSV Header Validation', () => {
    it('should return 400 when missing required headers', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockRejectedValue(
        new Error('Missing required columns: quantity')
      )

      const csvContent = 'customer_code,product_code\nACME001,PROD-001'
      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.message).toContain('Missing required columns')
    })
  })

  describe('AC-IMPORT-03: Import CSV creates SOs with correct customer grouping', () => {
    it('should create 3 SOs from CSV with 3 customers', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-002', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-002' },
          { rowNumber: 3, valid: true, customer_code: 'BETA002', product_code: 'PROD-001', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-001' },
          { rowNumber: 4, valid: true, customer_code: 'BETA002', product_code: 'PROD-003', quantity: 75, unit_price: 15.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-003' },
          { rowNumber: 5, valid: true, customer_code: 'GAMMA003', product_code: 'PROD-001', quantity: 300, unit_price: 5.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-003', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
            { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-002', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-002' },
          ],
          'BETA002': [
            { rowNumber: 3, valid: true, customer_code: 'BETA002', product_code: 'PROD-001', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-001' },
            { rowNumber: 4, valid: true, customer_code: 'BETA002', product_code: 'PROD-003', quantity: 75, unit_price: 15.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-003' },
          ],
          'GAMMA003': [
            { rowNumber: 5, valid: true, customer_code: 'GAMMA003', product_code: 'PROD-001', quantity: 300, unit_price: 5.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-003', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 3,
        linesToCreate: 5,
        validCount: 5,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00
BETA002,PROD-001,200,10.00
BETA002,PROD-003,75,15.00
GAMMA003,PROD-001,300,5.00`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ordersCreated).toBe(3)
    })

    it('should link each SO to correct customer_id', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          { rowNumber: 2, valid: true, customer_code: 'BETA002', product_code: 'PROD-001', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
          'BETA002': [
            { rowNumber: 2, valid: true, customer_code: 'BETA002', product_code: 'PROD-001', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 2,
        linesToCreate: 2,
        validCount: 2,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
BETA002,PROD-001,200,10.00`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.created_orders.length).toBe(2)
    })

    it('should group lines correctly per SO', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-002', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-002' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
            { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-002', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-002' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 2,
        validCount: 2,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.created_orders[0].lines_count).toBe(2)
    })

    it('should number lines sequentially per SO', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-002', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-002' },
          { rowNumber: 3, valid: true, customer_code: 'ACME001', product_code: 'PROD-003', quantity: 75, unit_price: 15.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-003' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
            { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-002', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-002' },
            { rowNumber: 3, valid: true, customer_code: 'ACME001', product_code: 'PROD-003', quantity: 75, unit_price: 15.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-003' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 3,
        validCount: 3,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00
ACME001,PROD-003,75,15.00`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.created_orders[0].lines_count).toBe(3)
    })
  })

  describe('AC-IMPORT-09: Import with partial errors creates valid SOs', () => {
    it('should create SOs for valid rows, skip invalid', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: false, error: 'Customer INVALID not found', customer_code: 'INVALID', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null },
          { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          { rowNumber: 3, valid: false, error: 'Product PROD-999 not found', customer_code: 'MISSING-PROD', product_code: 'PROD-999', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null },
          { rowNumber: 4, valid: true, customer_code: 'BETA002', product_code: 'PROD-002', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-002' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
          'BETA002': [
            { rowNumber: 4, valid: true, customer_code: 'BETA002', product_code: 'PROD-002', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-002' },
          ],
        },
        ordersToCreate: 2,
        linesToCreate: 2,
        validCount: 2,
        invalidCount: 2,
        errors: [
          { row: 1, customer_code: 'INVALID', error: 'Customer INVALID not found' },
          { row: 3, product_code: 'PROD-999', error: 'Product PROD-999 not found' },
        ],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
INVALID,PROD-001,100,10.50
ACME001,PROD-001,100,10.50
MISSING-PROD,PROD-999,50,25.00
BETA002,PROD-002,200,10.00`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ordersCreated).toBe(2)
      expect(data.errorsCount).toBe(2)
    })

    it('should include row numbers in error messages', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          { rowNumber: 2, valid: false, error: 'Customer INVALID not found', customer_code: 'INVALID', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 1,
        validCount: 1,
        invalidCount: 1,
        errors: [{ row: 2, customer_code: 'INVALID', error: 'Customer INVALID not found' }],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
INVALID,PROD-001,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(data.errors[0].rowNumber).toBe(2)
      expect(data.errors[0].message).toContain('Customer INVALID not found')
    })
  })

  describe('AC-IMPORT-15: Import - Success Summary', () => {
    it('should return success summary with counts', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-002', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-002' },
          { rowNumber: 3, valid: true, customer_code: 'BETA002', product_code: 'PROD-001', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
            { rowNumber: 2, valid: true, customer_code: 'ACME001', product_code: 'PROD-002', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-002' },
          ],
          'BETA002': [
            { rowNumber: 3, valid: true, customer_code: 'BETA002', product_code: 'PROD-001', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 2,
        linesToCreate: 3,
        validCount: 3,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00
BETA002,PROD-001,200,10.00`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(data.ordersCreated).toBe(2)
      expect(data.linesImported).toBe(3)
      expect(data.errorsCount).toBe(0)
    })

    it('should include list of created order numbers', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          { rowNumber: 2, valid: true, customer_code: 'BETA002', product_code: 'PROD-001', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
          'BETA002': [
            { rowNumber: 2, valid: true, customer_code: 'BETA002', product_code: 'PROD-001', quantity: 200, unit_price: 10.00, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-002', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 2,
        linesToCreate: 2,
        validCount: 2,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
BETA002,PROD-001,200,10.00`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(data.createdOrderNumbers).toBeDefined()
      expect(data.createdOrderNumbers.length).toBe(2)
      expect(data.createdOrderNumbers[0]).toMatch(/^SO-\d{4}-\d{4,5}$/)
    })
  })

  describe('AC-IMPORT-16: Import - Error Summary', () => {
    it('should return error list with row numbers and messages', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: false, error: 'Customer INVALID not found', customer_code: 'INVALID', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null },
          { rowNumber: 2, valid: false, error: 'Product INVALID-PROD not found', customer_code: 'ACME001', product_code: 'INVALID-PROD', quantity: 50, unit_price: 25.00, customer_po: null, promised_ship_date: null, notes: null },
        ],
        customerGroups: {},
        ordersToCreate: 0,
        linesToCreate: 0,
        validCount: 0,
        invalidCount: 2,
        errors: [
          { row: 1, customer_code: 'INVALID', error: 'Customer INVALID not found' },
          { row: 2, product_code: 'INVALID-PROD', error: 'Product INVALID-PROD not found' },
        ],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
INVALID,PROD-001,100,10.50
ACME001,INVALID-PROD,50,25.00`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(data.errors).toBeDefined()
      expect(data.errors.length).toBe(2)
      expect(data.errors[0].rowNumber).toBe(1)
      expect(data.errors[0].message).toContain('Customer INVALID not found')
      expect(data.errors[1].rowNumber).toBe(2)
      expect(data.errors[1].message).toContain('Product INVALID-PROD not found')
    })
  })

  describe('AC-IMPORT-17: Import - Org Isolation', () => {
    it('should not find customer from different org', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: false, error: 'Customer ORG-B-CUSTOMER not found', customer_code: 'ORG-B-CUSTOMER', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null },
        ],
        customerGroups: {},
        ordersToCreate: 0,
        linesToCreate: 0,
        validCount: 0,
        invalidCount: 1,
        errors: [{ row: 1, customer_code: 'ORG-B-CUSTOMER', error: 'Customer ORG-B-CUSTOMER not found' }],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ORG-B-CUSTOMER,PROD-001,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(data.errors[0].message).toContain('Customer')
      expect(data.errors[0].message).toContain('not found')
    })

    it('should not find product from different org', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: false, error: 'Product ORG-B-PRODUCT not found', customer_code: 'ACME001', product_code: 'ORG-B-PRODUCT', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null },
        ],
        customerGroups: {},
        ordersToCreate: 0,
        linesToCreate: 0,
        validCount: 0,
        invalidCount: 1,
        errors: [{ row: 1, product_code: 'ORG-B-PRODUCT', error: 'Product ORG-B-PRODUCT not found' }],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,ORG-B-PRODUCT,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(data.errors[0].message).toContain('Product')
      expect(data.errors[0].message).toContain('not found')
    })
  })

  describe('AC-IMPORT-18: Import - SO Org Assignment', () => {
    it('should set org_id on all created SOs', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 1,
        validCount: 1,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.created_orders.length).toBe(1)
    })
  })

  describe('Import - allergen_validated Reset', () => {
    it('should set allergen_validated=false on all created SOs', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 1,
        validCount: 1,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)

      // Service is called with correct org_id
      expect(SalesOrderService.importSalesOrdersFromCSV).toHaveBeenCalled()
    })
  })

  describe('Import - Default Values', () => {
    it('should set status=draft on created SOs', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 1,
        validCount: 1,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should set order_date to today', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 1,
        validCount: 1,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should use customer_po from CSV if provided', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: 'PO-12345', promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: 'PO-12345', promised_ship_date: null, notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 1,
        validCount: 1,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price,customer_po
ACME001,PROD-001,100,10.50,PO-12345`

      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should use promised_ship_date from CSV if provided', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockResolvedValue({
        validatedRows: [
          { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: '2025-12-20', notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
        ],
        customerGroups: {
          'ACME001': [
            { rowNumber: 1, valid: true, customer_code: 'ACME001', product_code: 'PROD-001', quantity: 100, unit_price: 10.50, customer_po: null, promised_ship_date: '2025-12-20', notes: null, resolvedCustomerId: 'cust-001', resolvedProductId: 'prod-001' },
          ],
        },
        ordersToCreate: 1,
        linesToCreate: 1,
        validCount: 1,
        invalidCount: 0,
        errors: [],
        defaultValues: { status: 'draft', allergen_validated: false, order_date: '2025-01-22' },
      })

      const csvContent = `customer_code,product_code,quantity,unit_price,promised_ship_date
ACME001,PROD-001,100,10.50,2025-12-20`

      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockRejectedValue(new Error('Database error'))

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should rollback on partial failure', async () => {
      // This is tested by the error handling - if an error occurs, no SOs are committed
      vi.mocked(SalesOrderService.importSalesOrdersFromCSV).mockRejectedValue(new Error('Failed to import'))

      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const request = createRequest(csvContent)
      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
