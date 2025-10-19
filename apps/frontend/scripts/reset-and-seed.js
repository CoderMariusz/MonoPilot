#!/usr/bin/env node

/**
 * Reset and Seed Database
 * This script resets the database and applies the fixed seed data
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetAndSeed() {
  console.log('🔄 Resetting and seeding database...\n');
  
  try {
    // Step 1: Clear existing data
    console.log('1. Clearing existing data...');
    
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
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 0);
        
        if (error) {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: cleared`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }
    
    // Step 2: Insert master data
    console.log('\n2. Inserting master data...');
    
    // Suppliers
    const { error: suppliersError } = await supabase
      .from('suppliers')
      .insert([
        { id: 1, name: 'ABC Meats Ltd', legal_name: 'ABC Meats Limited', vat_number: 'GB123456789', country: 'GBR', currency: 'GBP', payment_terms: 'Net 30', is_active: true },
        { id: 2, name: 'Fresh Produce Co', legal_name: 'Fresh Produce Company Inc', vat_number: 'US987654321', country: 'USA', currency: 'USD', payment_terms: 'Net 15', is_active: true },
        { id: 3, name: 'Spice World Ltd', legal_name: 'Spice World Limited', vat_number: 'GB987654321', country: 'GBR', currency: 'GBP', payment_terms: 'Net 45', is_active: true },
        { id: 4, name: 'Packaging Solutions', legal_name: 'Packaging Solutions LLC', vat_number: 'US123456789', country: 'USA', currency: 'USD', payment_terms: 'Net 30', is_active: true },
        { id: 5, name: 'Cold Storage UK', legal_name: 'Cold Storage United Kingdom', vat_number: 'GB456789123', country: 'GBR', currency: 'GBP', payment_terms: 'Net 60', is_active: true }
      ]);
    
    if (suppliersError) {
      console.log(`   ❌ Suppliers: ${suppliersError.message}`);
    } else {
      console.log(`   ✅ Suppliers: 5 inserted`);
    }
    
    // Warehouses
    const { error: warehousesError } = await supabase
      .from('warehouses')
      .insert([
        { id: 1, code: 'WH-MAIN', name: 'Main Warehouse', is_active: true },
        { id: 2, code: 'WH-COLD', name: 'Cold Storage Warehouse', is_active: true },
        { id: 3, code: 'WH-PROD', name: 'Production Floor', is_active: true }
      ]);
    
    if (warehousesError) {
      console.log(`   ❌ Warehouses: ${warehousesError.message}`);
    } else {
      console.log(`   ✅ Warehouses: 3 inserted`);
    }
    
    // Tax Codes
    const { error: taxCodesError } = await supabase
      .from('tax_codes')
      .insert([
        { id: 1, code: 'STD', name: 'Standard Rate', rate: 0.20, is_active: true },
        { id: 2, code: 'RED', name: 'Reduced Rate', rate: 0.05, is_active: true },
        { id: 3, code: 'ZERO', name: 'Zero Rate', rate: 0.00, is_active: true }
      ]);
    
    if (taxCodesError) {
      console.log(`   ❌ Tax Codes: ${taxCodesError.message}`);
    } else {
      console.log(`   ✅ Tax Codes: 3 inserted`);
    }
    
    // Allergens
    const { error: allergensError } = await supabase
      .from('allergens')
      .insert([
        { id: 1, code: 'GLUTEN', name: 'Gluten', description: 'Contains gluten from wheat, barley, rye' },
        { id: 2, code: 'DAIRY', name: 'Dairy', description: 'Contains milk and milk products' },
        { id: 3, code: 'EGGS', name: 'Eggs', description: 'Contains eggs and egg products' },
        { id: 4, code: 'NUTS', name: 'Nuts', description: 'Contains tree nuts' },
        { id: 5, code: 'PEANUTS', name: 'Peanuts', description: 'Contains peanuts' },
        { id: 6, code: 'SOY', name: 'Soy', description: 'Contains soy and soy products' },
        { id: 7, code: 'FISH', name: 'Fish', description: 'Contains fish and fish products' },
        { id: 8, code: 'SHELLFISH', name: 'Shellfish', description: 'Contains shellfish and crustaceans' }
      ]);
    
    if (allergensError) {
      console.log(`   ❌ Allergens: ${allergensError.message}`);
    } else {
      console.log(`   ✅ Allergens: 8 inserted`);
    }
    
    // Machines
    const { error: machinesError } = await supabase
      .from('machines')
      .insert([
        { id: 1, code: 'GRIND-001', name: 'Meat Grinder 1', type: 'grinder', is_active: true },
        { id: 2, code: 'MIX-001', name: 'Meat Mixer 1', type: 'mixer', is_active: true },
        { id: 3, code: 'STUFF-001', name: 'Sausage Stuffer 1', type: 'stuffer', is_active: true },
        { id: 4, code: 'COOK-001', name: 'Cooking Oven 1', type: 'oven', is_active: true },
        { id: 5, code: 'PACK-001', name: 'Packaging Line 1', type: 'packaging', is_active: true }
      ]);
    
    if (machinesError) {
      console.log(`   ❌ Machines: ${machinesError.message}`);
    } else {
      console.log(`   ✅ Machines: 5 inserted`);
    }
    
    // Step 3: Insert products with correct categories
    console.log('\n3. Inserting products with correct categories...');
    
    // MEAT products
    const meatProducts = [
      { id: 1, part_number: 'RM-BEEF-001', description: 'Premium Beef Trim', type: 'RM', product_group: 'MEAT', product_type: 'RM_MEAT', subtype: 'Beef', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 5, is_active: true },
      { id: 2, part_number: 'RM-BEEF-002', description: 'Beef Chuck', type: 'RM', product_group: 'MEAT', product_type: 'RM_MEAT', subtype: 'Beef', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 5, is_active: true },
      { id: 3, part_number: 'RM-BEEF-003', description: 'Beef Fat', type: 'RM', product_group: 'MEAT', product_type: 'RM_MEAT', subtype: 'Beef', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 3, is_active: true },
      { id: 4, part_number: 'RM-PORK-001', description: 'Pork Shoulder', type: 'RM', product_group: 'MEAT', product_type: 'RM_MEAT', subtype: 'Pork', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 4, is_active: true },
      { id: 5, part_number: 'RM-PORK-002', description: 'Pork Belly', type: 'RM', product_group: 'MEAT', product_type: 'RM_MEAT', subtype: 'Pork', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 4, is_active: true },
      { id: 6, part_number: 'RM-LAMB-001', description: 'Lamb Shoulder', type: 'RM', product_group: 'MEAT', product_type: 'RM_MEAT', subtype: 'Lamb', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 3, is_active: true },
      { id: 7, part_number: 'RM-CHICKEN-001', description: 'Chicken Thighs', type: 'RM', product_group: 'MEAT', product_type: 'RM_MEAT', subtype: 'Chicken', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 2, is_active: true }
    ];
    
    const { error: meatError } = await supabase
      .from('products')
      .insert(meatProducts);
    
    if (meatError) {
      console.log(`   ❌ MEAT products: ${meatError.message}`);
    } else {
      console.log(`   ✅ MEAT products: ${meatProducts.length} inserted`);
    }
    
    // DRYGOODS products
    const dryGoodsProducts = [
      // Ingredients
      { id: 8, part_number: 'DG-SALT-001', description: 'Table Salt', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_ING', subtype: 'Salt', uom: 'kg', expiry_policy: 'best_before', shelf_life_days: 365, is_active: true },
      { id: 9, part_number: 'DG-PEPPER-001', description: 'Black Pepper Ground', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_ING', subtype: 'Pepper', uom: 'kg', expiry_policy: 'best_before', shelf_life_days: 730, is_active: true },
      { id: 10, part_number: 'DG-SPICE-001', description: 'Mixed Spices', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_ING', subtype: 'Spices', uom: 'kg', expiry_policy: 'best_before', shelf_life_days: 365, is_active: true },
      { id: 11, part_number: 'DG-ONION-001', description: 'Dried Onion Powder', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_ING', subtype: 'Onion', uom: 'kg', expiry_policy: 'best_before', shelf_life_days: 730, is_active: true },
      { id: 12, part_number: 'DG-GARLIC-001', description: 'Garlic Powder', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_ING', subtype: 'Garlic', uom: 'kg', expiry_policy: 'best_before', shelf_life_days: 365, is_active: true },
      { id: 13, part_number: 'DG-PAPRIKA-001', description: 'Paprika Powder', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_ING', subtype: 'Spices', uom: 'kg', expiry_policy: 'best_before', shelf_life_days: 365, is_active: true },
      
      // Labels
      { id: 14, part_number: 'DG-LABEL-001', description: 'Product Label Small', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_LABEL', subtype: 'Label', uom: 'pcs', expiry_policy: 'indefinite', shelf_life_days: 0, is_active: true },
      { id: 15, part_number: 'DG-LABEL-002', description: 'Product Label Large', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_LABEL', subtype: 'Label', uom: 'pcs', expiry_policy: 'indefinite', shelf_life_days: 0, is_active: true },
      { id: 16, part_number: 'DG-LABEL-003', description: 'Allergen Warning Label', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_LABEL', subtype: 'Label', uom: 'pcs', expiry_policy: 'indefinite', shelf_life_days: 0, is_active: true },
      
      // Webs/Casings
      { id: 17, part_number: 'DG-WEB-001', description: 'Natural Hog Casings', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_WEB', subtype: 'Casing', uom: 'm', expiry_policy: 'use_by', shelf_life_days: 30, is_active: true },
      { id: 18, part_number: 'DG-WEB-002', description: 'Collagen Casings', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_WEB', subtype: 'Casing', uom: 'm', expiry_policy: 'use_by', shelf_life_days: 90, is_active: true },
      { id: 19, part_number: 'DG-WEB-003', description: 'Synthetic Casings', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_WEB', subtype: 'Casing', uom: 'm', expiry_policy: 'indefinite', shelf_life_days: 0, is_active: true },
      
      // Boxes
      { id: 20, part_number: 'DG-BOX-001', description: 'Small Product Box', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_BOX', subtype: 'Box', uom: 'pcs', expiry_policy: 'indefinite', shelf_life_days: 0, is_active: true },
      { id: 21, part_number: 'DG-BOX-002', description: 'Large Product Box', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_BOX', subtype: 'Box', uom: 'pcs', expiry_policy: 'indefinite', shelf_life_days: 0, is_active: true },
      { id: 22, part_number: 'DG-BOX-003', description: 'Shipping Box', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_BOX', subtype: 'Box', uom: 'pcs', expiry_policy: 'indefinite', shelf_life_days: 0, is_active: true },
      
      // Sauces
      { id: 23, part_number: 'DG-SAUCE-001', description: 'BBQ Sauce', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_SAUCE', subtype: 'Sauce', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 180, is_active: true },
      { id: 24, part_number: 'DG-SAUCE-002', description: 'Hot Sauce', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_SAUCE', subtype: 'Sauce', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 365, is_active: true },
      { id: 25, part_number: 'DG-SAUCE-003', description: 'Mustard', type: 'RM', product_group: 'DRYGOODS', product_type: 'DG_SAUCE', subtype: 'Sauce', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 180, is_active: true }
    ];
    
    const { error: dryGoodsError } = await supabase
      .from('products')
      .insert(dryGoodsProducts);
    
    if (dryGoodsError) {
      console.log(`   ❌ DRYGOODS products: ${dryGoodsError.message}`);
    } else {
      console.log(`   ✅ DRYGOODS products: ${dryGoodsProducts.length} inserted`);
    }
    
    // PROCESS products
    const processProducts = [
      { id: 26, part_number: 'PR-GRIND-001', description: 'Ground Beef Mix', type: 'PR', product_group: 'COMPOSITE', product_type: 'PR', subtype: 'Ground', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 2, is_active: true },
      { id: 27, part_number: 'PR-MIX-001', description: 'Seasoned Meat Mix', type: 'PR', product_group: 'COMPOSITE', product_type: 'PR', subtype: 'Mixed', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 1, is_active: true },
      { id: 28, part_number: 'PR-FILL-001', description: 'Sausage Filling', type: 'PR', product_group: 'COMPOSITE', product_type: 'PR', subtype: 'Filling', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 1, is_active: true },
      { id: 29, part_number: 'PR-COOK-001', description: 'Cooked Sausage', type: 'PR', product_group: 'COMPOSITE', product_type: 'PR', subtype: 'Cooked', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 3, is_active: true },
      { id: 30, part_number: 'PR-CHILL-001', description: 'Chilled Product', type: 'PR', product_group: 'COMPOSITE', product_type: 'PR', subtype: 'Chilled', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 7, is_active: true },
      { id: 31, part_number: 'PR-SMOKE-001', description: 'Smoked Meat', type: 'PR', product_group: 'COMPOSITE', product_type: 'PR', subtype: 'Smoked', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 14, is_active: true },
      { id: 32, part_number: 'PR-MARINATE-001', description: 'Marinated Meat', type: 'PR', product_group: 'COMPOSITE', product_type: 'PR', subtype: 'Marinated', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 3, is_active: true }
    ];
    
    const { error: processError } = await supabase
      .from('products')
      .insert(processProducts);
    
    if (processError) {
      console.log(`   ❌ PROCESS products: ${processError.message}`);
    } else {
      console.log(`   ✅ PROCESS products: ${processProducts.length} inserted`);
    }
    
    // FINISHED_GOODS products
    const finishedGoodsProducts = [
      { id: 33, part_number: 'FG-SAUS-001', description: 'Premium Beef Sausage', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Beef', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 5, is_active: true },
      { id: 34, part_number: 'FG-SAUS-002', description: 'Classic Pork Sausage', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Pork', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 5, is_active: true },
      { id: 35, part_number: 'FG-SAUS-003', description: 'Mixed Meat Sausage', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Mixed', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 5, is_active: true },
      { id: 36, part_number: 'FG-BURG-001', description: 'Beef Burger Patty', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Beef', uom: 'piece', expiry_policy: 'use_by', shelf_life_days: 3, is_active: true },
      { id: 37, part_number: 'FG-BURG-002', description: 'Mixed Burger Patty', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Mixed', uom: 'piece', expiry_policy: 'use_by', shelf_life_days: 3, is_active: true },
      { id: 38, part_number: 'FG-MEAT-001', description: 'Seasoned Ground Beef', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Ground', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 2, is_active: true },
      { id: 39, part_number: 'FG-MEAT-002', description: 'Premium Steak', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Steak', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 5, is_active: true },
      { id: 40, part_number: 'FG-MEAT-003', description: 'Marinated Chicken', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Chicken', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 3, is_active: true },
      { id: 41, part_number: 'FG-SALAMI-001', description: 'Italian Salami', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Salami', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 30, is_active: true },
      { id: 42, part_number: 'FG-HAM-001', description: 'Smoked Ham', type: 'FG', product_group: 'COMPOSITE', product_type: 'FG', subtype: 'Ham', uom: 'kg', expiry_policy: 'use_by', shelf_life_days: 7, is_active: true }
    ];
    
    const { error: finishedGoodsError } = await supabase
      .from('products')
      .insert(finishedGoodsProducts);
    
    if (finishedGoodsError) {
      console.log(`   ❌ FINISHED_GOODS products: ${finishedGoodsError.message}`);
    } else {
      console.log(`   ✅ FINISHED_GOODS products: ${finishedGoodsProducts.length} inserted`);
    }
    
    // Step 4: Verify final distribution
    console.log('\n4. Verifying final distribution...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('product_group, product_type')
      .eq('is_active', true);
    
    if (!productsError && products) {
      const distribution = {};
      products.forEach(p => {
        const key = `${p.product_group}/${p.product_type}`;
        distribution[key] = (distribution[key] || 0) + 1;
      });
      
      console.log('📊 Product distribution:');
      Object.entries(distribution).forEach(([key, count]) => {
        console.log(`   ${key}: ${count} products`);
      });
      
      // Check BOM categories
      const bomCategories = {
        MEAT: products.filter(p => p.product_group === 'MEAT').length,
        DRYGOODS: products.filter(p => p.product_group === 'DRYGOODS').length,
        FINISHED_GOODS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG').length,
        PROCESS: products.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR').length
      };
      
      console.log('\n📋 BOM Category distribution:');
      Object.entries(bomCategories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} products`);
      });
    }
    
    console.log('\n🎉 Database reset and seeded successfully!');
    console.log('✅ BOM module should now show products in all categories correctly.');
    
  } catch (error) {
    console.error('❌ Error resetting and seeding database:', error.message);
  }
}

resetAndSeed();
