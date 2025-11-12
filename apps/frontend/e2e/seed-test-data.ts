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

const productIdMap: Record<string, number> = {};
const supplierIdMap: Record<string, number> = {};
const warehouseIdMap: Record<string, number> = {};
const locationIdMap: Record<string, number> = {};

type BomItemSeed = {
  material: string;
  quantity: number;
  uom: string;
  is_by_product?: boolean;
  yield_percentage?: number;
  condition?: any;
};

async function ensureProduct(
  partNumber: string,
  insertData: Record<string, any>
): Promise<number> {
  const { data: existing, error } = await supabase
    .from('products')
    .select('id')
    .eq('part_number', partNumber)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch product ${partNumber}: ${error.message}`);
  }

  if (existing && existing.length > 0) {
    const id = existing[0].id;
    productIdMap[partNumber] = id;
    return id;
  }

  const payload = { part_number: partNumber, ...insertData };
  const { data: inserted, error: insertError } = await supabase
    .from('products')
    .insert(payload)
    .select('id')
    .single();

  if (insertError || !inserted) {
    throw new Error(
      `Failed to insert product ${partNumber}: ${insertError?.message}`
    );
  }

  productIdMap[partNumber] = inserted.id;
  console.log(`✅ Created product: ${partNumber}`);
  return inserted.id;
}

async function getProductId(partNumber: string): Promise<number> {
  if (productIdMap[partNumber]) {
    return productIdMap[partNumber];
  }

  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('part_number', partNumber)
    .limit(1);

  if (error || !data || data.length === 0) {
    throw new Error(`Product not found: ${partNumber}`);
  }

  productIdMap[partNumber] = data[0].id;
  return data[0].id;
}

async function ensureWarehouseSettings(options: {
  warehouseCode: string;
  defaultToReceive?: string;
  defaultPoReceive?: string;
  defaultTransit?: string;
}) {
  const warehouseId = warehouseIdMap[options.warehouseCode];
  if (!warehouseId) {
    console.warn(
      `⚠️  Warehouse ${options.warehouseCode} not found. Skipping warehouse settings.`
    );
    return;
  }

  const toLocationId = options.defaultToReceive
    ? locationIdMap[options.defaultToReceive]
    : null;
  const poLocationId = options.defaultPoReceive
    ? locationIdMap[options.defaultPoReceive]
    : null;
  const transitLocationId = options.defaultTransit
    ? locationIdMap[options.defaultTransit]
    : null;

  const { data: existing, error } = await supabase
    .from('warehouse_settings')
    .select('id')
    .eq('warehouse_id', warehouseId)
    .limit(1);

  if (error) {
    console.error(
      `❌ Failed to read warehouse settings for ${options.warehouseCode}: ${error.message}`
    );
    return;
  }

  const payload = {
    warehouse_id: warehouseId,
    default_to_receive_location_id: toLocationId,
    default_po_receive_location_id: poLocationId,
    default_transit_location_id: transitLocationId,
    notes: 'Seeded by e2e script',
  };

  if (existing && existing.length > 0) {
    await supabase
      .from('warehouse_settings')
      .update(payload)
      .eq('id', existing[0].id);
    console.log(
      `⏭️  Warehouse settings already exist for ${options.warehouseCode}`
    );
  } else {
    const { error: insertError } = await supabase
      .from('warehouse_settings')
      .insert(payload);
    if (insertError) {
      console.error(
        `❌ Failed to insert warehouse settings for ${options.warehouseCode}: ${insertError.message}`
      );
    } else {
      console.log(
        `✅ Configured warehouse settings for ${options.warehouseCode}`
      );
    }
  }
}

async function upsertBomWithItems(params: {
  productPart: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  notes?: string;
  items: BomItemSeed[];
}) {
  const productId = await getProductId(params.productPart);

  const { data: existingBom, error: bomFetchError } = await supabase
    .from('boms')
    .select('id')
    .eq('product_id', productId)
    .eq('version', params.version)
    .limit(1);

  if (bomFetchError) {
    throw new Error(
      `Failed to fetch BOM for ${params.productPart}: ${bomFetchError.message}`
    );
  }

  let bomId: number;

  if (existingBom && existingBom.length > 0) {
    bomId = existingBom[0].id;
    const { error: updateError } = await supabase
      .from('boms')
      .update({
        status: params.status,
        effective_from: params.effectiveFrom ?? null,
        effective_to: params.effectiveTo ?? null,
        notes: params.notes ?? 'Seeded by e2e script',
      })
      .eq('id', bomId);
    if (updateError) {
      throw new Error(
        `Failed to update BOM ${params.version} for ${params.productPart}: ${updateError.message}`
      );
    }
  } else {
    const { data: insertedBom, error: insertError } = await supabase
      .from('boms')
      .insert({
        product_id: productId,
        version: params.version,
        status: params.status,
        effective_from: params.effectiveFrom ?? null,
        effective_to: params.effectiveTo ?? null,
        notes: params.notes ?? 'Seeded by e2e script',
      })
      .select('id')
      .single();

    if (insertError || !insertedBom) {
      throw new Error(
        `Failed to insert BOM ${params.version} for ${params.productPart}: ${insertError?.message}`
      );
    }

    bomId = insertedBom.id;
    console.log(
      `✅ Created BOM ${params.version} for ${params.productPart} (${params.status})`
    );
  }

  // Replace BOM items
  await supabase.from('bom_items').delete().eq('bom_id', bomId);

  if (params.items.length === 0) {
    return;
  }

  const itemRows = [];
  for (let i = 0; i < params.items.length; i++) {
    const item = params.items[i];
    const materialId = await getProductId(item.material);
    itemRows.push({
      bom_id: bomId,
      material_id: materialId,
      quantity: item.quantity,
      uom: item.uom,
      sequence: i + 1,
      packages_per_box: 1,
      is_by_product: item.is_by_product ?? false,
      yield_percentage: item.yield_percentage ?? null,
      condition: item.condition ?? null,
    });
  }

  const { error: itemsError } = await supabase.from('bom_items').insert(itemRows);
  if (itemsError) {
    throw new Error(
      `Failed to insert BOM items for ${params.productPart}: ${itemsError.message}`
    );
  }
}
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
      // Ensure user has required profile fields for middleware
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          name: 'Playwright Test User',
          role: 'Admin',
          status: 'Active',
        })
        .eq('id', existingUser.id);

      if (userUpdateError) {
        console.error('❌ Failed to update test user profile:', userUpdateError.message);
      } else {
        console.log('✅ Ensured test user has Admin role and active status');
      }
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
      const { data: existing, error: supplierFetchError } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('name', supplier.name)
        .limit(1);

      if (supplierFetchError) {
        console.error(
          `❌ Error reading supplier ${supplier.name}:`,
          supplierFetchError.message
        );
        continue;
      }

      if (!existing || existing.length === 0) {
        const { data: inserted, error } = await supabase
          .from('suppliers')
          .insert(supplier)
          .select('id, name')
          .single();

        if (error || !inserted) {
          console.error(
            `❌ Error inserting supplier ${supplier.name}:`,
            error?.message
          );
        } else {
          supplierIdMap[supplier.name] = inserted.id;
          console.log(`✅ Created supplier: ${supplier.name}`);
        }
      } else {
        const supplierRow = existing[0];
        supplierIdMap[supplier.name] = supplierRow.id;
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
      const { data: existing, error: productFetchError } = await supabase
        .from('products')
        .select('id, part_number')
        .eq('part_number', product.part_number)
        .limit(1);

      if (productFetchError) {
        console.error(
          `❌ Error reading product ${product.part_number}:`,
          productFetchError.message
        );
        continue;
      }

      if (!existing || existing.length === 0) {
        const { data: inserted, error } = await supabase
          .from('products')
          .insert(product)
          .select('id, part_number')
          .single();
        if (error || !inserted) {
          console.error(
            `❌ Error inserting product ${product.part_number}:`,
            error?.message
          );
        } else {
          productIdMap[product.part_number] = inserted.id;
          console.log(
            `✅ Created product: ${product.part_number} - ${product.description}`
          );
        }
      } else {
        const row = existing[0];
        productIdMap[product.part_number] = row.id;
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

    for (const warehouse of warehouses) {
      const { data: existing, error: warehouseFetchError } = await supabase
        .from('warehouses')
        .select('id, code')
        .eq('code', warehouse.code)
        .limit(1);

      if (warehouseFetchError) {
        console.error(
          `❌ Error reading warehouse ${warehouse.code}:`,
          warehouseFetchError.message
        );
        continue;
      }

      if (!existing || existing.length === 0) {
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
          if (data) warehouseIdMap[warehouse.code] = data.id;
        }
      } else {
        console.log(`⏭️  Warehouse already exists: ${warehouse.code}`);
        warehouseIdMap[warehouse.code] = existing[0].id;
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
      const warehouseId = warehouseIdMap[warehouse_code];
      if (!warehouseId) {
        console.log(
          `⚠️  Warehouse ${warehouse_code} not found, skipping locations`
        );
        continue;
      }

      for (const locationCode of locations) {
        const { data: existing, error: locationFetchError } = await supabase
          .from('locations')
          .select('id, code')
          .eq('warehouse_id', warehouseId)
          .eq('code', locationCode)
          .limit(1);

        if (locationFetchError) {
          console.error(
            `❌ Error reading location ${locationCode}:`,
            locationFetchError.message
          );
          continue;
        }

        const mapKey = `${warehouse_code}/${locationCode}`;

        if (!existing || existing.length === 0) {
          const { data: insertedLocation, error } = await supabase
            .from('locations')
            .insert({
            warehouse_id: warehouseId,
            code: locationCode,
            name: `Test Location ${locationCode}`,
              is_active: true,
            })
            .select('id')
            .single();

          if (error || !insertedLocation) {
            console.error(
              `❌ Error inserting location ${locationCode}:`,
              error?.message
            );
          } else {
            locationIdMap[mapKey] = insertedLocation.id;
            console.log(
              `✅ Created location: ${warehouse_code}/${locationCode}`
            );
          }
        } else {
          console.log(
            `⏭️  Location already exists: ${warehouse_code}/${locationCode}`
          );
          locationIdMap[mapKey] = existing[0].id;
        }
      }
    }

    // 6. Ensure production lines exist for WO creation
    console.log('\n🏭 Seeding production lines...');
    const productionLines = [
      { code: 'LINE-TEST-01', name: 'Test Line 01', warehouse_code: 'WH-TEST-01' },
      { code: 'LINE-TEST-02', name: 'Test Line 02', warehouse_code: 'WH-TEST-02' },
    ];

    for (const line of productionLines) {
      const { data: existingLine, error: lineFetchError } = await supabase
        .from('production_lines')
        .select('id, code')
        .eq('code', line.code)
        .limit(1);

      if (lineFetchError) {
        console.error(`❌ Error reading production line ${line.code}:`, lineFetchError.message);
        continue;
      }

      if (!existingLine || existingLine.length === 0) {
        const warehouseId = warehouseIdMap[line.warehouse_code] || null;
        const { error: insertLineError } = await supabase
          .from('production_lines')
          .insert({
            code: line.code,
            name: line.name,
            warehouse_id: warehouseId,
            status: 'active',
            is_active: true,
          });

        if (insertLineError) {
          console.error(`❌ Error inserting production line ${line.code}:`, insertLineError.message);
        } else {
          console.log(`✅ Created production line: ${line.code}`);
        }
      } else {
        console.log(`⏭️  Production line already exists: ${line.code}`);
      }
    }

    // 6. Configure default warehouse settings for receiving flows
    console.log('\n⚙️ Configuring warehouse settings...');
    await ensureWarehouseSettings({
      warehouseCode: 'WH-TEST-01',
      defaultToReceive: 'WH-TEST-01/WH01-RECEIVING',
      defaultPoReceive: 'WH-TEST-01/WH01-RECEIVING',
      defaultTransit: 'WH-TEST-01/WH01-SHIPPING',
    });

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

    // ========================================================================
    // 7. Advanced Test Fixtures (BOMs, By-Products, Conditional Materials)
    // ========================================================================

    console.log('\n🥘 Seeding advanced BOM scenarios...');

    const supplierIds: Record<string, number> = {};
    (suppliersList || []).forEach((supplier) => {
      supplierIds[supplier.name] = supplier.id;
    });

    const productIdCache = new Map<string, number>();

    async function getProductId(partNumber: string): Promise<number> {
      if (productIdCache.has(partNumber)) {
        return productIdCache.get(partNumber)!;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('part_number', partNumber)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch product ${partNumber}: ${error.message}`);
      }
      if (!data) {
        throw new Error(`Product ${partNumber} not found`);
      }

      productIdCache.set(partNumber, data.id);
      return data.id;
    }

    async function ensureProduct(partNumber: string, product: {
      description: string;
      type: 'RM' | 'DG' | 'PR' | 'FG' | 'WIP';
      product_group: 'MEAT' | 'DRYGOODS' | 'COMPOSITE';
      product_type: 'RM_MEAT' | 'PR' | 'FG' | 'DG_WEB' | 'DG_LABEL' | 'DG_BOX' | 'DG_ING' | 'DG_SAUCE';
      uom: string;
      std_price?: number;
      supplier_name?: string;
      subtype?: string;
    }) {
      const { data: existing, error: existingError } = await supabase
        .from('products')
        .select('id')
        .eq('part_number', partNumber)
        .maybeSingle();

      if (existingError) {
        console.error(`❌ Failed checking product ${partNumber}:`, existingError.message);
        return existingError;
      }

      if (!existing) {
        const { data: inserted, error } = await supabase
          .from('products')
          .insert({
            part_number: partNumber,
            description: product.description,
            type: product.type,
            subtype: product.subtype || null,
            uom: product.uom,
            product_group: product.product_group,
            product_type: product.product_type,
            std_price: product.std_price ?? 0,
            supplier_id: product.supplier_name ? supplierIds[product.supplier_name] ?? null : null,
            is_active: true,
          })
          .select('id')
          .single();

        if (error) {
          console.error(`❌ Error inserting product ${partNumber}:`, error.message);
          return error;
        }

        if (inserted) {
          productIdCache.set(partNumber, inserted.id);
          console.log(`✅ Created product: ${partNumber}`);
        }
      } else {
        productIdCache.set(partNumber, existing.id);
        console.log(`⏭️  Product already exists: ${partNumber}`);
      }
    }

    async function ensureBomWithItems(params: {
      productCode: string;
      version: string;
      status: 'draft' | 'active' | 'archived';
      effectiveFrom: string;
      effectiveTo?: string | null;
      notes?: string | null;
      items: Array<{
        materialCode: string;
        quantity: number;
        uom: string;
        sequence: number;
        isByProduct?: boolean;
        yieldPercentage?: number;
        condition?: Record<string, any> | null;
      }>;
    }) {
      const productId = await getProductId(params.productCode);

      const { data: existingBom, error: existingBomError } = await supabase
        .from('boms')
        .select('id')
        .eq('product_id', productId)
        .eq('version', params.version)
        .maybeSingle();

      let bomId: number;

      if (existingBomError) {
        throw new Error(`Failed to lookup BOM for ${params.productCode} v${params.version}: ${existingBomError.message}`);
      }

      if (!existingBom) {
        const { data: insertedBom, error: insertBomError } = await supabase
          .from('boms')
          .insert({
            product_id: productId,
            version: params.version,
            status: params.status,
            effective_from: params.effectiveFrom,
            effective_to: params.effectiveTo ?? null,
            notes: params.notes ?? null,
          })
          .select('id')
          .single();

        if (insertBomError) {
          throw new Error(`Failed to insert BOM ${params.productCode} v${params.version}: ${insertBomError.message}`);
        }

        bomId = insertedBom.id;
        console.log(`✅ Created BOM ${params.productCode} v${params.version}`);
      } else {
        bomId = existingBom.id;
        const { error: updateError } = await supabase
          .from('boms')
          .update({
            status: params.status,
            effective_from: params.effectiveFrom,
            effective_to: params.effectiveTo ?? null,
            notes: params.notes ?? null,
          })
          .eq('id', bomId);

        if (updateError) {
          throw new Error(`Failed to update BOM ${params.productCode} v${params.version}: ${updateError.message}`);
        }

        console.log(`⏭️  BOM already exists: ${params.productCode} v${params.version}`);
      }

      const { error: deleteItemsError } = await supabase
        .from('bom_items')
        .delete()
        .eq('bom_id', bomId);

      if (deleteItemsError) {
        throw new Error(`Failed cleaning BOM items for ${params.productCode} v${params.version}: ${deleteItemsError.message}`);
      }

      const itemsPayload = [];
      for (const item of params.items) {
        const materialId = await getProductId(item.materialCode);
        itemsPayload.push({
          bom_id: bomId,
          material_id: materialId,
          uom: item.uom,
          quantity: item.quantity,
          sequence: item.sequence,
          priority: item.sequence,
          is_by_product: item.isByProduct ?? false,
          yield_percentage: item.isByProduct ? item.yieldPercentage ?? null : null,
          condition: item.condition ?? null,
        });
      }

      if (itemsPayload.length > 0) {
        const { error: insertItemsError } = await supabase
          .from('bom_items')
          .insert(itemsPayload);

        if (insertItemsError) {
          throw new Error(`Failed inserting BOM items for ${params.productCode} v${params.version}: ${insertItemsError.message}`);
        }
      }
    }

    // Ensure additional products exist
    await ensureProduct('TEST-RIBEYE-001', {
      description: 'Test Ribeye Steak',
      type: 'FG',
      product_group: 'COMPOSITE',
      product_type: 'FG',
      uom: 'KG',
      std_price: 45,
      supplier_name: 'Test Supplier Alpha',
    });

    await ensureProduct('BONES-BYPRODUCT', {
      description: 'Bones By-Product',
      type: 'RM',
      product_group: 'MEAT',
      product_type: 'RM_MEAT',
      uom: 'KG',
      std_price: 5,
      supplier_name: 'Test Supplier Beta',
    });

    await ensureProduct('TRIM-BYPRODUCT', {
      description: 'Trim By-Product',
      type: 'RM',
      product_group: 'MEAT',
      product_type: 'RM_MEAT',
      uom: 'KG',
      std_price: 6,
      supplier_name: 'Test Supplier Beta',
    });

    await ensureProduct('BASE-ING-001', {
      description: 'Base Ingredient',
      type: 'RM',
      product_group: 'DRYGOODS',
      product_type: 'DG_ING',
      uom: 'KG',
      std_price: 2,
      supplier_name: 'Test Supplier Gamma',
    });

    await ensureProduct('ORG-SALT-001', {
      description: 'Organic Salt',
      type: 'DG',
      product_group: 'DRYGOODS',
      product_type: 'DG_ING',
      uom: 'KG',
      std_price: 1.5,
      supplier_name: 'Test Supplier Gamma',
    });

    await ensureProduct('STD-SALT-001', {
      description: 'Standard Salt',
      type: 'DG',
      product_group: 'DRYGOODS',
      product_type: 'DG_ING',
      uom: 'KG',
      std_price: 1.2,
      supplier_name: 'Test Supplier Gamma',
    });

    await ensureProduct('GLUTEN-FLOUR-001', {
      description: 'Gluten-Free Flour',
      type: 'DG',
      product_group: 'DRYGOODS',
      product_type: 'DG_ING',
      uom: 'KG',
      std_price: 3.5,
      supplier_name: 'Test Supplier Alpha',
    });

    await ensureProduct('PREMIUM-ING-001', {
      description: 'Premium Ingredient',
      type: 'DG',
      product_group: 'DRYGOODS',
      product_type: 'DG_ING',
      uom: 'KG',
      std_price: 6,
      supplier_name: 'Test Supplier Gamma',
    });

    await ensureProduct('TEST-COND-001', {
      description: 'Conditional Materials Product',
      type: 'FG',
      product_group: 'COMPOSITE',
      product_type: 'FG',
      uom: 'KG',
      std_price: 50,
      supplier_name: 'Test Supplier Alpha',
    });

    await ensureProduct('TEST-MULTI-FLAG', {
      description: 'Multi-Flag Product',
      type: 'FG',
      product_group: 'COMPOSITE',
      product_type: 'FG',
      uom: 'KG',
      std_price: 55,
      supplier_name: 'Test Supplier Alpha',
    });

    await ensureProduct('TEST-VERSIONED-001', {
      description: 'Versioned Product',
      type: 'FG',
      product_group: 'COMPOSITE',
      product_type: 'FG',
      uom: 'KG',
      std_price: 60,
      supplier_name: 'Test Supplier Alpha',
    });

    const now = new Date();
    const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const future30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await ensureBomWithItems({
      productCode: 'TEST-RIBEYE-001',
      version: '1.0',
      status: 'active',
      effectiveFrom: past30,
      items: [
        { materialCode: 'BXS-001', quantity: 1, uom: 'KG', sequence: 1 },
        {
          materialCode: 'BONES-BYPRODUCT',
          quantity: 1,
          uom: 'KG',
          sequence: 2,
          isByProduct: true,
          yieldPercentage: 15,
        },
        {
          materialCode: 'TRIM-BYPRODUCT',
          quantity: 1,
          uom: 'KG',
          sequence: 3,
          isByProduct: true,
          yieldPercentage: 10,
        },
      ],
    });

    await ensureBomWithItems({
      productCode: 'TEST-COND-001',
      version: '1.0',
      status: 'active',
      effectiveFrom: past30,
      items: [
        { materialCode: 'BASE-ING-001', quantity: 100, uom: 'KG', sequence: 1 },
        {
          materialCode: 'ORG-SALT-001',
          quantity: 5,
          uom: 'KG',
          sequence: 2,
          condition: {
            type: 'OR',
            rules: [{ field: 'order_flags', operator: 'contains', value: 'organic' }],
          },
        },
        {
          materialCode: 'STD-SALT-001',
          quantity: 5,
          uom: 'KG',
          sequence: 3,
          condition: {
            type: 'AND',
            rules: [{ field: 'order_flags', operator: 'not_contains', value: 'organic' }],
          },
        },
        {
          materialCode: 'GLUTEN-FLOUR-001',
          quantity: 50,
          uom: 'KG',
          sequence: 4,
          condition: {
            type: 'OR',
            rules: [{ field: 'order_flags', operator: 'contains', value: 'gluten_free' }],
          },
        },
      ],
    });

    await ensureBomWithItems({
      productCode: 'TEST-MULTI-FLAG',
      version: '1.0',
      status: 'active',
      effectiveFrom: past30,
      items: [
        { materialCode: 'BASE-ING-001', quantity: 100, uom: 'KG', sequence: 1 },
        {
          materialCode: 'PREMIUM-ING-001',
          quantity: 10,
          uom: 'KG',
          sequence: 2,
          condition: {
            type: 'AND',
            rules: [
              { field: 'order_flags', operator: 'contains', value: 'organic' },
              { field: 'order_flags', operator: 'contains', value: 'gluten_free' },
            ],
          },
        },
      ],
    });

    await ensureBomWithItems({
      productCode: 'TEST-VERSIONED-001',
      version: '1.0',
      status: 'active',
      effectiveFrom: past30,
      items: [
        { materialCode: 'BASE-ING-001', quantity: 20, uom: 'KG', sequence: 1 },
      ],
    });

    await ensureBomWithItems({
      productCode: 'TEST-VERSIONED-001',
      version: '2.0',
      status: 'draft',
      effectiveFrom: future30,
      items: [
        { materialCode: 'BASE-ING-001', quantity: 18, uom: 'KG', sequence: 1 },
        { materialCode: 'PREMIUM-ING-001', quantity: 2, uom: 'KG', sequence: 2 },
      ],
    });

    console.log('✅ Advanced BOM fixtures seeded');

    // Seed sample license plates for warehouse/LP tests
    console.log('\n📦 Seeding sample license plates...');
    const sampleLicensePlates = [
      {
        lp_number: 'LP-TEST-001',
        product_part: 'BXS-001',
        quantity: 50,
        uom: 'KG',
        location_key: 'WH-TEST-01/WH01-A-01-01',
        qa_status: 'pending',
        status: 'available',
      },
      {
        lp_number: 'LP-TEST-002',
        product_part: 'BXS-001',
        quantity: 40,
        uom: 'KG',
        location_key: 'WH-TEST-01/WH01-B-01-01',
        qa_status: 'passed',
        status: 'available',
      },
      {
        lp_number: 'LP-TEST-003',
        product_part: 'PKC-001',
        quantity: 30,
        uom: 'KG',
        location_key: 'WH-TEST-02/WH02-C-01-01',
        qa_status: 'pending',
        status: 'available',
      },
    ];

    for (const lp of sampleLicensePlates) {
      const { data: existingLp, error: lpFetchError } = await supabase
        .from('license_plates')
        .select('id')
        .eq('lp_number', lp.lp_number)
        .limit(1);

      if (lpFetchError) {
        console.error(`❌ Error reading license plate ${lp.lp_number}:`, lpFetchError.message);
        continue;
      }

      if (!existingLp || existingLp.length === 0) {
        try {
          const productId = await getProductId(lp.product_part);
          const locationId = locationIdMap[lp.location_key] ?? null;
          const { error: insertError } = await supabase.from('license_plates').insert({
            lp_number: lp.lp_number,
            product_id: productId,
            quantity: lp.quantity,
            uom: lp.uom,
            location_id: locationId,
            qa_status: lp.qa_status,
            status: lp.status,
            lp_type: 'FG',
            origin_type: 'seed-script',
            origin_ref: { source: 'e2e-seed' },
          });

          if (insertError) {
            console.error(`❌ Error inserting license plate ${lp.lp_number}:`, insertError.message);
          } else {
            console.log(`✅ Created license plate: ${lp.lp_number}`);
          }
        } catch (err: any) {
          console.error(`❌ Failed to seed license plate ${lp.lp_number}:`, err.message);
        }
      } else {
        console.log(`⏭️  License plate already exists: ${lp.lp_number}`);
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
