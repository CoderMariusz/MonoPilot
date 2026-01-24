#!/usr/bin/env node
/**
 * Script to execute master_migration.sql on TEST Supabase database
 * Story: 0.9 - Database Reset Execution
 *
 * CRITICAL: This executes on TEST database only!
 *
 * Usage:
 *   node apply-migration-test.mjs
 *
 * Or with custom migration file:
 *   node apply-migration-test.mjs path/to/migration.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test DB Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_TEST || 'https://gvnkzwokxtztyxsfshct.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_TEST || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bmt6d29reHR6dHl4c2ZzaGN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIyMTQxNSwiZXhwIjoyMDc4Nzk3NDE1fQ.ataBNcpspVo6Qwxw-r02ber7SYsuaqQoU7PedSRXhEo';

// Migration file path
const migrationFile = process.argv[2] || join(__dirname, 'master_migration.sql');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  DATABASE RESET - TEST DATABASE                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('⚠️  CRITICAL: This will execute on TEST database only!');
console.log(`📁 Migration file: ${migrationFile}`);
console.log(`🔗 Target: ${SUPABASE_URL}\n`);

// Confirm before execution
if (!process.env.FORCE_EXECUTE) {
  console.log('To execute, set FORCE_EXECUTE=true environment variable:');
  console.log('  FORCE_EXECUTE=true node apply-migration-test.mjs\n');
  process.exit(0);
}

async function executeMigration() {
  try {
    // Read migration SQL
    console.log('📖 Reading migration file...');
    const migrationSQL = readFileSync(migrationFile, 'utf-8');
    const lines = migrationSQL.split('\n').length;
    console.log(`✓ Loaded ${lines} lines of SQL\n`);

    // Create Supabase client with service role
    console.log('🔐 Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Execute migration using RPC (requires database function or direct SQL execution)
    console.log('🚀 Executing migration...');
    console.log('⏳ This may take several minutes for 1000+ lines of SQL...\n');

    // Note: Supabase JS client doesn't support direct SQL execution of large DDL scripts
    // We need to use the REST API's query endpoint or pg connection
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).catch(err => {
      // If exec_sql doesn't exist, we need to use the SQL Editor or CLI
      return { error: err };
    });

    if (error) {
      console.error('❌ Migration failed via RPC. Trying alternative method...\n');

      // Alternative: Split into statements and execute one by one
      console.log('Attempting statement-by-statement execution...');
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`Found ${statements.length} SQL statements\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length < 10) continue; // Skip tiny fragments

        process.stdout.write(`  [${i + 1}/${statements.length}] Executing... `);

        // For DDL statements, we need to use the direct database connection
        // This requires database password which we don't have via JS client

        console.log('⚠️  LIMITATION: JS client cannot execute DDL statements');
        break;
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  MANUAL STEP REQUIRED:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Supabase JS client cannot execute large DDL migrations.');
      console.log('Please use ONE of these methods:\n');
      console.log('METHOD 1: Supabase Dashboard SQL Editor');
      console.log('  1. Go to: https://supabase.com/dashboard/project/gvnkzwokxtztyxsfshct/sql');
      console.log('  2. Copy contents of master_migration.sql');
      console.log('  3. Paste into SQL Editor');
      console.log('  4. Click "Run"\n');
      console.log('METHOD 2: Supabase CLI (requires database password)');
      console.log('  npx supabase db execute --db-url "CONNECTION_STRING" --file master_migration.sql\n');
      console.log('METHOD 3: psql client (requires database password)');
      console.log('  psql "CONNECTION_STRING" < master_migration.sql\n');
      console.log('After manual execution, run validation script:');
      console.log('  node verify-migration-test.mjs\n');

      process.exit(1);
    }

    console.log('\n✅ Migration executed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run validation: node verify-migration-test.mjs');
    console.log('  2. Check logs for warnings');
    console.log('  3. Verify Epic 0 fixes');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

executeMigration();
