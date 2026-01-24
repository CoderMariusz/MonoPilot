/**
 * Technical Module - E2E Test Fixtures
 *
 * Reusable test data for all Technical module tests.
 * Includes products, BOMs, routings, allergens, and helper functions.
 *
 * Usage:
 *   import { productFixtures, bomFixtures } from '../fixtures/technical';
 *   const product = productFixtures.rawMaterial();
 */

import { faker } from '@faker-js/faker';

// ==================== Product Fixtures ====================

export const productFixtures = {
  /**
   * Raw material product (RAW type)
   */
  rawMaterial: () => ({
    code: `RM-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `Raw Material ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
    type: 'RAW',
    base_uom: 'KG',
    cost_per_unit: parseFloat(faker.commerce.price({ min: 1, max: 100 })),
    shelf_life_days: faker.number.int({ min: 30, max: 365 }),
    is_perishable: true,
    expiry_policy: 'rolling',
  }),

  /**
   * Work in progress product (WIP type)
   */
  wipProduct: () => ({
    code: `WIP-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `WIP Product ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
    type: 'WIP',
    base_uom: 'KG',
    cost_per_unit: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
    shelf_life_days: faker.number.int({ min: 7, max: 60 }),
    is_perishable: true,
    expiry_policy: 'fifo',
  }),

  /**
   * Finished good product (FIN type)
   */
  finishedGood: () => ({
    code: `FIN-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `Finished Good ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
    type: 'FIN',
    base_uom: 'EA',
    cost_per_unit: parseFloat(faker.commerce.price({ min: 20, max: 1000 })),
    shelf_life_days: faker.number.int({ min: 5, max: 30 }),
    is_perishable: true,
    expiry_policy: 'fefo',
  }),

  /**
   * Packaging product (PKG type)
   */
  packaging: () => ({
    code: `PKG-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `Packaging ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
    type: 'PKG',
    base_uom: 'EA',
    cost_per_unit: parseFloat(faker.commerce.price({ min: 0.5, max: 50 })),
    shelf_life_days: faker.number.int({ min: 365, max: 1825 }),
    is_perishable: false,
  }),

  /**
   * Non-perishable product
   */
  nonPerishable: () => ({
    code: `NP-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `Non-Perishable ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
    type: 'RAW',
    base_uom: 'KG',
    cost_per_unit: parseFloat(faker.commerce.price({ min: 1, max: 100 })),
    is_perishable: false,
  }),

  /**
   * Product with allergens
   */
  withAllergens: () => ({
    code: `ALG-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `Allergen Product ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
    type: 'RAW',
    base_uom: 'KG',
    cost_per_unit: parseFloat(faker.commerce.price({ min: 1, max: 100 })),
    allergens: ['A01', 'A07'], // Gluten, Milk
  }),

  /**
   * Standard flour
   */
  flour: () => ({
    code: 'RM-FLOUR-001',
    name: 'All-Purpose Flour',
    description: 'Premium all-purpose flour for bread production',
    type: 'RAW',
    base_uom: 'KG',
    cost_per_unit: 2.50,
    shelf_life_days: 180,
    is_perishable: true,
    expiry_policy: 'fifo',
  }),

  /**
   * Sugar
   */
  sugar: () => ({
    code: 'RM-SUGAR-001',
    name: 'White Sugar',
    description: 'Refined white sugar',
    type: 'RAW',
    base_uom: 'KG',
    cost_per_unit: 1.00,
    shelf_life_days: 365,
    is_perishable: false,
  }),

  /**
   * Yeast
   */
  yeast: () => ({
    code: 'RM-YEAST-001',
    name: 'Active Dry Yeast',
    description: 'Active dry yeast for bread baking',
    type: 'RAW',
    base_uom: 'KG',
    cost_per_unit: 10.00,
    shelf_life_days: 90,
    is_perishable: true,
    expiry_policy: 'fifo',
  }),

  /**
   * White Bread
   */
  whiteBread: () => ({
    code: 'FIN-BREAD-001',
    name: 'White Bread Loaf',
    description: 'Standard white bread loaf',
    type: 'FIN',
    base_uom: 'EA',
    cost_per_unit: 5.99,
    shelf_life_days: 7,
    is_perishable: true,
    expiry_policy: 'fefo',
  }),
};

