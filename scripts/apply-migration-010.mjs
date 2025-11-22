#!/usr/bin/env node

/**
 * Apply migration 010 (Allergens table) via Supabase Management API
 * Story: 1.9 - Allergen Management
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
  console.error('   Usage: SUPABASE_ACCESS_TOKEN=<your-token> node scripts/apply-migration-010.mjs');
  console.error('   Or add to .env file (make sure .env is in .gitignore!)');
  process.exit(1);
}

console.log('🔄 Applying migration 010 (Allergens table) via Management API...\n');

// Read migration file (relative to script location for portability)
const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '010_create_allergens_table.sql');
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
        console.log('\n⚠️  Migration 010 already applied (some objects may already exist)');
        console.log('   This is normal if migration was partially applied before.');
      }
      
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 010 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - public.allergens table');
    console.log('   - RLS policies (org isolation)');
    console.log('   - Indexes:');
    console.log('     • idx_allergens_org_id');
    console.log('     • idx_allergens_flags (org_id, is_major, is_custom)');
    console.log('     • idx_allergens_code');
    console.log('   - Triggers (updated_at auto-update)');
    console.log('   - Constraints:');
    console.log('     • Unique: (org_id, code)');
    console.log('\n🎯 Key Features:');
    console.log('   - Multi-tenancy via org_id RLS');
    console.log('   - Support for 14 EU major allergens (is_major flag)');
    console.log('   - Custom allergens per organization (is_custom flag)');
    console.log('   - Unique allergen codes per organization\n');

    if (result && Object.keys(result).length > 0) {
      console.log('API Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
