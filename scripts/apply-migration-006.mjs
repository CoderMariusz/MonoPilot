#!/usr/bin/env node

/**
 * Apply migration 006: Create user_invitations table
 * Story: 1.3 User Invitations
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_ACCESS_TOKEN = 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac'
const PROJECT_REF = 'pgroxddbtaevdegnidaz'

async function main() {
  console.log('🔄 Applying migration 006: Create user_invitations table...\n')

  try {
    // Read migration file
    const migrationPath = resolve(
      process.cwd(),
      'apps/frontend/lib/supabase/migrations/006_create_user_invitations_table.sql'
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
        console.log('⚠️  Table already exists (migration already applied)')
        console.log('✅ Migration 006 is already up to date!\n')
        return
      }

      console.error('❌ Migration failed:', response.status)
      console.error('Response:', responseText)
      process.exit(1)
    }

    console.log('✅ Migration 006 applied successfully!')
    console.log('\n📋 Created:')
    console.log('   - user_invitations table with columns:')
    console.log('     • id, org_id, email, role, token')
    console.log('     • invited_by, status, sent_at, expires_at, accepted_at')
    console.log('   - invitation_status enum (pending, accepted, expired, cancelled)')
    console.log('   - RLS policies for org-level isolation')
    console.log('   - Unique constraint: one pending invitation per email per org')
    console.log('   - Indexes: org_id, email, status, expires_at')
    console.log('\n💡 User invitation flow is now ready!\n')
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    process.exit(1)
  }
}

main()
