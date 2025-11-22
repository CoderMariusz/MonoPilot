#!/usr/bin/env node

/**
 * Apply migration 009 (Production Lines table) via Supabase Management API
 * Story: 1.8 - Production Line Configuration
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ⚠️ SECURITY: NEVER HARDCODE TOKENS! Always load from environment variables
// This token was exposed in git history and should be rotated immediately
// Use: SUPABASE_ACCESS_TOKEN=<token> node scripts/apply-migration-009.mjs
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('   Usage: SUPABASE_ACCESS_TOKEN=<your-token> node scripts/apply-migration-009.mjs');
  console.error('   Or add to .env file (make sure .env is in .gitignore!)');
  process.exit(1);
}

console.log('🔄 Applying migration 009 (Production Lines table) via Management API...\n');

// Read migration file
const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/009_create_production_lines_table.sql');
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
      
      // Check if it's an "already exists" error
      if (errorText.includes('already exists') || 
          errorText.includes('duplicate') ||
          errorText.includes('42710')) {
        console.log('\n⚠️  Migration 009 already applied (some objects may already exist)');
        console.log('   This is normal if migration was partially applied before.');
      }
      
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 009 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - public.production_lines table');
    console.log('   - Foreign key constraint on machine_line_assignments.line_id');
    console.log('   - RLS policies (select, insert, update, delete)');
    console.log('   - Indexes:');
    console.log('     • idx_production_lines_org_id');
    console.log('     • idx_production_lines_code (org_id, code)');
    console.log('     • idx_production_lines_warehouse_id');
    console.log('     • idx_production_lines_org_warehouse');
    console.log('     • idx_production_lines_default_output_location');
    console.log('   - Triggers:');
    console.log('     • production_lines_updated_at_trigger');
    console.log('     • production_lines_validate_output_location (validates output location warehouse)');
    console.log('   - Functions:');
    console.log('     • validate_production_line_output_location()');
    console.log('   - Constraints:');
    console.log('     • Unique: (org_id, code)');
    console.log('     • Check: code format (uppercase alphanumeric + hyphens)');
    console.log('     • Check: code length (2-50 chars)');
    console.log('     • Check: name length (1-100 chars)');
    console.log('\n🎯 Key Features:');
    console.log('   - Multi-tenancy via org_id RLS');
    console.log('   - Warehouse assignment (line belongs to warehouse)');
    console.log('   - Default output location (optional, must be in same warehouse)');
    console.log('   - Database constraint validates output location warehouse');
    console.log('   - FK to machine_line_assignments for machine assignments');
    console.log('   - Ready for WO assignments (Epic 3)\n');

    if (result && Object.keys(result).length > 0) {
      console.log('API Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
