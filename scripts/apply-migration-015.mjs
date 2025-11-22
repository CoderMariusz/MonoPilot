#!/usr/bin/env node

/**
 * Apply migration 015 (Auto-activate users via Database Trigger) via Supabase Management API
 * Story: 1.14 - Epic Polish & Cleanup
 * AC: AC-1.4 (Signup Status Automation)
 *
 * Purpose: Replace $20/month Vercel webhook with FREE database trigger
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('   Usage: SUPABASE_ACCESS_TOKEN=<your-token> node scripts/apply-migration-015.mjs');
  console.error('   Or add to .env file (make sure .env is in .gitignore!)');
  process.exit(1);
}

console.log('🔄 Applying migration 015 (Auto-activate users trigger) via Management API...\n');

// Read migration file (relative to script location for portability)
const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '015_auto_activate_users_trigger.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function main() {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Migration failed:', response.status, response.statusText);
      console.error('Response:', errorText);

      if (errorText.includes('already exists') ||
          errorText.includes('duplicate') ||
          errorText.includes('42710')) {
        console.log('\n⚠️  Migration 015 already applied (trigger may already exist)');
        console.log('   This is normal if migration was run before.');
        process.exit(0);
      }

      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 015 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - Function: auto_activate_invited_user()');
    console.log('   - Trigger: trigger_auto_activate_user ON auth.users');
    console.log('   - Event: AFTER INSERT (fires when user signs up)');
    console.log('\n🎯 Key Features:');
    console.log('   - Auto-activates users after signup via invitation link');
    console.log('   - Validates invitation token from user metadata');
    console.log('   - Updates users.status = "active" automatically');
    console.log('   - Updates user_invitations.status = "accepted"');
    console.log('   - Logs activity in activity_logs table');
    console.log('   - Graceful handling if invitation not found');
    console.log('\n💰 Cost Savings:');
    console.log('   - Replaces Vercel webhook ($20/month)');
    console.log('   - FREE (included in Supabase Free Plan)');
    console.log('   - 100% reliable (database-level guarantee)');
    console.log('\n💡 How it works:');
    console.log('   1. User visits /signup?token=xxx&email=user@example.com');
    console.log('   2. User completes signup form');
    console.log('   3. Supabase Auth creates user in auth.users');
    console.log('   4. Trigger fires automatically');
    console.log('   5. User is activated and can login immediately');
    console.log('\n🧪 Test:');
    console.log('   1. Create invitation: POST /api/settings/users');
    console.log('   2. Complete signup via link');
    console.log('   3. Check user status:');
    console.log('      SELECT status FROM users WHERE email = \'test@example.com\';');
    console.log('      -- Expected: "active"\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
