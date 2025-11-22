#!/usr/bin/env node

/**
 * Apply migration 005: Upgrade users table to full version
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac'
const PROJECT_REF = 'pgroxddbtaevdegnidaz'

async function main() {
  console.log('🔄 Applying migration 005: Upgrade users table to full version...\n')

  try {
    // Read migration file
    const migrationPath = resolve(
      process.cwd(),
      'apps/frontend/lib/supabase/migrations/005_upgrade_users_table_to_full.sql'
    )
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Apply migration via Supabase Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: migrationSQL,
        }),
      }
    )

    const responseText = await response.text()

    if (!response.ok) {
      // Check if it's an "already exists" error
      if (
        responseText.includes('already exists') ||
        responseText.includes('duplicate') ||
        responseText.includes('42701') // duplicate column error code
      ) {
        console.log('⚠️  Columns already exist (migration already applied)')
        console.log('✅ Migration 005 is already up to date!\n')
        return
      }

      console.error('❌ Migration failed:', response.status)
      console.error('Response:', responseText)
      process.exit(1)
    }

    console.log('✅ Migration 005 applied successfully!')
    console.log('\n📋 Added columns:')
    console.log('   - status (VARCHAR(20), default: active)')
    console.log('   - last_login_at (TIMESTAMP WITH TIME ZONE)')
    console.log('   - created_by (UUID, references users.id)')
    console.log('   - updated_by (UUID, references users.id)')
    console.log('\n💡 User creation API should now work correctly!\n')
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    process.exit(1)
  }
}

main()
