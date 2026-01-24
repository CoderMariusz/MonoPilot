/**
 * E2E Test Data Constants
 *
 * Central place for all test credentials and data.
 * Must match the data seeded by scripts/seed-e2e-test-data.ts
 */

// Test user credentials
export const TEST_CREDENTIALS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@monopilot.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'test1234',
    role: 'admin' as const,
  },
  manager: {
    email: process.env.TEST_MANAGER_EMAIL || 'admin@monopilot.com',
    password: process.env.TEST_MANAGER_PASSWORD || 'test1234',
    role: 'manager' as const,
  },
  planner: {
    email: process.env.TEST_PLANNER_EMAIL || 'admin@monopilot.com',
    password: process.env.TEST_PLANNER_PASSWORD || 'test1234',
    role: 'planner' as const,
  },
  operator: {
    email: process.env.TEST_OPERATOR_EMAIL || 'admin@monopilot.com',
    password: process.env.TEST_OPERATOR_PASSWORD || 'test1234',
    role: 'operator' as const,
  },
} as const;

export type UserRole = keyof typeof TEST_CREDENTIALS;

// Test organization data
export const TEST_ORG = {
  id: 'e2e-test-org-id', // Replace with actual seeded org ID
  name: 'E2E Test Organization',
  slug: 'e2e-test-org',
} as const;

// Test suppliers
export const TEST_SUPPLIERS = [
  { code: 'MILL-001', name: 'Mill Co.' },
  { code: 'SUGAR-001', name: 'Sugar Inc.' },
  { code: 'SMALL-001', name: 'Small Supplier' },
] as const;

// Test warehouses
export const TEST_WAREHOUSES = [
  { code: 'MAIN-WH', name: 'Main Warehouse' },
  { code: 'RAW-WH', name: 'Raw Materials Warehouse' },
  { code: 'FG-WH', name: 'Finished Goods Warehouse' },
] as const;

// Test products
export const TEST_PRODUCTS = [
  { code: 'FLOUR-A', name: 'Flour Type A', uom: 'kg' },
  { code: 'SUGAR-W', name: 'White Sugar', uom: 'kg' },
  { code: 'SALT-S', name: 'Sea Salt', uom: 'kg' },
  { code: 'BREAD-001', name: 'White Bread', uom: 'pcs' },
] as const;

// Test work centers
export const TEST_WORK_CENTERS = [
  { code: 'MIX-01', name: 'Mixing Station 1' },
  { code: 'OVEN-01', name: 'Oven Line 1' },
  { code: 'PACK-01', name: 'Packing Line 1' },
] as const;

// Planning settings
export const TEST_SETTINGS = {
  approvalThreshold: 10000,
  approvalRoles: ['manager', 'admin'],
  defaultLeadTimeDays: 7,
} as const;

// URL paths
export const ROUTES = {
  // Auth
  login: '/login',
  logout: '/logout',

  // Dashboard
  dashboard: '/dashboard',

  // Settings
  settings: '/settings',
  settingsUsers: '/settings/users',
  settingsRoles: '/settings/roles',
  settingsOrganization: '/settings/organization',
  settingsTaxCodes: '/settings/tax-codes',

  // Technical
  technical: '/technical',
  technicalProducts: '/technical/products',
  technicalBOMs: '/technical/boms',
  technicalRoutings: '/technical/routings',

  // Planning
  planning: '/planning',
  planningPurchaseOrders: '/planning/purchase-orders',
  planningWorkOrders: '/planning/work-orders',
  planningTransferOrders: '/planning/transfer-orders',

  // Production
  production: '/production',
  productionDashboard: '/production/dashboard',
  productionScanner: '/production/scanner',

  // Warehouse
  warehouse: '/warehouse',
  warehouseDashboard: '/warehouse/dashboard',
  warehouseASNs: '/warehouse/asns',
  warehouseLicensePlates: '/warehouse/license-plates',
  warehouseScanner: '/warehouse/scanner',

  // Quality
  quality: '/quality',
  qualityInspections: '/quality/inspections',
  qualityNCRs: '/quality/ncrs',
  qualityBatchRelease: '/quality/batch-release',

  // Shipping
  shipping: '/shipping',
  shippingCustomers: '/shipping/customers',
  shippingSalesOrders: '/shipping/sales-orders',
  shippingPickLists: '/shipping/pick-lists',
} as const;

// Test IDs for common UI elements
export const TEST_IDS = {
  // Layout
  sidebar: 'sidebar',
  userMenu: 'user-menu',
  header: 'header',

  // Tables
  dataTable: 'data-table',
  tableRow: 'table-row',
  tableEmpty: 'table-empty',

  // Forms
  submitButton: 'submit-button',
  cancelButton: 'cancel-button',
  deleteButton: 'delete-button',

  // Modals
  modal: 'modal',
  modalClose: 'modal-close',

  // Status badges
  statusBadge: 'status-badge',

  // Toasts
  toast: 'toast',
  toastSuccess: 'toast-success',
  toastError: 'toast-error',
} as const;
