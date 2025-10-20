const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProductsTable() {
  console.log('🔧 Fixing products table...');
  
  try {
    // Check current table structure
    console.log('Checking current table structure...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error checking table:', error.message);
      return;
    }
    
    console.log('Current columns:', Object.keys(data[0] || {}));
    
    // Add missing columns if they don't exist
    const alterTableSQL = `
      ALTER TABLE public.products 
      ADD COLUMN IF NOT EXISTS allergen_ids INTEGER[],
      ADD COLUMN IF NOT EXISTS product_group TEXT,
      ADD COLUMN IF NOT EXISTS product_type TEXT;
    `;
    
    console.log('Adding missing columns...');
    const { error: alterError } = await supabase.rpc('exec_sql', { sql_query: alterTableSQL });
    
    if (alterError) {
      console.log('Error altering table:', alterError.message);
    } else {
      console.log('✅ Table structure updated');
    }
    
    // Update existing products to have correct product_group and product_type
    console.log('Updating existing products...');
    const { error: updateError } = await supabase
      .from('products')
      .update({
        product_group: 'MEAT',
        product_type: 'RM'
      })
      .eq('part_number', 'MEAT-001');
    
    if (updateError) {
      console.log('Error updating products:', updateError.message);
    } else {
      console.log('✅ Products updated');
    }
    
  } catch (error) {
    console.error('❌ Error fixing table:', error.message);
  }
}

fixProductsTable().catch(console.error);
