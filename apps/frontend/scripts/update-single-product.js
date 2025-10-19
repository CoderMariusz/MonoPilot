#!/usr/bin/env node

/**
 * Update Single Product
 * This script updates one product to test if updates work
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateSingleProduct() {
  console.log('🔧 Testing single product update...\n');
  
  try {
    // Get first product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, part_number, description, product_group, product_type')
      .eq('id', 1)
      .single();
    
    if (fetchError) {
      console.log('❌ Error fetching product:', fetchError.message);
      return;
    }
    
    console.log('📋 Current product:', product);
    
    // Try to update it
    const { data: updateData, error: updateError } = await supabase
      .from('products')
      .update({
        product_group: 'MEAT',
        product_type: 'RM_MEAT'
      })
      .eq('id', 1)
      .select();
    
    if (updateError) {
      console.log('❌ Error updating product:', updateError.message);
      console.log('Error details:', updateError);
    } else {
      console.log('✅ Product updated successfully:', updateData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateSingleProduct();