// ==================== BOM Fixtures ====================

export const bomFixtures = {
  /**
   * Simple BOM with 2 ingredients
   */
  simpleBOM: (productId?: string) => ({
    product_id: productId || '[test-product-id]',
    version: 1,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: null,
    output_qty: 10,
    output_uom: 'EA',
    items: [
      {
        component_id: '[component-1-id]',
        quantity: 5,
        uom: 'KG',
        operation_seq: 1,
        scrap_percent: 0,
      },
      {
        component_id: '[component-2-id]',
        quantity: 2,
        uom: 'KG',
        operation_seq: 1,
        scrap_percent: 0,
      },
    ],
  }),

  /**
   * Multi-level BOM with sub-components
   */
  multiLevelBOM: (productId?: string) => ({
    product_id: productId || '[test-product-id]',
    version: 1,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: null,
    output_qty: 100,
    output_uom: 'EA',
    items: [
      {
        component_id: '[ingredient-1-id]',
        quantity: 50,
        uom: 'KG',
        operation_seq: 1,
        scrap_percent: 2,
      },
      {
        component_id: '[ingredient-2-id]',
        quantity: 20,
        uom: 'KG',
        operation_seq: 1,
        scrap_percent: 1,
      },
      {
        component_id: '[ingredient-3-id]',
        quantity: 5,
        uom: 'KG',
        operation_seq: 2,
        scrap_percent: 0,
      },
    ],
  }),

  /**
   * BOM with by-products
   */
  withByProducts: (productId?: string) => ({
    product_id: productId || '[test-product-id]',
    version: 1,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: null,
    output_qty: 100,
    output_uom: 'EA',
    items: [
      {
        component_id: '[ingredient-id]',
        quantity: 100,
        uom: 'KG',
        operation_seq: 1,
      },
    ],
    byProducts: [
      {
        product_id: '[byproduct-1-id]',
        yield_percent: 5,
        uom: 'KG',
      },
      {
        product_id: '[byproduct-2-id]',
        yield_percent: 2,
        uom: 'KG',
      },
    ],
  }),

  /**
   * BOM with alternative ingredients
   */
  withAlternatives: (productId?: string) => ({
    product_id: productId || '[test-product-id]',
    version: 1,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: null,
    output_qty: 50,
    output_uom: 'EA',
    items: [
      {
        component_id: '[primary-ingredient-id]',
        quantity: 25,
        uom: 'KG',
        operation_seq: 1,
        alternatives: [
          {
            component_id: '[alternative-1-id]',
            quantity: 25,
            uom: 'KG',
          },
          {
            component_id: '[alternative-2-id]',
            quantity: 25,
            uom: 'KG',
          },
        ],
      },
    ],
  }),

  /**
   * BOM with routing assigned
   */
  withRouting: (productId?: string, routingId?: string) => ({
    product_id: productId || '[test-product-id]',
    version: 1,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: null,
    output_qty: 100,
    output_uom: 'EA',
    routing_id: routingId || '[test-routing-id]',
    items: [
      {
        component_id: '[ingredient-id]',
        quantity: 100,
        uom: 'KG',
        operation_seq: 1,
      },
    ],
  }),

  /**
   * Bread BOM with standard recipe
   */
  breadRecipe: (productId?: string) => ({
    product_id: productId || '[bread-product-id]',
    version: 1,
    effective_from: '2024-01-01',
    effective_to: null,
    output_qty: 10,
    output_uom: 'EA',
    items: [
      {
        component_id: 'RM-FLOUR-001', // Flour
        quantity: 5,
        uom: 'KG',
        operation_seq: 1,
        scrap_percent: 0,
      },
      {
        component_id: 'RM-YEAST-001', // Yeast
        quantity: 0.1,
        uom: 'KG',
        operation_seq: 1,
        scrap_percent: 0,
      },
      {
        component_id: 'RM-SUGAR-001', // Sugar
        quantity: 0.2,
        uom: 'KG',
        operation_seq: 1,
        scrap_percent: 0,
      },
    ],
  }),
};

