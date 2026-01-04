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
  console.log('Querying table schemas...\n');

  const tables = ['users', 'suppliers', 'warehouses', 'products'];

  for (const table of tables) {
    console.log(`\n=== ${table.toUpperCase()} TABLE ===`);

    // Query columns
    const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table}'
        ORDER BY ordinal_position
      `
    });

    if (colError) {
      console.error(`Error querying ${table}:`, colError);

      // Try direct query instead
      const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (!sampleError && sample && sample.length > 0) {
        console.log('Columns (from sample data):', Object.keys(sample[0]));
      }
    } else {
      console.log('Columns:', columns);
    }
  }

  // Check warehouse type constraint
  console.log('\n\n=== WAREHOUSES TYPE CONSTRAINT ===');
  const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'warehouses' AND con.contype = 'c'
    `
  });

  if (constraintError) {
    console.error('Error querying constraints:', constraintError);
  } else {
    console.log('Check constraints:', constraints);
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
