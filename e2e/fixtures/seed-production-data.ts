/**
 * Production Module E2E Test Data Seeding
 *
 * This script seeds all required test data for Production module E2E tests.
 * Uses predictable UUIDs for consistency and idempotency checks.
 *
 * Usage:
 *   import { seedProductionData, cleanupProductionData } from '../fixtures/seed-production-data';
 *   await seedProductionData(supabaseClient);
 *   await cleanupProductionData(supabaseClient);
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ==================== Fixed Test UUIDs ====================
// Use v5 UUIDs derived from fixed strings for consistency

export const TEST_UUIDS = {
  // Organization
  org: '550e8400-e29b-41d4-a716-446655440001',

  // Users
  adminUser: '550e8400-e29b-41d4-a716-446655440002',
  operatorUser: '550e8400-e29b-41d4-a716-446655440003',

  // Roles (fixed UUIDs for consistency)
  roleAdmin: '10000000-0000-0000-0000-000000000002',
  roleOperator: '10000000-0000-0000-0000-000000000004',
  roleManager: '10000000-0000-0000-0000-000000000003',
  rolePlanner: '10000000-0000-0000-0000-000000000005',

  // Warehouses
  mainWarehouse: '550e8400-e29b-41d4-a716-446655440201',

  // Locations
  locationRaw: '550e8400-e29b-41d4-a716-446655440301',
  locationFG: '550e8400-e29b-41d4-a716-446655440302',

  // Products
  productFlour: '550e8400-e29b-41d4-a716-446655440401',
  productYeast: '550e8400-e29b-41d4-a716-446655440402',
  productBread: '550e8400-e29b-41d4-a716-446655440403',

  // Production Settings
  productionSettings: '550e8400-e29b-41d4-a716-446655440501',

  // Production Lines
  lineA: '550e8400-e29b-41d4-a716-446655440601',
  lineB: '550e8400-e29b-41d4-a716-446655440602',

  // Machines
  machineOven: '550e8400-e29b-41d4-a716-446655440701',
  machineMixer: '550e8400-e29b-41d4-a716-446655440702',

  // BOMs
  bomBread: '550e8400-e29b-41d4-a716-446655440801',

  // BOM Items
  bomItemFlour: '550e8400-e29b-41d4-a716-446655440901',
  bomItemYeast: '550e8400-e29b-41d4-a716-446655440902',

  // Routings
  routingBread: '550e8400-e29b-41d4-a716-446655440a01',

  // Work Orders
  workOrderReleased: 'wo-id-123',

  // License Plates
  lpFlour: 'lp-001',
};

// ==================== Seeding Functions ====================

/**
 * Create organization if not exists
 */
async function seedOrganization(client: SupabaseClient) {
  console.log('📋 Seeding organization...');

  const result = await client
    .from('organizations')
    .select('id')
    .eq('id', TEST_UUIDS.org)
    .single();

  const existing = result.data;

  if (existing) {
    console.log('  ✓ Organization already exists');
    return;
  }

  const { error } = await client.from('organizations').insert({
    id: TEST_UUIDS.org,
    name: 'E2E Test Org',
    slug: 'e2e-test-org',
    is_active: true,
  });

  if (error) throw new Error(`Failed to seed organization: ${error.message}`);
  console.log('  ✓ Organization created');
}

/**
 * Seed system roles if they don't exist
 */
