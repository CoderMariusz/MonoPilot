#!/usr/bin/env node
/**
 * Script to fix all service files to use admin Supabase client
 * This bypasses RLS policies which require org_id in JWT claims
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SERVICES_DIR = 'apps/frontend/lib/services';

const servicesToFix = [
  'machine-service.ts',
  'production-line-service.ts',
  'tax-code-service.ts',
  'invitation-service.ts',
  'module-service.ts',
  'wizard-service.ts',
];

function fixServiceFile(filePath) {
  console.log(`\nFixing ${filePath}...`);

  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Step 1: Add createServerSupabaseAdmin import if missing
  if (!content.includes('createServerSupabaseAdmin')) {
    content = content.replace(
      /import { createServerSupabase } from/,
      'import { createServerSupabase, createServerSupabaseAdmin } from'
    );
    console.log('  ✓ Added createServerSupabaseAdmin import');
    modified = true;
  }

  // Step 2: Replace database queries to use admin client
  // Pattern: supabase.from('tablename') -> supabaseAdmin.from('tablename')
  const tables = [
    'machines', 'production_lines', 'tax_codes', 'allergens',
    'warehouses', 'locations', 'user_invitations', 'organizations',
    'users', 'machine_line_assignments'
  ];

  tables.forEach(table => {
    const regex = new RegExp(`supabase\\.from\\('${table}'\\)`, 'g');
    const beforeCount = (content.match(regex) || []).length;

    if (beforeCount > 0) {
      content = content.replace(regex, `supabaseAdmin.from('${table}')`);
      console.log(`  ✓ Replaced ${beforeCount} queries to '${table}' table`);
      modified = true;
    }
  });

  // Step 3: Add supabaseAdmin constant where needed
  // Find functions that now use supabaseAdmin but don't have it declared
  const functionPattern = /export async function \w+\([^)]*\)[^{]*{[^}]*?const supabase = await createServerSupabase\(\)/gs;
  const matches = content.match(functionPattern) || [];

  matches.forEach(match => {
    if (match.includes('supabaseAdmin.from(') && !match.includes('const supabaseAdmin')) {
      const replacement = match.replace(
        'const supabase = await createServerSupabase()',
        'const supabase = await createServerSupabase()\n    const supabaseAdmin = createServerSupabaseAdmin()'
      );
      content = content.replace(match, replacement);
      console.log('  ✓ Added supabaseAdmin constant to function');
      modified = true;
    }
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  No changes needed for ${filePath}`);
    return false;
  }
}

// Main execution
console.log('🔧 Fixing all service files to use admin Supabase client...\n');

let fixedCount = 0;

servicesToFix.forEach(filename => {
  const filePath = join(SERVICES_DIR, filename);
  try {
    if (fixServiceFile(filePath)) {
      fixedCount++;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filename}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} service files`);
console.log('\n📝 Next steps:');
console.log('   1. Review the changes in each file');
console.log('   2. Test all API endpoints');
console.log('   3. Commit the changes');
