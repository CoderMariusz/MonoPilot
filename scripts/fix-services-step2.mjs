#!/usr/bin/env node
/**
 * Step 2: Replace all table queries with admin client
 */

import { readFileSync, writeFileSync } from 'fs';
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

const tables = [
  'machines', 'production_lines', 'tax_codes', 'allergens',
  'warehouses', 'locations', 'user_invitations', 'organizations',
  'users', 'machine_line_assignments'
];

function fixFile(filePath) {
  console.log(`\nFixing ${filePath}...`);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let totalReplaced = 0;

  // Replace all supabase.from('table') with supabaseAdmin.from('table')
  tables.forEach(table => {
    const regex = new RegExp(`await supabase\\.from\\('${table}'\\)`, 'g');
    const matches = content.match(regex) || [];

    if (matches.length > 0) {
      content = content.replace(regex, `await supabaseAdmin.from('${table}')`);
      console.log(`  ✓ Replaced ${matches.length} queries to '${table}'`);
      totalReplaced += matches.length;
      modified = true;
    }
  });

  // Add supabaseAdmin = createServerSupabaseAdmin() to functions that use it
  if (modified) {
    // Find all function declarations
    const lines = content.split('\n');
    const newLines = [];
    let inFunction = false;
    let functionIndent = '';
    let hasSupabase = false;
    let hasSupabaseAdmin = false;
    let needsSupabaseAdmin = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if entering a function
      if (line.match(/export async function|async function/)) {
        inFunction = true;
        hasSupabase = false;
        hasSupabaseAdmin = false;
        needsSupabaseAdmin = false;
      }

      // Check if this line has createServerSupabase
      if (inFunction && line.includes('const supabase = await createServerSupabase()')) {
        hasSupabase = true;
        functionIndent = line.match(/^(\s*)/)[1];
      }

      // Check if this line already has createServerSupabaseAdmin
      if (inFunction && line.includes('createServerSupabaseAdmin()')) {
        hasSupabaseAdmin = true;
      }

      // Check if this line uses supabaseAdmin
      if (inFunction && line.includes('supabaseAdmin.from(')) {
        needsSupabaseAdmin = true;
      }

      // If we found supabase declaration and need admin but don't have it, add it
      if (hasSupabase && needsSupabaseAdmin && !hasSupabaseAdmin && line.includes('const supabase = await createServerSupabase()')) {
        newLines.push(line);
        newLines.push(`${functionIndent}const supabaseAdmin = createServerSupabaseAdmin()`);
        console.log(`  ✓ Added supabaseAdmin constant`);
        hasSupabaseAdmin = true;
        modified = true;
        continue;
      }

      // Check if exiting function
      if (inFunction && line.match(/^export|^}/)) {
        inFunction = false;
      }

      newLines.push(line);
    }

    content = newLines.join('\n');
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed ${filePath} (${totalReplaced} queries replaced)`);
    return true;
  } else {
    console.log(`⏭️  No changes for ${filePath}`);
    return false;
  }
}

// Main
console.log('🔧 Step 2: Replacing all table queries with admin client...\n');

let fixedCount = 0;
servicesToFix.forEach(filename => {
  const filePath = join(SERVICES_DIR, filename);
  try {
    if (fixFile(filePath)) fixedCount++;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