async function seedRoles(client: SupabaseClient) {
  console.log('📋 Seeding roles...');

  const roles = [
    {
      id: TEST_UUIDS.roleAdmin,
      code: 'ADMIN',
      name: 'Administrator',
      description: 'Full access within organization',
      permissions: {
        settings: { read: true, create: true, update: true, delete: true },
        technical: { read: true, create: true, update: true, delete: true },
        planning: { read: true, create: true, update: true, delete: true },
        production: { read: true, create: true, update: true, delete: true },
        warehouse: { read: true, create: true, update: true, delete: true },
        quality: { read: true, create: true, update: true, delete: true },
        shipping: { read: true, create: true, update: true, delete: true },
      },
      is_system: true,
      display_order: 2,
    },
    {
      id: TEST_UUIDS.roleManager,
      code: 'PRODUCTION_MANAGER',
      name: 'Production Manager',
      description: 'Manage production operations',
      permissions: {
        settings: { read: true, create: false, update: false, delete: false },
        technical: { read: true, create: true, update: true, delete: false },
        planning: { read: true, create: true, update: true, delete: false },
        production: { read: true, create: true, update: true, delete: true },
        warehouse: { read: true, create: false, update: false, delete: false },
        quality: { read: true, create: false, update: false, delete: false },
        shipping: { read: true, create: false, update: false, delete: false },
      },
      is_system: true,
      display_order: 3,
    },
    {
      id: TEST_UUIDS.roleOperator,
      code: 'PRODUCTION_OPERATOR',
      name: 'Production Operator',
      description: 'Execute production tasks',
      permissions: {
        settings: { read: false, create: false, update: false, delete: false },
        technical: { read: true, create: false, update: false, delete: false },
        planning: { read: true, create: false, update: false, delete: false },
        production: { read: true, create: true, update: true, delete: false },
        warehouse: { read: true, create: false, update: false, delete: false },
        quality: { read: true, create: false, update: false, delete: false },
        shipping: { read: false, create: false, update: false, delete: false },
      },
      is_system: true,
      display_order: 4,
    },
    {
      id: TEST_UUIDS.rolePlanner,
      code: 'WAREHOUSE_MANAGER',
      name: 'Warehouse Manager',
      description: 'Manage warehouse operations',
      permissions: {
        settings: { read: true, create: false, update: false, delete: false },
        technical: { read: true, create: false, update: false, delete: false },
        planning: { read: true, create: true, update: true, delete: false },
        production: { read: true, create: false, update: false, delete: false },
        warehouse: { read: true, create: true, update: true, delete: true },
        quality: { read: true, create: false, update: false, delete: false },
        shipping: { read: true, create: true, update: true, delete: false },
      },
      is_system: true,
      display_order: 5,
    },
  ];

  for (const role of roles) {
    const { data: existing } = await client
      .from('roles')
      .select('id')
      .eq('id', role.id)
      .single();

    if (!existing) {
      const { error } = await client.from('roles').insert(role);
      if (error) {
        console.warn(`  ⚠️ Failed to seed role ${role.code}: ${error.message}`);
      }
    }
  }

  console.log('  ✓ Roles seeded');
}

/**
 * Create users if not exist
 */
async function seedUsers(client: SupabaseClient) {
  console.log('📋 Seeding users...');

  // Check if users already exist
  const { data: existing } = await client
    .from('users')
    .select('id')
    .eq('org_id', TEST_UUIDS.org);

  if (existing && existing.length > 0) {
    console.log(`  ✓ Users already exist (${existing.length} found)`);
    return;
  }

  // Get admin role ID
  let adminRoleId = TEST_UUIDS.roleAdmin;
  const { data: adminRole } = await client
    .from('roles')
    .select('id')
    .eq('id', TEST_UUIDS.roleAdmin)
    .single();

  if (!adminRole) {
    console.warn('  ⚠️ Admin role not found, creating on-the-fly');
    const { data: created } = await client
      .from('roles')
      .insert({
        id: TEST_UUIDS.roleAdmin,
        code: 'ADMIN',
        name: 'Administrator',
        permissions: { all: true },
        is_system: true,
      })
      .select('id')
      .single();
    if (created) adminRoleId = created.id;
  }

  // Get operator role ID
  let operatorRoleId = TEST_UUIDS.roleOperator;
  const { data: operatorRole } = await client
    .from('roles')
    .select('id')
    .eq('id', TEST_UUIDS.roleOperator)
    .single();

  if (!operatorRole) {
    console.warn('  ⚠️ Operator role not found, creating on-the-fly');
    const { data: created } = await client
      .from('roles')
      .insert({
        id: TEST_UUIDS.roleOperator,
        code: 'PRODUCTION_OPERATOR',
        name: 'Production Operator',
        permissions: { production: true },
        is_system: true,
      })
      .select('id')
      .single();
    if (created) operatorRoleId = created.id;
  }

  // Insert users
  const { error } = await client.from('users').insert([
    {
      id: TEST_UUIDS.adminUser,
      org_id: TEST_UUIDS.org,
      role_id: adminRoleId,
      email: 'admin@monopilot.com',
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
    },
    {
      id: TEST_UUIDS.operatorUser,
      org_id: TEST_UUIDS.org,
      role_id: operatorRoleId,
      email: 'operator@monopilot.com',
      first_name: 'Operator',
      last_name: 'User',
      is_active: true,
    },
  ]);

  if (error) {
    console.warn(`⚠️ Failed to seed users: ${error.message}`);
    // Don't throw - allow tests to continue
    return;
  }
  console.log('  ✓ Users created');
}

