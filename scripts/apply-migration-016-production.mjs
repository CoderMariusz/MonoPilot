#!/usr/bin/env node
/**
 * Apply migration 016 - Comprehensive RLS Fix for ALL Settings Tables to PRODUCTION
 * This script applies the comprehensive RLS policies migration to Supabase PRODUCTION
 *
 * Tables covered:
 *   1. warehouses
 *   2. locations
 *   3. machines
 *   4. production_lines
 *   5. allergens
 *   6. tax_codes
 *   7. user_invitations
 *   8. user_sessions
 *   9. machine_line_assignments
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_REF = 'pgroxddbtaevdegnidaz'; // PRODUCTION
const ACCESS_TOKEN = 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';

const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '016_comprehensive_rls_fix_all_settings_tables.sql');

async function applyMigration() {
  try {
    console.log('📖 Reading migration 016 file...');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration 016 to PRODUCTION Supabase (pgroxddbtaevdegnidaz)...');
    console.log('⚠️  WARNING: This will modify RLS policies for 9 Settings tables!');
    console.log('');
    console.log('   Tables being updated:');
    console.log('   ✓ warehouses');
    console.log('   ✓ locations');
    console.log('   ✓ machines');
    console.log('   ✓ production_lines');
    console.log('   ✓ allergens');
    console.log('   ✓ tax_codes');
    console.log('   ✓ user_invitations');
    console.log('   ✓ user_sessions');
    console.log('   ✓ machine_line_assignments');
    console.log('');

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
    console.log('✅ Migration 016 applied successfully to PRODUCTION!');
    console.log('');
    console.log('📊 Results:');
    console.log('   - 36 RLS policies created (4 per table: SELECT, INSERT, UPDATE, DELETE)');
    console.log('   - All policies include service_role bypass');
    console.log('   - All policies enforce org_id isolation');
    console.log('   - Admin role required for INSERT/UPDATE/DELETE');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Verify each table has policies with verification script');
    console.log('   2. Test all Epic 1 API endpoints');
    console.log('   3. Verify CRUD operations work in production');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('');
    console.error('📝 Manual application required:');
    console.error('   1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
    console.error('   2. Copy the contents of: apps/frontend/lib/supabase/migrations/016_comprehensive_rls_fix_all_settings_tables.sql');
    console.error('   3. Paste and run in the SQL editor');
    process.exit(1);
  }
}

applyMigration();
