#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simpleFix() {
  console.log('🔧 Simple fix for categories...\n');
  
  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, part_number, product_group, product_type')
      .eq('is_active', true);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`📋 Found ${products?.length || 0} products`);
    
    if (!products || products.length === 0) {
      console.log('⚠️  No products found');
      return;
    }
    
    // Show current state
    console.log('\n📊 Current state:');
    products.slice(0, 5).forEach(p => {
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
    
    // If all products are in FINISHED_GOODS, we need to fix them
    if (bomCategories.MEAT === 0 && bomCategories.DRYGOODS === 0 && bomCategories.PROCESS === 0) {
      console.log('\n🔧 All products are in FINISHED_GOODS, fixing...');
      
      let updated = 0;
      for (const product of products) {
        const partNumber = product.part_number;
        let newProductGroup = 'COMPOSITE';
        let newProductType = 'FG';
        
        // MEAT
        if (partNumber.startsWith('RM-BEEF-') || partNumber.startsWith('RM-PORK-') || 
            partNumber.startsWith('RM-LAMB-') || partNumber.startsWith('RM-CHICKEN-')) {
          newProductGroup = 'MEAT';
          newProductType = 'RM_MEAT';
        }
        // DRYGOODS
        else if (partNumber.startsWith('DG-')) {
          newProductGroup = 'DRYGOODS';
          newProductType = 'DG_ING';
        }
        // PROCESS
        else if (partNumber.startsWith('PR-')) {
          newProductGroup = 'COMPOSITE';
          newProductType = 'PR';
        }
        // FINISHED_GOODS
        else if (partNumber.startsWith('FG-')) {
          newProductGroup = 'COMPOSITE';
          newProductType = 'FG';
        }
        
        // Update if different
        if (newProductGroup !== product.product_group || newProductType !== product.product_type) {
          try {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                product_group: newProductGroup,
                product_type: newProductType
              })
              .eq('id', product.id);
            
            if (updateError) {
              console.log(`❌ Error updating ${product.part_number}: ${updateError.message}`);
            } else {
              console.log(`✅ Updated ${product.part_number}: ${newProductGroup}/${newProductType}`);
              updated++;
            }
          } catch (err) {
            console.log(`❌ Error updating ${product.part_number}: ${err.message}`);
          }
        }
      }
      
      console.log(`\n📊 Updated ${updated} products`);
    } else {
      console.log('\n✅ Categories look correct!');
    }
    
    // Show final state
    console.log('\n🔍 Final state:');
    const { data: finalProducts, error: finalError } = await supabase
      .from('products')
      .select('product_group, product_type')
      .eq('is_active', true);
    
    if (!finalError && finalProducts) {
      const finalBomCategories = {
        MEAT: finalProducts.filter(p => p.product_group === 'MEAT').length,
        DRYGOODS: finalProducts.filter(p => p.product_group === 'DRYGOODS').length,
        FINISHED_GOODS: finalProducts.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG').length,
        PROCESS: finalProducts.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR').length
      };
      
      console.log('📋 Final BOM Categories:');
      Object.entries(finalBomCategories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} products`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleFix();
