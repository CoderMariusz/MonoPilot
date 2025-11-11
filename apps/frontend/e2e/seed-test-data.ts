/**
 * Test Data Seeding Script
 * 
 * This script seeds the database with test data required for E2E tests.
 * Run this before running E2E tests to ensure all necessary data exists.
 * 
 * Usage:
 *   npx tsx e2e/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try to load environment variables from .env.local if it exists
const envPath = resolve(__dirname, '../.env.local');
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('📄 Loaded environment from .env.local');
}

// Supabase configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase configuration!');
  console.error('\nPlease set environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  console.error('\nYou can:');
  console.error('  1. Create .env.local file with these variables');
  console.error('  2. Set them as system environment variables');
  console.error('  3. Pass them inline: NEXT_PUBLIC_SUPABASE_URL=... pnpm test:e2e:seed\n');
  process.exit(1);
}

console.log('✅ Supabase configuration loaded');
console.log(`   URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Main seeding function
 */
async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  try {
    // 1. Seed Test User
    console.log('👤 Checking test user...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'przyslony@gmail.com')
      .single();

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
    } else {
      console.log('⚠️  Test user not found. Please ensure przyslony@gmail.com is registered.');
    }

    // 2. Seed Suppliers
    console.log('\n📦 Seeding suppliers...');
    const suppliers = [
      {
        code: 'SUP-001',
        name: 'Test Supplier Alpha',
        email: 'alpha@testsupplier.com',
        phone: '+48 123 456 789',
        address: 'Test Street 1, Warsaw',
        country: 'Poland',
        tax_id: 'PL1234567890',
        currency: 'PLN',
        payment_terms: 'Net 30',
        is_active: true,
      },
      {
        code: 'SUP-002',
        name: 'Test Supplier Beta',
        email: 'beta@testsupplier.com',
        phone: '+48 987 654 321',
        address: 'Test Avenue 2, Krakow',
        country: 'Poland',
        tax_id: 'PL0987654321',
        currency: 'EUR',
        payment_terms: 'Net 60',
        is_active: true,
      },
      {
        code: 'SUP-003',
        name: 'Test Supplier Gamma',
        email: 'gamma@testsupplier.com',
        phone: '+48 555 666 777',
        address: 'Test Boulevard 3, Gdansk',
        country: 'Poland',
        tax_id: 'PL5556667777',
        currency: 'USD',
        payment_terms: 'Net 45',
        is_active: true,
      },
    ];

    for (const supplier of suppliers) {
      const { data: existing } = await supabase
        .from('suppliers')
        .select('id, code')
        .eq('code', supplier.code)
        .single();

      if (!existing) {
        const { error } = await supabase.from('suppliers').insert(supplier);
        if (error) {
          console.error(`❌ Error inserting supplier ${supplier.code}:`, error.message);
        } else {
          console.log(`✅ Created supplier: ${supplier.code} - ${supplier.name}`);
        }
      } else {
        console.log(`⏭️  Supplier already exists: ${supplier.code}`);
      }
    }

    // 3. Seed Products
    console.log('\n🥩 Seeding products...');
    const products = [
      {
        code: 'BXS-001',
        name: 'Test Beef Short Rib',
        product_type: 'RM_MEAT',
        product_group: 'BEEF',
        unit_of_measure: 'KG',
        default_unit_price: 25.50,
        is_active: true,
      },
      {
        code: 'PKC-001',
        name: 'Test Pork Chop',
        product_type: 'RM_MEAT',
        product_group: 'PORK',
        unit_of_measure: 'KG',
        default_unit_price: 18.75,
        is_active: true,
      },
      {
        code: 'CHB-001',
        name: 'Test Chicken Breast',
        product_type: 'RM_MEAT',
        product_group: 'POULTRY',
        unit_of_measure: 'KG',
        default_unit_price: 12.50,
        is_active: true,
      },
      {
        code: 'LBS-001',
        name: 'Test Lamb Shoulder',
        product_type: 'RM_MEAT',
        product_group: 'LAMB',
        unit_of_measure: 'KG',
        default_unit_price: 22.00,
        is_active: true,
      },
      {
        code: 'VCS-001',
        name: 'Test Veal Cutlet',
        product_type: 'RM_MEAT',
        product_group: 'VEAL',
        unit_of_measure: 'KG',
        default_unit_price: 28.00,
        is_active: true,
      },
    ];

    for (const product of products) {
      const { data: existing } = await supabase
        .from('products')
        .select('id, code')
        .eq('code', product.code)
        .single();

      if (!existing) {
        const { error } = await supabase.from('products').insert(product);
        if (error) {
          console.error(`❌ Error inserting product ${product.code}:`, error.message);
        } else {
          console.log(`✅ Created product: ${product.code} - ${product.name}`);
        }
      } else {
        console.log(`⏭️  Product already exists: ${product.code}`);
      }
    }

    // 4. Seed Warehouses
    console.log('\n🏢 Seeding warehouses...');
    const warehouses = [
      {
        code: 'WH-TEST-01',
        name: 'Test Warehouse Main',
        address: 'Test Warehouse Street 1, Warsaw',
        is_active: true,
      },
      {
        code: 'WH-TEST-02',
        name: 'Test Warehouse Secondary',
        address: 'Test Warehouse Avenue 2, Krakow',
        is_active: true,
      },
      {
        code: 'WH-TEST-03',
        name: 'Test Warehouse Distribution',
        address: 'Test Warehouse Boulevard 3, Gdansk',
        is_active: true,
      },
    ];

    const warehouseIds: Record<string, number> = {};

    for (const warehouse of warehouses) {
      const { data: existing } = await supabase
        .from('warehouses')
        .select('id, code')
        .eq('code', warehouse.code)
        .single();

      if (!existing) {
        const { data, error } = await supabase
          .from('warehouses')
          .insert(warehouse)
          .select('id, code')
          .single();
        
        if (error) {
          console.error(`❌ Error inserting warehouse ${warehouse.code}:`, error.message);
        } else {
          console.log(`✅ Created warehouse: ${warehouse.code} - ${warehouse.name}`);
          if (data) warehouseIds[warehouse.code] = data.id;
        }
      } else {
        console.log(`⏭️  Warehouse already exists: ${warehouse.code}`);
        warehouseIds[warehouse.code] = existing.id;
      }
    }

    // 5. Seed Locations (for each warehouse)
    console.log('\n📍 Seeding locations...');
    const locationsByWarehouse = [
      { warehouse_code: 'WH-TEST-01', locations: ['A-01-01', 'A-01-02', 'B-01-01', 'RECEIVING', 'SHIPPING'] },
      { warehouse_code: 'WH-TEST-02', locations: ['C-01-01', 'C-01-02', 'RECEIVING', 'SHIPPING'] },
      { warehouse_code: 'WH-TEST-03', locations: ['D-01-01', 'RECEIVING', 'SHIPPING'] },
    ];

    for (const { warehouse_code, locations } of locationsByWarehouse) {
      const warehouseId = warehouseIds[warehouse_code];
      if (!warehouseId) {
        console.log(`⚠️  Warehouse ${warehouse_code} not found, skipping locations`);
        continue;
      }

      for (const locationCode of locations) {
        const { data: existing } = await supabase
          .from('locations')
          .select('id, code')
          .eq('warehouse_id', warehouseId)
          .eq('code', locationCode)
          .single();

        if (!existing) {
          const { error } = await supabase.from('locations').insert({
            warehouse_id: warehouseId,
            code: locationCode,
            name: `Test Location ${locationCode}`,
            is_active: true,
          });

          if (error) {
            console.error(`❌ Error inserting location ${locationCode}:`, error.message);
          } else {
            console.log(`✅ Created location: ${warehouse_code}/${locationCode}`);
          }
        } else {
          console.log(`⏭️  Location already exists: ${warehouse_code}/${locationCode}`);
        }
      }
    }

    // 6. Link Products to Suppliers (for PO creation tests)
    console.log('\n🔗 Linking products to suppliers...');
    const { data: suppliersList } = await supabase
      .from('suppliers')
      .select('id, code')
      .in('code', ['SUP-001', 'SUP-002', 'SUP-003']);

    const { data: productsList } = await supabase
      .from('products')
      .select('id, code')
      .in('code', ['BXS-001', 'PKC-001', 'CHB-001', 'LBS-001', 'VCS-001']);

    if (suppliersList && productsList) {
      // Link each product to a supplier
      const links = [
        { product: 'BXS-001', supplier: 'SUP-001' },
        { product: 'PKC-001', supplier: 'SUP-001' },
        { product: 'CHB-001', supplier: 'SUP-002' },
        { product: 'LBS-001', supplier: 'SUP-002' },
        { product: 'VCS-001', supplier: 'SUP-003' },
      ];

      for (const link of links) {
        const product = productsList.find(p => p.code === link.product);
        const supplier = suppliersList.find(s => s.code === link.supplier);

        if (product && supplier) {
          // Update product with supplier_id
          const { error } = await supabase
            .from('products')
            .update({ supplier_id: supplier.id })
            .eq('id', product.id);

          if (error) {
            console.error(`❌ Error linking ${link.product} to ${link.supplier}:`, error.message);
          } else {
            console.log(`✅ Linked ${link.product} → ${link.supplier}`);
          }
        }
      }
    }

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Warehouses: ${warehouses.length}`);
    console.log(`   - Ready for E2E tests! 🚀`);

  } catch (error: any) {
    console.error('\n❌ Error seeding test data:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedTestData();