/**
 * Create production settings if not exist
 */
async function seedProductionSettings(client: SupabaseClient) {
  console.log('📋 Seeding production settings...');

  const result = await client
    .from('production_settings')
    .select('id')
    .eq('org_id', TEST_UUIDS.org)
    .single();

  const existing = result.data;

  if (existing) {
    console.log('  ✓ Production settings already exist');
    return;
  }

  const { error } = await client.from('production_settings').insert({
    id: TEST_UUIDS.productionSettings,
    org_id: TEST_UUIDS.org,
    // WO Execution settings
    allow_pause_wo: true,
    auto_complete_wo: false,
    require_operation_sequence: true,
    // Material Consumption settings
    allow_over_consumption: false,
    allow_partial_lp_consumption: true,
    // Output settings
    require_qa_on_output: true,
    auto_create_by_product_lp: true,
    // Reservations settings
    enable_material_reservations: true,
    // Dashboard settings
    dashboard_refresh_seconds: 30,
    show_material_alerts: true,
    show_delay_alerts: true,
    show_quality_alerts: true,
    // OEE settings
    enable_oee_tracking: false,
    target_oee_percent: 85,
    enable_downtime_tracking: false,
  });

  if (error) throw new Error(`Failed to seed production settings: ${error.message}`);
  console.log('  ✓ Production settings created');
}

/**
 * Create warehouse if not exist
 */
async function seedWarehouse(client: SupabaseClient) {
  console.log('📋 Seeding warehouse...');

  const result = await client
    .from('warehouses')
    .select('id')
    .eq('id', TEST_UUIDS.mainWarehouse)
    .single();

  const existing = result.data;

  if (existing) {
    console.log('  ✓ Warehouse already exists');
    return;
  }

  const { error } = await client.from('warehouses').insert({
    id: TEST_UUIDS.mainWarehouse,
    org_id: TEST_UUIDS.org,
    code: 'MAIN-WH',
    name: 'Main Warehouse',
    is_default: true,
    is_active: true,
  });

  if (error) throw new Error(`Failed to seed warehouse: ${error.message}`);
  console.log('  ✓ Warehouse created');
}

/**
 * Create warehouse locations if not exist
 */
async function seedLocations(client: SupabaseClient) {
  console.log('📋 Seeding warehouse locations...');

  const { data: existing } = await client
    .from('locations')
    .select('id')
    .eq('warehouse_id', TEST_UUIDS.mainWarehouse);

  if (existing && existing.length > 0) {
    console.log(`  ✓ Locations already exist (${existing.length} found)`);
    return;
  }

  const { error } = await client.from('locations').insert([
    {
      id: TEST_UUIDS.locationRaw,
      org_id: TEST_UUIDS.org,
      warehouse_id: TEST_UUIDS.mainWarehouse,
      code: 'ZONE-RAW',
      name: 'Raw Materials Zone',
      level: 'zone',
      location_type: 'shelf',
      is_active: true,
    },
    {
      id: TEST_UUIDS.locationFG,
      org_id: TEST_UUIDS.org,
      warehouse_id: TEST_UUIDS.mainWarehouse,
      code: 'ZONE-FG',
      name: 'Finished Goods Zone',
      level: 'zone',
      location_type: 'pallet',
      is_active: true,
    },
  ]);

  if (error) throw new Error(`Failed to seed locations: ${error.message}`);
  console.log('  ✓ Locations created');
}