// ==================== Routing Fixtures ====================

export const routingFixtures = {
  /**
   * Standard routing with 2 operations
   */
  standardRouting: () => ({
    code: `RTG-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `Standard Routing ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
    is_reusable: true,
    setup_cost: 50.00,
    working_cost_per_unit: 0.50,
    overhead_percent: 15.0,
    operations: [
      {
        sequence: 1,
        name: 'Mixing',
        setup_time: 15,
        duration: 60,
        cleanup_time: 10,
        labor_cost_per_hour: 25.00,
      },
      {
        sequence: 2,
        name: 'Baking',
        setup_time: 30,
        duration: 45,
        cleanup_time: 20,
        labor_cost_per_hour: 20.00,
      },
    ],
  }),

  /**
   * Non-reusable routing
   */
  nonReusableRouting: () => ({
    code: `RTG-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `One-Time Routing ${faker.commerce.productName()}`,
    description: 'Non-reusable routing for single product',
    is_reusable: false,
    setup_cost: 100.00,
    working_cost_per_unit: 1.00,
    overhead_percent: 10.0,
    operations: [
      {
        sequence: 1,
        name: 'Processing',
        setup_time: 20,
        duration: 120,
        cleanup_time: 15,
        labor_cost_per_hour: 30.00,
      },
    ],
  }),

  /**
   * Simple single-operation routing
   */
  simpleRouting: () => ({
    code: `RTG-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `Simple Routing`,
    description: 'Single operation routing',
    is_reusable: true,
    setup_cost: 25.00,
    working_cost_per_unit: 0.25,
    overhead_percent: 10.0,
    operations: [
      {
        sequence: 1,
        name: 'Assembly',
        setup_time: 10,
        duration: 30,
        cleanup_time: 5,
        labor_cost_per_hour: 20.00,
      },
    ],
  }),

  /**
   * Complex routing with parallel operations
   */
  complexRouting: () => ({
    code: `RTG-${faker.string.alphaNumeric(6).toUpperCase()}`,
    name: `Complex Routing`,
    description: 'Complex routing with parallel operations',
    is_reusable: true,
    setup_cost: 200.00,
    working_cost_per_unit: 2.00,
    overhead_percent: 20.0,
    operations: [
      {
        sequence: 1,
        name: 'Prep A',
        setup_time: 20,
        duration: 40,
        cleanup_time: 10,
        labor_cost_per_hour: 25.00,
      },
      {
        sequence: 1, // Parallel with Prep A
        name: 'Prep B',
        setup_time: 15,
        duration: 50,
        cleanup_time: 8,
        labor_cost_per_hour: 22.00,
      },
      {
        sequence: 2,
        name: 'Assembly',
        setup_time: 30,
        duration: 90,
        cleanup_time: 15,
        labor_cost_per_hour: 30.00,
      },
    ],
  }),

  /**
   * Bread production routing
   */
  breadRouting: () => ({
    code: 'RTG-BREAD-STD',
    name: 'Standard Bread Production',
    description: 'Standard routing for bread production',
    is_reusable: true,
    setup_cost: 50.00,
    working_cost_per_unit: 0.50,
    overhead_percent: 15.0,
    operations: [
      {
        sequence: 1,
        name: 'Mixing',
        setup_time: 15,
        duration: 60,
        cleanup_time: 10,
        labor_cost_per_hour: 25.00,
      },
      {
        sequence: 2,
        name: 'Proofing',
        setup_time: 5,
        duration: 120,
        cleanup_time: 5,
        labor_cost_per_hour: 15.00,
      },
      {
        sequence: 3,
        name: 'Baking',
        setup_time: 30,
        duration: 45,
        cleanup_time: 20,
        labor_cost_per_hour: 20.00,
      },
    ],
  }),
};

