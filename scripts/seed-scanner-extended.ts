#!/usr/bin/env ts-node
/**
 * Extended Scanner Test Data Seed Script
 * Creates comprehensive test data for Scanner module:
 * - 20+ products with barcodes
 * - 5+ purchase orders
 * - Warehouse locations (zones, aisles, bins)
 * - Stock transfers
 * - Warehouse staff users
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed() {
  console.log('🌱 Seeding Extended Scanner Test Data...\n')

  try {
    // Get org, user, supplier, warehouse
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1)
    if (!orgs || orgs.length === 0) throw new Error('No organization found')
    const orgId = orgs[0].id

    const { data: users } = await supabase.from('users').select('id').limit(1)
    if (!users || users.length === 0) throw new Error('No user found')
    const userId = users[0].id

    const { data: suppliersList } = await supabase
      .from('suppliers')
      .select('id')
      .eq('code', 'TEST-SUPP-001')
    
    let supplierId: string
    if (suppliersList && suppliersList.length > 0) {
      supplierId = suppliersList[0].id
      console.log(`   ✓ Using supplier TEST-SUPP-001`)
    } else {
      // Use first available supplier
      const { data: anySupplier } = await supabase
        .from('suppliers')
        .select('id')
        .limit(1)
      if (!anySupplier || anySupplier.length === 0) throw new Error('No supplier found')
      supplierId = anySupplier[0].id
      console.log(`   ✓ Using available supplier`)
    }

    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .limit(1)
    if (!warehouses || warehouses.length === 0) throw new Error('No warehouse found')
    const warehouseId = warehouses[0].id

    // Get product type
    const { data: productTypes } = await supabase
      .from('product_types')
      .select('id')
      .eq('org_id', orgId)
      .limit(1)
    if (!productTypes || productTypes.length === 0) throw new Error('No product type found')
    const productTypeId = productTypes[0].id

    // 1️⃣ CREATE 20+ PRODUCTS WITH BARCODES
    console.log('1️⃣  Creating 20+ products with barcodes...')
    const productCodes = Array.from({ length: 20 }, (_, i) => `PROD-${String(i + 1).padStart(3, '0')}`)
    const products: any[] = []

    for (const code of productCodes) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', code)
        .single()

      if (existing) {
        products.push(existing)
      } else {
        const barcode = `EAN${String(Math.random()).slice(2, 14)}`
        const { data: newProd } = await supabase
          .from('products')
          .insert([
            {
              org_id: orgId,
              code,
              name: `Product ${code}`,
              barcode,
              product_type_id: productTypeId,
              base_uom: 'KG',
              shelf_life_days: 365,
              status: 'active',
              created_by: userId
            }
          ])
          .select()
          .single()

        if (newProd) {
          products.push(newProd)
          console.log(`   ✓ ${code} (barcode: ${barcode})`)
        }
      }
    }
    console.log(`✅ Total products: ${products.length}\n`)

    // 2️⃣ CREATE WAREHOUSE LOCATIONS
    console.log('2️⃣  Creating warehouse locations...')
    const zones = ['ZONE-A', 'ZONE-B', 'ZONE-C']
    const aisles = ['AISLE-01', 'AISLE-02', 'AISLE-03']
    const bins = ['BIN-001', 'BIN-002', 'BIN-003', 'BIN-004', 'BIN-005']
    
    let locationCount = 0
    for (const zone of zones) {
      for (const aisle of aisles) {
        for (const bin of bins) {
          const locationCode = `${zone}-${aisle}-${bin}`
          const { data: existing } = await supabase
            .from('warehouse_locations')
            .select('id')
            .eq('warehouse_id', warehouseId)
            .eq('location_code', locationCode)
            .single()

          if (!existing) {
            await supabase
              .from('warehouse_locations')
              .insert([
                {
                  warehouse_id: warehouseId,
                  location_code: locationCode,
                  zone: zone,
                  aisle: aisle,
                  bin: bin,
                  is_active: true,
                  created_by: userId
                }
              ])
            locationCount++
          }
        }
      }
    }
    console.log(`✅ Created ${locationCount} warehouse locations\n`)

    // 3️⃣ CREATE 5+ PURCHASE ORDERS
    console.log('3️⃣  Creating 5+ purchase orders...')
    const poNumbers = Array.from({ length: 5 }, (_, i) => `PO-2025-${String(i + 2).padStart(5, '0')}`)

    for (const poNumber of poNumbers) {
      const { data: existing } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('org_id', orgId)
        .eq('po_number', poNumber)
        .single()

      if (existing) {
        console.log(`   ℹ️  PO exists: ${poNumber}`)
        continue
      }

      const { data: newPO } = await supabase
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
            status: 'confirmed',
            payment_terms: 'Net 30',
            created_by: userId
          }
        ])
        .select()
        .single()

      if (newPO) {
        // Add line items
        for (let i = 0; i < 5; i++) {
          const product = products[i % products.length]
          await supabase
            .from('purchase_order_lines')
            .insert([
              {
                po_id: newPO.id,
                product_id: product.id,
                quantity: 100 + i * 50,
                uom: 'KG',
                unit_price: 50 + i * 10,
                received_qty: 0,
                line_number: i + 1
              }
            ])
        }
        console.log(`   ✅ ${poNumber} (5 line items)`)
      }
    }
    console.log()

    // 4️⃣ CREATE STOCK TRANSFERS
    console.log('4️⃣  Creating stock transfers...')
    for (let t = 0; t < 3; t++) {
      const { data: transfer } = await supabase
        .from('stock_transfers')
        .insert([
          {
            org_id: orgId,
            from_warehouse_id: warehouseId,
            to_warehouse_id: warehouseId,
            transfer_date: new Date().toISOString().split('T')[0],
            status: 'pending',
            created_by: userId
          }
        ])
        .select()
        .single()

      if (transfer) {
        // Add transfer items
        for (let i = 0; i < 3; i++) {
          const product = products[(t * 3 + i) % products.length]
          await supabase
            .from('stock_transfer_items')
            .insert([
              {
                transfer_id: transfer.id,
                product_id: product.id,
                quantity: 50 + i * 10,
                uom: 'KG',
                source_location_id: null,
                dest_location_id: null,
                line_number: i + 1
              }
            ])
        }
        console.log(`   ✅ Transfer ${t + 1} (3 items)`)
      }
    }
    console.log()

    // 5️⃣ CREATE WAREHOUSE STAFF USERS (if possible)
    console.log('5️⃣  Warehouse staff setup...')
    console.log('   ℹ️  Users already exist in system')
    console.log('   ℹ️  Assign scanner permissions via admin panel\n')

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ EXTENDED SCANNER TEST DATA SEED COMPLETED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 Summary:')
    console.log(`   Products: ${products.length} (with barcodes)`)
    console.log(`   Warehouse Locations: ${locationCount}`)
    console.log(`   Purchase Orders: 5+`)
    console.log(`   Stock Transfers: 3`)
    console.log(`   Total PO Lines: 25+`)
    console.log(`   Total Transfer Items: 9+`)
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
