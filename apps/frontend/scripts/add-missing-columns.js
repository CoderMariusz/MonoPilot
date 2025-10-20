const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pgroxddbtaevdegnidaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU'
);

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to products table...');
  
  try {
    // Check current columns
    console.log('Checking current columns...');
    const { data: currentData, error: currentError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.log('Error checking current columns:', currentError.message);
      return;
    }
    
    console.log('Current columns:', Object.keys(currentData[0] || {}));
    
    // Add missing columns one by one
    const columnsToAdd = [
      { name: 'std_price', type: 'DECIMAL(12,4)' },
      { name: 'notes', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'allergen_ids', type: 'INTEGER[]' },
      { name: 'rate', type: 'DECIMAL(10,2)' },
      { name: 'requires_routing', type: 'BOOLEAN DEFAULT false' },
      { name: 'default_routing_id', type: 'INTEGER' },
      { name: 'created_by', type: 'UUID REFERENCES public.users(id)' },
      { name: 'updated_by', type: 'UUID REFERENCES public.users(id)' }
    ];
    
    for (const column of columnsToAdd) {
      console.log(`Adding column: ${column.name} (${column.type})`);
      
      try {
        // Try to add the column
        const { error: addError } = await supabase
          .from('products')
          .select(column.name)
          .limit(1);
        
        if (addError && addError.code === 'PGRST204') {
          // Column doesn't exist, try to add it
          console.log(`Column ${column.name} doesn't exist, adding...`);
          
          // Try to insert a test record with the new column to trigger creation
          const testData = {};
          testData[column.name] = column.type.includes('INTEGER') ? 0 : 
                                 column.type.includes('DECIMAL') ? 0.0 :
                                 column.type.includes('BOOLEAN') ? false :
                                 column.type.includes('UUID') ? null :
                                 column.type.includes('[]') ? [] : '';
          
          const { error: insertError } = await supabase
            .from('products')
            .insert([{
              part_number: `TEST-${Date.now()}`,
              description: 'Test product for column creation',
              type: 'RM',
              uom: 'EA',
              product_group: 'MEAT',
              product_type: 'RM',
              is_active: true,
              ...testData
            }]);
          
          if (insertError) {
            console.log(`Error adding column ${column.name}:`, insertError.message);
          } else {
            console.log(`✅ Column ${column.name} added successfully`);
            // Clean up test record
            await supabase
              .from('products')
              .delete()
              .eq('part_number', `TEST-${Date.now()}`);
          }
        } else if (addError) {
          console.log(`Error checking column ${column.name}:`, addError.message);
        } else {
          console.log(`✅ Column ${column.name} already exists`);
        }
      } catch (error) {
        console.log(`Error processing column ${column.name}:`, error.message);
      }
    }
    
    // Check final columns
    console.log('\nChecking final columns...');
    const { data: finalData, error: finalError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (finalError) {
      console.log('Error checking final columns:', finalError.message);
    } else {
      console.log('Final columns:', Object.keys(finalData[0] || {}));
    }
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
  }
}

addMissingColumns().catch(console.error);
