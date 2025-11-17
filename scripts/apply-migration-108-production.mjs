#!/usr/bin/env node
/**
 * Apply migration 108 - Fix Users RLS Policies to PRODUCTION database
 * CRITICAL FIX: Users table has RLS enabled but no policies!
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_REF = 'pgroxddbtaevdegnidaz'; // PRODUCTION
const ACCESS_TOKEN = 'sbp_11f65c1a940eb66ed8084ce71b04bdf026ee1b56';

const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '108_fix_users_rls_policies.sql');

async function applyMigration() {
  try {
    console.log('📖 Reading migration 108 file...');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration 108 to PRODUCTION (pgroxddbtaevdegnidaz)...');
    console.log('🚨 CRITICAL FIX: Adding RLS policies to users table');

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Migration failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Migration 108 applied successfully to PRODUCTION!');
    console.log('Result:', result);

    console.log('\n📋 Next steps:');
    console.log('   1. Refresh the application');
    console.log('   2. Test user role visibility');
    console.log('   3. Test Settings CRUD operations');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('\n📝 Manual application required:');
    console.error('   1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
    console.error('   2. Copy the contents of: apps/frontend/lib/supabase/migrations/108_fix_users_rls_policies.sql');
    console.error('   3. Paste and run in the SQL editor');
    process.exit(1);
  }
}

applyMigration();
