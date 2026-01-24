/**
 * E2E Test Data Seed Script
 * Story: 03.5b - PO Approval Workflow
 *
 * Seeds Supabase with test data for E2E tests:
 * - Test users with different roles
 * - Test organization
 * - Suppliers, warehouses, products
 * - Planning settings configured for approval workflow
 *
 * Usage:
 *   node scripts/seed-e2e-test-data.ts
 *
 * Prerequisites:
 *   - Supabase project connected
 *   - Environment variables set (.env file)
 *   - All migrations applied
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from root .env
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data constants
const TEST_ORG = {
  name: 'E2E Test Organization',
  slug: 'e2e-test-org'
};

// FIXED: Changed full_name to first_name + last_name (users table schema)
const TEST_USERS = [
  {
    email: 'planner@company.com',
    password: 'password123',
    role_code: 'planner',
    first_name: 'Test',
    last_name: 'Planner',
    is_active: true
  },
  {
    email: 'manager@company.com',
    password: 'password123',
    role_code: 'manager',
    first_name: 'Test',
    last_name: 'Manager',
    is_active: true
  },
  {
    email: 'admin@company.com',
    password: 'password123',
    role_code: 'admin',
    first_name: 'Test',
    last_name: 'Admin',
    is_active: true
  }
];

// FIXED: Removed email/phone fields (don't exist in suppliers table)
// Schema has: contact_email, contact_phone
const TEST_SUPPLIERS = [
  {
    code: 'MILL-001',
    name: 'Mill Co.',
    contact_email: 'orders@millco.com',
    contact_phone: '+48 123 456 789',
    address: 'ul. Młyńska 10, Warsaw',
    payment_terms: 'Net 30',
    is_active: true
  },
  {
    code: 'SUGAR-001',
    name: 'Sugar Inc.',
    contact_email: 'sales@sugarinc.com',
    contact_phone: '+48 987 654 321',
    address: 'ul. Cukrowa 5, Poznań',
    payment_terms: 'Net 45',
    is_active: true
  },
  {
    code: 'SMALL-001',
    name: 'Small Supplier',
    contact_email: 'info@smallsupplier.pl',
    contact_phone: '+48 555 666 777',
    address: 'ul. Krótka 1, Kraków',
    payment_terms: 'Net 14',
    is_active: true
  }
];

// FIXED: Changed type values to match CHECK constraint
// Valid values: 'GENERAL', 'RAW_MATERIALS', 'WIP', 'FINISHED_GOODS', 'QUARANTINE'
const TEST_WAREHOUSES = [
  {
    code: 'MAIN-WH',
    name: 'Main Warehouse',
    type: 'FINISHED_GOODS',
    is_active: true
  },
  {
    code: 'RAW-WH',
    name: 'Raw Materials Warehouse',
    type: 'RAW_MATERIALS',
    is_active: true
  }
];

// FIXED: Products table requires product_type_id (UUID FK), not product_type string
// Also changed unit_of_measure to base_uom, removed is_active (doesn't exist, use status)
const TEST_PRODUCTS = [
  {
    code: 'FLOUR-A',
    name: 'Flour Type A',
    base_uom: 'kg',
    shelf_life_days: 180,
    status: 'active'
  },
  {
    code: 'SUGAR-W',
    name: 'White Sugar',
    base_uom: 'kg',
    shelf_life_days: 365,
    status: 'active'
  },
  {
    code: 'SALT-S',
    name: 'Sea Salt',
    base_uom: 'kg',
    shelf_life_days: 730,
    status: 'active'
  }
];

const PLANNING_SETTINGS = {
  po_require_approval: true,
  po_approval_threshold: 10000, // $10,000
  po_approval_roles: ['manager', 'admin'],
  po_auto_number_prefix: 'PO-',
  po_auto_number_format: 'YYYY-NNNNN',
  po_default_payment_terms: 'Net 30',
  po_default_currency: 'PLN',
  to_allow_partial_shipments: true,
  to_require_lp_selection: false,
  wo_material_check: true,
  wo_copy_routing: true,
  wo_auto_select_bom: true
};

/**
 * Main seed function
 */
