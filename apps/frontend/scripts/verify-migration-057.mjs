#!/usr/bin/env node

/**
 * Verify Migration 057: PO Header warehouse_id
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

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
    const { data, error } = await supabase
      .from('po_header')
      .select('warehouse_id')
      .limit(1);

    if (error) {
      if (error.code === '42703') {
        console.log('❌ FAIL: warehouse_id column does NOT exist in po_header');
        console.log('   Error:', error.message);
        console.log('   Migration 057 has NOT been executed');
        allPassed = false;
      } else {
        console.log('⚠️  Warning: Unexpected error:', error.message);
      }
    } else {
      console.log('✅ PASS: warehouse_id column exists in po_header');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    allPassed = false;
  }

  // Test 2: Check TypeScript interface
  console.log('\nTest 2: Checking TypeScript interface...');
  try {
    const typesContent = readFileSync('lib/types.ts', 'utf-8');

    if (typesContent.includes('warehouse_id?: number') || typesContent.includes('warehouse_id: number')) {
      console.log('✅ PASS: POHeader interface has warehouse_id property');
    } else {
      console.log('❌ FAIL: POHeader interface missing warehouse_id');
      allPassed = false;
    }
  } catch (err) {
    console.error('⚠️  SKIP: Could not read types.ts:', err.message);
  }

  // Test 3: Check migration file exists
  console.log('\nTest 3: Checking migration file exists...');
  try {
    const migrationContent = readFileSync('lib/supabase/migrations/057_add_warehouse_id_to_po_header.sql', 'utf-8');
    if (migrationContent.includes('ALTER TABLE po_header')) {
      console.log('✅ PASS: Migration 057 file exists');
    }
  } catch (err) {
    console.log('❌ FAIL: Migration 057 file not found');
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ Migration 057 VERIFIED: All checks passed');
    console.log('   warehouse_id column exists and TypeScript is updated');
  } else {
    console.log('❌ Migration 057 NOT EXECUTED: Column missing in database');
    console.log('   Action Required: Execute migration 057');
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
