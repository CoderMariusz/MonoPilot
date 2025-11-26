#!/usr/bin/env node

/**
 * Setup script for test user
 * Creates test user in Supabase Auth and users table
 *
 * Usage:
 *   node scripts/setup-test-user.mjs
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// Load .env.test
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.test')
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const testOrgId = process.env.TEST_ORG_ID
const testUserEmail = process.env.TEST_USER_EMAIL || 'test-user@monopilot.test'
const testUserPassword = process.env.TEST_USER_PASSWORD || 'test-password-123'

if (!supabaseUrl || !serviceRoleKey || !testOrgId) {
  console.error(
    'Error: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and TEST_ORG_ID must be set'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

async function setupTestUser() {
  try {
    console.log(`📝 Setting up test user: ${testUserEmail}`)

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers()

    if (!checkError) {
      const userExists = existingUser.users.some((u) => u.email === testUserEmail)
      if (userExists) {
        console.log(`✅ Test user already exists: ${testUserEmail}`)

        // Verify user has profile in users table
        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('email', testUserEmail)
          .single()

        if (userProfile) {
          console.log(`✅ User profile exists in users table`)
          console.log(`\n🎉 Test user is ready!`)
          return
        } else {
          console.log(`⚠️ User profile missing in users table, creating it...`)
        }
      }
    }

    // Create auth user
    console.log(`Creating auth user...`)
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: testUserPassword,
      email_confirm: true,
    })

    if (createError) {
      throw new Error(`Failed to create auth user: ${createError.message}`)
    }

    const userId = createData.user?.id
    if (!userId) {
      throw new Error('Failed to get user ID from created user')
    }

    console.log(`✅ Auth user created: ${userId}`)

    // Create user profile
    console.log(`Creating user profile...`)
    const { error: profileError } = await supabase.from('users').insert({
      id: userId,
      email: testUserEmail,
      org_id: testOrgId,
      role: 'admin',
      status: 'active',
    })

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    console.log(`✅ User profile created in users table`)

    console.log(`\n🎉 Test user setup complete!`)
    console.log(`\nCredentials:`)
    console.log(`  Email: ${testUserEmail}`)
    console.log(`  Password: ${testUserPassword}`)
    console.log(`  Org ID: ${testOrgId}`)
  } catch (error) {
    console.error('❌ Error during setup:', error.message)
    process.exit(1)
  }
}

setupTestUser()