async function seedTestData() {
  console.log('🌱 Starting E2E test data seed...\n');

  try {
    // Step 1: Create or get test organization
    console.log('1️⃣  Creating test organization...');
    const org = await createOrganization();
    console.log(`   ✅ Organization created: ${org.name} (${org.id})\n`);

    // Step 1b: Seed default product types for this org
    console.log('1️⃣b  Seeding default product types...');
    await seedProductTypes(org.id);
    console.log('   ✅ Product types seeded\n');

    // Step 2: Get role IDs
    console.log('2️⃣  Fetching role IDs...');
    const roles = await getRoleIds();
    console.log(`   ✅ Found ${Object.keys(roles).length} roles\n`);

    // Step 3: Create test users
    console.log('3️⃣  Creating test users...');
    const users = await createUsers(org.id, roles);
    console.log(`   ✅ Created ${users.length} test users\n`);

    // Step 4: Create suppliers
    console.log('4️⃣  Creating suppliers...');
    const suppliers = await createSuppliers(org.id);
    console.log(`   ✅ Created ${suppliers.length} suppliers\n`);

    // Step 5: Create warehouses
    console.log('5️⃣  Creating warehouses...');
    const warehouses = await createWarehouses(org.id);
    console.log(`   ✅ Created ${warehouses.length} warehouses\n`);

    // Step 6: Create products
    console.log('6️⃣  Creating products...');
    const products = await createProducts(org.id);
    console.log(`   ✅ Created ${products.length} products\n`);

    // Step 7: Create planning settings
    console.log('7️⃣  Creating planning settings...');
    await createPlanningSettings(org.id);
    console.log('   ✅ Planning settings configured\n');

    // Step 8: Create default PO statuses
    console.log('8️⃣  Creating default PO statuses...');
    await createDefaultPOStatuses(org.id);
    console.log('   ✅ Default PO statuses created\n');

    // Step 9: Create tax codes
    console.log('9️⃣  Creating tax codes...');
    // Get first user if none created (for created_by field)
    let userId = users.length > 0 ? users[0].id : null;
    if (!userId) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();
      userId = existingUser?.id || null;
    }
    if (!userId) {
      console.log('   ⚠️  No user found, skipping tax codes');
    } else {
      const taxCodes = await createTaxCodes(org.id, userId);
      console.log(`   ✅ Created ${taxCodes.length} tax codes\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ E2E TEST DATA SEED COMPLETED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Summary:');
    console.log(`   Organization: ${org.name}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Suppliers: ${suppliers.length}`);
    console.log(`   Warehouses: ${warehouses.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Approval threshold: $${PLANNING_SETTINGS.po_approval_threshold.toLocaleString()}`);
    console.log('\n🔐 Test Credentials:');
    TEST_USERS.forEach(user => {
      console.log(`   ${user.email} / ${user.password} (${user.role_code})`);
    });
    console.log('\n🎯 Ready for E2E tests!');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

/**
 * Get first available organization (use existing org for E2E tests)
 */
async function createOrganization() {
  // Get first organization in database
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (error) throw error;

  if (!orgs || orgs.length === 0) {
    throw new Error('No organization found in database. Please create an organization first via UI or migrations.');
  }

  const org = orgs[0];
  console.log(`   ℹ️  Using existing organization: ${org.name} (${org.id})`);
  return org;
}

/**
 * Seed default product types for organization
 */
async function seedProductTypes(orgId: string) {
  const { error } = await supabase.rpc('seed_default_product_types', {
    target_org_id: orgId
  });

  if (error) {
    console.error('   ⚠️  Warning: Could not seed product types:', error);
    // Don't throw - product types might already exist
  }
}

/**
 * Get role IDs by code
 */
async function getRoleIds() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, code');

  if (error) throw error;

  const roleMap: Record<string, string> = {};
  data.forEach(role => {
    roleMap[role.code] = role.id;
  });

  return roleMap;
}

/**
 * Create test users
 */
async function createUsers(orgId: string, roles: Record<string, string>) {
  const createdUsers = [];

  for (const userData of TEST_USERS) {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      console.log(`   ℹ️  User already exists: ${userData.email}`);
      createdUsers.push(existingUser);
      continue;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });

    if (authError) {
      console.error(`   ❌ Failed to create auth user ${userData.email}:`, authError);
      continue;
    }

    // Create user record (FIXED: use first_name + last_name instead of full_name)
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        org_id: orgId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_id: roles[userData.role_code],
        is_active: userData.is_active
      }])
      .select()
      .single();

    if (userError) {
      console.error(`   ❌ Failed to create user record ${userData.email}:`, userError);
      continue;
    }

    console.log(`   ✓ Created user: ${user.email} (${userData.role_code})`);
    createdUsers.push(user);
  }

  return createdUsers;
}

/**
 * Create suppliers
 */
async function createSuppliers(orgId: string) {
  const createdSuppliers = [];

  for (const supplierData of TEST_SUPPLIERS) {
    // Check if supplier exists
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', orgId)
      .eq('code', supplierData.code)
      .single();

    if (existingSupplier) {
      console.log(`   ℹ️  Supplier already exists: ${supplierData.name}`);
      createdSuppliers.push(existingSupplier);
      continue;
    }

    // Create supplier (FIXED: fields match suppliers table schema)
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ ...supplierData, org_id: orgId }])
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to create supplier ${supplierData.name}:`, error);
      continue;
    }

    console.log(`   ✓ Created supplier: ${data.name}`);
    createdSuppliers.push(data);
  }

  return createdSuppliers;
}

/**
 * Create warehouses
 */
