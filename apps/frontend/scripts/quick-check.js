#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function quickCheck() {
  console.log('🔍 Quick database check...\n');
  
  // Check products
  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, part_number, product_group, product_type')
      .eq('is_active', true)
      .limit(5);
    
    if (productsError) {
      console.log('❌ Products table error:', productsError.message);
    } else {
      console.log(`✅ Products: ${products?.length || 0} found`);
      if (products && products.length > 0) {
        console.log('Sample products:');
        products.forEach(p => {
          console.log(`  - ${p.part_number}: ${p.product_group}/${p.product_type}`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Products table error:', err.message);
  }
  
  // Check routing_operations
  try {
    const { data: routingOps, error: routingOpsError } = await supabase
      .from('routing_operations')
      .select('*')
      .limit(1);
    
    if (routingOpsError) {
      console.log('❌ routing_operations table error:', routingOpsError.message);
    } else {
      console.log(`✅ routing_operations: ${routingOps?.length || 0} found`);
    }
  } catch (err) {
    console.log('❌ routing_operations table error:', err.message);
  }
  
  // Check routings
  try {
    const { data: routings, error: routingsError } = await supabase
      .from('routings')
      .select('*')
      .limit(1);
    
    if (routingsError) {
      console.log('❌ routings table error:', routingsError.message);
    } else {
      console.log(`✅ routings: ${routings?.length || 0} found`);
    }
  } catch (err) {
    console.log('❌ routings table error:', err.message);
  }
  
  // Check BOM categories
  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('product_group, product_type')
      .eq('is_active', true);
    
    if (!productsError && products) {
      const categories = {
        MEAT: products.filter(p => p.product_group === 'MEAT').length,
        DRYGOODS: products.filter(p => p.product_group === 'DRYGOODS').length,
        FINISHED_GOODS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG').length,
        PROCESS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR').length
      };
      
      console.log('\n📊 BOM Categories:');
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} products`);
      });
    }
  } catch (err) {
    console.log('❌ Error checking categories:', err.message);
  }
}

quickCheck();
