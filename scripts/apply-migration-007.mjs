#!/usr/bin/env node

/**
 * Apply migration 007: Create machines and machine_line_assignments tables
 * Story: 1.7 Machine Configuration
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_ACCESS_TOKEN = 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac'
const PROJECT_REF = 'pgroxddbtaevdegnidaz'

async function main() {
  console.log('🔄 Applying migration 007: Create machines and machine_line_assignments tables...\n')

  try {
    // Read migration file
    const migrationPath = resolve(
      process.cwd(),
      'apps/frontend/lib/supabase/migrations/007_create_machines_table.sql'
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
        responseText.includes('42P07') // duplicate table error code
      ) {
        console.log('⚠️  Tables already exist (migration already applied)')
        console.log('✅ Migration 007 is already up to date!\n')
        return
      }

      console.error('❌ Migration failed:', response.status)
      console.error('Response:', responseText)
      process.exit(1)
    }

    console.log('✅ Migration 007 applied successfully!')
    console.log('\n📋 Created:')
    console.log('   - machines table with columns:')
    console.log('     • id, org_id, code, name, status, capacity_per_hour')
    console.log('     • created_by, updated_by, created_at, updated_at')
    console.log('   - machine_line_assignments table (many-to-many join):')
    console.log('     • machine_id (FK to machines), line_id (FK to production_lines - to be added)')
    console.log('   - Status enum: active, down, maintenance')
    console.log('   - RLS policies for org-level isolation')
    console.log('   - Unique constraints: (org_id, code), (machine_id, line_id)')
    console.log('   - Indexes: org_id, code, status, machine_id, line_id')
    console.log('\n💡 Machine configuration is now ready!')
    console.log('📝 Note: FK for line_id will be added when production_lines table is created (Story 1.8)\n')
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    process.exit(1)
  }
}

main()
