#!/usr/bin/env node

/**
 * Cleanup script for test users
 * Removes all test users created during E2E testing
 *
 * Usage:
 *   node scripts/cleanup-test-users.mjs
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

async function cleanupTestUsers() {
  try {
    console.log('🧹 Cleaning up test users...')

    // Get all test users (pattern: test-user-*.monopilot.test)
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const testUsers = users.users.filter(
      (user) =>
        user.email?.includes('test-user-') &&
        user.email?.endsWith('@monopilot.test')
    )

    if (testUsers.length === 0) {
      console.log('✅ No test users found')
      return
    }

    console.log(`Found ${testUsers.length} test users to delete`)

    // Delete each test user
    let deleted = 0
    let failed = 0

    for (const user of testUsers) {
      try {
        console.log(`  Deleting: ${user.email} (${user.id})`)

        // Delete from users table first
        await supabase
          .from('users')
          .delete()
          .eq('id', user.id)

        // Delete from auth
        await supabase.auth.admin.deleteUser(user.id)
        deleted++
      } catch (error) {
        console.warn(`  ❌ Failed to delete ${user.email}:`, error.message)
        failed++
      }
    }

    console.log(`\n✅ Cleanup complete`)
    console.log(`  Deleted: ${deleted}`)
    console.log(`  Failed: ${failed}`)
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message)
    process.exit(1)
  }
}

cleanupTestUsers()
