#!/usr/bin/env node

/**
 * Apply migration 008: Create user_sessions table
 * Story: 1.4 Session Management
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac'
const PROJECT_REF = 'pgroxddbtaevdegnidaz'

async function main() {
  console.log('🔄 Applying migration 008: Create user_sessions table...\n')

  try {
    // Read migration file
    const migrationPath = resolve(
      process.cwd(),
      'apps/frontend/lib/supabase/migrations/008_create_user_sessions_table.sql'
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
        console.log('✅ Migration 008 is already up to date!\n')
        return
      }

      console.error('❌ Migration failed:', response.status)
      console.error('Response:', responseText)
      process.exit(1)
    }

    console.log('✅ Migration 008 applied successfully!')
    console.log('\n📋 Created:')
    console.log('   - user_sessions table with columns:')
    console.log('     • id, user_id, token_id (JWT jti claim)')
    console.log('     • device_info, ip_address, location')
    console.log('     • login_time, last_activity, is_active, logged_out_at')
    console.log('   - Indexes: user_id, token_id, is_active, last_activity')
    console.log('   - Composite index: (user_id, is_active) for active sessions query')
    console.log('   - Check constraint: logged_out_at NULL if is_active = true')
    console.log('\n💡 Session tracking ready for JWT-based session management!\n')
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    process.exit(1)
  }
}

main()
