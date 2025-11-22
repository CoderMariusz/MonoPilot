#!/usr/bin/env node

/**
 * Check if logged-in user exists in public.users table
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pgroxddbtaevdegnidaz.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('🔍 Checking auth users and their records in public.users table...\n')

  // Get all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching auth users:', authError)
    return
  }

  console.log(`📊 Found ${authUsers.users.length} auth users:\n`)

  for (const authUser of authUsers.users) {
    console.log(`\n👤 Auth User: ${authUser.email}`)
    console.log(`   ID: ${authUser.id}`)
    console.log(`   Created: ${new Date(authUser.created_at).toLocaleString()}`)

    // Check if user exists in public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (publicError && publicError.code !== 'PGRST116') {
      console.log(`   ❌ Error checking public.users:`, publicError.message)
    } else if (!publicUser) {
      console.log(`   ⚠️  NOT FOUND in public.users table - THIS WILL CAUSE REDIRECT LOOP!`)
    } else {
      console.log(`   ✅ Found in public.users:`)
      console.log(`      Org ID: ${publicUser.org_id}`)
      console.log(`      Role: ${publicUser.role}`)
      console.log(`      Status: ${publicUser.status}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n✅ Check complete!')
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
