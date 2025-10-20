const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAllergenColumn() {
  console.log('🔧 Adding allergen_ids column...');
  
  try {
    // Try to add the column using a direct SQL query
    const { data, error } = await supabase
      .from('products')
      .select('allergen_ids')
      .limit(1);
    
    if (error && error.code === 'PGRST204') {
      console.log('Column allergen_ids does not exist, trying to add it...');
      
      // Try to add the column by inserting a product with allergen_ids
      const { data: insertData, error: insertError } = await supabase
        .from('products')
        .insert({
          part_number: 'TEST-ALLERGEN',
          description: 'Test product for allergen column',
          type: 'RM',
          uom: 'EA',
          product_group: 'MEAT',
          product_type: 'RM',
          allergen_ids: [1, 2, 3]
        });
      
      if (insertError) {
        console.log('Error inserting test product:', insertError.message);
        console.log('This means the column does not exist and cannot be added via API');
      } else {
        console.log('✅ Column allergen_ids exists or was created');
        // Clean up test product
        await supabase.from('products').delete().eq('part_number', 'TEST-ALLERGEN');
      }
    } else if (error) {
      console.log('Other error:', error.message);
    } else {
      console.log('✅ Column allergen_ids already exists');
    }
    
  } catch (error) {
    console.error('❌ Error checking column:', error.message);
  }
}

addAllergenColumn().catch(console.error);
