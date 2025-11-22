#!/usr/bin/env node

/**
 * Apply migration 009: Create production_lines table
 * Story: 1.8 Production Line Configuration
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_ACCESS_TOKEN = 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac'
const PROJECT_REF = 'pgroxddbtaevdegnidaz'

async function main() {
  console.log('🔄 Applying migration 009: Create production_lines table...\n')

  try {
    // Read migration file
    const migrationPath = resolve(
      process.cwd(),
      'apps/frontend/lib/supabase/migrations/009_create_production_lines_table.sql'
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
        responseText.includes('42P07')
      ) {
        console.log('⚠️  Table already exists (migration already applied)')
        console.log('✅ Migration 009 is already up to date!\n')
        return
      }

      console.error('❌ Migration failed:', response.status)
      console.error('Response:', responseText)
      process.exit(1)
    }

    console.log('✅ Migration 009 applied successfully!')
    console.log('\n📋 Created:')
    console.log('   - production_lines table with columns:')
    console.log('     • id, org_id, warehouse_id (FK to warehouses)')
    console.log('     • code (unique per org), name')
    console.log('     • default_output_location_id (FK to locations, nullable)')
    console.log('     • created_by, updated_by, created_at, updated_at')
    console.log('   - FK constraint added: machine_line_assignments.line_id → production_lines.id')
    console.log('   - Indexes: org_id, code, warehouse_id, org+warehouse composite')
    console.log('   - RLS policies: Admin-only insert/update/delete, org isolation')
    console.log('   - Constraints: unique (org_id, code), code format ^[A-Z0-9-]+$')
    console.log('\n💡 Production lines ready for WO creation (Epic 3, 4)!\n')
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    process.exit(1)
  }
}

main()
