#!/usr/bin/env tsx

/**
 * Migration Validation Script
 * 
 * Checks if database migrations are newer than the generated documentation.
 * This helps ensure documentation stays in sync with schema changes.
 * 
 * Usage: pnpm scripts/validate-migrations.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(__dirname, '../../..');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'apps/frontend/lib/supabase/migrations');
const SCHEMA_DOC = path.join(ROOT_DIR, 'docs/DATABASE_SCHEMA.md');

function getLastMigrationTimestamp(): Date | null {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.warn(`⚠️  Migrations directory not found: ${MIGRATIONS_DIR}`);
    return null;
  }

  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.includes('seed'))
    .map(f => ({
      name: f,
      path: path.join(MIGRATIONS_DIR, f),
    }));

  if (migrationFiles.length === 0) {
    return null;
  }

  // Get the most recent migration file by modification time
  let latestMigration = migrationFiles[0];
  let latestTime = fs.statSync(latestMigration.path).mtime;

  for (const file of migrationFiles) {
    const fileTime = fs.statSync(file.path).mtime;
    if (fileTime > latestTime) {
      latestTime = fileTime;
      latestMigration = file;
    }
  }

  return latestTime;
}

function getSchemaDocTimestamp(): Date | null {
  if (!fs.existsSync(SCHEMA_DOC)) {
    console.warn(`⚠️  Schema documentation not found: ${SCHEMA_DOC}`);
    return null;
  }

  return fs.statSync(SCHEMA_DOC).mtime;
}

function extractLastUpdatedFromDoc(): Date | null {
  if (!fs.existsSync(SCHEMA_DOC)) {
    return null;
  }

  const content = fs.readFileSync(SCHEMA_DOC, 'utf-8');
  const match = content.match(/\*\*Last Updated\*\*:\s*(\d{4}-\d{2}-\d{2})/);
  
  if (match) {
    const dateStr = match[1];
    return new Date(dateStr + 'T00:00:00');
  }

  return null;
}

async function main() {
  console.log('🔍 Validating migration/documentation sync...\n');

  const lastMigrationTime = getLastMigrationTimestamp();
  const schemaDocTime = getSchemaDocTimestamp();
  const docLastUpdated = extractLastUpdatedFromDoc();

  if (!lastMigrationTime) {
    console.log('✅ No migrations found - nothing to validate');
    process.exit(0);
  }

  if (!schemaDocTime) {
    console.warn('⚠️  Schema documentation not found - cannot validate');
    process.exit(0);
  }

  console.log(`📅 Last migration: ${lastMigrationTime.toISOString()}`);
  console.log(`📄 Schema doc modified: ${schemaDocTime.toISOString()}`);
  if (docLastUpdated) {
    console.log(`📝 Doc reports last updated: ${docLastUpdated.toISOString()}`);
  }
  console.log('');

  // Check if migrations are newer than documentation
  if (lastMigrationTime > schemaDocTime) {
    console.warn('⚠️  WARNING: Migrations are newer than documentation!');
    console.warn('   Run: pnpm docs:update');
    console.warn('');
    console.warn('   This suggests the documentation may be out of sync with the database schema.');
    process.exit(1);
  }

  // Also check the "Last Updated" date in the doc
  if (docLastUpdated && lastMigrationTime > docLastUpdated) {
    console.warn('⚠️  WARNING: Migrations are newer than the "Last Updated" date in documentation!');
    console.warn('   The documentation header may need updating.');
    console.warn('   Run: pnpm docs:update');
    process.exit(1);
  }

  console.log('✅ Documentation is up to date with migrations');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error during validation:', error);
  process.exit(1);
});

