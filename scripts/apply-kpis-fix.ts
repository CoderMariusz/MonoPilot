/**
 * Apply get_inventory_kpis fix
 * Bug: Stats cards showing 0 LPs/$0
 * Fix: Add org_id filter to products JOIN
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

async function applyMigration() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/126_fix_inventory_kpis_function.sql')
  const sql = readFileSync(migrationPath, 'utf-8')

  console.log('Applying migration: 126_fix_inventory_kpis_function.sql')
  console.log('SQL:', sql.substring(0, 200) + '...')

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration applied successfully')
    console.log('Data:', data)
  } catch (err) {
    console.error('Error executing migration:', err)
    console.log('\nTrying direct execution...')

    // Try executing the function creation directly
    const functionSQL = sql.split('CREATE OR REPLACE FUNCTION')[1]
    if (!functionSQL) {
      console.error('Could not extract function definition')
      process.exit(1)
    }

    const { error } = await supabase.rpc('exec', {
      query: 'CREATE OR REPLACE FUNCTION' + functionSQL,
    })

    if (error) {
      console.error('Direct execution failed:', error)
      console.log('\n📝 Please apply the migration manually in Supabase SQL Editor:')
      console.log(sql)
      process.exit(1)
    }

    console.log('✅ Migration applied via direct execution')
  }
}

applyMigration()
