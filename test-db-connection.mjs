import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  // Get list of all tables
  const { data: tables, error: tableError } = await supabase
    .rpc('get_tables');

  if (tableError) {
    console.log('⚠️ Could not get table list via RPC, trying direct query...');

    // Fallback: query information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (schemaError) {
      console.log('⚠️ Could not query information_schema, listing known tables...');
    } else {
      console.log('\n📋 Tables in public schema:');
      schemaData.forEach(t => console.log(`   - ${t.table_name}`));
    }
  }

  // Test organizations table (get all columns)
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (orgError) {
    console.error('\n❌ Error querying organizations:', orgError.message);
  } else {
    console.log('\n✅ Organizations table structure:');
    if (orgs.length > 0) {
      console.log('   Columns:', Object.keys(orgs[0]).join(', '));
      console.log(`   Found ${orgs.length} organization(s)`);
    } else {
      console.log('   Table exists but is empty');
    }
  }

  // Test users table
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (userError) {
    console.error('\n❌ Error querying users:', userError.message);
  } else {
    console.log('\n✅ Users table structure:');
    if (users.length > 0) {
      console.log('   Columns:', Object.keys(users[0]).join(', '));
      console.log(`   Found ${users.length} user(s)`);
    }
  }

  // List some common tables
  const tablesToCheck = ['products', 'boms', 'workorders', 'modules', 'roles', 'organization_modules'];
  console.log('\n📊 Checking common tables:');

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: exists (${data.length > 0 ? 'has data' : 'empty'})`);
    }
  }

  console.log('\n✅ Connection test complete!');

} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
