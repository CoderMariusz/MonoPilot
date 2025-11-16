/**
 * Database Fixture for E2E Tests
 *
 * Provides test data creation with automatic cleanup
 * Part of Epic 0 test infrastructure improvements
 *
 * Usage:
 * ```typescript
 * import { test } from './fixtures/database-fixture';
 *
 * test('should create PO', async ({ page, createPO }) => {
 *   const po = await createPO({ supplier_id: 1 });
 *   // Test with PO...
 *   // No manual cleanup needed - fixture handles it
 * });
 * ```
 */

import { test as base, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

// Types
type Warehouse = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Supplier = {
  id: number;
  name: string;
  legal_name?: string;
  currency?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type POHeader = {
  id: number;
  number: string;
  supplier_id: number;
  warehouse_id?: number | null;
  status: string;
  currency: string;
  order_date: string;
  created_at: string;
  updated_at: string;
};

type WorkOrder = {
  id: number;
  wo_number: string;
  product_id: number;
  org_id: number;
};

type LicensePlate = {
  id: number;
  lp_number: string;
  product_id: number;
  status: string;
  org_id: number;
};

// Fixture types
type DatabaseFixture = {
  supabase: SupabaseClient;
  testOrgId: number;
  createWarehouse: (data?: Partial<Warehouse>) => Promise<Warehouse>;
  createSupplier: (data?: Partial<Supplier>) => Promise<Supplier>;
  createPO: (data?: Partial<POHeader>) => Promise<POHeader>;
  createWO: (data?: Partial<WorkOrder>) => Promise<WorkOrder>;
  createLP: (data?: Partial<LicensePlate>) => Promise<LicensePlate>;
};

// Extend Playwright test with database fixtures
export const test = base.extend<DatabaseFixture>({
  // Supabase client for test environment
  supabase: async ({}, use) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    await use(supabase);
  },

  // Test org ID - Not used (tables don't have org_id column)
  testOrgId: async ({}, use) => {
    await use(1); // Placeholder for compatibility
  },

  // Warehouse fixture with auto-cleanup
  createWarehouse: async ({ supabase, testOrgId }, use) => {
    const createdIds: number[] = [];

    const createWarehouse = async (data: Partial<Warehouse> = {}): Promise<Warehouse> => {
      const warehouseData = {
        code: data.code || `WH-TEST-${Date.now()}`,
        name: data.name || 'Test Warehouse',
        is_active: true,
        ...data,
      };

      const { data: warehouse, error } = await supabase
        .from('warehouses')
        .insert(warehouseData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create warehouse: ${error.message}`);
      }

      createdIds.push(warehouse.id);
      return warehouse;
    };

    await use(createWarehouse);

    // Auto-cleanup: Delete all created warehouses
    for (const id of createdIds) {
      await supabase.from('warehouses').delete().eq('id', id);
    }
  },

  // Supplier fixture with auto-cleanup
  createSupplier: async ({ supabase, testOrgId }, use) => {
    const createdIds: number[] = [];

    const createSupplier = async (data: Partial<Supplier> = {}): Promise<Supplier> => {
      const supplierData = {
        name: data.name || `Test Supplier ${Date.now()}`,
        legal_name: data.legal_name || `Test Supplier Legal ${Date.now()}`,
        is_active: true,
        currency: 'USD',
        ...data,
      };

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create supplier: ${error.message}`);
      }

      createdIds.push(supplier.id);
      return supplier;
    };

    await use(createSupplier);

    // Auto-cleanup
    for (const id of createdIds) {
      await supabase.from('suppliers').delete().eq('id', id);
    }
  },

  // Purchase Order fixture with auto-cleanup
  createPO: async ({ supabase, testOrgId, createSupplier, createWarehouse }, use) => {
    const createdIds: number[] = [];
    let defaultSupplier: Supplier | null = null;
    let defaultWarehouse: Warehouse | null = null;

    const createPO = async (data: Partial<POHeader> = {}): Promise<POHeader> => {
      // Create default supplier and warehouse if not provided
      if (!data.supplier_id && !defaultSupplier) {
        defaultSupplier = await createSupplier();
      }

      if (!data.warehouse_id && !defaultWarehouse) {
        defaultWarehouse = await createWarehouse();
      }

      const poData = {
        number: data.number || `PO-TEST-${Date.now()}`,
        supplier_id: data.supplier_id || defaultSupplier!.id,
        warehouse_id: data.warehouse_id !== undefined ? data.warehouse_id : defaultWarehouse?.id,
        status: data.status || 'draft',
        currency: 'USD',
        order_date: new Date().toISOString(),
        ...data,
      };

      const { data: po, error } = await supabase
        .from('po_header')
        .insert(poData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create PO: ${error.message}`);
      }

      createdIds.push(po.id);
      return po;
    };

    await use(createPO);

    // Auto-cleanup (cascade will delete po_line via FK)
    for (const id of createdIds) {
      await supabase.from('po_header').delete().eq('id', id);
    }
  },

  // Work Order fixture with auto-cleanup
  createWO: async ({ supabase, testOrgId }, use) => {
    const createdIds: number[] = [];

    const createWO = async (data: Partial<WorkOrder> = {}): Promise<WorkOrder> => {
      // For test purposes, use first available product
      let productId = data.product_id;
      if (!productId) {
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('org_id', testOrgId)
          .limit(1);

        if (products && products.length > 0) {
          productId = products[0].id;
        } else {
          throw new Error('No products available for WO creation');
        }
      }

      const woData = {
        wo_number: `WO-TEST-${Date.now()}`,
        product_id: productId,
        quantity: 100,
        status: 'draft',
        org_id: data.org_id || testOrgId,
        ...data,
      };

      const { data: wo, error } = await supabase
        .from('work_orders')
        .insert(woData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create WO: ${error.message}`);
      }

      createdIds.push(wo.id);
      return wo;
    };

    await use(createWO);

    // Auto-cleanup (cascade will delete wo_materials via FK)
    for (const id of createdIds) {
      await supabase.from('work_orders').delete().eq('id', id);
    }
  },

  // License Plate fixture with auto-cleanup
  createLP: async ({ supabase, testOrgId }, use) => {
    const createdIds: number[] = [];

    const createLP = async (data: Partial<LicensePlate> = {}): Promise<LicensePlate> => {
      // For test purposes, use first available product
      let productId = data.product_id;
      if (!productId) {
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('org_id', testOrgId)
          .limit(1);

        if (products && products.length > 0) {
          productId = products[0].id;
        } else {
          throw new Error('No products available for LP creation');
        }
      }

      const lpData = {
        lp_number: `LP-TEST-${Date.now()}`,
        product_id: productId,
        quantity: 100,
        uom: 'kg',
        status: data.status || 'Available',
        manufacture_date: new Date().toISOString(),
        org_id: data.org_id || testOrgId,
        ...data,
      };

      const { data: lp, error } = await supabase
        .from('license_plates')
        .insert(lpData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create LP: ${error.message}`);
      }

      createdIds.push(lp.id);
      return lp;
    };

    await use(createLP);

    // Auto-cleanup (cascade will delete lp_genealogy via FK)
    for (const id of createdIds) {
      await supabase.from('license_plates').delete().eq('id', id);
    }
  },
});

export { expect };
