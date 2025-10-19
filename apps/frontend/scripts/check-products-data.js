#!/usr/bin/env node

/**
 * Check Products Data
 * This script checks what data exists in the products table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProductsData() {
  console.log('🔍 Checking products data...\n');
  
  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, part_number, description, product_group, product_type, is_active')
      .eq('is_active', true);
    
    if (error) {
      console.log('❌ Error querying products:', error.message);
      return;
    }
    
    console.log(`✅ Found ${products?.length || 0} active products`);
    
    if (products && products.length > 0) {
      console.log('\n📋 Products by category:');
      
      // Group by product_group
      const byGroup = {};
      products.forEach(p => {
        const group = p.product_group || 'UNKNOWN';
        if (!byGroup[group]) byGroup[group] = [];
        byGroup[group].push(p);
      });
      
      Object.entries(byGroup).forEach(([group, items]) => {
        console.log(`\n   ${group} (${items.length} items):`);
        items.slice(0, 3).forEach(item => {
          console.log(`      - ${item.part_number}: ${item.description} (${item.product_type})`);
        });
        if (items.length > 3) {
          console.log(`      ... and ${items.length - 3} more`);
        }
      });
      
      // Check BOM categories
      console.log('\n📊 BOM Category Distribution:');
      const categories = {
        MEAT: products.filter(p => p.product_group === 'MEAT').length,
        DRYGOODS: products.filter(p => p.product_group === 'DRYGOODS').length,
        FINISHED_GOODS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG').length,
        PROCESS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR').length
      };
      
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} products`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  }
}

checkProductsData();
