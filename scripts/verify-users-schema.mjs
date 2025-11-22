#!/usr/bin/env node

/**
 * Verify users table schema
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pgroxddbtaevdegnidaz.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('🔍 Verifying users table schema...\n')

  // Get first user to check schema
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error fetching users:', error)
    return
  }

  if (users && users.length > 0) {
    const user = users[0]
    console.log('✅ Users table schema verified!\n')
    console.log('📋 Available columns:')
    Object.keys(user).forEach((col) => {
      console.log(`   - ${col}`)
    })

    console.log('\n💡 Required columns for User Management API:')
    const requiredColumns = [
      'id',
      'org_id',
      'email',
      'first_name',
      'last_name',
      'role',
      'status',
      'last_login_at',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at',
    ]

    let allPresent = true
    requiredColumns.forEach((col) => {
      const isPresent = col in user
      console.log(`   ${isPresent ? '✅' : '❌'} ${col}`)
      if (!isPresent) allPresent = false
    })

    console.log(
      allPresent
        ? '\n✅ All required columns present! User API should work now.'
        : '\n⚠️  Some columns missing! User API may have issues.'
    )
  } else {
    console.log('⚠️  No users found in database')
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