/**
 * Create products if not exist
 */
async function seedProducts(client: SupabaseClient) {
  console.log('📋 Seeding products...');

  const { data: existing } = await client
    .from('products')
    .select('id')
    .eq('org_id', TEST_UUIDS.org);

  if (existing && existing.length >= 3) {
    console.log(`  ✓ Products already exist (${existing.length} found)`);
    return;
  }

  const { error } = await client.from('products').insert([
    {
      id: TEST_UUIDS.productFlour,
      org_id: TEST_UUIDS.org,
      product_code: 'RM-FLOUR-001',
      name: 'All-Purpose Flour',
      product_type: 'raw',
      shelf_life_days: 180,
      is_active: true,
    },
    {
      id: TEST_UUIDS.productYeast,
      org_id: TEST_UUIDS.org,
      product_code: 'RM-YEAST-001',
      name: 'Active Dry Yeast',
      product_type: 'raw',
      shelf_life_days: 90,
      is_active: true,
    },
    {
      id: TEST_UUIDS.productBread,
      org_id: TEST_UUIDS.org,
      product_code: 'FIN-BREAD-001',
      name: 'White Bread Loaf',
      product_type: 'finished',
      shelf_life_days: 7,
      is_active: true,
    },
  ]);

  if (error) throw new Error(`Failed to seed products: ${error.message}`);
  console.log('  ✓ Products created');
}

/**
 * Create BOM if not exist
 */
async function seedBOM(client: SupabaseClient) {
  console.log('📋 Seeding BOM...');

  const result = await client
    .from('boms')
    .select('id')
    .eq('id', TEST_UUIDS.bomBread)
    .single();

  const existing = result.data;

  if (existing) {
    console.log('  ✓ BOM already exists');
    return;
  }

  const { error: bomError } = await client.from('boms').insert({
    id: TEST_UUIDS.bomBread,
    org_id: TEST_UUIDS.org,
    product_id: TEST_UUIDS.productBread,
    bom_number: 'BOM-BREAD-001',
    version: 1,
    status: 'active',
    is_active: true,
  });

  if (bomError) throw new Error(`Failed to seed BOM: ${bomError.message}`);

  // Insert BOM items
  const { error: itemsError } = await client.from('bom_items').insert([
    {
      id: TEST_UUIDS.bomItemFlour,
      org_id: TEST_UUIDS.org,
      bom_id: TEST_UUIDS.bomBread,
      product_id: TEST_UUIDS.productFlour,
      sequence: 1,
      quantity: 5.0,
      unit: 'KG',
      is_critical: true,
    },
    {
      id: TEST_UUIDS.bomItemYeast,
      org_id: TEST_UUIDS.org,
      bom_id: TEST_UUIDS.bomBread,
      product_id: TEST_UUIDS.productYeast,
      sequence: 2,
      quantity: 0.1,
      unit: 'KG',
      is_critical: true,
    },
  ]);

  if (itemsError) throw new Error(`Failed to seed BOM items: ${itemsError.message}`);
  console.log('  ✓ BOM and items created');
}

/**
 * Create production lines if not exist
 */
async function seedProductionLines(client: SupabaseClient) {
  console.log('📋 Seeding production lines...');

  const { data: existing } = await client
    .from('production_lines')
    .select('id')
    .eq('org_id', TEST_UUIDS.org);

  if (existing && existing.length >= 2) {
    console.log(`  ✓ Production lines already exist (${existing.length} found)`);
    return;
  }

  const { error } = await client.from('production_lines').insert([
    {
      id: TEST_UUIDS.lineA,
      org_id: TEST_UUIDS.org,
      code: 'LINE-A',
      name: 'Line A',
      is_active: true,
    },
    {
      id: TEST_UUIDS.lineB,
      org_id: TEST_UUIDS.org,
      code: 'LINE-B',
      name: 'Line B',
      is_active: true,
    },
  ]);

  if (error) throw new Error(`Failed to seed production lines: ${error.message}`);
  console.log('  ✓ Production lines created');
}

