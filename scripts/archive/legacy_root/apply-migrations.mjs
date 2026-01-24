#!/usr/bin/env node

/**
 * Migration Helper Script
 * Displays SQL to execute via Supabase Dashboard
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRef = 'pgroxddbtaevdegnidaz';

async function displayMigration() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 MIGRATION 057: Add warehouse_id to po_header');
  console.log('='.repeat(80) + '\n');

  try {
    // Read migration file
    const migrationPath = resolve(__dirname, 'apps/frontend/lib/supabase/migrations/057_add_warehouse_id_to_po_header.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📊 Project Reference:', projectRef || 'Unknown');
    console.log(`📍 Supabase Dashboard SQL Editor:`);
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);

    console.log('📋 INSTRUCTIONS:');
    console.log('1. Open the Supabase Dashboard SQL Editor using the link above');
    console.log('2. Copy the SQL below');
    console.log('3. Paste into the SQL Editor');
    console.log('4. Click "Run" to execute the migration');
    console.log('5. Verify success message appears');
    console.log('6. Run: node scripts/verify-migration-057.mjs\n');

    console.log('='.repeat(80));
    console.log('SQL TO EXECUTE:');
    console.log('='.repeat(80) + '\n');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(80));

    console.log('\n✅ After executing, verify with:');
    console.log('   cd apps/frontend && node scripts/verify-migration-057.mjs\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

displayMigration();
