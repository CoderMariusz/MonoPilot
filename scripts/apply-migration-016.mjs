#!/usr/bin/env node

/**
 * Apply migration 016 (Comprehensive RLS Fix for ALL Settings Tables) via Supabase Management API
 * Story: 1.14 - Epic Polish & Cleanup
 * 
 * Purpose: Fixes RLS policies to allow service_role bypass for all Epic 1 tables
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

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('   Usage: SUPABASE_ACCESS_TOKEN=<your-token> node scripts/apply-migration-016.mjs');
  console.error('   Or add to .env file (make sure .env is in .gitignore!)');
  process.exit(1);
}

console.log('🔄 Applying migration 016 (Comprehensive RLS Fix for ALL Settings Tables) via Management API...\n');

// Read migration file (relative to script location for portability)
const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '016_comprehensive_rls_fix_all_settings_tables.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function main() {
  try {
    console.log('📋 Tables being updated:');
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
        console.log('\n⚠️  Migration 016 already applied (some policies may already exist)');
        console.log('   This is normal if migration was partially applied before.');
      }
      
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 016 applied successfully!');
    console.log('\n📋 Updated RLS policies for 9 Settings tables:');
    console.log('   - 36 RLS policies created/updated (4 per table: SELECT, INSERT, UPDATE, DELETE)');
    console.log('   - All policies include service_role bypass');
    console.log('   - All policies enforce org_id isolation');
    console.log('   - Admin role required for INSERT/UPDATE/DELETE');
    console.log('\n🎯 Key Features:');
    console.log('   - Service role can bypass RLS for all operations');
    console.log('   - Users can view data from their organization');
    console.log('   - Only admins can create/update/delete');
    console.log('   - Consistent RLS pattern across all Settings tables');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify RLS policies: node scripts/verify-all-rls-policies.mjs');
    console.log('   2. Test all Epic 1 API endpoints');
    console.log('   3. Verify CRUD operations work correctly\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();



