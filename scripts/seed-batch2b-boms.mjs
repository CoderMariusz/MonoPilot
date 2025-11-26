/**
 * Seed script for Epic 2 Batch 2B - BOM System
 * Stories: 2.6, 2.7, 2.12, 2.13
 *
 * This script seeds:
 * 1. 2 sample BOMs (for White Bread and Whole Wheat Bread)
 * 2. BOM items with quantities, scrap percentages, and conditional logic
 * 3. By-products (bread waste)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from apps/frontend/.env.local
const envPath = resolve(__dirname, '../apps/frontend/.env.local')
let envVars = {}

try {
  console.log(`📂 Reading env file from: ${envPath}`)
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      return
    }
    const match = trimmedLine.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      envVars[key] = value
      console.log(`  ✓ ${key}=${value.substring(0, 20)}...`)
    }
  })
} catch (error) {
  console.error('❌ Could not read apps/frontend/.env.local')
  console.error('Make sure the file exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error(`Attempted path: ${envPath}`)
  console.error(`Error: ${error.message}`)
  process.exit(1)
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedBOMs(orgId, userId) {
  console.log('  📋 Seeding BOMs...')

  // Get finished goods products
  const { data: products } = await supabase
    .from('products')
    .select('id, code, type')
    .eq('org_id', orgId)
    .in('type', ['FG'])

  if (!products || products.length < 2) {
    console.log('    ⚠️  Not enough finished goods products found, skipping BOM seeding...')
    return null
  }

  const whiteBread = products.find(p => p.code === 'BREAD-001')
  const wheatBread = products.find(p => p.code === 'BREAD-002')

  const boms = []

  // BOM 1: White Bread
  if (whiteBread) {
    const { data: bom, error } = await supabase
      .from('boms')
      .insert({
        org_id: orgId,
        product_id: whiteBread.id,
        version: '1.0',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: null,
        status: 'active',
        output_qty: 1.0,
        output_uom: 'unit',
        notes: 'Standard recipe for white bread 500g',
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('    ❌ Failed to seed BOM for BREAD-001:', error.message)
    } else {
      console.log('    ✅ Seeded BOM: White Bread 1.0')
      boms.push({ bom: bom, productCode: 'BREAD-001' })
    }
  }

  // BOM 2: Whole Wheat Bread
  if (wheatBread) {
    const { data: bom, error } = await supabase
      .from('boms')
      .insert({
        org_id: orgId,
        product_id: wheatBread.id,
        version: '1.0',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: null,
        status: 'active',
        output_qty: 1.0,
        output_uom: 'unit',
        notes: 'Premium recipe for whole wheat bread 500g with additional nutrients',
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('    ❌ Failed to seed BOM for BREAD-002:', error.message)
    } else {
      console.log('    ✅ Seeded BOM: Whole Wheat Bread 1.0')
      boms.push({ bom: bom, productCode: 'BREAD-002' })
    }
  }

  return boms
}

async function seedBOMItems(orgId, boms) {
  console.log('  📦 Seeding BOM Items...')

  if (!boms || boms.length === 0) {
    console.log('    ⚠️  No BOMs found, skipping BOM items seeding...')
    return
  }

  // Get ingredient products
  const { data: products } = await supabase
    .from('products')
    .select('id, code')
    .eq('org_id', orgId)

  if (!products) {
    console.log('    ⚠️  No products found, skipping BOM items seeding...')
    return
  }

  const flour = products.find(p => p.code === 'FLOUR-001')
  const sugar = products.find(p => p.code === 'SUGAR-001')
  const yeast = products.find(p => p.code === 'YEAST-001')
  const milk = products.find(p => p.code === 'MILK-001')
  const bag = products.find(p => p.code === 'BAG-001')

  // BOM Items for White Bread (BREAD-001)
  if (boms[0]?.productCode === 'BREAD-001' && flour && sugar && yeast && milk && bag) {
    const whiteBreadItems = [
      {
        bom_id: boms[0].bom.id,
        product_id: flour.id,
        quantity: 0.35,
        uom: 'kg',
        scrap_percent: 2,
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Type 550 wheat flour, main ingredient'
      },
      {
        bom_id: boms[0].bom.id,
        product_id: yeast.id,
        quantity: 0.005,
        uom: 'kg',
        scrap_percent: 0,
        sequence: 2,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Baker\'s yeast for fermentation'
      },
      {
        bom_id: boms[0].bom.id,
        product_id: sugar.id,
        quantity: 0.01,
        uom: 'kg',
        scrap_percent: 0,
        sequence: 3,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Sugar to activate yeast and add flavor'
      },
      {
        bom_id: boms[0].bom.id,
        product_id: milk.id,
        quantity: 0.08,
        uom: 'L',
        scrap_percent: 0,
        sequence: 4,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Whole milk for soft crumb texture'
      },
      {
        bom_id: boms[0].bom.id,
        product_id: bag.id,
        quantity: 1,
        uom: 'unit',
        scrap_percent: 0,
        sequence: 5,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Plastic bag for final packaging'
      }
    ]

    for (const item of whiteBreadItems) {
      const { error } = await supabase
        .from('bom_items')
        .insert(item)

      if (error) {
        console.error(`    ❌ Failed to seed BOM item for BREAD-001:`, error.message)
      } else {
        console.log(`    ✅ Seeded BOM item: ${item.sequence} (${item.quantity} ${item.uom})`)
      }
    }
  }

  // BOM Items for Whole Wheat Bread (BREAD-002)
  if (boms[1]?.productCode === 'BREAD-002' && products.length > 0) {
    const wheatFlour = products.find(p => p.code === 'FLOUR-001') // Could use different flour in real scenario
    const wheatItems = [
      {
        bom_id: boms[1].bom.id,
        product_id: wheatFlour?.id || flour?.id,
        quantity: 0.40,
        uom: 'kg',
        scrap_percent: 3,
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Whole wheat flour blend'
      },
      {
        bom_id: boms[1].bom.id,
        product_id: yeast.id,
        quantity: 0.006,
        uom: 'kg',
        scrap_percent: 0,
        sequence: 2,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Slightly more yeast for whole wheat fermentation'
      },
      {
        bom_id: boms[1].bom.id,
        product_id: sugar.id,
        quantity: 0.015,
        uom: 'kg',
        scrap_percent: 0,
        sequence: 3,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Extra sugar for whole wheat balance'
      },
      {
        bom_id: boms[1].bom.id,
        product_id: milk.id,
        quantity: 0.10,
        uom: 'L',
        scrap_percent: 0,
        sequence: 4,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'More milk for texture and nutrition'
      },
      {
        bom_id: boms[1].bom.id,
        product_id: bag.id,
        quantity: 1,
        uom: 'unit',
        scrap_percent: 0,
        sequence: 5,
        consume_whole_lp: false,
        is_by_product: false,
        notes: 'Plastic bag for final packaging'
      }
    ]

    for (const item of wheatItems) {
      const { error } = await supabase
        .from('bom_items')
        .insert(item)

      if (error) {
        console.error(`    ❌ Failed to seed BOM item for BREAD-002:`, error.message)
      } else {
        console.log(`    ✅ Seeded BOM item: ${item.sequence} (${item.quantity} ${item.uom})`)
      }
    }
  }
}

async function main() {
  console.log('🌱 Seeding Batch 2B - BOMs + BOM Items...\n')

  // Get all organizations
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, company_name')

  if (orgError || !orgs || orgs.length === 0) {
    console.error('❌ No organizations found')
    process.exit(1)
  }

  console.log(`Found ${orgs.length} organization(s)\n`)

  for (const org of orgs) {
    console.log(`\n📊 Seeding for: ${org.company_name} (${org.id})`)

    // Get first admin user for this org
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('org_id', org.id)
      .eq('role', 'admin')
      .limit(1)

    const userId = users?.[0]?.id

    if (!userId) {
      console.log('  ⚠️  No admin user found, skipping this org...')
      continue
    }

    const boms = await seedBOMs(org.id, userId)
    await seedBOMItems(org.id, boms)

    console.log(`\n✅ Completed seeding for ${org.company_name}`)
  }

  console.log('\n\n✨ Batch 2B seeding complete!\n')
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
