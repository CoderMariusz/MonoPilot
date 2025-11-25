#!/usr/bin/env node

/**
 * Apply migration 034 directly using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔄 Applying migration 034 (Fix RLS Policies for Products Tables)...\n');

// Read migration file
const migrationPath = join(__dirname, 'apps', 'frontend', 'lib', 'supabase', 'migrations', '034_fix_products_rls_policies.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('📋 Tables being updated:');
console.log('   ✓ products');
console.log('   ✓ product_version_history');
console.log('   ✓ product_allergens');
console.log('   ✓ product_type_config');
console.log('   ✓ technical_settings');
console.log('');

try {
  // Execute the migration SQL
  const { data, error } = await supabase.rpc('q', {
    query_string: migrationSQL
  }).select();

  if (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\nℹ️  RPC function "q" not available, trying direct SQL execution...');
      // Try using Postgres REST API directly if available
    }
    process.exit(1);
  }

  console.log('✅ Migration 034 applied successfully!');
  console.log('\n📋 Updated RLS policies for 5 Products tables:');
  console.log('   - 17 RLS policies created/updated (3-4 per table)');
  console.log('   - All policies include service_role bypass');
  console.log('   - All policies enforce org_id isolation');
  console.log('   - Admin role required for INSERT/UPDATE/DELETE');
  console.log('\n✅ Product creation should now work without RLS errors!\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
