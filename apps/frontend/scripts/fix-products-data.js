#!/usr/bin/env node

/**
 * Fix Products Data
 * This script updates the products data to have correct categories
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixProductsData() {
  console.log('🔧 Fixing products data...\n');
  
  try {
    // Get all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, part_number, description, product_type');
    
    if (fetchError) {
      console.log('❌ Error fetching products:', fetchError.message);
      return;
    }
    
    console.log(`📋 Found ${products?.length || 0} products to update`);
    
    if (!products || products.length === 0) {
      console.log('⚠️  No products found to update');
      return;
    }
    
    // Update products based on part_number patterns
    const updates = [];
    
    products.forEach(product => {
      const partNumber = product.part_number;
      let newProductGroup = 'COMPOSITE';
      let newProductType = product.product_type;
      
      // Raw Materials - MEAT
      if (partNumber.startsWith('RM-BEEF-') || partNumber.startsWith('RM-PORK-') || partNumber.startsWith('RM-FAT-')) {
        newProductGroup = 'MEAT';
        newProductType = 'RM_MEAT';
      }
      // Raw Materials - DRYGOODS
      else if (partNumber.startsWith('RM-SALT-') || partNumber.startsWith('RM-PEPPER-') || 
               partNumber.startsWith('RM-SPICE-') || partNumber.startsWith('RM-CASING-') ||
               partNumber.startsWith('RM-ONION-') || partNumber.startsWith('RM-GARLIC-') ||
               partNumber.startsWith('RM-PAPER-')) {
        newProductGroup = 'DRYGOODS';
        newProductType = 'DG_ING';
      }
      // Process products
      else if (partNumber.startsWith('PR-')) {
        newProductGroup = 'COMPOSITE';
        newProductType = 'PR';
      }
      // Finished goods
      else if (partNumber.startsWith('FG-')) {
        newProductGroup = 'COMPOSITE';
        newProductType = 'FG';
      }
      
      if (newProductGroup !== product.product_group || newProductType !== product.product_type) {
        updates.push({
          id: product.id,
          product_group: newProductGroup,
          product_type: newProductType
        });
      }
    });
    
    console.log(`📝 Will update ${updates.length} products`);
    
    if (updates.length > 0) {
      // Update products in batches
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        for (const update of batch) {
          const { error: updateError } = await supabase
            .from('products')
            .update({
              product_group: update.product_group,
              product_type: update.product_type
            })
            .eq('id', update.id);
          
          if (updateError) {
            console.log(`❌ Error updating product ${update.id}:`, updateError.message);
          } else {
            console.log(`✅ Updated product ${update.id}: ${update.product_group}/${update.product_type}`);
          }
        }
      }
    }
    
    // Check final distribution
    console.log('\n📊 Final category distribution:');
    const { data: finalProducts, error: finalError } = await supabase
      .from('products')
      .select('product_group, product_type')
      .eq('is_active', true);
    
    if (!finalError && finalProducts) {
      const distribution = {};
      finalProducts.forEach(p => {
        const key = `${p.product_group}/${p.product_type}`;
        distribution[key] = (distribution[key] || 0) + 1;
      });
      
      Object.entries(distribution).forEach(([key, count]) => {
        console.log(`   ${key}: ${count} products`);
      });
    }
    
    console.log('\n✅ Products data fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing data:', error.message);
  }
}

fixProductsData();
