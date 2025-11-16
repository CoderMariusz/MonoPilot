#!/usr/bin/env node
/**
 * Apply migration 107 - Fix Settings RLS Policies
 * This script applies the RLS policies migration directly to Supabase
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_REF = 'gvnkzwokxtztyxsfshct';
const ACCESS_TOKEN = 'sbp_11f65c1a940eb66ed8084ce71b04bdf026ee1b56';

const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '107_fix_settings_rls_policies.sql');

async function applyMigration() {
  try {
    console.log('📖 Reading migration file...');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration to Supabase...');

    const response = await fetch(
      `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ACCESS_TOKEN,
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (!response.ok) {
      // Try alternative endpoint
      console.log('🔄 Trying alternative method via SQL endpoint...');
      const altResponse = await fetch(
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

      if (!altResponse.ok) {
        const errorText = await altResponse.text();
        throw new Error(`Migration failed: ${altResponse.status} ${altResponse.statusText}\n${errorText}`);
      }

      const result = await altResponse.json();
      console.log('✅ Migration applied successfully!');
      console.log('Result:', result);
      return;
    }

    const result = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('\n📝 Manual application required:');
    console.error('   1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
    console.error('   2. Copy the contents of: apps/frontend/lib/supabase/migrations/107_fix_settings_rls_policies.sql');
    console.error('   3. Paste and run in the SQL editor');
    process.exit(1);
  }
}

applyMigration();