async function createWarehouses(orgId: string) {
  const createdWarehouses = [];

  for (const warehouseData of TEST_WAREHOUSES) {
    // Check if warehouse exists
    const { data: existingWarehouse } = await supabase
      .from('warehouses')
      .select('*')
      .eq('org_id', orgId)
      .eq('code', warehouseData.code)
      .single();

    if (existingWarehouse) {
      console.log(`   ℹ️  Warehouse already exists: ${warehouseData.name}`);
      createdWarehouses.push(existingWarehouse);
      continue;
    }

    // Create warehouse (FIXED: type values match CHECK constraint)
    const { data, error } = await supabase
      .from('warehouses')
      .insert([{ ...warehouseData, org_id: orgId }])
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to create warehouse ${warehouseData.name}:`, error);
      continue;
    }

    console.log(`   ✓ Created warehouse: ${data.name}`);
    createdWarehouses.push(data);
  }

  return createdWarehouses;
}

/**
 * Create products
 */
async function createProducts(orgId: string) {
  const createdProducts: any[] = [];

  // Get RM product type ID (Raw Material)
  const { data: productType, error: typeError } = await supabase
    .from('product_types')
    .select('id')
    .eq('org_id', orgId)
    .eq('code', 'RM')
    .single();

  if (typeError || !productType) {
    console.error('   ❌ Failed to get RM product type. Make sure product types are seeded.');
    return createdProducts;
  }

  for (const productData of TEST_PRODUCTS) {
    // Check if product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', orgId)
      .eq('code', productData.code)
      .single();

    if (existingProduct) {
      console.log(`   ℹ️  Product already exists: ${productData.name}`);
      createdProducts.push(existingProduct);
      continue;
    }

    // Create product (FIXED: add required product_type_id)
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        org_id: orgId,
        product_type_id: productType.id
      }])
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to create product ${productData.name}:`, error);
      continue;
    }

    console.log(`   ✓ Created product: ${data.name}`);
    createdProducts.push(data);
  }

  return createdProducts;
}

/**
 * Create planning settings
 */
async function createPlanningSettings(orgId: string) {
  // Check if settings exist
  const { data: existingSettings } = await supabase
    .from('planning_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (existingSettings) {
    // Update existing settings
    const { error } = await supabase
      .from('planning_settings')
      .update(PLANNING_SETTINGS)
      .eq('org_id', orgId);

    if (error) throw error;
    console.log('   ℹ️  Planning settings updated');
    return;
  }

  // Create new settings
  const { error } = await supabase
    .from('planning_settings')
    .insert([{ ...PLANNING_SETTINGS, org_id: orgId }]);

  if (error) throw error;
}

/**
 * Create default PO statuses
 */
async function createDefaultPOStatuses(orgId: string) {
  // Check if statuses exist
  const { data: existingStatuses } = await supabase
    .from('po_statuses')
    .select('*')
    .eq('org_id', orgId);

  if (existingStatuses && existingStatuses.length > 0) {
    console.log(`   ℹ️  PO statuses already exist (${existingStatuses.length} statuses)`);
    return;
  }

  // Call RPC function to create default statuses
  const { error } = await supabase
    .rpc('create_default_po_statuses', { p_org_id: orgId });

  if (error) {
    console.error('   ⚠️  Warning: Could not create default PO statuses:', error);
    // Don't throw - this is not critical for basic tests
  }
}

/**
 * Create tax codes
 */
async function createTaxCodes(orgId: string, userId: string) {
  const createdTaxCodes = [];

  const TEST_TAX_CODES = [
    {
      code: 'VAT23',
      name: 'VAT 23%',
      country_code: 'PL',
      rate: 23.00,
      valid_from: '2024-01-01',
      valid_to: null,
      is_default: true
    },
    {
      code: 'VAT8',
      name: 'VAT 8% (Reduced)',
      country_code: 'PL',
      rate: 8.00,
      valid_from: '2024-01-01',
      valid_to: null,
      is_default: false
    },
    {
      code: 'VAT5',
      name: 'VAT 5% (Food)',
      country_code: 'PL',
      rate: 5.00,
      valid_from: '2024-01-01',
      valid_to: null,
      is_default: false
    },
    {
      code: 'VAT0',
      name: 'VAT 0% (Export)',
      country_code: 'PL',
      rate: 0.00,
      valid_from: '2024-01-01',
      valid_to: null,
      is_default: false
    },
    {
      code: 'GST10',
      name: 'GST 10%',
      country_code: 'AU',
      rate: 10.00,
      valid_from: '2024-01-01',
      valid_to: null,
      is_default: false
    }
  ];

  for (const taxCodeData of TEST_TAX_CODES) {
    // Check if tax code exists
    const { data: existingTaxCode } = await supabase
      .from('tax_codes')
      .select('*')
      .eq('org_id', orgId)
      .eq('code', taxCodeData.code)
      .eq('country_code', taxCodeData.country_code)
      .single();

    if (existingTaxCode) {
      console.log(`   ℹ️  Tax code already exists: ${taxCodeData.code} (${taxCodeData.country_code})`);
      createdTaxCodes.push(existingTaxCode);
      continue;
    }

    // Create tax code
    const { data, error } = await supabase
      .from('tax_codes')
      .insert([{
        ...taxCodeData,
        org_id: orgId,
        created_by: userId
      }])
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to create tax code ${taxCodeData.code}:`, error);
      continue;
    }

    console.log(`   ✓ Created tax code: ${data.code} (${data.name})`);
    createdTaxCodes.push(data);
  }

  return createdTaxCodes;
}

// Run seed
seedTestData();
