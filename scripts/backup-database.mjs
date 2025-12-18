import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('💾 Creating database backup...\n');

const backup = {
  timestamp: new Date().toISOString(),
  tables: {}
};

// Backup organizations
console.log('📦 Backing up organizations...');
const { data: orgs, error: orgError } = await supabase
  .from('organizations')
  .select('*');

if (orgError) {
  console.error('❌ Error:', orgError.message);
} else {
  backup.tables.organizations = orgs;
  console.log(`   ✅ Backed up ${orgs.length} organizations`);
}

// Backup users
console.log('📦 Backing up users...');
const { data: users, error: userError } = await supabase
  .from('users')
  .select('*');

if (userError) {
  console.error('❌ Error:', userError.message);
} else {
  backup.tables.users = users;
  console.log(`   ✅ Backed up ${users.length} users`);
}

// Backup products
console.log('📦 Backing up products...');
const { data: products, error: prodError } = await supabase
  .from('products')
  .select('*');

if (prodError) {
  console.error('❌ Error:', prodError.message);
} else {
  backup.tables.products = products;
  console.log(`   ✅ Backed up ${products.length} products`);
}

// Backup boms
console.log('📦 Backing up boms...');
const { data: boms, error: bomError } = await supabase
  .from('boms')
  .select('*');

if (bomError) {
  console.error('❌ Error:', bomError.message);
} else {
  backup.tables.boms = boms;
  console.log(`   ✅ Backed up ${boms.length} boms`);
}

// Save backup file
const backupFile = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const backupPath = `C:\\Users\\Mariusz K\\Documents\\Programowanie\\MonoPilot\\${backupFile}`;

writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(`\n✅ Backup saved to: ${backupFile}`);
console.log(`   Total tables backed up: ${Object.keys(backup.tables).length}`);
console.log(`   Timestamp: ${backup.timestamp}`);
