#!/usr/bin/env node

/**
 * Manual Test Script for Auth Webhook
 * Story: 1.14 (Batch 1) - AC-1.4 (Signup Status Automation)
 *
 * Tests the /api/webhooks/auth endpoint with mock Supabase webhook payload
 *
 * Usage:
 *   node scripts/test-auth-webhook.mjs
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
config({ path: join(__dirname, '..', '.env.local') })

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/auth`
  : 'http://localhost:5000/api/webhooks/auth'

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET

if (!WEBHOOK_SECRET) {
  console.error('❌ SUPABASE_WEBHOOK_SECRET not found in .env.local')
  console.error('   Please add SUPABASE_WEBHOOK_SECRET to your .env.local file')
  process.exit(1)
}

console.log('🧪 Testing Auth Webhook Endpoint...\n')
console.log(`📍 Webhook URL: ${WEBHOOK_URL}`)
console.log(`🔐 Using webhook secret: ${WEBHOOK_SECRET.substring(0, 10)}...\n`)

// Mock Supabase webhook payload for auth.users.created event
const mockPayload = {
  type: 'INSERT',
  table: 'users',
  schema: 'auth',
  record: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    raw_user_meta_data: {
      invitation_token: 'test-invitation-token-here',
    },
  },
  old_record: null,
}

async function testWebhook() {
  console.log('📤 Sending mock webhook payload...\n')
  console.log('Payload:', JSON.stringify(mockPayload, null, 2))
  console.log('')

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': WEBHOOK_SECRET,
      },
      body: JSON.stringify(mockPayload),
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    console.log(`📥 Response Status: ${response.status} ${response.statusText}\n`)
    console.log('Response Body:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('')

    if (response.ok) {
      console.log('✅ Webhook test PASSED')
      console.log('   Expected behavior:')
      console.log('   - Webhook receives auth.users.created event')
      console.log('   - Validates signature')
      console.log('   - Finds invitation by token')
      console.log('   - Updates user status to "active"')
      console.log('   - Updates invitation status to "accepted"')
    } else {
      console.log('⚠️  Webhook test FAILED')
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${responseData.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('❌ Test failed with error:')
    console.error(error.message)
    console.error('')
    console.error('💡 Make sure:')
    console.error('   1. The Next.js dev server is running (pnpm dev)')
    console.error('   2. The server is listening on the correct port')
    console.error('   3. The webhook endpoint exists at /api/webhooks/auth')
  }
}

// Test cases
async function runTests() {
  console.log('═══════════════════════════════════════════════════')
  console.log('TEST 1: Valid webhook with signature')
  console.log('═══════════════════════════════════════════════════\n')
  await testWebhook()

  console.log('\n═══════════════════════════════════════════════════')
  console.log('TEST 2: Invalid signature')
  console.log('═══════════════════════════════════════════════════\n')

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': 'invalid-signature',
      },
      body: JSON.stringify(mockPayload),
    })

    const responseData = await response.json()

    console.log(`📥 Response Status: ${response.status} ${response.statusText}\n`)
    console.log('Response Body:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('')

    if (response.status === 401) {
      console.log('✅ Invalid signature test PASSED (rejected as expected)')
    } else {
      console.log('⚠️  Invalid signature test FAILED (should return 401)')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log('TEST 3: Missing invitation token')
  console.log('═══════════════════════════════════════════════════\n')

  const payloadWithoutToken = {
    ...mockPayload,
    record: {
      ...mockPayload.record,
      raw_user_meta_data: {},
    },
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': WEBHOOK_SECRET,
      },
      body: JSON.stringify(payloadWithoutToken),
    })

    const responseData = await response.json()

    console.log(`📥 Response Status: ${response.status} ${response.statusText}\n`)
    console.log('Response Body:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('')

    if (response.ok && responseData.message === 'No invitation token') {
      console.log('✅ Missing token test PASSED (handled gracefully)')
    } else {
      console.log('⚠️  Missing token test FAILED')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log('All tests completed!')
  console.log('═══════════════════════════════════════════════════\n')
}

runTests()
