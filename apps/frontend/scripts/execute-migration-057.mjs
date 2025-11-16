#!/usr/bin/env node

/**
 * Execute Migration 057: Add warehouse_id to po_header
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function executeMigration() {
  console.log('🚀 Executing Migration 057: Add warehouse_id to po_header\n');

  try {
    // Read migration file
    const migrationSQL = readFileSync('lib/supabase/migrations/057_add_warehouse_id_to_po_header.sql', 'utf-8');

    // Split into individual statements (rough split)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.log('Statement:', stmt.substring(0, 100) + '...');
        throw error;
      }

      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    console.log('\n✅ Migration 057 executed successfully!');
    console.log('   warehouse_id column added to po_header');

    // Verify
    const { data, error } = await supabase
      .from('po_header')
      .select('warehouse_id')
      .limit(1);

    if (!error) {
      console.log('✅ Verification: warehouse_id column is accessible\n');
    }

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.log('\nNote: You may need to execute this migration manually via Supabase Dashboard');
    console.log('SQL Editor URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql');
    process.exit(1);
  }
}

executeMigration();
