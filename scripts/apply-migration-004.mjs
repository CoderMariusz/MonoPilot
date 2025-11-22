#!/usr/bin/env node

/**
 * Apply migration 004 (Locations table) via Supabase Management API
 * Story: 1.6 Location Management
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = 'pgroxddbtaevdegnidaz';

console.log('🔄 Applying migration 004 (Locations table) via Management API...\n');

// Read migration file
const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/004_create_locations_table.sql');
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
    console.log('✅ Migration 004 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - public.locations table');
    console.log('   - RLS policies (select, insert, update, delete)');
    console.log('   - Indexes:');
    console.log('     • idx_locations_warehouse (CRITICAL for performance)');
    console.log('     • idx_locations_org_id');
    console.log('     • idx_locations_type');
    console.log('     • idx_locations_barcode');
    console.log('     • idx_locations_code');
    console.log('     • idx_locations_org_active');
    console.log('     • idx_locations_warehouse_type');
    console.log('   - Triggers (updated_at auto-update)');
    console.log('   - Constraints:');
    console.log('     • Unique: (org_id, warehouse_id, code)');
    console.log('     • Unique: (barcode) - globally unique');
    console.log('     • Check: type IN (receiving, production, storage, shipping, transit, quarantine)');
    console.log('     • Check: zone validation (if enabled, must not be null)');
    console.log('     • Check: capacity validation (if enabled, must be > 0)\n');

    console.log('🎯 Key Features:');
    console.log('   - Auto-generated barcodes (LOC-{warehouse_code}-{sequence})');
    console.log('   - Optional zone/capacity with toggle flags');
    console.log('   - Multi-tenancy via org_id RLS');
    console.log('   - ON DELETE RESTRICT prevents deletion if used as warehouse default\n');

    if (result) {
      console.log('API Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
