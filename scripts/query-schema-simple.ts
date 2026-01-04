import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function querySchema() {
  console.log('Querying table schemas by fetching sample records...\n');

  const tables = ['users', 'suppliers', 'warehouses', 'products'];

  for (const table of tables) {
    console.log(`\n=== ${table.toUpperCase()} TABLE ===`);

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Error querying ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).sort());
      console.log('Sample record:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No records found. Attempting insert to see required columns...');

      // Try empty insert to get error with column info
      const { error: insertError } = await supabase
        .from(table)
        .insert({});

      if (insertError) {
        console.log('Insert error (reveals required columns):', insertError.message);
      }
    }
  }

  // Check warehouse records to see actual type values
  console.log('\n\n=== WAREHOUSES TYPE VALUES ===');
  const { data: warehouses, error: whError } = await supabase
    .from('warehouses')
    .select('id, name, type')
    .limit(10);

  if (whError) {
    console.error('Error:', whError.message);
  } else {
    console.log('Existing warehouse types:', warehouses);
  }
}

querySchema()
  .then(() => {
    console.log('\n\nSchema query complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
