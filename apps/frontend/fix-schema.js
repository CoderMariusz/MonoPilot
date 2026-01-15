const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' }
})

async function fixSchema() {
  try {
    console.log('Executing ALTER TABLE to rename is_by_product to is_output...')

    // Use REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        query: `
          ALTER TABLE bom_items RENAME COLUMN is_by_product TO is_output;
          COMMENT ON COLUMN bom_items.is_output IS 'If true, this is an output by-product, not an input';
          NOTIFY pgrst, 'reload schema';
        `
      })
    })

    const result = await response.text()
    console.log('Response:', response.status, result)

    if (!response.ok) {
      console.error('Failed to execute SQL')

      // Try alternative method - direct SQL through postgres-meta
      console.log('\nTrying alternative method with SQL query...')

      const sqlQuery = `ALTER TABLE bom_items RENAME COLUMN is_by_product TO is_output;`

      const altResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: sqlQuery })
      })

      const altResult = await altResponse.text()
      console.log('Alt Response:', altResponse.status, altResult)
    }

  } catch (err) {
    console.error('Exception:', err.message)
    console.log('\n===========================================')
    console.log('Please execute this SQL manually in Supabase Dashboard SQL Editor:')
    console.log('===========================================')
    console.log(`
ALTER TABLE bom_items RENAME COLUMN is_by_product TO is_output;
COMMENT ON COLUMN bom_items.is_output IS 'If true, this is an output by-product, not an input';
NOTIFY pgrst, 'reload schema';
    `)
    console.log('===========================================')
  }
}

fixSchema()
