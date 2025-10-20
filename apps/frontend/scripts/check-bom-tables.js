const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pgroxddbtaevdegnidaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU'
);

async function checkBomTables() {
  try {
    // Check bom table
    console.log('Checking bom table...');
    const { data: bomData, error: bomError } = await supabase
      .from('bom')
      .select('*')
      .limit(1);
    
    if (bomError) {
      console.log('BOM table error:', bomError.message);
    } else {
      console.log('BOM table exists, columns:', Object.keys(bomData[0] || {}));
    }
    
    // Check bom_items table
    console.log('\nChecking bom_items table...');
    const { data: bomItemsData, error: bomItemsError } = await supabase
      .from('bom_items')
      .select('*')
      .limit(1);
    
    if (bomItemsError) {
      console.log('BOM_ITEMS table error:', bomItemsError.message);
    } else {
      console.log('BOM_ITEMS table exists, columns:', Object.keys(bomItemsData[0] || {}));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBomTables();
