const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking existing tables...');
  
  try {
    // Check if products table exists
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (productsError) {
      console.log('Products table does not exist, creating...');
      return false;
    }
    
    console.log('Products table exists');
    return true;
  } catch (error) {
    console.log('Error checking tables:', error.message);
    return false;
  }
}

async function createTables() {
  console.log('Creating tables...');
  
  // Read the migration files
  const fs = require('fs');
  const path = require('path');
  
  const migrationsDir = path.join(__dirname, '../lib/supabase/migrations');
  const migrationFiles = [
    '001_planning_tables.sql',
    '002_rls_policies.sql',
    '003_phase14_schema.sql',
    '004_phase14_rpc_functions.sql',
    '005_product_taxonomy_enums.sql',
    '006_tax_allergens.sql',
    '007_supplier_products.sql',
    '008_bom_routing.sql',
    '009_routing_requirements.sql',
    '010_production_enums.sql',
    '011_work_orders_enhancement.sql',
    '012_license_plates_enhancement.sql',
    '013_stock_moves_enhancement.sql',
    '014_production_outputs.sql',
    '015_wo_operations_enhancement.sql',
    '016_lp_numbering_trigger.sql',
    '017_qa_gate_policies.sql',
    '018_yield_views.sql',
    '019_scanner_core_enhancements.sql',
    '020_lp_reservations.sql',
    '021_lp_compositions.sql',
    '022_pallets.sql',
    '023_sequential_routing_enforcement.sql',
    '024_license_plates_stage_suffix_enhancement.sql',
    '025_enhanced_trace_functions.sql'
  ];
  
  for (const file of migrationFiles) {
    try {
      const sqlPath = path.join(migrationsDir, file);
      if (fs.existsSync(sqlPath)) {
        console.log(`Executing ${file}...`);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.error(`Error executing ${file}:`, error.message);
        } else {
          console.log(`✅ ${file} executed successfully`);
        }
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }
}

async function seedData() {
  console.log('Seeding data...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const seedPath = path.join(__dirname, '../lib/supabase/migrations/seed_database.sql');
    if (fs.existsSync(seedPath)) {
      const sql = fs.readFileSync(seedPath, 'utf8');
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('Error seeding data:', error.message);
      } else {
        console.log('✅ Data seeded successfully');
      }
    }
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
}

async function main() {
  console.log('🚀 Setting up Supabase database...');
  
  const tablesExist = await checkTables();
  
  if (!tablesExist) {
    await createTables();
    await seedData();
  } else {
    console.log('Tables already exist, skipping creation');
  }
  
  console.log('✅ Database setup complete!');
}

main().catch(console.error);
