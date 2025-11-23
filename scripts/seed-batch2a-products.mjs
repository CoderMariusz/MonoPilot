/**
 * Seed script for Epic 2 Batch 2A - Products + Settings
 * Stories: 2.1, 2.2, 2.3, 2.4, 2.5, 2.22
 *
 * This script seeds:
 * 1. Default product types (RM, WIP, FG, PKG, BP)
 * 2. Technical settings with defaults
 * 3. Sample products with different types
 * 4. Sample allergen assignments
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from apps/frontend/.env.local
const envPath = resolve(process.cwd(), 'apps/frontend/.env.local')
let envVars = {}

try {
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      return
    }
    const match = trimmedLine.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      envVars[key] = value
    }
  })
} catch (error) {
  console.error('❌ Could not read apps/frontend/.env.local')
  console.error('Make sure the file exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
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

async function seedProductTypes(orgId, userId) {
  console.log('  📦 Seeding default product types...')

  const defaultTypes = [
    { code: 'RM', name: 'Raw Material', is_default: true },
    { code: 'WIP', name: 'Work in Progress', is_default: true },
    { code: 'FG', name: 'Finished Good', is_default: true },
    { code: 'PKG', name: 'Packaging', is_default: true },
    { code: 'BP', name: 'By-Product', is_default: true }
  ]

  for (const type of defaultTypes) {
    const { error } = await supabase
      .from('product_type_config')
      .upsert({
        ...type,
        org_id: orgId,
        created_by: userId,
        updated_by: userId
      }, {
        onConflict: 'org_id,code'
      })

    if (error) {
      console.error(`    ❌ Failed to seed type ${type.code}:`, error.message)
    } else {
      console.log(`    ✅ Seeded product type: ${type.code}`)
    }
  }
}

async function seedTechnicalSettings(orgId, userId) {
  console.log('  ⚙️  Seeding technical settings...')

  const { data: existing } = await supabase
    .from('technical_settings')
    .select('org_id')
    .eq('org_id', orgId)
    .single()

  if (existing) {
    console.log('    ℹ️  Technical settings already exist, skipping...')
    return
  }

  const { error } = await supabase
    .from('technical_settings')
    .insert({
      org_id: orgId,
      updated_by: userId
    })

  if (error) {
    console.error('    ❌ Failed to seed technical settings:', error.message)
  } else {
    console.log('    ✅ Seeded technical settings')
  }
}

async function seedSampleProducts(orgId, userId) {
  console.log('  🍞 Seeding sample products...')

  const products = [
    // Raw Materials
    {
      code: 'FLOUR-001',
      name: 'Wheat Flour',
      type: 'RM',
      description: 'Type 550 wheat flour for bread production',
      category: 'Bakery Ingredients',
      uom: 'kg',
      shelf_life_days: 180,
      min_stock_qty: 1000,
      max_stock_qty: 5000,
      reorder_point: 1500,
      cost_per_unit: 0.85
    },
    {
      code: 'SUGAR-001',
      name: 'White Sugar',
      type: 'RM',
      description: 'Fine granulated white sugar',
      category: 'Bakery Ingredients',
      uom: 'kg',
      shelf_life_days: 365,
      min_stock_qty: 500,
      max_stock_qty: 2000,
      cost_per_unit: 1.20
    },
    {
      code: 'YEAST-001',
      name: 'Baker\'s Yeast',
      type: 'RM',
      description: 'Fresh compressed yeast for bread',
      category: 'Bakery Ingredients',
      uom: 'kg',
      shelf_life_days: 30,
      min_stock_qty: 50,
      max_stock_qty: 200,
      cost_per_unit: 3.50
    },
    {
      code: 'MILK-001',
      name: 'Whole Milk',
      type: 'RM',
      description: '3.5% fat whole milk',
      category: 'Dairy',
      uom: 'L',
      shelf_life_days: 7,
      min_stock_qty: 100,
      max_stock_qty: 500,
      cost_per_unit: 0.95
    },
    // Packaging
    {
      code: 'BOX-001',
      name: 'Cardboard Box 30x30x30',
      type: 'PKG',
      description: 'Brown cardboard shipping box',
      category: 'Packaging',
      uom: 'unit',
      min_stock_qty: 500,
      max_stock_qty: 2000,
      cost_per_unit: 0.45
    },
    {
      code: 'BAG-001',
      name: 'Plastic Bread Bag',
      type: 'PKG',
      description: 'Clear plastic bag for bread packaging',
      category: 'Packaging',
      uom: 'unit',
      min_stock_qty: 1000,
      max_stock_qty: 5000,
      cost_per_unit: 0.05
    },
    // Finished Goods
    {
      code: 'BREAD-001',
      name: 'White Bread 500g',
      type: 'FG',
      description: 'Classic white bread loaf',
      category: 'Bread',
      uom: 'unit',
      shelf_life_days: 7,
      cost_per_unit: 2.50
    },
    {
      code: 'BREAD-002',
      name: 'Whole Wheat Bread 500g',
      type: 'FG',
      description: 'Healthy whole wheat bread',
      category: 'Bread',
      uom: 'unit',
      shelf_life_days: 7,
      cost_per_unit: 2.80
    },
    // Work in Progress
    {
      code: 'DOUGH-001',
      name: 'White Bread Dough',
      type: 'WIP',
      description: 'Mixed and proofed white bread dough',
      category: 'Intermediate',
      uom: 'kg',
      shelf_life_days: 1,
      cost_per_unit: 1.80
    }
  ]

  for (const product of products) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        org_id: orgId,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error(`    ❌ Failed to seed ${product.code}:`, error.message)
    } else {
      console.log(`    ✅ Seeded product: ${product.code} - ${product.name}`)
    }
  }
}

async function seedAllergenAssignments(orgId) {
  console.log('  🥜 Seeding allergen assignments...')

  // Get allergens
  const { data: allergens } = await supabase
    .from('allergens')
    .select('id, code')
    .eq('org_id', orgId)

  if (!allergens || allergens.length === 0) {
    console.log('    ℹ️  No allergens found, skipping allergen assignments...')
    return
  }

  const wheat = allergens.find(a => a.code.toLowerCase().includes('wheat') || a.code.toLowerCase().includes('gluten'))
  const milk = allergens.find(a => a.code.toLowerCase().includes('milk') || a.code.toLowerCase().includes('dairy'))

  // Get products
  const { data: products } = await supabase
    .from('products')
    .select('id, code')
    .eq('org_id', orgId)

  if (!products) {
    console.log('    ℹ️  No products found, skipping allergen assignments...')
    return
  }

  const assignments = []

  // Assign wheat allergen to flour and wheat bread
  const flourProduct = products.find(p => p.code === 'FLOUR-001')
  const wheatBread = products.find(p => p.code === 'BREAD-002')
  const whiteBread = products.find(p => p.code === 'BREAD-001')
  const dough = products.find(p => p.code === 'DOUGH-001')

  if (wheat) {
    if (flourProduct) {
      assignments.push({
        product_id: flourProduct.id,
        allergen_id: wheat.id,
        relation_type: 'contains',
        org_id: orgId
      })
    }
    if (wheatBread) {
      assignments.push({
        product_id: wheatBread.id,
        allergen_id: wheat.id,
        relation_type: 'contains',
        org_id: orgId
      })
    }
    if (whiteBread) {
      assignments.push({
        product_id: whiteBread.id,
        allergen_id: wheat.id,
        relation_type: 'contains',
        org_id: orgId
      })
    }
    if (dough) {
      assignments.push({
        product_id: dough.id,
        allergen_id: wheat.id,
        relation_type: 'contains',
        org_id: orgId
      })
    }
  }

  // Assign milk allergen
  const milkProduct = products.find(p => p.code === 'MILK-001')
  if (milk && milkProduct) {
    assignments.push({
      product_id: milkProduct.id,
      allergen_id: milk.id,
      relation_type: 'contains',
      org_id: orgId
    })
  }

  if (assignments.length > 0) {
    const { error } = await supabase
      .from('product_allergens')
      .insert(assignments)

    if (error) {
      console.error('    ❌ Failed to seed allergen assignments:', error.message)
    } else {
      console.log(`    ✅ Seeded ${assignments.length} allergen assignments`)
    }
  }
}

async function main() {
  console.log('🌱 Seeding Batch 2A - Products + Settings...\n')

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

    await seedProductTypes(org.id, userId)
    await seedTechnicalSettings(org.id, userId)
    await seedSampleProducts(org.id, userId)
    await seedAllergenAssignments(org.id)

    console.log(`\n✅ Completed seeding for ${org.company_name}`)
  }

  console.log('\n\n✨ Batch 2A seeding complete!\n')
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
