const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkSchema() {
  try {
    // Check columns in bom_items
    const { data, error } = await supabase
      .from('bom_items')
      .select('*')
      .limit(0) // Don't fetch any rows, just get column info

    if (error) {
      console.error('Error:', error)

      // Try to get schema info from information_schema
      console.log('\nTrying direct SQL query...')
      const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
        query: `SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'bom_items'
                ORDER BY ordinal_position;`
      })

      if (schemaError) {
        console.error('Schema query error:', schemaError)
      } else {
        console.log('Schema:', schemaData)
      }
    } else {
      console.log('Table exists, columns available through API')

      // Try to insert a test record to see which columns are expected
      const testInsert = {
        bom_id: '00000000-0000-0000-0000-000000000000',
        product_id: '00000000-0000-0000-0000-000000000000',
        quantity: 1,
        uom: 'kg',
        sequence: 1,
        operation_seq: 1,
        is_output: false,
        consume_whole_lp: false
      }

      const { error: insertError } = await supabase
        .from('bom_items')
        .insert(testInsert)
        .select()

      if (insertError) {
        console.log('\nInsert error (expected):', insertError.message)
        console.log('Details:', insertError.details)
        console.log('Hint:', insertError.hint)
      }
    }
  } catch (err) {
    console.error('Exception:', err)
  }
}

checkSchema()
