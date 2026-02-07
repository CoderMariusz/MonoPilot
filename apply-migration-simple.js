/**
 * Apply get_inventory_kpis fix migration
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, 'apps/frontend/.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function applyMigration() {
  console.log('🔧 Applying get_inventory_kpis fix...')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Read migration SQL
  const migrationPath = path.join(__dirname, 'supabase/migrations/126_fix_inventory_kpis_function.sql')
  let sql

  try {
    sql = fs.readFileSync(migrationPath, 'utf-8')
  } catch (err) {
    console.error('❌ Failed to read migration file:', err.message)
    process.exit(1)
  }

  // Execute SQL using Supabase REST API
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    console.log('✅ Migration applied successfully!')
    console.log('\n📊 Stats cards should now show correct data:')
    console.log('  - Total LP Count: Correct count of non-consumed LPs')
    console.log('  - Total Value: Displayed in PLN (zł)')
    console.log('\n🔄 Refresh the /warehouse/inventory page to see the fix')

  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    console.log('\n📝 Please apply manually in Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/_/sql/new')
    console.log('\nSQL to execute:')
    console.log('=' .repeat(80))
    console.log(sql)
    console.log('=' .repeat(80))
    process.exit(1)
  }
}

applyMigration()
