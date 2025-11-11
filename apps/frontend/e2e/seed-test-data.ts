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
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase configuration!');
  console.error('\nPlease set environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error(
    '  - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
  );
  console.error('\nYou can:');
  console.error('  1. Create .env.local file with these variables');
  console.error('  2. Set them as system environment variables');
  console.error(
    '  3. Pass them inline: NEXT_PUBLIC_SUPABASE_URL=... pnpm test:e2e:seed\n'
  );
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
      console.log(
        '⚠️  Test user not found. Please ensure przyslony@gmail.com is registered.'
      );
    }

    // 2. Seed Suppliers
    console.log('\n📦 Seeding suppliers...');
    const suppliers = [
      {
        name: 'Test Supplier Alpha',
        legal_name: 'Test Supplier Alpha Sp. z o.o.',
        vat_number: 'PL1234567890',
        tax_number: 'PL1234567890',
        country: 'POL',
        currency: 'PLN',
        payment_terms: 'Net 30',
        incoterms: 'DAP',
        email: 'alpha@testsupplier.com',
        phone: '+48 123 456 789',
        address: {
          street: 'Test Street 1',
          city: 'Warsaw',
          postal_code: '00-001',
          country: 'Poland',
        },
        is_active: true,
      },
      {
        name: 'Test Supplier Beta',
        legal_name: 'Test Supplier Beta GmbH',
        vat_number: 'DE0987654321',
        tax_number: 'DE0987654321',
        country: 'DEU',
        currency: 'EUR',
        payment_terms: 'Net 60',
        incoterms: 'EXW',
        email: 'beta@testsupplier.com',
        phone: '+49 987 654 321',
        address: {
          street: 'Test Avenue 2',
          city: 'Berlin',
          postal_code: '10115',
          country: 'Germany',
        },
        is_active: true,
      },
      {
        name: 'Test Supplier Gamma',
        legal_name: 'Test Supplier Gamma Inc.',
        vat_number: 'US5556667777',
        tax_number: 'US5556667777',
        country: 'USA',
        currency: 'USD',
        payment_terms: 'Net 45',
        incoterms: 'FOB',
        email: 'gamma@testsupplier.com',
        phone: '+1 555 666 7777',
        address: {
          street: 'Test Boulevard 3',
          city: 'New York',
          postal_code: '10001',
          country: 'USA',
        },
        is_active: true,
      },
    ];

    for (const supplier of suppliers) {
      const { data: existing } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('name', supplier.name)
        .single();

      if (!existing) {
        const { error } = await supabase.from('suppliers').insert(supplier);
        if (error) {
          console.error(
            `❌ Error inserting supplier ${supplier.name}:`,
            error.message
          );
        } else {
          console.log(`✅ Created supplier: ${supplier.name}`);
        }
      } else {
        console.log(`⏭️  Supplier already exists: ${supplier.name}`);
      }
    }

    // 3. Seed Products
    console.log('\n🥩 Seeding products...');
    const products = [
      {
        part_number: 'BXS-001',
        description: 'Test Beef Short Rib',
        type: 'RM',
        subtype: 'BEEF',
        product_group: 'MEAT',
        product_type: 'RM_MEAT',
        uom: 'KG',
        std_price: 25.5,
        is_active: true,
      },
      {
        part_number: 'PKC-001',
        description: 'Test Pork Chop',
        type: 'RM',
        subtype: 'PORK',
        product_group: 'MEAT',
        product_type: 'RM_MEAT',
        uom: 'KG',
        std_price: 18.75,
        is_active: true,
      },
      {
        part_number: 'CHB-001',
        description: 'Test Chicken Breast',
        type: 'RM',
        subtype: 'POULTRY',
        product_group: 'MEAT',
        product_type: 'RM_MEAT',
        uom: 'KG',
        std_price: 12.5,
        is_active: true,
      },
      {
        part_number: 'LBS-001',
        description: 'Test Lamb Shoulder',
        type: 'RM',
        subtype: 'LAMB',
        product_group: 'MEAT',
        product_type: 'RM_MEAT',
        uom: 'KG',
        std_price: 22.0,
        is_active: true,
      },
      {
        part_number: 'VCS-001',
        description: 'Test Veal Cutlet',
        type: 'RM',
        subtype: 'VEAL',
        product_group: 'MEAT',
        product_type: 'RM_MEAT',
        uom: 'KG',
        std_price: 28.0,
        is_active: true,
      },
    ];

    for (const product of products) {
      const { data: existing } = await supabase
        .from('products')
        .select('id, part_number')
        .eq('part_number', product.part_number)
        .single();

      if (!existing) {
        const { error } = await supabase.from('products').insert(product);
        if (error) {
          console.error(
            `❌ Error inserting product ${product.part_number}:`,
            error.message
          );
        } else {
          console.log(
            `✅ Created product: ${product.part_number} - ${product.description}`
          );
        }
      } else {
        console.log(`⏭️  Product already exists: ${product.part_number}`);
      }
    }

    // 4. Seed Warehouses
    console.log('\n🏢 Seeding warehouses...');
    const warehouses = [
      {
        code: 'WH-TEST-01',
        name: 'Test Warehouse Main',
        is_active: true,
      },
      {
        code: 'WH-TEST-02',
        name: 'Test Warehouse Secondary',
        is_active: true,
      },
      {
        code: 'WH-TEST-03',
        name: 'Test Warehouse Distribution',
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
          console.error(
            `❌ Error inserting warehouse ${warehouse.code}:`,
            error.message
          );
        } else {
          console.log(
            `✅ Created warehouse: ${warehouse.code} - ${warehouse.name}`
          );
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
      {
        warehouse_code: 'WH-TEST-01',
        locations: [
          'WH01-A-01-01',
          'WH01-A-01-02',
          'WH01-B-01-01',
          'WH01-RECEIVING',
          'WH01-SHIPPING',
        ],
      },
      {
        warehouse_code: 'WH-TEST-02',
        locations: [
          'WH02-C-01-01',
          'WH02-C-01-02',
          'WH02-RECEIVING',
          'WH02-SHIPPING',
        ],
      },
      {
        warehouse_code: 'WH-TEST-03',
        locations: ['WH03-D-01-01', 'WH03-RECEIVING', 'WH03-SHIPPING'],
      },
    ];

    for (const { warehouse_code, locations } of locationsByWarehouse) {
      const warehouseId = warehouseIds[warehouse_code];
      if (!warehouseId) {
        console.log(
          `⚠️  Warehouse ${warehouse_code} not found, skipping locations`
        );
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
            console.error(
              `❌ Error inserting location ${locationCode}:`,
              error.message
            );
          } else {
            console.log(
              `✅ Created location: ${warehouse_code}/${locationCode}`
            );
          }
        } else {
          console.log(
            `⏭️  Location already exists: ${warehouse_code}/${locationCode}`
          );
        }
      }
    }

    // 6. Link Products to Suppliers (for PO creation tests)
    console.log('\n🔗 Linking products to suppliers...');
    const { data: suppliersList } = await supabase
      .from('suppliers')
      .select('id, name')
      .in('name', [
        'Test Supplier Alpha',
        'Test Supplier Beta',
        'Test Supplier Gamma',
      ]);

    const { data: productsList } = await supabase
      .from('products')
      .select('id, part_number')
      .in('part_number', [
        'BXS-001',
        'PKC-001',
        'CHB-001',
        'LBS-001',
        'VCS-001',
      ]);

    if (suppliersList && productsList) {
      // Link each product to a supplier
      const links = [
        { product: 'BXS-001', supplier: 'Test Supplier Alpha' },
        { product: 'PKC-001', supplier: 'Test Supplier Alpha' },
        { product: 'CHB-001', supplier: 'Test Supplier Beta' },
        { product: 'LBS-001', supplier: 'Test Supplier Beta' },
        { product: 'VCS-001', supplier: 'Test Supplier Gamma' },
      ];

      for (const link of links) {
        const product = productsList.find(p => p.part_number === link.product);
        const supplier = suppliersList.find(s => s.name === link.supplier);

        if (product && supplier) {
          // Update product with supplier_id
          const { error } = await supabase
            .from('products')
            .update({ supplier_id: supplier.id })
            .eq('id', product.id);

          if (error) {
            console.error(
              `❌ Error linking ${link.product} to ${link.supplier}:`,
              error.message
            );
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