// ==================== Allergen Fixtures ====================

export const allergenFixtures = {
  /**
   * All EU-mandated allergens (read-only)
   */
  euAllergens: [
    { code: 'A01', name: 'Gluten', relation: 'contains' },
    { code: 'A02', name: 'Crustaceans', relation: 'contains' },
    { code: 'A03', name: 'Eggs', relation: 'may_contain' },
    { code: 'A04', name: 'Fish', relation: 'contains' },
    { code: 'A05', name: 'Peanuts', relation: 'may_contain' },
    { code: 'A06', name: 'Soybeans', relation: 'contains' },
    { code: 'A07', name: 'Milk', relation: 'contains' },
    { code: 'A08', name: 'Nuts', relation: 'may_contain' },
    { code: 'A09', name: 'Celery', relation: 'contains' },
    { code: 'A10', name: 'Mustard', relation: 'contains' },
    { code: 'A11', name: 'Sesame', relation: 'may_contain' },
    { code: 'A12', name: 'Sulphites', relation: 'contains' },
    { code: 'A13', name: 'Lupin', relation: 'contains' },
    { code: 'A14', name: 'Molluscs', relation: 'may_contain' },
  ],

  /**
   * Common allergens for testing
   */
  common: () => [
    { code: 'A01', name: 'Gluten', relation: 'contains' },
    { code: 'A07', name: 'Milk', relation: 'contains' },
    { code: 'A08', name: 'Nuts', relation: 'may_contain' },
  ],
};

// ==================== Date Fixtures ====================

export const dateFixtures = {
  /**
   * Generate date range for BOM effective dates
   */
  bomDateRange: (startDays = 0, endDays = 365) => {
    const start = new Date();
    start.setDate(start.getDate() + startDays);
    const end = new Date();
    end.setDate(end.getDate() + endDays);

    return {
      effective_from: start.toISOString().split('T')[0],
      effective_to: end.toISOString().split('T')[0],
    };
  },

  /**
   * Current date as ISO string
   */
  today: () => new Date().toISOString().split('T')[0],

  /**
   * Tomorrow date
   */
  tomorrow: () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  },

  /**
   * Date N days from now
   */
  daysFromNow: (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  /**
   * Yesterday
   */
  yesterday: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  },

  /**
   * Overlapping date range with existing range
   */
  overlappingRange: (existingStart: string, existingEnd: string | null) => {
    const midpoint = new Date(existingStart);
    midpoint.setDate(midpoint.getDate() + 30);

    const newEnd = new Date(midpoint);
    newEnd.setDate(newEnd.getDate() + 60);

    return {
      effective_from: midpoint.toISOString().split('T')[0],
      effective_to: newEnd.toISOString().split('T')[0],
    };
  },
};

// ==================== Test Data Helper Functions ====================

/**
 * Generate unique product code
 */
