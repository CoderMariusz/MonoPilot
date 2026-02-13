import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function check() {
  const { data } = await supabase.from('suppliers').select('id, code, name')
  console.log('Suppliers:', JSON.stringify(data, null, 2))
}
check()
