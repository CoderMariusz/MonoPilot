#!/usr/bin/env node

/**
 * Apply migration 034 (Fix RLS Policies for Products Tables) via Supabase Management API
 *
 * Purpose: Fixes RLS policies to allow authenticated user operations for products tables
 *
 * Tables covered:
 *   1. products
 *   2. product_version_history
 *   3. product_allergens
 *   4. product_type_config
 *   5. technical_settings
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

console.log('🔄 Applying migration 034 (Fix RLS Policies for Products Tables) via Management API...\n');

// Read migration file
const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/034_fix_products_rls_policies.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function main() {
  try {
    console.log('📋 Tables being updated:');
    console.log('   ✓ products');
    console.log('   ✓ product_version_history');
    console.log('   ✓ product_allergens');
    console.log('   ✓ product_type_config');
    console.log('   ✓ technical_settings');
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
        console.log('\n⚠️  Migration 034 already applied (some policies may already exist)');
        console.log('   This is normal if migration was partially applied before.');
      }

      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 034 applied successfully!');
    console.log('\n📋 Updated RLS policies for 5 Products tables:');
    console.log('   - 17 RLS policies created/updated (3-4 per table: SELECT, INSERT, UPDATE, DELETE)');
    console.log('   - All policies include service_role bypass');
    console.log('   - All policies enforce org_id isolation');
    console.log('   - Admin role required for INSERT/UPDATE/DELETE (except product_version_history)');
    console.log('\n🎯 Key Features:');
    console.log('   - Service role can bypass RLS for all operations');
    console.log('   - Users can view data from their organization');
    console.log('   - Only admins can create/update/delete products');
    console.log('   - Version history and allergens are automatically managed');
    console.log('   - Consistent RLS pattern across all Products tables');
    console.log('\n✅ Product creation should now work without RLS errors!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
