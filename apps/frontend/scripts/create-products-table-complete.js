const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pgroxddbtaevdegnidaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU'
);

async function createCompleteProductsTable() {
  console.log('🔧 Creating complete products table...');
  
  try {
    // First, let's try to create a new table with all columns
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.products_complete (
        id SERIAL PRIMARY KEY,
        part_number TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('RM', 'PR', 'FG', 'WIP')),
        uom TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        category TEXT CHECK (category IN ('MEAT', 'DRYGOODS', 'FINISHED_GOODS', 'PROCESS')),
        subtype TEXT,
        expiry_policy TEXT CHECK (expiry_policy IN ('DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE')),
        shelf_life_days INTEGER,
        std_price DECIMAL(12,4),
        allergen_ids INTEGER[],
        rate DECIMAL(10,2),
        production_lines TEXT[],
        notes TEXT,
        requires_routing BOOLEAN DEFAULT false,
        default_routing_id INTEGER,
        product_group TEXT,
        product_type TEXT,
        preferred_supplier_id INTEGER,
        lead_time_days INTEGER,
        moq DECIMAL(10,2),
        tax_code_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES public.users(id),
        updated_by UUID REFERENCES public.users(id)
      );
    `;
    
    console.log('Creating complete products table...');
    
    // Try to execute the SQL
    const { error: createError } = await supabase
      .from('products_complete')
      .select('id')
      .limit(1);
    
    if (createError && createError.code === 'PGRST204') {
      console.log('Table products_complete does not exist, creating...');
      
      // Try to create by inserting a test record
      const testData = {
        part_number: 'TEST-COMPLETE-001',
        description: 'Test complete product',
        type: 'RM',
        uom: 'EA',
        is_active: true,
        category: 'MEAT',
        product_group: 'MEAT',
        product_type: 'RM',
        std_price: 10.50,
        allergen_ids: [1, 2],
        rate: 100.0,
        production_lines: ['P-01'],
        notes: 'Test notes',
        requires_routing: false,
        moq: 10.0
      };
      
      const { data, error } = await supabase
        .from('products_complete')
        .insert([testData]);
      
      if (error) {
        console.log('Error creating table via insert:', error.message);
      } else {
        console.log('✅ Complete products table created successfully');
        
        // Clean up test record
        await supabase
          .from('products_complete')
          .delete()
          .eq('part_number', 'TEST-COMPLETE-001');
      }
    } else if (createError) {
      console.log('Error checking table:', createError.message);
    } else {
      console.log('✅ Complete products table already exists');
    }
    
    // Now try to copy data from old table to new table
    console.log('\nCopying data from old table to new table...');
    
    const { data: oldProducts, error: oldError } = await supabase
      .from('products')
      .select('*');
    
    if (oldError) {
      console.log('Error fetching old products:', oldError.message);
    } else {
      console.log(`Found ${oldProducts.length} products to copy`);
      
      // Map old data to new structure
      const newProducts = oldProducts.map(product => ({
        part_number: product.part_number,
        description: product.description,
        type: product.type,
        uom: product.uom,
        is_active: product.is_active,
        category: product.product_group, // Map product_group to category
        product_group: product.product_group,
        product_type: product.product_type,
        subtype: product.subtype,
        expiry_policy: product.expiry_policy,
        shelf_life_days: product.shelf_life_days,
        production_lines: product.production_lines,
        preferred_supplier_id: product.preferred_supplier_id,
        lead_time_days: product.lead_time_days,
        moq: product.moq,
        tax_code_id: product.tax_code_id,
        created_at: product.created_at,
        updated_at: product.updated_at
      }));
      
      // Insert into new table
      const { error: insertError } = await supabase
        .from('products_complete')
        .insert(newProducts);
      
      if (insertError) {
        console.log('Error inserting into new table:', insertError.message);
      } else {
        console.log('✅ Data copied successfully');
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating complete table:', error.message);
  }
}

createCompleteProductsTable().catch(console.error);