export function generateProductCode(prefix = 'PROD'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

/**
 * Generate unique BOM code
 */
export function generateBOMCode(prefix = 'BOM'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

/**
 * Generate unique routing code
 */
export function generateRoutingCode(prefix = 'RTG'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

/**
 * Create product data with dynamic code
 */
export function createProductData(type: 'RAW' | 'WIP' | 'FIN' | 'PKG' = 'RAW') {
  const code = generateProductCode(`${type}`);
  return {
    code,
    name: `${type} Product ${Date.now()}`,
    description: `Test ${type} product`,
    type,
    base_uom: type === 'PKG' ? 'EA' : 'KG',
    cost_per_unit: Math.round(Math.random() * 100 * 100) / 100,
    ...(type !== 'PKG' && {
      is_perishable: true,
      shelf_life_days: Math.floor(Math.random() * 365) + 1,
      expiry_policy: ['fifo', 'fefo', 'rolling'][Math.floor(Math.random() * 3)],
    }),
  };
}

/**
 * Create BOM item data
 */
export function createBOMItemData(componentId: string, operation_seq = 1) {
  return {
    component_id: componentId,
    quantity: Math.round(Math.random() * 50 * 10) / 10,
    uom: ['KG', 'LB', 'L', 'ML', 'EA'][Math.floor(Math.random() * 5)],
    operation_seq,
    scrap_percent: Math.floor(Math.random() * 20),
  };
}

/**
 * Create operation data for routing
 */
export function createOperationData(
  sequence: number,
  name = `Operation ${sequence}`,
) {
  return {
    sequence,
    name,
    setup_time: Math.floor(Math.random() * 60) + 5,
    duration: Math.floor(Math.random() * 180) + 30,
    cleanup_time: Math.floor(Math.random() * 30) + 5,
    labor_cost_per_hour: Math.round(Math.random() * 50 + 15) / 100,
  };
}

/**
 * Create BOM with random items
 */
export function createBOMWithItems(productId: string, itemCount = 3) {
  const items = [];
  for (let i = 0; i < itemCount; i++) {
    items.push(
      createBOMItemData(`[component-${i + 1}-id]`, Math.ceil((i + 1) / 2)),
    );
  }

  return {
    product_id: productId,
    version: 1,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: null,
    output_qty: 100,
    output_uom: 'EA',
    items,
  };
}

/**
 * Create routing with random operations
 */
export function createRoutingWithOperations(
  operationCount = 2,
  isReusable = true,
) {
  const operations = [];
  for (let i = 0; i < operationCount; i++) {
    operations.push(createOperationData(i + 1, `Operation ${i + 1}`));
  }

  return {
    code: generateRoutingCode(),
    name: `Routing ${Date.now()}`,
    description: 'Test routing',
    is_reusable: isReusable,
    setup_cost: Math.round(Math.random() * 200) + 50,
    working_cost_per_unit: Math.round(Math.random() * 10 * 100) / 100,
    overhead_percent: Math.round(Math.random() * 30),
    operations,
  };
}

// ==================== UOM Mappings ====================

export const uomMappings = {
  weight: ['KG', 'G', 'MG', 'LB', 'OZ', 'TON'],
  volume: ['L', 'ML', 'GAL', 'PT', 'FL OZ', 'CUP'],
  count: ['EA', 'DZ', 'BOX', 'CASE', 'PALLET'],
};

// ==================== Cost Calculation Helpers ====================

/**
 * Calculate BOM material cost
 */
export function calculateBOMMaterialCost(
  items: Array<{ quantity: number; cost_per_unit: number }>,
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.cost_per_unit, 0);
}

/**
 * Calculate routing cost for quantity
 */
export function calculateRoutingCost(
  setupCost: number,
  workingCostPerUnit: number,
  quantity: number,
  overheadPercent: number,
): number {
  const total = setupCost + workingCostPerUnit * quantity;
  const overhead = total * (overheadPercent / 100);
  return total + overhead;
}

/**
 * Calculate operation labor cost
 */
export function calculateOperationLaborCost(
  setupTime: number,
  duration: number,
  cleanupTime: number,
  hourlyRate: number,
): number {
  const totalMinutes = setupTime + duration + cleanupTime;
  const hours = totalMinutes / 60;
  return hours * hourlyRate;
}

// ==================== Export All Fixtures ====================

export default {
  productFixtures,
  bomFixtures,
  routingFixtures,
  allergenFixtures,
  dateFixtures,
  generateProductCode,
  generateBOMCode,
  generateRoutingCode,
  createProductData,
  createBOMItemData,
  createOperationData,
  createBOMWithItems,
  createRoutingWithOperations,
  uomMappings,
  calculateBOMMaterialCost,
  calculateRoutingCost,
  calculateOperationLaborCost,
};
