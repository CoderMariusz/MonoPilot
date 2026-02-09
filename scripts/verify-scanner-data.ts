#!/usr/bin/env ts-node
/**
 * Verification Script for Scanner Test Data
 * Checks if POs and line items were created correctly
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
  console.log('🔍 Verifying Scanner Test Data...\n')

  try {
    // 1. Check POs
    console.log('1️⃣  Checking Purchase Orders...')
    const { data: pos, error: posError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status')
      .like('po_number', 'PO-2025-%')

    if (posError) throw posError

    if (!pos || pos.length === 0) {
      console.warn('   ⚠️  No test POs found!')
    } else {
      console.log(`   ✅ Found ${pos.length} test POs:`)
      pos.forEach(po => {
        console.log(`      - ${po.po_number} (${po.status})`)
      })
    }
    console.log()

    // 2. Check PO Lines
    console.log('2️⃣  Checking PO Lines...')
    const { data: allLines, error: linesError } = await supabase
      .from('purchase_order_lines')
      .select('id, po_id, quantity, received_qty, uom')

    if (linesError) throw linesError

    if (!allLines || allLines.length === 0) {
      console.warn('   ⚠️  No PO lines found!')
    } else {
      console.log(`   ✅ Found ${allLines.length} total PO lines`)
    }
    console.log()

    // 3. Check each PO with its lines
    console.log('3️⃣  Checking PO + Lines Association...')
    for (const po of pos) {
      const { data: lines, error: lineError } = await supabase
        .from('purchase_order_lines')
        .select('id, product_id, quantity, uom, received_qty')
        .eq('po_id', po.id)

      if (lineError) {
        console.warn(`   ❌ Error fetching lines for ${po.po_number}: ${lineError.message}`)
        continue
      }

      if (!lines || lines.length === 0) {
        console.warn(`   ⚠️  PO ${po.po_number} has NO LINES!`)
      } else {
        console.log(`   ✅ ${po.po_number}: ${lines.length} lines`)
        lines.forEach((line, idx) => {
          console.log(`      Line ${idx + 1}: ${line.quantity} ${line.uom} (received: ${line.received_qty})`)
        })
      }
    }
    console.log()

    // 4. Test the lookup endpoint logic
    console.log('4️⃣  Testing PO Lookup Logic...')
    for (const po of pos) {
      const { data: looked, error: lookError } = await supabase
        .from('purchase_orders')
        .select('*')
        .or(`po_number.eq.${po.po_number},id.eq.${po.id}`)
        .single()

      if (lookError) {
        console.warn(`   ❌ Failed to lookup ${po.po_number}: ${lookError.message}`)
        continue
      }

      if (!looked) {
        console.warn(`   ❌ PO ${po.po_number} not found via lookup!`)
      } else {
        console.log(`   ✅ Successfully looked up: ${looked.po_number}`)
      }
    }

    console.log()
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ VERIFICATION COMPLETE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  }
}

verify()
