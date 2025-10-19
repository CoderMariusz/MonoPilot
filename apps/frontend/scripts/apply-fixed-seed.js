#!/usr/bin/env node

/**
 * Apply Fixed Seed Data
 * This script applies the corrected seed data with proper categories
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyFixedSeed() {
  console.log('🌱 Applying fixed seed data...\n');
  
  try {
    // Read the fixed seed file
    const seedPath = path.join(__dirname, '..', 'lib', 'supabase', 'migrations', 'seed_database_fixed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Split into individual statements
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute statements one by one
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`❌ Statement ${i + 1}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1}: executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Fixed seed data applied successfully!');
      
      // Verify the data
      console.log('\n🔍 Verifying data...');
      
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
    }
    
  } catch (error) {
    console.error('❌ Error applying seed data:', error.message);
  }
}

applyFixedSeed();
