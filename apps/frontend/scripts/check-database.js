const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase database...');
  
  try {
    // Check if products table exists
    console.log('Checking products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (productsError) {
      console.log('❌ Products table does not exist');
      console.log('Error:', productsError.message);
      return false;
    }
    
    console.log('✅ Products table exists');
    console.log('Products count:', products?.length || 0);
    
    // Check if users table exists
    console.log('Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table does not exist');
      console.log('Error:', usersError.message);
    } else {
      console.log('✅ Users table exists');
      console.log('Users count:', users?.length || 0);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    return false;
  }
}

async function createBasicTables() {
  console.log('🔨 Creating basic tables...');
  
  // Create products table
  const createProductsSQL = `
    CREATE TABLE IF NOT EXISTS public.products (
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
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES public.users(id),
      updated_by UUID REFERENCES public.users(id)
    );
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: createProductsSQL });
    if (error) {
      console.log('Error creating products table:', error.message);
    } else {
      console.log('✅ Products table created');
    }
  } catch (error) {
    console.log('Error creating products table:', error.message);
  }
}

async function addSeedData() {
  console.log('🌱 Adding seed data...');
  
  // Add basic products
  const products = [
    {
      part_number: 'MEAT-001',
      description: 'Beef Chuck',
      type: 'RM',
      uom: 'kg',
      category: 'MEAT',
      std_price: 25.50,
      is_active: true
    },
    {
      part_number: 'DRY-001',
      description: 'Flour',
      type: 'RM',
      uom: 'kg',
      category: 'DRYGOODS',
      std_price: 2.50,
      is_active: true
    },
    {
      part_number: 'FG-001',
      description: 'Finished Product',
      type: 'FG',
      uom: 'box',
      category: 'FINISHED_GOODS',
      std_price: 50.00,
      is_active: true
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(products);
    
    if (error) {
      console.log('Error inserting products:', error.message);
    } else {
      console.log('✅ Seed data added');
    }
  } catch (error) {
    console.log('Error adding seed data:', error.message);
  }
}

async function main() {
  const tablesExist = await checkDatabase();
  
  if (!tablesExist) {
    await createBasicTables();
    await addSeedData();
  }
  
  console.log('✅ Database check complete!');
}

main().catch(console.error);
