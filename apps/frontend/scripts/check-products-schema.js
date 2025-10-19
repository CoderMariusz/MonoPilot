#!/usr/bin/env node

/**
 * Check Products Table Schema
 * This script checks what columns exist in the products table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProductsSchema() {
  console.log('🔍 Checking products table schema...\n');
  
  try {
    // Try to get one product to see what columns exist
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error querying products:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Products table exists');
      console.log('📋 Available columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]}`);
      });
      
      console.log('\n📊 Sample product data:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  Products table is empty');
    }
    
    // Check if specific columns exist
    const columnsToCheck = ['category', 'group', 'product_type', 'type'];
    console.log('\n🔍 Checking specific columns:');
    
    for (const col of columnsToCheck) {
      try {
        const { data: testData, error: testError } = await supabase
          .from('products')
          .select(col)
          .limit(1);
        
        if (testError) {
          console.log(`   ❌ ${col}: ${testError.message}`);
        } else {
          console.log(`   ✅ ${col}: exists`);
        }
      } catch (err) {
        console.log(`   ❌ ${col}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
}

checkProductsSchema();
