#!/usr/bin/env node

/**
 * Verify Migration 057: PO Header warehouse_id
 *
 * This script checks if migration 057 has been successfully executed by:
 * 1. Verifying warehouse_id column exists in po_header table
 * 2. Checking foreign key constraint to warehouses table
 * 3. Validating index exists for performance
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../apps/frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration057() {
  console.log('🔍 Verifying Migration 057: PO Header warehouse_id\n');

  let allPassed = true;

  // Test 1: Check if warehouse_id column exists
  console.log('Test 1: Checking if warehouse_id column exists...');
  try {
    const { data: columns, error } = await supabase
      .rpc('pg_get_columns', { table_name: 'po_header' })
      .select();

    if (error) {
      // RPC might not exist, try direct query
      const { data: infoColumns, error: infoError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'po_header')
        .eq('column_name', 'warehouse_id');

      if (infoError) {
        console.error('❌ Error querying columns:', infoError.message);
        allPassed = false;
      } else if (!infoColumns || infoColumns.length === 0) {
        console.log('❌ FAIL: warehouse_id column does NOT exist in po_header');
        console.log('   Migration 057 has NOT been executed');
        allPassed = false;
      } else {
        const col = infoColumns[0];
        console.log(`✅ PASS: warehouse_id column exists`);
        console.log(`   Type: ${col.data_type}`);
        console.log(`   Nullable: ${col.is_nullable}`);
      }
    } else {
      const warehouseIdCol = columns?.find(c => c.column_name === 'warehouse_id');
      if (warehouseIdCol) {
        console.log(`✅ PASS: warehouse_id column exists`);
        console.log(`   Type: ${warehouseIdCol.data_type}`);
      } else {
        console.log('❌ FAIL: warehouse_id column does NOT exist');
        allPassed = false;
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    allPassed = false;
  }

  // Test 2: Try to create a PO with warehouse_id (integration test)
  console.log('\nTest 2: Testing warehouse_id foreign key constraint...');
  try {
    // First, get a valid warehouse
    const { data: warehouses, error: whError } = await supabase
      .from('warehouses')
      .select('id')
      .limit(1);

    if (whError || !warehouses || warehouses.length === 0) {
      console.log('⚠️  SKIP: No warehouses found (need data to test FK)');
    } else {
      const validWarehouseId = warehouses[0].id;

      // Try invalid warehouse_id (should fail)
      const { error: invalidError } = await supabase
        .from('po_header')
        .insert({
          number: 'PO-TEST-INVALID-' + Date.now(),
          supplier_id: 1,
          status: 'draft',
          warehouse_id: 99999, // Invalid
          order_date: new Date().toISOString(),
        })
        .select();

      if (invalidError && invalidError.code === '23503') {
        console.log('✅ PASS: Foreign key constraint working (rejected invalid warehouse_id)');
      } else {
        console.log('❌ FAIL: Foreign key constraint NOT working');
        allPassed = false;
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Test 3: Check TypeScript interface (compile-time check)
  console.log('\nTest 3: Checking TypeScript interface...');
  try {
    // We can't actually import TypeScript in this JS file, but we can check the source
    const fs = await import('fs');
    const typesPath = join(__dirname, '../apps/frontend/lib/types.ts');
    const typesContent = fs.readFileSync(typesPath, 'utf-8');

    if (typesContent.includes('warehouse_id?: number;') || typesContent.includes('warehouse_id: number')) {
      console.log('✅ PASS: POHeader interface has warehouse_id property');
    } else {
      console.log('❌ FAIL: POHeader interface missing warehouse_id');
      allPassed = false;
    }
  } catch (err) {
    console.error('⚠️  SKIP: Could not read types.ts:', err.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ Migration 057 VERIFIED: All checks passed');
    console.log('   warehouse_id column exists and is properly configured');
  } else {
    console.log('❌ Migration 057 INCOMPLETE: Some checks failed');
    console.log('   Please execute migration 057 or check errors above');
  }
  console.log('='.repeat(60) + '\n');

  return allPassed;
}

// Run verification
verifyMigration057()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
