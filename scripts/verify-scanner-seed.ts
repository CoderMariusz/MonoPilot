#!/usr/bin/env ts-node
/**
 * Verification Script for MY Scanner Test Data (PO-2025-00001, PO-2025-00002)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verify() {
  console.log('🔍 Verifying Seeded Scanner Data (PO-2025-00001, PO-2025-00002)...\n')

  try {
    // Check PO-2025-00001
    console.log('Checking PO-2025-00001...')
    const { data: po1, error: po1Error } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status, supplier_id, warehouse_id')
      .eq('po_number', 'PO-2025-00001')
      .single()

    if (po1Error) {
      console.error('   ❌ Error:', po1Error.message)
    } else if (po1) {
      console.log('   ✅ PO found:', po1.po_number, `(${po1.status})`)
      console.log(`      ID: ${po1.id}`)

      // Get lines for this PO
      const { data: lines1, error: linesError1 } = await supabase
        .from('purchase_order_lines')
        .select('id, product_id, quantity, uom, received_qty, line_number')
        .eq('po_id', po1.id)

      if (linesError1) {
        console.error('   ❌ Error fetching lines:', linesError1.message)
      } else if (!lines1 || lines1.length === 0) {
        console.error('   ❌ NO LINES FOUND FOR THIS PO!')
      } else {
        console.log(`   ✅ Found ${lines1.length} lines:`)
        lines1.forEach(line => {
          console.log(`      Line ${line.line_number}: ${line.quantity} ${line.uom} (received: ${line.received_qty})`)
        })
      }
    } else {
      console.error('   ❌ PO-2025-00001 NOT FOUND')
    }

    console.log()

    // Check PO-2025-00002
    console.log('Checking PO-2025-00002...')
    const { data: po2Data, error: po2ListError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status')
      .eq('po_number', 'PO-2025-00002')

    if (po2ListError) {
      console.error('   ❌ Error:', po2ListError.message)
    } else if (!po2Data || po2Data.length === 0) {
      console.error('   ❌ PO-2025-00002 NOT FOUND')
    } else if (po2Data.length > 1) {
      console.warn(`   ⚠️  Multiple PO-2025-00002 entries found (${po2Data.length})!`)
      po2Data.forEach(po => {
        console.log(`      - ID: ${po.id}, Status: ${po.status}`)
      })

      // Try the confirmed one
      const confirmedPO = po2Data.find(p => p.status === 'confirmed')
      if (confirmedPO) {
        console.log(`\n   Using confirmed version: ${confirmedPO.id}`)

        const { data: lines2, error: linesError2 } = await supabase
          .from('purchase_order_lines')
          .select('id, product_id, quantity, uom, received_qty, line_number')
          .eq('po_id', confirmedPO.id)

        if (linesError2) {
          console.error('   ❌ Error fetching lines:', linesError2.message)
        } else if (!lines2 || lines2.length === 0) {
          console.error('   ❌ NO LINES FOUND FOR THIS PO!')
        } else {
          console.log(`   ✅ Found ${lines2.length} lines:`)
          lines2.forEach(line => {
            console.log(`      Line ${line.line_number}: ${line.quantity} ${line.uom} (received: ${line.received_qty})`)
          })
        }
      }
    } else {
      const po2 = po2Data[0]
      console.log('   ✅ PO found:', po2.po_number, `(${po2.status})`)
      console.log(`      ID: ${po2.id}`)

      // Get lines for this PO
      const { data: lines2, error: linesError2 } = await supabase
        .from('purchase_order_lines')
        .select('id, product_id, quantity, uom, received_qty, line_number')
        .eq('po_id', po2.id)

      if (linesError2) {
        console.error('   ❌ Error fetching lines:', linesError2.message)
      } else if (!lines2 || lines2.length === 0) {
        console.error('   ❌ NO LINES FOUND FOR THIS PO!')
      } else {
        console.log(`   ✅ Found ${lines2.length} lines:`)
        lines2.forEach(line => {
          console.log(`      Line ${line.line_number}: ${line.quantity} ${line.uom} (received: ${line.received_qty})`)
        })
      }
    }

    console.log()
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ SEED VERIFICATION COMPLETE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  }
}

verify()
