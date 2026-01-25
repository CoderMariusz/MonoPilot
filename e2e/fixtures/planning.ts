/**
 * Planning Module - E2E Test Fixtures
 *
 * Reusable test data for all Planning module tests.
 * Includes work orders, suppliers, purchase orders, transfer orders, and helper functions.
 *
 * Usage:
 *   import { workOrderFixtures, supplierFixtures, generateWONumber } from '../fixtures/planning';
 *   const wo = workOrderFixtures.draft();
 *   const supplier = supplierFixtures.standardSupplier();
 */

import { faker } from '@faker-js/faker';

// ==================== Work Order Fixtures ====================

export const workOrderFixtures = {
  draft: () => ({
    product_name: `Product ${faker.commerce.productName()}`,
    planned_quantity: faker.number.int({ min: 10, max: 1000 }),
    uom: 'kg',
    planned_start_date: new Date().toISOString().split('T')[0],
    priority: 'normal' as const,
  }),

  planned: () => ({
    product_name: `Product ${faker.commerce.productName()}`,
    planned_quantity: faker.number.int({ min: 50, max: 5000 }),
    uom: 'kg',
    planned_start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    planned_end_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    priority: 'high' as const,
    notes: `WO for ${faker.company.name()}`,
  }),

  urgent: () => ({
    product_name: `Urgent Product ${faker.commerce.productName()}`,
    planned_quantity: faker.number.int({ min: 100, max: 2000 }),
    uom: 'kg',
    planned_start_date: new Date().toISOString().split('T')[0],
    planned_end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'critical' as const,
    notes: 'URGENT - Customer Priority',
  }),

  largeVolume: () => ({
    product_name: `Bulk Product ${faker.commerce.productName()}`,
    planned_quantity: faker.number.int({ min: 10000, max: 50000 }),
    uom: 'kg',
    planned_start_date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    planned_end_date: new Date(Date.now() + 604800000).toISOString().split('T')[0],
    priority: 'normal' as const,
    notes: 'Large volume production',
  }),
};

export function generateWONumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = faker.string.alphanumeric(5).toUpperCase();
  return `WO-${date}-${random}`;
}

export function generateProductCode(): string {
  return `PROD-${faker.string.alphanumeric(6).toUpperCase()}`;
}

export function generateBOMCode(): string {
  return `BOM-${faker.string.alphanumeric(6).toUpperCase()}`;
}

export function generateLPNumber(): string {
  return `LP-${Date.now()}-${faker.string.numeric(4)}`;
}

export function getDateRange(daysFromNow: number) {
  const startDate = new Date(Date.now() + daysFromNow * 86400000);
  const endDate = new Date(startDate.getTime() + 86400000);

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

export function createWOFormData(overrides?: Record<string, any>) {
  const startDate = new Date(Date.now() + 86400000);

  return {
    product_code: generateProductCode(),
    product_name: `Product ${faker.commerce.productName()}`,
    planned_quantity: 100,
    uom: 'kg',
    planned_start_date: startDate.toISOString().split('T')[0],
    planned_end_date: new Date(startDate.getTime() + 86400000).toISOString().split('T')[0],
    priority: 'normal' as const,
    notes: faker.commerce.productDescription(),
    ...overrides,
  };
}

// ==================== Supplier Fixtures ====================

export const supplierFixtures = {
  /**
   * Standard active supplier
   */
  standardSupplier: () => ({
    code: `SUP-${Date.now().toString().slice(-6)}`,
    name: faker.company.name(),
    contact_name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: 'international' }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    country: 'Poland',
    tax_code: 'VAT23',
    currency: 'PLN',
    payment_terms: 'Net 30',
    is_active: true,
  }),

  /**
   * Supplier with custom code
   */
  withCustomCode: (code: string) => ({
    code,
    name: faker.company.name(),
    contact_name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: 'international' }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    country: 'Poland',
    tax_code: 'VAT23',
    currency: 'PLN',
    payment_terms: 'Net 30',
    is_active: true,
  }),

  /**
   * Inactive supplier
   */
  inactiveSupplier: () => ({
    code: `SUP-${Date.now().toString().slice(-6)}`,
    name: faker.company.name(),
    contact_name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: 'international' }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    country: 'Poland',
    tax_code: 'VAT23',
    currency: 'PLN',
    payment_terms: 'Net 30',
    is_active: false,
  }),

  /**
   * Supplier with EUR currency
   */
  withEuroSupplier: () => ({
    code: `SUP-${Date.now().toString().slice(-6)}`,
    name: faker.company.name(),
    contact_name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: 'international' }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    country: 'Germany',
    tax_code: 'VAT19',
    currency: 'EUR',
    payment_terms: 'Net 60',
    is_active: true,
  }),

  /**
   * Supplier with Net 60 terms
   */
  withNet60: () => ({
    code: `SUP-${Date.now().toString().slice(-6)}`,
    name: faker.company.name(),
    contact_name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: 'international' }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    country: 'Poland',
    tax_code: 'VAT23',
    currency: 'PLN',
    payment_terms: 'Net 60',
    is_active: true,
  }),

  /**
   * Supplier with minimal required fields
   */
  minimal: () => ({
    code: `SUP-${Date.now().toString().slice(-6)}`,
    name: faker.company.name(),
    currency: 'PLN',
    tax_code: 'VAT23',
    payment_terms: 'Net 30',
    is_active: true,
  }),
};

// ==================== Helper Functions ====================

/**
 * Generate unique supplier code
 * Format: SUP-XXXXXX (6 random alphanumeric)
 */
export function generateSupplierCode(prefix: string = 'SUP'): string {
  const uniquePart = Date.now().toString().slice(-6);
  return `${prefix}-${uniquePart}`;
}

/**
 * Generate random email for testing
 */
export function generateSupplierEmail(): string {
  return faker.internet.email();
}

/**
 * Generate random phone number
 */
export function generateSupplierPhone(): string {
  return faker.phone.number({ style: 'international' });
}

/**
 * Create supplier batch for bulk testing
 */
export function createSupplierBatch(count: number) {
  const suppliers = [];
  for (let i = 0; i < count; i++) {
    suppliers.push(supplierFixtures.standardSupplier());
  }
  return suppliers;
}

/**
 * Get valid payment terms options
 */
export function getPaymentTermsOptions(): string[] {
  return ['Net 15', 'Net 30', 'Net 60', 'Net 90', 'COD', '2/10 Net 30'];
}

/**
 * Get valid currency options
 */
export function getCurrencyOptions(): string[] {
  return ['PLN', 'EUR', 'USD', 'GBP', 'CHF'];
}

/**
 * Get valid tax code options
 */
export function getTaxCodeOptions(): string[] {
  return ['VAT23', 'VAT8', 'VAT5', 'VAT0', 'EXEMPT'];
}

/**
 * Validate supplier code format
 * Allows: A-Z, 0-9, hyphen
 */
export function isValidSupplierCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9\-]{2,20}$/;
  return codeRegex.test(code);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Mock supplier API response
 */
export function mockSupplierResponse(supplier: any) {
  return {
    id: faker.string.uuid(),
    org_id: faker.string.uuid(),
    ...supplier,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: faker.string.uuid(),
    updated_by: null,
  };
}

/**
 * Create pagination mock response
 */
export function mockSupplierListResponse(suppliers: any[], page: number = 1, limit: number = 20) {
  const total = suppliers.length;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: suppliers.slice(start, end),
    meta: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
      has_more: end < total,
    },
  };
}
