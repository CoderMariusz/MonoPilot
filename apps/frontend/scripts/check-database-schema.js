#!/usr/bin/env node

/**
 * Database Schema Check Script
 * This script checks if the required tables exist in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: true, count: data?.length || 0 };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');
  
  const tables = [
    'routings',
    'routing_operations',
    'products',
    'bom',
    'bom_items',
    'work_orders',
    'machines',
    'allergens',
    'suppliers',
    'warehouses'
  ];
  
  const results = {};
  
  for (const table of tables) {
    console.log(`Checking ${table}...`);
    const result = await checkTableExists(table);
    results[table] = result;
    
    if (result.exists) {
      console.log(`  ✅ ${table} exists (${result.count} records)`);
    } else {
      console.log(`  ❌ ${table} missing: ${result.error}`);
    }
  }
  
  console.log('\n📊 Summary:');
  const missingTables = Object.entries(results).filter(([_, result]) => !result.exists);
  
  if (missingTables.length === 0) {
    console.log('✅ All required tables exist!');
  } else {
    console.log(`❌ Missing tables: ${missingTables.map(([name]) => name).join(', ')}`);
    console.log('\n💡 To fix this, run the database migrations:');
    console.log('   npx supabase db reset');
    console.log('   or apply migrations manually in Supabase dashboard');
  }
  
  return results;
}

// Run the check
checkDatabaseSchema()
  .then((results) => {
    const missingTables = Object.entries(results).filter(([_, result]) => !result.exists);
    process.exit(missingTables.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Error checking database schema:', error);
    process.exit(1);
  });
