#!/usr/bin/env node

/**
 * Seed Epic 1 Test Data
 *
 * Creates sample data for all Epic 1 tables:
 * - Organizations
 * - Users (admin)
 * - Warehouses
 * - Locations
 * - Machines
 * - Production Lines
 * - Allergens
 * - Tax Codes
 * - User Invitations
 *
 * Usage:
 *   node scripts/seed-epic1-data.mjs
 *
 * Environment variables (from apps/frontend/.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Note: This script is idempotent - it will skip creation if test data already exists
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from apps/frontend/.env.local
const envPath = resolve(process.cwd(), 'apps/frontend/.env.local');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      return;
    }
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
} catch (error) {
  console.error('❌ Could not read apps/frontend/.env.local');
  console.error('   Make sure the file exists with SUPABASE credentials');
  process.exit(1);
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in apps/frontend/.env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data credentials
const TEST_EMAIL = 'admin@monopilot.com';
const TEST_PASSWORD = 'Admin123!@#';
const TEST_ORG_NAME = 'MonoPilot Test Organization';

console.log('🌱 Seeding Epic 1 test data...\n');

async function main() {
  let orgId, userId;

  try {
    // ================================================================
    // STEP 1: Check/Create Test Organization
    // ================================================================
    console.log('📋 Step 1: Checking test organization...');

    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('company_name', TEST_ORG_NAME)
      .single();

    if (existingOrg) {
      console.log('✓ Test organization already exists');
      orgId = existingOrg.id;
      console.log('  Organization ID:', orgId);
    } else {
      console.log('  Creating test organization...');
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          company_name: TEST_ORG_NAME,
          date_format: 'DD/MM/YYYY',
          number_format: '1,234.56',
          unit_system: 'metric',
          timezone: 'Europe/Warsaw',
          default_currency: 'PLN',
          default_language: 'PL',
          country: 'PL'
        })
        .select()
        .single();

      if (orgError) {
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      orgId = newOrg.id;
      console.log('✓ Test organization created');
      console.log('  Organization ID:', orgId);
    }

    // ================================================================
    // STEP 2: Check/Create Test Admin User
    // ================================================================
    console.log('\n📋 Step 2: Checking test admin user...');

    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const authUser = existingAuthUser?.users?.find(u => u.email === TEST_EMAIL);

    if (authUser) {
      console.log('✓ Test auth user already exists');
      userId = authUser.id;
    } else {
      console.log('  Creating test auth user...');
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: 'Test',
          last_name: 'Admin',
          role: 'admin'
        }
      });

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      userId = newAuthUser.user.id;
      console.log('✓ Test auth user created');
    }

    // Check/Create user record in public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      console.log('  Creating user record...');
      const { error: userRecordError } = await supabase
        .from('users')
        .insert({
          id: userId,
          org_id: orgId,
          email: TEST_EMAIL,
          first_name: 'Test',
          last_name: 'Admin',
          role: 'admin',
          status: 'active'
        });

      if (userRecordError) {
        throw new Error(`Failed to create user record: ${userRecordError.message}`);
      }
      console.log('✓ User record created');
    } else {
      console.log('✓ User record already exists');
    }

    console.log('  User ID:', userId);

    // ================================================================
    // STEP 3: Seed Tax Codes (using DB function)
    // ================================================================
    console.log('\n📋 Step 3: Seeding tax codes...');

    const { data: existingTaxCodes } = await supabase
      .from('tax_codes')
      .select('count')
      .eq('org_id', orgId);

    if (existingTaxCodes && existingTaxCodes.length > 0) {
      console.log('✓ Tax codes already seeded');
    } else {
      const { error: taxSeedError } = await supabase
        .rpc('seed_tax_codes_for_organization', {
          p_org_id: orgId,
          p_country_code: 'PL'
        });

      if (taxSeedError) {
        console.log('⚠️  Warning: Could not seed tax codes via function:', taxSeedError.message);
        console.log('  Inserting manually...');

        const { error: manualTaxError } = await supabase
          .from('tax_codes')
          .insert([
            { org_id: orgId, code: 'VAT23', description: 'VAT 23%', rate: 23.00 },
            { org_id: orgId, code: 'VAT8', description: 'VAT 8%', rate: 8.00 },
            { org_id: orgId, code: 'VAT0', description: 'VAT 0%', rate: 0.00 }
          ]);

        if (manualTaxError) {
          console.log('⚠️  Warning: Could not insert tax codes:', manualTaxError.message);
        } else {
          console.log('✓ Tax codes inserted manually');
        }
      } else {
        console.log('✓ Tax codes seeded via function');
      }
    }

    // ================================================================
    // STEP 4: Seed Allergens
    // ================================================================
    console.log('\n📋 Step 4: Seeding allergens...');

    const { data: existingAllergens } = await supabase
      .from('allergens')
      .select('count')
      .eq('org_id', orgId);

    if (existingAllergens && existingAllergens.length > 0) {
      console.log('✓ Allergens already seeded');
    } else {
      const { error: allergenError } = await supabase
        .from('allergens')
        .insert([
          { org_id: orgId, code: 'MILK', name: 'Milk and dairy', is_major: true, is_custom: false },
          { org_id: orgId, code: 'EGGS', name: 'Eggs', is_major: true, is_custom: false },
          { org_id: orgId, code: 'GLUTEN', name: 'Gluten (Cereals)', is_major: true, is_custom: false },
          { org_id: orgId, code: 'NUTS', name: 'Tree nuts', is_major: true, is_custom: false }
        ]);

      if (allergenError) {
        console.log('⚠️  Warning: Could not insert allergens:', allergenError.message);
      } else {
        console.log('✓ Allergens inserted (4 items)');
      }
    }

    // ================================================================
    // STEP 5: Seed Warehouses
    // ================================================================
    console.log('\n📋 Step 5: Seeding warehouses...');

    const { data: existingWarehouses } = await supabase
      .from('warehouses')
      .select('*')
      .eq('org_id', orgId);

    let warehouseIds = [];

    if (existingWarehouses && existingWarehouses.length > 0) {
      console.log(`✓ Warehouses already exist (${existingWarehouses.length} items)`);
      warehouseIds = existingWarehouses.map(w => w.id);
    } else {
      const { data: newWarehouses, error: warehouseError } = await supabase
        .from('warehouses')
        .insert([
          {
            org_id: orgId,
            code: 'WH-01',
            name: 'Main Warehouse',
            address: '123 Industrial Park, Warsaw',
            is_active: true,
            created_by: userId
          },
          {
            org_id: orgId,
            code: 'WH-02',
            name: 'Secondary Warehouse',
            address: '456 Storage Ln, Krakow',
            is_active: true,
            created_by: userId
          },
          {
            org_id: orgId,
            code: 'WH-03',
            name: 'Distribution Center',
            address: '789 Logistics Rd, Gdansk',
            is_active: true,
            created_by: userId
          }
        ])
        .select();

      if (warehouseError) {
        throw new Error(`Failed to insert warehouses: ${warehouseError.message}`);
      }

      warehouseIds = newWarehouses.map(w => w.id);
      console.log(`✓ Warehouses inserted (${newWarehouses.length} items)`);
    }

    // ================================================================
    // STEP 6: Seed Locations
    // ================================================================
    console.log('\n📋 Step 6: Seeding locations...');

    const { data: existingLocations } = await supabase
      .from('locations')
      .select('*')
      .eq('org_id', orgId);

    if (existingLocations && existingLocations.length > 0) {
      console.log(`✓ Locations already exist (${existingLocations.length} items)`);
    } else {
      const locationsToInsert = [];

      // Create 3 locations per warehouse
      warehouseIds.forEach((whId, whIndex) => {
        const whCode = `WH-0${whIndex + 1}`;
        locationsToInsert.push(
          {
            org_id: orgId,
            warehouse_id: whId,
            code: `RCV-01`,
            name: 'Receiving Area',
            type: 'receiving',
            barcode: `LOC-${whCode}-001`,
            zone_enabled: false,
            capacity_enabled: false,
            is_active: true,
            created_by: userId
          },
          {
            org_id: orgId,
            warehouse_id: whId,
            code: `STOR-01`,
            name: 'Main Storage',
            type: 'storage',
            barcode: `LOC-${whCode}-002`,
            zone: 'Zone A',
            zone_enabled: true,
            capacity: 1000.00,
            capacity_enabled: true,
            is_active: true,
            created_by: userId
          },
          {
            org_id: orgId,
            warehouse_id: whId,
            code: `SHIP-01`,
            name: 'Shipping Dock',
            type: 'shipping',
            barcode: `LOC-${whCode}-003`,
            zone_enabled: false,
            capacity_enabled: false,
            is_active: true,
            created_by: userId
          }
        );
      });

      const { error: locationError } = await supabase
        .from('locations')
        .insert(locationsToInsert);

      if (locationError) {
        throw new Error(`Failed to insert locations: ${locationError.message}`);
      }

      console.log(`✓ Locations inserted (${locationsToInsert.length} items)`);
    }

    // ================================================================
    // STEP 7: Seed Machines
    // ================================================================
    console.log('\n📋 Step 7: Seeding machines...');

    const { data: existingMachines } = await supabase
      .from('machines')
      .select('*')
      .eq('org_id', orgId);

    let machineIds = [];

    if (existingMachines && existingMachines.length > 0) {
      console.log(`✓ Machines already exist (${existingMachines.length} items)`);
      machineIds = existingMachines.map(m => m.id);
    } else {
      const { data: newMachines, error: machineError } = await supabase
        .from('machines')
        .insert([
          {
            org_id: orgId,
            code: 'MIX-01',
            name: 'Industrial Mixer #1',
            status: 'active',
            capacity_per_hour: 500.00,
            created_by: userId
          },
          {
            org_id: orgId,
            code: 'PACK-01',
            name: 'Packaging Line #1',
            status: 'active',
            capacity_per_hour: 1000.00,
            created_by: userId
          },
          {
            org_id: orgId,
            code: 'OVEN-01',
            name: 'Baking Oven #1',
            status: 'maintenance',
            capacity_per_hour: 300.00,
            created_by: userId
          }
        ])
        .select();

      if (machineError) {
        throw new Error(`Failed to insert machines: ${machineError.message}`);
      }

      machineIds = newMachines.map(m => m.id);
      console.log(`✓ Machines inserted (${newMachines.length} items)`);
    }

    // ================================================================
    // STEP 8: Seed Production Lines
    // ================================================================
    console.log('\n📋 Step 8: Seeding production lines...');

    const { data: existingLines } = await supabase
      .from('production_lines')
      .select('*')
      .eq('org_id', orgId);

    let lineIds = [];

    if (existingLines && existingLines.length > 0) {
      console.log(`✓ Production lines already exist (${existingLines.length} items)`);
      lineIds = existingLines.map(l => l.id);
    } else {
      const { data: newLines, error: lineError } = await supabase
        .from('production_lines')
        .insert([
          {
            org_id: orgId,
            warehouse_id: warehouseIds[0],
            code: 'LINE-01',
            name: 'Mixing Line',
            created_by: userId
          },
          {
            org_id: orgId,
            warehouse_id: warehouseIds[0],
            code: 'LINE-02',
            name: 'Packaging Line',
            created_by: userId
          },
          {
            org_id: orgId,
            warehouse_id: warehouseIds[1],
            code: 'LINE-03',
            name: 'Baking Line',
            created_by: userId
          }
        ])
        .select();

      if (lineError) {
        throw new Error(`Failed to insert production lines: ${lineError.message}`);
      }

      lineIds = newLines.map(l => l.id);
      console.log(`✓ Production lines inserted (${newLines.length} items)`);
    }

    // ================================================================
    // STEP 9: Seed Machine-Line Assignments
    // ================================================================
    console.log('\n📋 Step 9: Seeding machine-line assignments...');

    const { data: existingAssignments } = await supabase
      .from('machine_line_assignments')
      .select('*');

    if (existingAssignments && existingAssignments.length > 0) {
      console.log(`✓ Machine assignments already exist (${existingAssignments.length} items)`);
    } else {
      const { error: assignmentError } = await supabase
        .from('machine_line_assignments')
        .insert([
          { machine_id: machineIds[0], line_id: lineIds[0] }, // MIX-01 → LINE-01
          { machine_id: machineIds[1], line_id: lineIds[1] }, // PACK-01 → LINE-02
          { machine_id: machineIds[2], line_id: lineIds[2] }  // OVEN-01 → LINE-03
        ]);

      if (assignmentError) {
        console.log('⚠️  Warning: Could not insert machine assignments:', assignmentError.message);
      } else {
        console.log('✓ Machine assignments inserted (3 items)');
      }
    }

    // ================================================================
    // STEP 10: Seed User Invitations
    // ================================================================
    console.log('\n📋 Step 10: Seeding user invitations...');

    const { data: existingInvitations } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('org_id', orgId);

    if (existingInvitations && existingInvitations.length > 0) {
      console.log(`✓ User invitations already exist (${existingInvitations.length} items)`);
    } else {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { error: invitationError } = await supabase
        .from('user_invitations')
        .insert([
          {
            org_id: orgId,
            email: 'operator1@monopilot.com',
            role: 'operator',
            token: 'test-token-operator-1',
            invited_by: userId,
            status: 'pending',
            expires_at: expiresAt.toISOString()
          },
          {
            org_id: orgId,
            email: 'operator2@monopilot.com',
            role: 'operator',
            token: 'test-token-operator-2',
            invited_by: userId,
            status: 'pending',
            expires_at: expiresAt.toISOString()
          },
          {
            org_id: orgId,
            email: 'viewer@monopilot.com',
            role: 'viewer',
            token: 'test-token-viewer-1',
            invited_by: userId,
            status: 'pending',
            expires_at: expiresAt.toISOString()
          }
        ]);

      if (invitationError) {
        console.log('⚠️  Warning: Could not insert invitations:', invitationError.message);
      } else {
        console.log('✓ User invitations inserted (3 items)');
      }
    }

    // ================================================================
    // SUMMARY
    // ================================================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ EPIC 1 SEED DATA CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📝 Test Credentials:\n');
    console.log('   Email:    ', TEST_EMAIL);
    console.log('   Password: ', TEST_PASSWORD);
    console.log('\n🔗 Login URL:\n');
    console.log('   http://localhost:3000/login');
    console.log('\n📊 Data Summary:\n');
    console.log('   Organization:', TEST_ORG_NAME);
    console.log('   Warehouses:   3');
    console.log('   Locations:    9 (3 per warehouse)');
    console.log('   Machines:     3');
    console.log('   Lines:        3');
    console.log('   Tax Codes:    3-4 (PL)');
    console.log('   Allergens:    4');
    console.log('   Invitations:  3');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
