const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pgroxddbtaevdegnidaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU'
);

async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error:', error.message);
      return;
    }
    
    console.log('Columns in products table:');
    console.log(Object.keys(data[0] || {}));
    
    // Check what columns the modal is trying to use
    console.log('\nColumns used in AddItemModal:');
    console.log([
      'id', 'part_number', 'description', 'type', 'uom', 'is_active', 
      'category', 'subtype', 'expiry_policy', 'shelf_life_days', 'std_price',
      'allergen_ids', 'rate', 'production_lines', 'created_at', 'updated_at',
      'created_by', 'updated_by', 'product_group', 'product_type'
    ]);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkColumns();
