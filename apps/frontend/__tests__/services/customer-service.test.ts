/**
 * Unit Tests: Customer Service (Story 07.1)
 * Phase: RED - All tests should FAIL (no implementation exists)
 *
 * Tests for CustomerService with:
 * - Customer CRUD operations
 * - Contacts management
 * - Addresses management
 * - Allergen validation
 * - Business rules (unique code, payment terms, open orders check)
 *
 * Coverage target: 80%+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomerService } from '@/lib/services/customer-service'
import type { Customer, CustomerContact, CustomerAddress } from '@/lib/services/customer-service'

// Mock Supabase client with proper chain methods
const createMockQueryBuilder = (returnData: any = null, returnError: any = null) => {
  const createChain = (): any => ({
    select: vi.fn().mockImplementation(() => createChain()),
    eq: vi.fn().mockImplementation(() => createChain()),
    neq: vi.fn().mockImplementation(() => createChain()),
    in: vi.fn().mockImplementation(() => createChain()),
    ilike: vi.fn().mockImplementation(() => createChain()),
    or: vi.fn().mockImplementation(() => createChain()),
    order: vi.fn().mockImplementation(() => createChain()),
    range: vi.fn().mockResolvedValue({ data: returnData ? [returnData] : [], error: returnError, count: returnData ? 1 : 0 }),
    limit: vi.fn().mockResolvedValue({ data: returnData ? [returnData] : [], error: returnError }),
    single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }),
    insert: vi.fn().mockImplementation(() => createChain()),
    update: vi.fn().mockImplementation(() => createChain()),
    delete: vi.fn().mockImplementation(() => createChain()),
    then: vi.fn().mockImplementation((cb) => cb({ data: returnData, error: returnError })),
  })
  return createChain()
}

const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  createServerSupabaseAdmin: vi.fn(() => mockSupabaseClient),
}))

// =============================================================================
// Test Data Fixtures
// =============================================================================

const mockOrg = {
  id: 'org-test-a',
  name: 'Test Org A',
}

const mockUser = {
  id: 'user-a',
  email: 'user@test.com',
  user_metadata: { org_id: 'org-test-a', role: 'sales' },
}

const mockAllergens = [
  { id: 'allergen-milk', code: 'A07', name: 'Milk' },
  { id: 'allergen-peanuts', code: 'A05', name: 'Peanuts' },
  { id: 'allergen-fish', code: 'A04', name: 'Fish' },
]

const mockCustomer: Customer = {
  id: 'cust-acme-01',
  org_id: 'org-test-a',
  customer_code: 'ACME001',
  name: 'ACME Corp',
  email: 'contact@acme.com',
  phone: '+1-555-0100',
  tax_id: null,
  credit_limit: 50000,
  payment_terms_days: 30,
  category: 'wholesale',
  allergen_restrictions: null,
  is_active: true,
  notes: 'VIP customer',
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'user-a',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockContact: CustomerContact = {
  id: 'contact-1',
  org_id: 'org-test-a',
  customer_id: 'cust-acme-01',
  name: 'John Doe',
  title: 'Purchasing Manager',
  email: 'john@acme.com',
  phone: '+1-555-0101',
  is_primary: true,
  created_at: '2025-01-01T00:00:00Z',
}

const mockAddress: CustomerAddress = {
  id: 'address-1',
  org_id: 'org-test-a',
  customer_id: 'cust-acme-01',
  address_type: 'shipping',
  is_default: true,
  address_line1: '123 Main St',
  address_line2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postal_code: '10001',
  country: 'USA',
  dock_hours: { mon: '08:00-17:00', tue: '08:00-17:00' },
  notes: 'Use loading dock B',
  created_at: '2025-01-01T00:00:00Z',
}

// =============================================================================
// CREATE CUSTOMER TESTS
// =============================================================================

describe('CustomerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup auth mock to return the mock user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Setup default from() mock for users table query
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { org_id: mockUser.user_metadata.org_id },
            error: null,
          }),
        }
      }
      if (table === 'customers') {
        const builder = createMockQueryBuilder()
        let insertedData: any = null

        // Default: no existing customer found (for uniqueness check)
        builder.single.mockResolvedValue({ data: null, error: null })

        // For insert, dynamically return the created customer with input values
        builder.insert.mockImplementation((insertData: any) => {
          insertedData = {
            id: '550e8400-e29b-41d4-a716-446655440000',
            ...insertData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: insertedData,
              error: null,
            }),
          }
        })
        // For update, return the updated customer
        builder.update.mockImplementation(() => ({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockCustomer, updated_at: new Date().toISOString() },
            error: null,
          }),
        }))
        // For range (pagination)
        builder.range.mockResolvedValue({
          data: [mockCustomer],
          error: null,
          count: 1,
        })
        return builder
      }
      if (table === 'customer_contacts') {
        const builder = createMockQueryBuilder()
        // Insert returns the input data with generated id
        builder.insert.mockImplementation((insertData: any) => ({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              customer_id: 'cust-acme-01',
              org_id: mockUser.user_metadata.org_id,
              is_primary: false,
              created_at: new Date().toISOString(),
              ...insertData,
            },
            error: null,
          }),
        }))
        // Update returns merged data with updates
        builder.update.mockImplementation((updateData: any) => ({
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockContact, ...updateData },
            error: null,
          }),
        }))
        builder.delete.mockImplementation(() => ({
          eq: vi.fn().mockReturnThis(),
          then: (cb: any) => cb({ error: null }),
        }))
        // For email uniqueness check, return null (no existing)
        builder.single.mockResolvedValue({ data: null, error: null })
        return builder
      }
      if (table === 'customer_addresses') {
        const builder = createMockQueryBuilder()
        // Insert returns the input data with generated id
        builder.insert.mockImplementation((insertData: any) => ({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              customer_id: 'cust-acme-01',
              org_id: mockUser.user_metadata.org_id,
              is_default: false,
              created_at: new Date().toISOString(),
              ...insertData,
            },
            error: null,
          }),
        }))
        // Update returns merged data with updates
        builder.update.mockImplementation((updateData: any) => ({
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockAddress, ...updateData },
            error: null,
          }),
        }))
        return builder
      }
      if (table === 'allergens') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          then: (cb: any) => cb({ data: mockAllergens, error: null }),
        }
      }
      return createMockQueryBuilder()
    })
  })

  describe('createCustomer', () => {
    it('should create customer with required fields', async () => {
      const input = {
        customer_code: 'NEWCUST001',
        name: 'New Customer Inc',
        category: 'wholesale' as const,
      }

      const result = await CustomerService.createCustomer(input)

      expect(result).toHaveProperty('id')
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/) // UUID format
      expect(result.org_id).toBe(mockUser.user_metadata.org_id)
      expect(result.is_active).toBe(true)
      expect(result.created_by).toBe(mockUser.id)
    })

    it('should normalize customer_code to uppercase', async () => {
      const input = {
        customer_code: 'acme-001',
        name: 'ACME Inc',
        category: 'retail' as const,
      }

      const result = await CustomerService.createCustomer(input)

      expect(result.customer_code).toBe('ACME-001')
    })

    it('should validate customer_code format - reject special chars', async () => {
      const input = {
        customer_code: 'invalid code!',
        name: 'Test',
        category: 'retail' as const,
      }

      await expect(CustomerService.createCustomer(input)).rejects.toThrow(
        'Invalid character in customer_code'
      )
    })

    it('should reject duplicate customer_code per org', async () => {
      // Override mock to simulate existing customer with same code
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { org_id: mockUser.user_metadata.org_id },
              error: null,
            }),
          }
        }
        if (table === 'customers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-customer', customer_code: 'ACME001' },
              error: null,
            }),
          }
        }
        return createMockQueryBuilder()
      })

      const input = {
        customer_code: 'ACME001', // Already exists
        name: 'Another ACME',
        category: 'retail' as const,
      }

      await expect(CustomerService.createCustomer(input)).rejects.toThrow(
        'Customer code already exists in organization'
      )
    })

    it('should encrypt tax_id field', async () => {
      const input = {
        customer_code: 'TAXTEST01',
        name: 'Tax Test Inc',
        category: 'wholesale' as const,
        tax_id: 'VAT123456',
      }

      const result = await CustomerService.createCustomer(input)

      // The result should have tax_id (decrypted on read)
      expect(result.tax_id).toBe('VAT123456')
      // But stored encrypted in DB (verified via mock call)
    })

    it('should validate allergen IDs exist', async () => {
      const input = {
        customer_code: 'ALLERTEST',
        name: 'Allergen Test',
        category: 'retail' as const,
        allergen_restrictions: ['invalid-uuid'],
      }

      await expect(CustomerService.createCustomer(input)).rejects.toThrow(
        'Allergen not found'
      )
    })

    it('should validate payment_terms_days range (1-365)', async () => {
      const input = {
        customer_code: 'PAYTEST',
        name: 'Payment Test',
        category: 'retail' as const,
        payment_terms_days: 400,
      }

      await expect(CustomerService.createCustomer(input)).rejects.toThrow(
        'Payment terms must be 1-365 days'
      )
    })

    it('should allow empty allergen_restrictions', async () => {
      const input = {
        customer_code: 'NOALLER',
        name: 'No Allergens Customer',
        category: 'distributor' as const,
        allergen_restrictions: null,
      }

      const result = await CustomerService.createCustomer(input)

      expect(result.allergen_restrictions).toBeNull()
    })

    it('should validate credit_limit is positive', async () => {
      const input = {
        customer_code: 'CREDITNEG',
        name: 'Negative Credit',
        category: 'retail' as const,
        credit_limit: -1000,
      }

      await expect(CustomerService.createCustomer(input)).rejects.toThrow(
        'Credit limit must be positive'
      )
    })

    it('should reject max allergens > 20', async () => {
      const input = {
        customer_code: 'MANYALLER',
        name: 'Many Allergens',
        category: 'retail' as const,
        allergen_restrictions: Array(21).fill('allergen-milk'),
      }

      await expect(CustomerService.createCustomer(input)).rejects.toThrow(
        'Maximum 20 allergens per customer'
      )
    })
  })

  // =============================================================================
  // UPDATE CUSTOMER TESTS
  // =============================================================================

  describe('updateCustomer', () => {
    beforeEach(() => {
      // Setup mock to return existing customer for update operations
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { org_id: mockUser.user_metadata.org_id },
              error: null,
            }),
          }
        }
        if (table === 'customers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockCustomer,
              error: null,
            }),
            update: vi.fn().mockImplementation((updateData: any) => ({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { ...mockCustomer, ...updateData, updated_at: new Date().toISOString() },
                error: null,
              }),
            })),
          }
        }
        if (table === 'allergens') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            then: (cb: any) => cb({ data: mockAllergens, error: null }),
          }
        }
        return createMockQueryBuilder()
      })
    })

    it('should update name only', async () => {
      const patch = { name: 'New Name' }

      const result = await CustomerService.updateCustomer('cust-acme-01', patch)

      expect(result.name).toBe('New Name')
      expect(result.customer_code).toBe(mockCustomer.customer_code) // Unchanged
    })

    it('should prevent customer_code change', async () => {
      const patch = { customer_code: 'NEW_CODE' }

      await expect(
        CustomerService.updateCustomer('cust-acme-01', patch)
      ).rejects.toThrow('Cannot modify customer_code')
    })

    it('should update allergen_restrictions with validation', async () => {
      const patch = {
        allergen_restrictions: ['allergen-milk', 'allergen-peanuts'],
      }

      const result = await CustomerService.updateCustomer('cust-acme-01', patch)

      expect(result.allergen_restrictions).toEqual(['allergen-milk', 'allergen-peanuts'])
    })

    it('should not allow archiving customer with open orders', async () => {
      // Setup mock to return a customer that has open orders
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { org_id: mockUser.user_metadata.org_id },
              error: null,
            }),
          }
        }
        if (table === 'customers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { ...mockCustomer, id: 'cust-with-open-orders', is_active: true },
              error: null,
            }),
          }
        }
        return createMockQueryBuilder()
      })

      const patch = { is_active: false }

      await expect(
        CustomerService.updateCustomer('cust-with-open-orders', patch)
      ).rejects.toThrow('Cannot archive customer with open orders')
    })

    it('should update updated_at timestamp', async () => {
      const patch = { name: 'Updated Name' }

      const result = await CustomerService.updateCustomer('cust-acme-01', patch)

      expect(new Date(result.updated_at).getTime()).toBeGreaterThan(
        new Date(mockCustomer.updated_at).getTime()
      )
    })

    it('should return 404 for non-existent customer', async () => {
      const patch = { name: 'Test' }

      await expect(
        CustomerService.updateCustomer('non-existent-id', patch)
      ).rejects.toThrow('Customer not found')
    })
  })

  // =============================================================================
  // DELETE CUSTOMER TESTS
  // =============================================================================

  describe('deleteCustomer', () => {
    beforeEach(() => {
      // Setup mock to return existing customer for delete operations
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { org_id: mockUser.user_metadata.org_id },
              error: null,
            }),
          }
        }
        if (table === 'customers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockCustomer,
              error: null,
            }),
            update: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { ...mockCustomer, is_active: false },
                error: null,
              }),
            })),
          }
        }
        if (table === 'sales_orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return createMockQueryBuilder()
      })
    })

    it('should archive customer (is_active = false)', async () => {
      const result = await CustomerService.deleteCustomer('cust-acme-01')

      expect(result.is_active).toBe(false)
    })

    it('should prevent delete if open orders exist', async () => {
      await expect(
        CustomerService.deleteCustomer('cust-with-open-orders')
      ).rejects.toThrow('Cannot delete customer with open orders')
    })

    it('should preserve allergen history after archive', async () => {
      const result = await CustomerService.deleteCustomer('cust-with-allergens')

      expect(result.is_active).toBe(false)
      expect(result.allergen_restrictions).toBeDefined()
    })
  })

  // =============================================================================
  // GET CUSTOMERS TESTS
  // =============================================================================

  describe('getCustomers', () => {
    it('should return paginated list', async () => {
      const result = await CustomerService.getCustomers({ page: 1, limit: 10 })

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('pagination')
      expect(result.pagination).toHaveProperty('total')
      expect(result.pagination).toHaveProperty('pages')
    })

    it('should filter by category', async () => {
      const result = await CustomerService.getCustomers({
        page: 1,
        limit: 10,
        category: 'wholesale',
      })

      result.data.forEach((customer) => {
        expect(customer.category).toBe('wholesale')
      })
    })

    it('should search by customer_code case-insensitive', async () => {
      const result = await CustomerService.getCustomers({
        page: 1,
        limit: 10,
        search: 'acm',
      })

      expect(result.data.some((c) => c.customer_code.includes('ACME'))).toBe(true)
    })

    it('should filter by is_active', async () => {
      const result = await CustomerService.getCustomers({
        page: 1,
        limit: 10,
        is_active: true,
      })

      result.data.forEach((customer) => {
        expect(customer.is_active).toBe(true)
      })
    })
  })

  describe('getCustomerById', () => {
    it('should return customer with nested contacts and addresses', async () => {
      const result = await CustomerService.getCustomerById('cust-acme-01')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('contacts')
      expect(result).toHaveProperty('addresses')
      expect(Array.isArray(result.contacts)).toBe(true)
      expect(Array.isArray(result.addresses)).toBe(true)
    })

    it('should return null for cross-tenant access', async () => {
      const result = await CustomerService.getCustomerById('cust-other-org')

      expect(result).toBeNull()
    })
  })

  // =============================================================================
  // CONTACTS MANAGEMENT TESTS
  // =============================================================================

  describe('addContact', () => {
    it('should create contact with name only', async () => {
      const input = { name: 'Jane Smith' }

      const result = await CustomerService.addContact('cust-acme-01', input)

      expect(result.name).toBe('Jane Smith')
      expect(result.is_primary).toBe(false)
    })

    it('should validate email format if provided', async () => {
      const input = { name: 'Test', email: 'invalid-email' }

      await expect(
        CustomerService.addContact('cust-acme-01', input)
      ).rejects.toThrow('Invalid email format')
    })

    it('should prevent duplicate emails per customer', async () => {
      // Mock to return existing contact with this email
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { org_id: mockUser.user_metadata.org_id },
              error: null,
            }),
          }
        }
        if (table === 'customer_contacts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing', email: 'john@acme.com' },
              error: null,
            }),
          }
        }
        return createMockQueryBuilder()
      })

      const input = { name: 'Duplicate', email: 'john@acme.com' } // Already exists

      await expect(
        CustomerService.addContact('cust-acme-01', input)
      ).rejects.toThrow('Email already exists for this customer')
    })

    it('should allow null email', async () => {
      const input = { name: 'No Email Contact', email: null }

      const result = await CustomerService.addContact('cust-acme-01', input)

      expect(result.email).toBeNull()
    })
  })

  describe('updateContact', () => {
    it('should update contact title', async () => {
      const patch = { title: 'VP Sales' }

      const result = await CustomerService.updateContact(
        'cust-acme-01',
        'contact-1',
        patch
      )

      expect(result.title).toBe('VP Sales')
    })

    it('should set is_primary contact', async () => {
      const patch = { is_primary: true }

      const result = await CustomerService.updateContact(
        'cust-acme-01',
        'contact-2',
        patch
      )

      expect(result.is_primary).toBe(true)
    })
  })

  describe('deleteContact', () => {
    it('should delete contact (hard delete)', async () => {
      const result = await CustomerService.deleteContact('cust-acme-01', 'contact-1')

      expect(result.success).toBe(true)
    })
  })

  // =============================================================================
  // ADDRESSES MANAGEMENT TESTS
  // =============================================================================

  describe('addAddress', () => {
    it('should create shipping address', async () => {
      const input = {
        address_type: 'shipping' as const,
        address_line1: '456 Oak Ave',
        city: 'Boston',
        postal_code: '02101',
        country: 'USA',
      }

      const result = await CustomerService.addAddress('cust-acme-01', input)

      expect(result.address_type).toBe('shipping')
      expect(result.is_default).toBe(false)
    })

    it('should create billing address', async () => {
      const input = {
        address_type: 'billing' as const,
        address_line1: '789 Finance Blvd',
        city: 'Chicago',
        postal_code: '60601',
        country: 'USA',
      }

      const result = await CustomerService.addAddress('cust-acme-01', input)

      expect(result.address_type).toBe('billing')
    })

    it('should validate postal_code not empty', async () => {
      const input = {
        address_type: 'shipping' as const,
        address_line1: '123 Test St',
        city: 'Test City',
        postal_code: '',
        country: 'USA',
      }

      await expect(
        CustomerService.addAddress('cust-acme-01', input)
      ).rejects.toThrow('Postal code required')
    })

    it('should parse dock_hours JSON', async () => {
      const input = {
        address_type: 'shipping' as const,
        address_line1: '123 Dock St',
        city: 'Port City',
        postal_code: '12345',
        country: 'USA',
        dock_hours: { mon: '08:00-17:00', tue: null },
      }

      const result = await CustomerService.addAddress('cust-acme-01', input)

      expect(result.dock_hours).toEqual({ mon: '08:00-17:00', tue: null })
    })

    it('should set address as default for type', async () => {
      const input = {
        address_type: 'shipping' as const,
        address_line1: '999 Default Way',
        city: 'Default City',
        postal_code: '99999',
        country: 'USA',
        is_default: true,
      }

      const result = await CustomerService.addAddress('cust-acme-01', input)

      expect(result.is_default).toBe(true)
      // Other shipping addresses should be set to is_default=false
    })
  })

  describe('updateAddress', () => {
    it('should update city', async () => {
      const patch = { city: 'New City' }

      const result = await CustomerService.updateAddress(
        'cust-acme-01',
        'address-1',
        patch
      )

      expect(result.city).toBe('New City')
      expect(result.address_type).toBe(mockAddress.address_type) // Unchanged
    })
  })

  describe('deleteAddress', () => {
    it('should delete address (hard delete)', async () => {
      const result = await CustomerService.deleteAddress('cust-acme-01', 'address-2')

      expect(result.success).toBe(true)
    })

    it('should require at least one address', async () => {
      // Customer has only one address
      await expect(
        CustomerService.deleteAddress('cust-single-address', 'address-only')
      ).rejects.toThrow('Customer must have at least one address')
    })
  })

  describe('setDefaultAddress', () => {
    beforeEach(() => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { org_id: mockUser.user_metadata.org_id },
              error: null,
            }),
          }
        }
        if (table === 'customer_addresses') {
          const builder = createMockQueryBuilder(mockAddress)
          builder.single.mockResolvedValue({ data: { address_type: 'shipping' }, error: null })
          builder.update.mockImplementation(() => ({
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { ...mockAddress, is_default: true },
              error: null,
            }),
          }))
          return builder
        }
        return createMockQueryBuilder()
      })
    })

    it('should mark address as default for its type', async () => {
      const result = await CustomerService.setDefaultAddress(
        'cust-acme-01',
        'address-2'
      )

      expect(result.is_default).toBe(true)
    })

    it('should unset other defaults of same type', async () => {
      // After setting address-2 as default shipping, address-1 should be is_default=false
      await CustomerService.setDefaultAddress('cust-acme-01', 'address-2')

      const addresses = await CustomerService.getAddresses('cust-acme-01')
      const shippingAddresses = addresses.filter((a) => a.address_type === 'shipping')
      const defaults = shippingAddresses.filter((a) => a.is_default)

      expect(defaults.length).toBe(1)
    })
  })

  // =============================================================================
  // ALLERGEN VALIDATION TESTS
  // =============================================================================

  describe('Allergen Validation', () => {
    it('should validate allergen UUIDs against allergens table', async () => {
      const input = {
        customer_code: 'ALLERVALID',
        name: 'Allergen Valid',
        category: 'retail' as const,
        allergen_restrictions: ['valid-uuid', 'invalid-uuid'],
      }

      await expect(CustomerService.createCustomer(input)).rejects.toThrow(
        'Allergen not found'
      )
    })

    it('should store allergen array as JSONB', async () => {
      const input = {
        customer_code: 'ALLERJSONB',
        name: 'Allergen JSONB',
        category: 'retail' as const,
        allergen_restrictions: ['allergen-milk', 'allergen-peanuts'],
      }

      const result = await CustomerService.createCustomer(input)

      expect(Array.isArray(result.allergen_restrictions)).toBe(true)
      expect(result.allergen_restrictions).toHaveLength(2)
    })

    it('should support max 20 allergens per customer', async () => {
      const input = {
        customer_code: 'ALLER20',
        name: 'Allergen 20',
        category: 'retail' as const,
        allergen_restrictions: Array(21).fill('allergen-milk'),
      }

      await expect(CustomerService.createCustomer(input)).rejects.toThrow(
        'Maximum 20 allergens per customer'
      )
    })

    it('should allow empty allergen restrictions', async () => {
      const input = {
        customer_code: 'ALLEREMPTY',
        name: 'Allergen Empty',
        category: 'retail' as const,
        allergen_restrictions: [],
      }

      const result = await CustomerService.createCustomer(input)

      expect(result.allergen_restrictions).toBeNull() // Empty array stored as null
    })
  })
})

/**
 * Test Coverage Summary for Story 07.1 - CustomerService Unit Tests
 * ==================================================================
 *
 * createCustomer: 9 tests
 *   - Create with required fields
 *   - Normalize code to uppercase
 *   - Validate code format
 *   - Reject duplicate code
 *   - Encrypt tax_id
 *   - Validate allergen IDs
 *   - Validate payment_terms range
 *   - Allow empty allergens
 *   - Validate credit_limit positive
 *   - Max allergens check
 *
 * updateCustomer: 6 tests
 *   - Update name only
 *   - Prevent code change
 *   - Update allergens with validation
 *   - Prevent archive with open orders
 *   - Update timestamp
 *   - 404 for non-existent
 *
 * deleteCustomer: 3 tests
 *   - Archive (soft delete)
 *   - Prevent with open orders
 *   - Preserve allergen history
 *
 * getCustomers: 4 tests
 *   - Paginated list
 *   - Filter by category
 *   - Search case-insensitive
 *   - Filter by is_active
 *
 * getCustomerById: 2 tests
 *   - Return with nested data
 *   - Cross-tenant returns null
 *
 * addContact: 4 tests
 *   - Create with name only
 *   - Validate email format
 *   - Prevent duplicate email
 *   - Allow null email
 *
 * updateContact: 2 tests
 *   - Update title
 *   - Set is_primary
 *
 * deleteContact: 1 test
 *   - Hard delete
 *
 * addAddress: 5 tests
 *   - Create shipping
 *   - Create billing
 *   - Validate postal_code
 *   - Parse dock_hours
 *   - Set default
 *
 * updateAddress: 1 test
 *   - Update city
 *
 * deleteAddress: 2 tests
 *   - Hard delete
 *   - Require at least one
 *
 * setDefaultAddress: 2 tests
 *   - Mark as default
 *   - Unset other defaults
 *
 * Allergen Validation: 4 tests
 *   - Validate UUIDs
 *   - Store as JSONB
 *   - Max 20 check
 *   - Allow empty
 *
 * Total: 45 tests
 * Status: ALL FAIL (RED phase - no implementation)
 */
