#!/usr/bin/env ts-node
/**
 * Seed Script for Scanner Receive Testing (BUG-SC-002)
 * Creates test POs with line items for testing /scanner/receive functionality
 *
 * Usage:
 *   npm run seed:scanner-test
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed() {
  console.log('🌱 Seeding Scanner Test Data...\n')

  try {
    // 1. Get first organization
    console.log('1️⃣  Getting organization...')
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)

    if (!orgs || orgs.length === 0) {
      throw new Error('No organization found in database')
    }

    const orgId = orgs[0].id
    console.log(`   ✅ Using org: ${orgId}\n`)

    // 2. Get first user
    console.log('2️⃣  Getting user...')
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (!users || users.length === 0) {
      throw new Error('No user found in database')
    }

    const userId = users[0].id
    console.log(`   ✅ Using user: ${userId}\n`)

    // 3. Get or create supplier
    console.log('3️⃣  Setting up supplier...')
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', 'TEST-SUPP-001')
      .single()

    let supplierId: string
    if (existingSupplier) {
      supplierId = existingSupplier.id
      console.log(`   ℹ️  Using existing supplier: ${supplierId}`)
    } else {
      const { data: newSupplier, error: suppError } = await supabase
        .from('suppliers')
        .insert([
          {
            org_id: orgId,
            code: 'TEST-SUPP-001',
            name: 'Test Supplier SC',
            contact_email: 'test@supplier.com',
            contact_phone: '+1-555-0001',
            address: '123 Test Street, Test City',
            payment_terms: 'Net 30',
            is_active: true,
            created_by: userId
          }
        ])
        .select()
        .single()

      if (suppError || !newSupplier) {
        throw new Error(`Failed to create supplier: ${suppError?.message}`)
      }

      supplierId = newSupplier.id
      console.log(`   ✅ Created supplier: ${supplierId}`)
    }
    console.log()

    // 4. Get or create warehouse
    console.log('4️⃣  Setting up warehouse...')
    const { data: existingWh } = await supabase
      .from('warehouses')
      .select('id')
      .eq('org_id', orgId)
      .limit(1)

    let warehouseId: string
    if (existingWh && existingWh.length > 0) {
      warehouseId = existingWh[0].id
      console.log(`   ℹ️  Using existing warehouse: ${warehouseId}`)
    } else {
      const { data: newWh, error: whError } = await supabase
        .from('warehouses')
        .insert([
          {
            org_id: orgId,
            code: 'TEST-WH-01',
            name: 'Test Warehouse',
            type: 'FINISHED_GOODS',
            is_active: true,
            created_by: userId
          }
        ])
        .select()
        .single()

      if (whError || !newWh) {
        throw new Error(`Failed to create warehouse: ${whError?.message}`)
      }

      warehouseId = newWh.id
      console.log(`   ✅ Created warehouse: ${warehouseId}`)
    }
    console.log()

    // 5. Get or create products
    console.log('5️⃣  Setting up products...')
    const productCodes = ['TEST-PROD-001', 'TEST-PROD-002', 'TEST-PROD-003']
    const products: any[] = []

    // Get product type
    const { data: productTypes } = await supabase
      .from('product_types')
      .select('id')
      .eq('org_id', orgId)
      .limit(1)

    if (!productTypes || productTypes.length === 0) {
      throw new Error('No product type found. Run migrations first.')
    }

    const productTypeId = productTypes[0].id

    for (const code of productCodes) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', code)
        .single()

      if (existing) {
        products.push(existing)
        console.log(`   ℹ️  Using existing product: ${code}`)
      } else {
        const { data: newProd, error: prodError } = await supabase
          .from('products')
          .insert([
            {
              org_id: orgId,
              code,
              name: `Test Product ${code}`,
              product_type_id: productTypeId,
              base_uom: 'KG',
              shelf_life_days: 365,
              status: 'active',
              created_by: userId
            }
          ])
          .select()
          .single()

        if (prodError || !newProd) {
          console.warn(`   ⚠️  Failed to create product ${code}: ${prodError?.message}`)
          continue
        }

        products.push(newProd)
        console.log(`   ✅ Created product: ${code}`)
      }
    }
    console.log()

    // 6. Create test POs with lines
    console.log('6️⃣  Creating test Purchase Orders...')
    const poNumbers = ['PO-2025-00001', 'PO-2025-00002']

    for (let poIndex = 0; poIndex < poNumbers.length; poIndex++) {
      const poNumber = poNumbers[poIndex]

      // Check if PO exists
      const { data: existingPO } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('org_id', orgId)
        .eq('po_number', poNumber)
        .single()

      if (existingPO) {
        console.log(`   ℹ️  PO already exists: ${poNumber}`)
        continue
      }

      // Create PO
      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert([
          {
            org_id: orgId,
            po_number: poNumber,
            supplier_id: supplierId,
            currency: 'PLN',
            expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            warehouse_id: warehouseId,
            status: 'confirmed', // Set to 'confirmed' so it appears in pending receipts
            payment_terms: 'Net 30',
            created_by: userId
          }
        ])
        .select()
        .single()

      if (poError || !newPO) {
        console.warn(`   ⚠️  Failed to create PO ${poNumber}: ${poError?.message}`)
        continue
      }

      console.log(`   ✅ Created PO: ${poNumber}`)

      // Create PO lines for this PO
      for (let lineIndex = 0; lineIndex < products.length; lineIndex++) {
        const product = products[lineIndex]
        const quantity = 100 + lineIndex * 50
        const unitPrice = 50 + lineIndex * 10

        const { error: lineError } = await supabase
          .from('purchase_order_lines')
          .insert([
            {
              po_id: newPO.id,
              product_id: product.id,
              quantity,
              uom: 'KG',
              unit_price: unitPrice,
              received_qty: 0,
              line_number: lineIndex + 1
            }
          ])

        if (lineError) {
          console.warn(`   ⚠️  Failed to create PO line: ${lineError.message}`)
        } else {
          console.log(`      ✓ Line ${lineIndex + 1}: ${quantity} KG @ ${unitPrice} PLN`)
        }
      }
    }
    console.log()

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ SCANNER TEST DATA SEED COMPLETED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 Summary:')
    console.log(`   Organization: ${orgId}`)
    console.log(`   Supplier: TEST-SUPP-001`)
    console.log(`   Warehouse: TEST-WH-01`)
    console.log(`   Products: ${products.length}`)
    console.log(`   POs Created: 2`)
    console.log(`   Lines per PO: ${products.length}`)
    console.log('\n🎯 Test the Scanner at: http://localhost:3000/scanner/receive')
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
