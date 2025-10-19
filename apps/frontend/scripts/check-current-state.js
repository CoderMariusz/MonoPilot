#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCurrentState() {
  console.log('🔍 Checking current database state...\n');
  
  try {
    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, part_number, description, product_group, product_type, is_active')
      .eq('is_active', true);
    
    if (productsError) {
      console.log('❌ Products error:', productsError.message);
      return;
    }
    
    console.log(`📋 Found ${products?.length || 0} active products`);
    
    if (products && products.length > 0) {
      console.log('\n📊 Current distribution:');
      const distribution = {};
      products.forEach(p => {
        const key = `${p.product_group}/${p.product_type}`;
        distribution[key] = (distribution[key] || 0) + 1;
      });
      
      Object.entries(distribution).forEach(([key, count]) => {
        console.log(`   ${key}: ${count} products`);
      });
      
      console.log('\n📋 Sample products:');
      products.slice(0, 10).forEach(p => {
        console.log(`   ${p.part_number}: ${p.product_group}/${p.product_type}`);
      });
      
      // Check BOM categories
      const bomCategories = {
        MEAT: products.filter(p => p.product_group === 'MEAT').length,
        DRYGOODS: products.filter(p => p.product_group === 'DRYGOODS').length,
        FINISHED_GOODS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG').length,
        PROCESS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR').length
      };
      
      console.log('\n📋 BOM Categories:');
      Object.entries(bomCategories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} products`);
      });
      
      // Check if we have the right products for each category
      console.log('\n🔍 Product analysis:');
      
      const meatProducts = products.filter(p => p.part_number.startsWith('RM-BEEF-') || p.part_number.startsWith('RM-PORK-') || p.part_number.startsWith('RM-LAMB-') || p.part_number.startsWith('RM-CHICKEN-'));
      const dryGoodsProducts = products.filter(p => p.part_number.startsWith('DG-'));
      const processProducts = products.filter(p => p.part_number.startsWith('PR-'));
      const finishedGoodsProducts = products.filter(p => p.part_number.startsWith('FG-'));
      
      console.log(`   MEAT candidates: ${meatProducts.length} (${meatProducts.map(p => p.part_number).join(', ')})`);
      console.log(`   DRYGOODS candidates: ${dryGoodsProducts.length} (${dryGoodsProducts.map(p => p.part_number).join(', ')})`);
      console.log(`   PROCESS candidates: ${processProducts.length} (${processProducts.map(p => p.part_number).join(', ')})`);
      console.log(`   FINISHED_GOODS candidates: ${finishedGoodsProducts.length} (${finishedGoodsProducts.map(p => p.part_number).join(', ')})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCurrentState();