/**
 * Create machines if not exist
 */
async function seedMachines(client: SupabaseClient) {
  console.log('📋 Seeding machines...');

  const { data: existing } = await client
    .from('machines')
    .select('id')
    .eq('org_id', TEST_UUIDS.org);

  if (existing && existing.length >= 2) {
    console.log(`  ✓ Machines already exist (${existing.length} found)`);
    return;
  }

  const { error } = await client.from('machines').insert([
    {
      id: TEST_UUIDS.machineOven,
      org_id: TEST_UUIDS.org,
      code: 'OVEN-01',
      name: 'Oven Line 1',
      machine_type: 'oven',
      is_active: true,
    },
    {
      id: TEST_UUIDS.machineMixer,
      org_id: TEST_UUIDS.org,
      code: 'MIX-01',
      name: 'Mixing Station 1',
      machine_type: 'mixer',
      is_active: true,
    },
  ]);

  if (error) throw new Error(`Failed to seed machines: ${error.message}`);
  console.log('  ✓ Machines created');
}

/**
 * Create work order if not exist
 */
async function seedWorkOrder(client: SupabaseClient) {
  console.log('📋 Seeding work order...');

  // Check if WO already exists using the literal ID from tests
  const result = await client
    .from('work_orders')
    .select('id')
    .eq('wo_number', 'wo-id-123')
    .single();

  const existing = result.data;

  if (existing) {
    console.log('  ✓ Work order already exists');
    return;
  }

  const { error } = await client.from('work_orders').insert({
    id: TEST_UUIDS.workOrderReleased,
    org_id: TEST_UUIDS.org,
    wo_number: 'wo-id-123',
    product_id: TEST_UUIDS.productBread,
    bom_id: TEST_UUIDS.bomBread,
    quantity_planned: 100.0,
    quantity_produced: 0.0,
    status: 'released',
    scheduled_start: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to seed work order: ${error.message}`);
  console.log('  ✓ Work order created');
}

/**
 * Create license plate if not exist
 */
async function seedLicensePlates(client: SupabaseClient) {
  console.log('📋 Seeding license plates...');

  const result = await client
    .from('license_plates')
    .select('id')
    .eq('lp_number', 'LP-001')
    .single();

  const existing = result.data;

  if (existing) {
    console.log('  ✓ License plate already exists');
    return;
  }

  const { error } = await client.from('license_plates').insert({
    id: TEST_UUIDS.lpFlour,
    org_id: TEST_UUIDS.org,
    lp_number: 'LP-001',
    product_id: TEST_UUIDS.productFlour,
    quantity: 100.0,
    unit: 'KG',
    lot_number: 'LOT-2025-001',
    production_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    location_id: TEST_UUIDS.locationRaw,
    status: 'available',
    qa_status: 'pending',
  });

  if (error) throw new Error(`Failed to seed license plate: ${error.message}`);
  console.log('  ✓ License plate created');
}

// ==================== Main Seeding Function ====================

/**
 * Execute all seeding steps
 */
export async function seedProductionData(client: SupabaseClient) {
  console.log('\n🌱 Starting Production Module E2E Data Seeding...\n');

  try {
    await seedOrganization(client);
    await seedRoles(client);
    await seedUsers(client);
    await seedProductionSettings(client);
    await seedWarehouse(client);
    await seedLocations(client);
    await seedProducts(client);
    await seedBOM(client);
    await seedProductionLines(client);
    await seedMachines(client);
    await seedWorkOrder(client);
    await seedLicensePlates(client);

    console.log('\n✅ Data seeding completed successfully!\n');
    console.log('📊 Test Data Summary:');
    console.log(`  - Organization: ${TEST_UUIDS.org}`);
    console.log(`  - Work Order: wo-id-123 (status=released)`);
    console.log(`  - License Plate: LP-001 (qty=100 KG)`);
    console.log(`  - Products: Flour, Yeast, Bread`);
    console.log(`  - Production Lines: 2 (Line A, Line B)`);
    console.log(`  - Machines: 2 (Oven, Mixer)`);
    console.log('\n');
  } catch (error) {
    console.error('\n❌ Data seeding failed:', error);
    throw error;
  }
}

// ==================== Cleanup Function ====================

/**
 * Clean up test data (use with caution!)
 * Only removes data created by this script
 */
export async function cleanupProductionData(client: SupabaseClient) {
  console.log('\n🧹 Cleaning up Production Module E2E Test Data...\n');

  try {
    // Delete in reverse order of creation (respecting FK constraints)
    console.log('  - Removing license plates...');
    await client
      .from('license_plates')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing work orders...');
    await client
      .from('work_orders')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing BOM items...');
    await client
      .from('bom_items')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing BOMs...');
    await client
      .from('boms')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing machines...');
    await client
      .from('machines')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing production lines...');
    await client
      .from('production_lines')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing products...');
    await client
      .from('products')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing locations...');
    await client
      .from('locations')
      .delete()
      .eq('warehouse_id', TEST_UUIDS.mainWarehouse);

    console.log('  - Removing warehouses...');
    await client
      .from('warehouses')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing production settings...');
    await client
      .from('production_settings')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing users...');
    await client
      .from('users')
      .delete()
      .eq('org_id', TEST_UUIDS.org);

    console.log('  - Removing organization...');
    await client
      .from('organizations')
      .delete()
      .eq('id', TEST_UUIDS.org);

    console.log('\n✅ Cleanup completed successfully!\n');
  } catch (error) {
    console.error('\n⚠️ Cleanup encountered errors (non-blocking):', error);
    // Don't throw - allow tests to continue even if cleanup partially fails
  }
}

// ==================== Export Test Data Constants ====================

export const PRODUCTION_TEST_DATA = {
  uuids: TEST_UUIDS,
  organization: {
    id: TEST_UUIDS.org,
    name: 'E2E Test Org',
    slug: 'e2e-test-org',
  },
  users: {
    admin: {
      id: TEST_UUIDS.adminUser,
      email: 'admin@monopilot.com',
      name: 'Admin User',
    },
    operator: {
      id: TEST_UUIDS.operatorUser,
      email: 'operator@monopilot.com',
      name: 'Operator User',
    },
  },
  warehouse: {
    id: TEST_UUIDS.mainWarehouse,
    code: 'MAIN-WH',
    name: 'Main Warehouse',
  },
  products: {
    flour: {
      id: TEST_UUIDS.productFlour,
      code: 'RM-FLOUR-001',
      name: 'All-Purpose Flour',
    },
    yeast: {
      id: TEST_UUIDS.productYeast,
      code: 'RM-YEAST-001',
      name: 'Active Dry Yeast',
    },
    bread: {
      id: TEST_UUIDS.productBread,
      code: 'FIN-BREAD-001',
      name: 'White Bread Loaf',
    },
  },
  workOrder: {
    id: TEST_UUIDS.workOrderReleased,
    number: 'wo-id-123',
    status: 'released',
    quantity: 100.0,
  },
  licensePlate: {
    id: TEST_UUIDS.lpFlour,
    number: 'LP-001',
    quantity: 100.0,
    unit: 'KG',
    status: 'available',
  },
  productionLines: [
    {
      id: TEST_UUIDS.lineA,
      code: 'LINE-A',
      name: 'Line A',
    },
    {
      id: TEST_UUIDS.lineB,
      code: 'LINE-B',
      name: 'Line B',
    },
  ],
  machines: [
    {
      id: TEST_UUIDS.machineOven,
      code: 'OVEN-01',
      name: 'Oven Line 1',
    },
    {
      id: TEST_UUIDS.machineMixer,
      code: 'MIX-01',
      name: 'Mixing Station 1',
    },
  ],
};
