#!/usr/bin/env node

/**
 * Apply migration 013 (Add modules_enabled to organizations) via Supabase Management API
 * Story: 1.11 - Module Activation
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
  console.error('   Usage: SUPABASE_ACCESS_TOKEN=<your-token> node scripts/apply-migration-013.mjs');
  console.error('   Or add to .env file (make sure .env is in .gitignore!)');
  process.exit(1);
}

console.log('🔄 Applying migration 013 (Add modules_enabled to organizations) via Management API...\n');

// Read migration file (relative to script location for portability)
const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '013_add_modules_enabled_to_organizations.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function main() {
  try {
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
        console.log('\n⚠️  Migration 013 already applied (column may already exist)');
      }
      
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 013 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - Column: organizations.modules_enabled (TEXT[])');
    console.log('   - Default: [technical, planning, production, warehouse]');
    console.log('   - Constraint: at least one module required');
    console.log('   - Index: GIN index for array operations');
    console.log('   - Function: is_module_enabled(org_id, module_code)');
    console.log('\n🎯 Key Features:');
    console.log('   - Module activation/deactivation per organization');
    console.log('   - Default modules: technical, planning, production, warehouse');
    console.log('   - Optional modules: quality, shipping, npd, finance');
    console.log('   - Helper function for module checks');
    console.log('\n💡 Usage:');
    console.log('   SELECT is_module_enabled(\'<org_id>\', \'technical\');');
    console.log('   -- Returns true if module is enabled\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
