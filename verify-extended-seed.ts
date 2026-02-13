import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verify() {
  console.log('🔍 Verifying Extended Seed Data...\n')

  // Get org
  const { data: org } = await supabase.from('organizations').select('id').limit(1)
  const orgId = org![0].id

  // 1. Count products
  const { data: products, count: prodCount } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .eq('org_id', orgId)
  console.log(`📦 Products: ${prodCount || 0}`)
  
  // Count with barcodes
  const { data: barcodedProducts } = await supabase
    .from('products')
    .select('barcode')
    .eq('org_id', orgId)
    .not('barcode', 'is', null)
  console.log(`   - With barcodes: ${barcodedProducts?.length || 0}`)

  // 2. Count POs
  const { data: pos, count: poCount } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact' })
    .eq('org_id', orgId)
  console.log(`\n📋 Purchase Orders: ${poCount || 0}`)
  
  // Count PO lines
  const { count: lineCount } = await supabase
    .from('purchase_order_lines')
    .select('id', { count: 'exact' })
  console.log(`   - PO Lines: ${lineCount || 0}`)

  // 3. Count warehouse locations
  const { count: locCount } = await supabase
    .from('warehouse_locations')
    .select('id', { count: 'exact' })
  console.log(`\n📍 Warehouse Locations: ${locCount || 0}`)

  // 4. Count stock transfers
  const { count: transferCount } = await supabase
    .from('stock_transfers')
    .select('id', { count: 'exact' })
  console.log(`\n🔄 Stock Transfers: ${transferCount || 0}`)

  const { count: itemCount } = await supabase
    .from('stock_transfer_items')
    .select('id', { count: 'exact' })
  console.log(`   - Transfer Items: ${itemCount || 0}`)

  // 5. Count users with scanner permission
  const { data: users } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('org_id', orgId)
  console.log(`\n👥 Users in Org: ${users?.length || 0}`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Verification Complete')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

verify()
