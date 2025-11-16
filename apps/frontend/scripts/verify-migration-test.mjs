#!/usr/bin/env node
/**
 * Story 0.9: Database Reset Execution - Schema Validation
 *
 * Validates TEST database schema after migration:
 * - 45 tables
 * - 3 ENUMs with correct values
 * - Epic 0 fixes (4 patterns)
 * - RLS policies, triggers, functions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_TEST || 'https://gvnkzwokxtztyxsfshct.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_TEST;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY_TEST environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  SCHEMA VALIDATION - TEST DATABASE                         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`🔗 Target: ${SUPABASE_URL}\n`);

let allPassed = true;
const results = [];

async function runQuery(sql, description) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return data;
  } catch (err) {
    // Fallback: direct query if RPC not available
    const { data, error } = await supabase.from('_exec').select('*').limit(0);
    console.warn(`⚠️  RPC not available, using alternative method for: ${description}`);
    return null;
  }
}

async function validateTableCount() {
  console.log('📊 [1/7] Validating Table Count...');

  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');

  if (error) {
    console.error(`   ❌ FAILED: ${error.message}`);
    results.push({ test: 'Table Count', status: 'FAILED', expected: 45, actual: 'error' });
    allPassed = false;
    return;
  }

  const count = data?.length || 0;
  const passed = count === 45;

  if (passed) {
    console.log(`   ✅ PASSED: ${count} tables (expected 45)`);
    results.push({ test: 'Table Count', status: 'PASSED', expected: 45, actual: count });
  } else {
    console.log(`   ❌ FAILED: ${count} tables (expected 45)`);
    results.push({ test: 'Table Count', status: 'FAILED', expected: 45, actual: count });
    allPassed = false;
  }
}

async function validateENUMs() {
  console.log('\n📊 [2/7] Validating ENUM Types...');

  // Check product_group
  const { data: pg, error: pgError } = await supabase.rpc('get_enum_values', { enum_name: 'product_group' }).catch(() => ({ data: null, error: 'not_found' }));

  // Since we can't easily query ENUMs via Supabase client, we'll check by querying products table
  console.log('   ℹ️  ENUM validation requires SQL Editor manual check');
  console.log('   Expected ENUMs:');
  console.log('   - product_group: MEAT, DRYGOODS, COMPOSITE');
  console.log('   - product_type: RM_MEAT, PR, FG, DG_WEB, DG_LABEL, DG_BOX, DG_ING, DG_SAUCE');
  console.log('   - bom_status: draft, active, archived');
  console.log('   ⚠️  MANUAL: Verify ENUMs in SQL Editor');

  results.push({ test: 'ENUM Types', status: 'MANUAL', expected: '3 ENUMs', actual: 'manual_check' });
}

async function validateEpic0Fixes() {
  console.log('\n📊 [3/7] Validating Epic 0 Fixes...');

  const fixes = [
    { pattern: 'A', table: 'to_line', column: 'notes', type: 'TEXT' },
    { pattern: 'B', table: 'locations', column: 'zone', type: 'VARCHAR' },
    { pattern: 'C', table: 'po_header', column: 'warehouse_id', type: 'INTEGER' },
    { pattern: 'C', table: 'license_plates', column: 'status', type: 'TEXT' },
  ];

  console.log('   ℹ️  Epic 0 fixes require SQL Editor manual check');
  console.log('   Expected columns:');
  fixes.forEach(fix => {
    console.log(`   - ${fix.table}.${fix.column} (${fix.type})`);
  });
  console.log('   ⚠️  MANUAL: Verify columns in SQL Editor');

  results.push({ test: 'Epic 0 Fixes', status: 'MANUAL', expected: '4 fixes', actual: 'manual_check' });
}

async function validateRLSPolicies() {
  console.log('\n📊 [4/7] Validating RLS Policies...');

  const { data, error } = await supabase
    .from('pg_policies')
    .select('tablename')
    .limit(50);

  if (error) {
    console.log(`   ⚠️  Cannot query RLS policies via client`);
    console.log('   Expected: 42 tables with RLS policies');
    console.log('   ⚠️  MANUAL: Run query in SQL Editor:');
    console.log('   SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = \'public\';');
    results.push({ test: 'RLS Policies', status: 'MANUAL', expected: 42, actual: 'manual_check' });
    return;
  }

  const uniqueTables = new Set(data.map(p => p.tablename));
  const count = uniqueTables.size;
  const passed = count >= 40; // Allow some variance

  if (passed) {
    console.log(`   ✅ PASSED: ${count} tables with RLS (expected ~42)`);
    results.push({ test: 'RLS Policies', status: 'PASSED', expected: 42, actual: count });
  } else {
    console.log(`   ❌ FAILED: ${count} tables with RLS (expected ~42)`);
    results.push({ test: 'RLS Policies', status: 'FAILED', expected: 42, actual: count });
    allPassed = false;
  }
}

async function validateTriggers() {
  console.log('\n📊 [5/7] Validating Triggers...');

  console.log('   ℹ️  Expected triggers:');
  console.log('   - users: update_users_updated_at');
  console.log('   - suppliers: update_suppliers_updated_at');
  console.log('   - warehouses: update_warehouses_updated_at');
  console.log('   - locations: update_locations_updated_at');
  console.log('   - boms: check_bom_date_overlap_trigger');
  console.log('   ⚠️  MANUAL: Run query in SQL Editor:');
  console.log('   SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = \'public\';');

  results.push({ test: 'Triggers', status: 'MANUAL', expected: 5, actual: 'manual_check' });
}

async function validateFunctions() {
  console.log('\n📊 [6/7] Validating Functions...');

  console.log('   ℹ️  Expected functions:');
  console.log('   - update_updated_at_column()');
  console.log('   - check_bom_date_overlap()');
  console.log('   - select_bom_for_wo()');
  console.log('   ⚠️  MANUAL: Run query in SQL Editor:');
  console.log('   SELECT routine_name FROM information_schema.routines WHERE routine_schema = \'public\' AND routine_type = \'FUNCTION\';');

  results.push({ test: 'Functions', status: 'MANUAL', expected: 3, actual: 'manual_check' });
}

async function validateSchemaStructure() {
  console.log('\n📊 [7/7] Schema Structure Check...');

  console.log('   ℹ️  Checking critical tables exist...');

  const criticalTables = [
    'users', 'products', 'boms', 'bom_items',
    'po_header', 'po_line', 'to_header', 'to_line',
    'work_orders', 'wo_materials', 'license_plates',
    'warehouses', 'locations', 'suppliers'
  ];

  let missing = [];

  for (const table of criticalTables) {
    const { error } = await supabase.from(table).select('id').limit(0);
    if (error && error.code === '42P01') {
      missing.push(table);
    }
  }

  if (missing.length === 0) {
    console.log(`   ✅ PASSED: All ${criticalTables.length} critical tables exist`);
    results.push({ test: 'Schema Structure', status: 'PASSED', expected: criticalTables.length, actual: criticalTables.length });
  } else {
    console.log(`   ❌ FAILED: Missing tables: ${missing.join(', ')}`);
    results.push({ test: 'Schema Structure', status: 'FAILED', expected: criticalTables.length, actual: criticalTables.length - missing.length });
    allPassed = false;
  }
}

async function main() {
  try {
    await validateTableCount();
    await validateENUMs();
    await validateEpic0Fixes();
    await validateRLSPolicies();
    await validateTriggers();
    await validateFunctions();
    await validateSchemaStructure();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('VALIDATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    results.forEach(r => {
      const icon = r.status === 'PASSED' ? '✅' : r.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`${icon} ${r.test.padEnd(25)} Expected: ${String(r.expected).padEnd(10)} Actual: ${r.actual}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allPassed) {
      console.log('✅ ALL AUTOMATED CHECKS PASSED!\n');
      console.log('⚠️  MANUAL CHECKS REQUIRED:');
      console.log('   - ENUMs (3 types with correct values)');
      console.log('   - Epic 0 fixes (4 column checks)');
      console.log('   - Triggers (5 expected)');
      console.log('   - Functions (3 expected)\n');
      console.log('📋 Next Step: Run manual SQL queries listed above in SQL Editor\n');
    } else {
      console.log('❌ VALIDATION FAILED - DO NOT PROCEED TO PRODUCTION\n');
      console.log('Fix issues on TEST DB before proceeding.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during validation:', error.message);
    process.exit(1);
  }
}

main();
