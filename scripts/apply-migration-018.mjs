#!/usr/bin/env node
/**
 * Apply Migration 018: Add Warehouse-Location Foreign Keys
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

console.log('🔧 Applying Migration 018: Add Warehouse-Location Foreign Keys\n');
console.log('═'.repeat(70));

// Step 1: Check current foreign keys
console.log('\n📋 Step 1: Checking current foreign keys on warehouses table...\n');

const { data: currentFKs, error: fkError } = await supabase
  .rpc('exec_sql', {
    query: `SELECT conname FROM pg_constraint
            WHERE conrelid = 'public.warehouses'::regclass
            AND contype = 'f'
            AND conname LIKE '%location%'
            ORDER BY conname;`
  });

if (fkError) {
  console.log('⚠️  Could not query via RPC (expected - function may not exist)');
  console.log('   Will proceed with migration...\n');
} else {
  console.log('Current foreign keys:', currentFKs);
}

// Step 2: Read migration file
console.log('📄 Step 2: Reading migration file...\n');

const migrationPath = join(__dirname, '../apps/frontend/lib/supabase/migrations/018_add_warehouse_location_foreign_keys.sql');
let migrationSQL;

try {
  migrationSQL = readFileSync(migrationPath, 'utf8');
  console.log('✅ Migration file loaded successfully');
  console.log(`   File: ${migrationPath}`);
  console.log(`   Size: ${migrationSQL.length} bytes\n`);
} catch (err) {
  console.error('❌ Failed to read migration file:', err.message);
  process.exit(1);
}

// Step 3: Extract SQL commands (skip comments and empty lines)
console.log('🔍 Step 3: Extracting SQL commands...\n');

const sqlCommands = migrationSQL
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0)
  .filter(cmd => !cmd.startsWith('--'))
  .filter(cmd => !cmd.match(/^\/\*/))
  .map(cmd => cmd + ';');

const alterCommands = sqlCommands.filter(cmd => cmd.startsWith('ALTER TABLE'));

console.log(`Found ${alterCommands.length} ALTER TABLE commands to execute:\n`);
alterCommands.forEach((cmd, idx) => {
  const constraintName = cmd.match(/CONSTRAINT (\w+)/)?.[1];
  console.log(`   ${idx + 1}. ${constraintName}`);
});

// Step 4: Apply migration using direct SQL execution
console.log('\n⚡ Step 4: Applying migration...\n');

// Since we can't use RPC, we'll need to tell the user to apply manually
console.log('⚠️  NOTE: Supabase JS client cannot execute raw DDL SQL directly.');
console.log('   The migration needs to be applied via Supabase SQL Editor.\n');

console.log('📋 Migration SQL to apply:');
console.log('─'.repeat(70));
console.log(migrationSQL);
console.log('─'.repeat(70));

console.log('\n📝 MANUAL STEPS REQUIRED:');
console.log('1. Copy the SQL above');
console.log('2. Go to Supabase Dashboard → SQL Editor');
console.log('3. Paste and run the migration');
console.log('4. Verify with:');
console.log('   SELECT conname FROM pg_constraint');
console.log('   WHERE conname LIKE \'warehouses_%_location%\';');

process.exit(0);
