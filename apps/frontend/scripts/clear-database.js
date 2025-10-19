#!/usr/bin/env node

/**
 * Clear Database Script
 * This script clears all data from the database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearDatabase() {
  console.log('🧹 Clearing database...\n');
  
  try {
    // Tables to clear (in order to respect foreign key constraints)
    const tablesToClear = [
      'product_allergens',
      'bom_items', 
      'bom',
      'routing_operations',
      'routings',
      'products',
      'supplier_products',
      'suppliers',
      'warehouses',
      'locations',
      'machines',
      'allergens',
      'tax_codes'
    ];
    
    for (const table of tablesToClear) {
      console.log(`🗑️  Clearing ${table}...`);
      
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 0); // Delete all records
        
        if (error) {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: cleared`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }
    
    console.log('\n✅ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  }
}

clearDatabase();
