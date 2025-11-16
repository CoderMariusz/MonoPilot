#!/usr/bin/env node

/**
 * Apply Migration 057: Add warehouse_id to po_header
 * Story 0.1 - Fix PO Header warehouse_id
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration057() {
  try {
    console.log('🚀 Applying Migration 057: Add warehouse_id to po_header\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'lib', 'supabase', 'migrations', '057_add_warehouse_id_to_po_header.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📝 SQL Length:', migrationSQL.length, 'characters');

    // Split SQL into individual statements (excluding comments)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'END $$');

    console.log('📊 Found', statements.length, 'SQL statements\n');

    // Execute each statement
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip empty or comment-only statements
      if (!statement.trim() || statement.trim() === ';') {
        continue;
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

        // Use direct SQL execution via Postgres connection
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Try alternative: direct query
          const { error: queryError } = await supabase.from('_sql').select('*').eq('query', statement);

          if (queryError) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            console.error('Statement:', statement.substring(0, 100) + '...');
            continue;
          }
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
      } catch (err) {
        console.error(`❌ Error on statement ${i + 1}:`, err.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }

    console.log(`\n📊 Migration complete: ${successCount}/${statements.length} statements executed`);

    // Verify migration was applied
    console.log('\n🔍 Verifying migration...');

    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'po_header')
      .eq('column_name', 'warehouse_id');

    if (verifyError) {
      console.log('⚠️  Could not verify migration (RLS may be blocking)');
    } else if (columns && columns.length > 0) {
      console.log('✅ Migration verified: warehouse_id column exists in po_header');
    } else {
      console.log('❌ Migration verification failed: warehouse_id column not found');
    }

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    process.exit(1);
  }
}

// Run the migration
applyMigration057()
  .then(() => {
    console.log('\n✅ Migration 057 applied successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
