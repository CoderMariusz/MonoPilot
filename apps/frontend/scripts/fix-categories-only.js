#!/usr/bin/env node

/**
 * Fix Categories Only
 * This script only fixes product categories without applying migrations
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixCategoriesOnly() {
  console.log('🔧 Fixing product categories only...\n');
  
  try {
    // Step 1: Check current state
    console.log('1. Checking current state...');
    
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, part_number, description, product_group, product_type')
      .eq('is_active', true);
    
    if (fetchError) {
      console.log('❌ Error fetching products:', fetchError.message);
      return;
    }
    
    console.log(`📋 Found ${products?.length || 0} products`);
    
    if (!products || products.length === 0) {
      console.log('⚠️  No products found');
      return;
    }
    
    // Show current distribution
    console.log('\n📊 Current distribution:');
    const currentDist = {};
    products.forEach(p => {
      const key = `${p.product_group}/${p.product_type}`;
      currentDist[key] = (currentDist[key] || 0) + 1;
    });
    Object.entries(currentDist).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} products`);
    });
    
    // Check BOM categories
    const bomCategories = {
      MEAT: products.filter(p => p.product_group === 'MEAT').length,
      DRYGOODS: products.filter(p => p.product_group === 'DRYGOODS').length,
      FINISHED_GOODS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG').length,
      PROCESS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR').length
    };
    
    console.log('\n📋 Current BOM Categories:');
    Object.entries(bomCategories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });
    
    // Step 2: Fix categories based on part_number
    console.log('\n2. Fixing categories...');
    
    let updated = 0;
    let errors = 0;
    
    for (const product of products) {
      const partNumber = product.part_number;
      let newProductGroup = 'COMPOSITE';
      let newProductType = 'FG';
      
      // MEAT - all RM-BEEF, RM-PORK, RM-LAMB, RM-CHICKEN
      if (partNumber.startsWith('RM-BEEF-') || partNumber.startsWith('RM-PORK-') || 
          partNumber.startsWith('RM-LAMB-') || partNumber.startsWith('RM-CHICKEN-')) {
        newProductGroup = 'MEAT';
        newProductType = 'RM_MEAT';
      }
      // DRYGOODS - all DG- products
      else if (partNumber.startsWith('DG-')) {
        newProductGroup = 'DRYGOODS';
        if (partNumber.includes('SALT') || partNumber.includes('PEPPER') || partNumber.includes('SPICE') || 
            partNumber.includes('ONION') || partNumber.includes('GARLIC') || partNumber.includes('PAPRIKA')) {
          newProductType = 'DG_ING';
        } else if (partNumber.includes('LABEL')) {
          newProductType = 'DG_LABEL';
        } else if (partNumber.includes('WEB') || partNumber.includes('CASING')) {
          newProductType = 'DG_WEB';
        } else if (partNumber.includes('BOX')) {
          newProductType = 'DG_BOX';
        } else if (partNumber.includes('SAUCE')) {
          newProductType = 'DG_SAUCE';
        } else {
          newProductType = 'DG_ING';
        }
      }
      // PROCESS - all PR- products
      else if (partNumber.startsWith('PR-')) {
        newProductGroup = 'COMPOSITE';
        newProductType = 'PR';
      }
      // FINISHED_GOODS - all FG- products
      else if (partNumber.startsWith('FG-')) {
        newProductGroup = 'COMPOSITE';
        newProductType = 'FG';
      }
      
      // Only update if different
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
            errors++;
          } else {
            console.log(`✅ Updated ${product.part_number}: ${product.product_group}/${product.product_type} → ${newProductGroup}/${newProductType}`);
            updated++;
          }
        } catch (err) {
          console.log(`❌ Error updating ${product.part_number}: ${err.message}`);
          errors++;
        }
      }
    }
    
    console.log(`\n📊 Updated ${updated} products, ${errors} errors`);
    
    // Step 3: Show final distribution
    console.log('\n3. Final distribution:');
    
    const { data: finalProducts, error: finalError } = await supabase
      .from('products')
      .select('product_group, product_type')
      .eq('is_active', true);
    
    if (!finalError && finalProducts) {
      const finalDist = {};
      finalProducts.forEach(p => {
        const key = `${p.product_group}/${p.product_type}`;
        finalDist[key] = (finalDist[key] || 0) + 1;
      });
      
      console.log('📊 Product distribution:');
      Object.entries(finalDist).forEach(([key, count]) => {
        console.log(`   ${key}: ${count} products`);
      });
      
      // Check BOM categories
      const finalBomCategories = {
        MEAT: finalProducts.filter(p => p.product_group === 'MEAT').length,
        DRYGOODS: finalProducts.filter(p => p.product_group === 'DRYGOODS').length,
        FINISHED_GOODS: finalProducts.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG').length,
        PROCESS: finalProducts.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR').length
      };
      
      console.log('\n📋 Final BOM Categories:');
      Object.entries(finalBomCategories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} products`);
      });
      
      // Check if we have products in all categories
      const hasAllCategories = finalBomCategories.MEAT > 0 && 
                              finalBomCategories.DRYGOODS > 0 && 
                              finalBomCategories.PROCESS > 0 && 
                              finalBomCategories.FINISHED_GOODS > 0;
      
      if (hasAllCategories) {
        console.log('\n🎉 SUCCESS! All categories have products!');
        console.log('✅ BOM should now work correctly with products in all categories.');
      } else {
        console.log('\n⚠️  Some categories are still empty:');
        Object.entries(finalBomCategories).forEach(([category, count]) => {
          if (count === 0) {
            console.log(`   ❌ ${category}: ${count} products`);
          } else {
            console.log(`   ✅ ${category}: ${count} products`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing categories:', error.message);
  }
}

fixCategoriesOnly();
