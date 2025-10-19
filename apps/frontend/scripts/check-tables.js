#!/usr/bin/env node

/**
 * Check Database Tables
 * This script checks which tables exist in the database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('🔍 Checking database tables...\n');
  
  const tablesToCheck = [
    'products',
    'suppliers', 
    'warehouses',
    'locations',
    'machines',
    'allergens',
    'tax_codes',
    'bom',
    'bom_items',
    'routings',
    'routing_operations',
    'product_allergens',
    'supplier_products'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of tablesToCheck) {
    try {
      // Try to query the table with a simple select
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('schema cache')) {
          missingTables.push(table);
          console.log(`❌ ${table}: Table does not exist`);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
      } else {
        existingTables.push(table);
        console.log(`✅ ${table}: Exists`);
      }
    } catch (err) {
      missingTables.push(table);
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Existing tables: ${existingTables.length}`);
  console.log(`   ❌ Missing tables: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log(`\n❌ Missing tables:`);
    missingTables.forEach(table => console.log(`   - ${table}`));
  }
  
  // Check if we have any data in existing tables
  console.log(`\n📋 Data in existing tables:`);
  for (const table of existingTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (!error && data) {
        // Try to get actual count
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!countError) {
          console.log(`   ${table}: ${count} records`);
        } else {
          console.log(`   ${table}: Data exists (count failed)`);
        }
      }
    } catch (err) {
      console.log(`   ${table}: Error checking data`);
    }
  }
  
  return { existingTables, missingTables };
}

checkTables();
