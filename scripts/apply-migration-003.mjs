#!/usr/bin/env node

/**
 * Apply migration 003 (Warehouses table) via Supabase Management API
 * Story: 1.5 Warehouse Configuration (prerequisite for 1.6 Locations)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = 'pgroxddbtaevdegnidaz';

console.log('🔄 Applying migration 003 (Warehouses table) via Management API...\n');

// Read migration file
const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/003_create_warehouses_table.sql');
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
    console.log('✅ Migration 003 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - public.warehouses table');
    console.log('   - RLS policies (select, insert, update, delete)');
    console.log('   - Indexes (org_id, code, is_active, org_active)');
    console.log('   - Triggers (updated_at auto-update)');
    console.log('   - Constraints (org_code unique, nullable default locations)\n');

    console.log('📝 Note: default_*_location_id FKs are nullable initially.');
    console.log('   They will be set after locations are created in migration 004.\n');

    if (result) {
      console.log('API Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
