import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function query(sql) {
  const res = await fetch('https://api.supabase.com/v1/projects/pgroxddbtaevdegnidaz/database/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  return await res.json();
}

console.log('🔍 Checking database tables...\n');

// Check if tables exist
const tables = await query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('roles', 'modules', 'organization_modules')
  ORDER BY table_name
`);
console.log('📊 Tables in public schema:');
console.log(JSON.stringify(tables, null, 2));

// Check roles count
const rolesCount = await query('SELECT COUNT(*) as count FROM roles');
console.log('\n📊 Roles count:');
console.log(JSON.stringify(rolesCount, null, 2));

// Check modules count
const modulesCount = await query('SELECT COUNT(*) as count FROM modules');
console.log('\n📊 Modules count:');
console.log(JSON.stringify(modulesCount, null, 2));

// Try to select from roles
const rolesList = await query('SELECT code, name FROM roles LIMIT 5');
console.log('\n📊 Roles list:');
console.log(JSON.stringify(rolesList, null, 2));
