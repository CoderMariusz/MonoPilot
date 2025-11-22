// Direct SQL execution via Supabase client
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg'

const supabase = createClient(supabaseUrl, supabaseKey)

// Read migration file
const sql = readFileSync('./apps/frontend/lib/supabase/migrations/010_create_allergens_table.sql', 'utf-8')

console.log('🚀 Executing Migration 010...\n')
console.log('SQL Preview:')
console.log(sql.substring(0, 200) + '...\n')

// Split SQL into individual statements and execute
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`Found ${statements.length} SQL statements to execute\n`)

async function execute() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';'
    if (stmt.trim().length < 10) continue // Skip very short statements

    console.log(`Executing statement ${i + 1}/${statements.length}...`)

    try {
      // Execute via raw SQL endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          name: 'exec',
          params: { sql: stmt }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.log(`⚠️  Statement ${i + 1} response: ${response.status}`)
        if (error && !error.includes('already exists')) {
          console.error(`Error: ${error}`)
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed`)
      }
    } catch (error) {
      console.error(`❌ Error executing statement ${i + 1}:`, error.message)
    }
  }

  console.log('\n✅ Migration execution completed')
  console.log('\n📝 Note: If you see errors, please run the SQL manually in Supabase Studio SQL Editor')
  console.log(`   URL: ${supabaseUrl.replace('.supabase.co', '')}/project/default/sql`)
}

execute()
