#!/usr/bin/env node

/**
 * Create missing user records in public.users for existing auth users
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pgroxddbtaevdegnidaz.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('🔧 Fixing missing user records...\n')
  console.log('=' .repeat(60))

  // Step 1: Check if organization exists
  console.log('\n📋 Step 1: Checking for existing organization...')
  const { data: existingOrg, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1)
    .single()

  let orgId

  if (orgError && orgError.code !== 'PGRST116') {
    console.error('   ❌ Error checking organizations:', orgError)
    return
  }

  if (!existingOrg) {
    console.log('   ⚠️  No organization found, creating one...')
    const { data: newOrg, error: createOrgError } = await supabase
      .from('organizations')
      .insert({
        company_name: 'MonoPilot',
        date_format: 'DD/MM/YYYY',
        number_format: '1,234.56',
        unit_system: 'metric',
        timezone: 'UTC',
        default_currency: 'EUR',
        default_language: 'EN'
      })
      .select()
      .single()

    if (createOrgError) {
      console.error('   ❌ Error creating organization:', createOrgError)
      return
    }

    orgId = newOrg.id
    console.log(`   ✅ Created organization: ${newOrg.company_name} (${orgId})`)
  } else {
    orgId = existingOrg.id
    console.log(`   ✅ Found existing organization: ${existingOrg.company_name} (${orgId})`)
  }

  // Step 2: Get all auth users
  console.log('\n📋 Step 2: Getting auth users...')
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('   ❌ Error fetching auth users:', authError)
    return
  }

  console.log(`   ✅ Found ${authUsers.users.length} auth users`)

  // Step 3: Create missing user records
  console.log('\n📋 Step 3: Creating missing user records...')

  for (const authUser of authUsers.users) {
    // Check if user already exists in public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single()

    if (existingUser) {
      console.log(`   ℹ️  User ${authUser.email} already exists in public.users`)
      continue
    }

    // Create user record (no status field in minimal schema)
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        org_id: orgId,
        email: authUser.email,
        first_name: authUser.email === 'admin@monopilot.local' ? 'Admin' : 'Mariusz',
        last_name: authUser.email === 'admin@monopilot.local' ? 'User' : 'K',
        role: 'admin'
      })
      .select()
      .single()

    if (createUserError) {
      console.error(`   ❌ Error creating user ${authUser.email}:`, createUserError)
    } else {
      console.log(`   ✅ Created user record for ${authUser.email}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n✅ All done! User records have been created.')
  console.log('\n💡 The dashboard should now work without redirect loops.')
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
