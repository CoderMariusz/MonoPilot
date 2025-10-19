#!/usr/bin/env node

/**
 * Database Connection Test Script
 * This script tests if the database connection works and data can be loaded
 */

const { createClient } = require('@supabase/supabase-js');

// Use hardcoded values from config.ts
const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('   ❌ Basic connection failed:', testError.message);
      return false;
    }
    console.log('   ✅ Basic connection successful');
    
    // Test products table
    console.log('\n2. Testing products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, part_number, description, product_group, product_type, is_active')
      .eq('is_active', true)
      .limit(10);
    
    if (productsError) {
      console.log('   ❌ Products query failed:', productsError.message);
      return false;
    }
    
    console.log(`   ✅ Found ${products?.length || 0} products`);
    if (products && products.length > 0) {
      console.log('   📋 Sample products:');
      products.slice(0, 3).forEach(p => {
        console.log(`      - ${p.part_number}: ${p.description} (${p.product_group}/${p.product_type})`);
      });
    }
    
    // Test BOM categories
    console.log('\n3. Testing BOM categories...');
    const categories = {
      MEAT: products?.filter(p => p.product_group === 'MEAT').length || 0,
      DRYGOODS: products?.filter(p => p.product_group === 'DRYGOODS').length || 0,
      FINISHED_GOODS: products?.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG').length || 0,
      PROCESS: products?.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR').length || 0
    };
    
    console.log('   📊 Category distribution:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`      ${category}: ${count} products`);
    });
    
    // Test other tables
    console.log('\n4. Testing other tables...');
    const tables = ['suppliers', 'warehouses', 'machines', 'allergens'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }
    
    console.log('\n✅ Database connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 All tests passed! Database is ready for BOM module.');
    } else {
      console.log('\n💡 To fix database issues:');
      console.log('   1. Check your Supabase project settings');
      console.log('   2. Verify environment variables in .env.local');
      console.log('   3. Run database migrations if needed');
      console.log('   4. Check RLS policies in Supabase dashboard');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
