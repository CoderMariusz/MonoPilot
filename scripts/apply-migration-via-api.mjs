#!/usr/bin/env node

/**
 * Apply migration 000 via Supabase Management API
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = 'pgroxddbtaevdegnidaz';

console.log('🔄 Applying migration 000 via Management API...\n');

// Read migration file (simplified version without user-dependent RLS)
const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/000_create_organizations_table_no_rls.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function main() {
  try {
    // Use Supabase Management API to execute SQL
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
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 000 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - public.organizations table');
    console.log('   - RLS policies (view, update, insert)');
    console.log('   - Indexes (company_name, country)');
    console.log('   - Triggers (updated_at auto-update)');
    console.log('   - Function (update_updated_at_column)\n');

    if (result) {
      console.log('API Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
