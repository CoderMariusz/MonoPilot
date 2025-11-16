#!/usr/bin/env node
/**
 * Generate complete master migration from Architecture.md
 *
 * Story 0.12 - Task 3: Full-Scale Generation
 *
 * Input: docs/architecture.md (Database Schema Reference section)
 * Output: master_migration.sql (all 45 tables, topologically sorted)
 */

import fs from 'fs/promises';

const ARCHITECTURE_PATH = 'docs/architecture.md';
const OUTPUT_PATH = 'master_migration.sql';

// Topological ordering based on FK dependencies
// Derived from POC analysis + manual dependency review
const TABLE_LEVELS = {
  // Level 0: No dependencies (foundation tables)
  0: [
    'users',  // auth.users FK (Supabase built-in)
    'suppliers',
    'warehouses',
    'allergens',
    'settings_tax_codes',
    'routing_operation_names'
  ],

  // Level 1: Depend on Level 0 only
  1: [
    'locations',  // → warehouses
    'machines',  // → locations
    'production_lines',  // → warehouses, users
    'settings_warehouse',  // → warehouses, locations
    'warehouse_settings'  // → warehouses, locations
  ],

  // Level 2: Depend on Level 0 + 1
  2: [
    'products',  // → suppliers, settings_tax_codes, users
    'routings',  // → products, users
    'audit_log'  // → users
  ],

  // Level 3: Depend on Level 0 + 1 + 2
  3: [
    'product_allergens',  // → products, allergens
    'boms',  // → products
    'bom_history',  // → boms, users
    'routing_operations',  // → routings, machines
    'bom_items',  // → boms, products, settings_tax_codes
    'material_costs',  // → products (note: references organizations which doesn't exist yet)
    'product_prices'  // → products
  ],

  // Level 4: Depend on Level 0-3
  4: [
    'work_orders',  // → products, boms, machines, production_lines
    'bom_costs',  // → boms (note: references organizations)
    'po_header',  // → suppliers, users
    'to_header',  // → warehouses, users
    'asns',  // → suppliers, po_header
    'grns'  // → po_header, suppliers
  ],

  // Level 5: Depend on Level 0-4
  5: [
    'wo_materials',  // → work_orders, products
    'wo_operations',  // → work_orders, routing_operations, users
    'wo_by_products',  // → work_orders, products
    'wo_reservations',  // → work_orders, products, license_plates (circular!)
    'wo_costs',  // → work_orders
    'production_outputs',  // → work_orders, products
    'po_line',  // → po_header, products, locations
    'po_correction',  // → po_header, po_line, users
    'to_line',  // → to_header, products
    'asn_items',  // → asns, products
    'grn_items',  // → grns, products, locations
    'pallets',  // → work_orders
    'pallet_items'  // → pallets
  ],

  // Level 6: Final level (complex dependencies)
  6: [
    'license_plates',  // → products, locations, work_orders, self-ref (parent_lp_id)
    'lp_reservations',  // → license_plates, work_orders
    'lp_compositions',  // → license_plates
    'lp_genealogy',  // → license_plates, work_orders
    'stock_moves'  // → products, locations
  ]
};

async function extractTableSQL(architectureContent, tableName) {
  // Find the table section in Architecture.md
  // Format: #### table_name\n\n```sql\nCREATE TABLE ...\n```

  const tableHeaderRegex = new RegExp(`^#### ${tableName}$`, 'm');
  const match = architectureContent.match(tableHeaderRegex);

  if (!match) {
    console.warn(`⚠️  Table ${tableName} not found in Architecture.md`);
    return null;
  }

  const startIndex = match.index;

  // Find the SQL block after the header
  const sqlBlockMatch = architectureContent.slice(startIndex).match(/```sql\n(CREATE TABLE[\s\S]+?)\n```/);

  if (!sqlBlockMatch) {
    console.warn(`⚠️  No SQL found for table ${tableName}`);
    return null;
  }

  return sqlBlockMatch[1];
}

async function generateMigration() {
  console.log('📖 Reading Architecture.md...');
  const architectureContent = await fs.readFile(ARCHITECTURE_PATH, 'utf-8');

  let output = `-- ============================================================================
-- Master Migration (Generated from Architecture.md)
-- ============================================================================
-- Date: ${new Date().toISOString()}
-- Story: 0.12 - Architecture.md Auto-Generation Setup
-- Tables: 45
-- Generator: Automated Script (generate-master-migration.mjs)
-- Source: docs/architecture.md (Database Schema Reference section)
--
-- Purpose: Complete database schema for MonoPilot MES
--          Generated from single source of truth (Architecture.md)
--
-- Topological Levels: 7 (0-6)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM Types
-- ============================================================================

CREATE TYPE bom_status AS ENUM ('draft', 'active', 'phased_out', 'inactive');
CREATE TYPE product_group AS ENUM ('COMPOSITE', 'SIMPLE');
CREATE TYPE product_type AS ENUM ('RM', 'DG', 'PR', 'FG', 'WIP');

`;

  let totalTables = 0;
  let totalIndexes = 0;

  // Generate tables level by level
  for (let level = 0; level <= 6; level++) {
    const tables = TABLE_LEVELS[level] || [];
    if (tables.length === 0) continue;

    output += `\n-- ============================================================================\n`;
    output += `-- LEVEL ${level}: ${getLevelDescription(level)}\n`;
    output += `-- ============================================================================\n\n`;

    for (const tableName of tables) {
      console.log(`  Extracting ${tableName} (level ${level})...`);

      const tableSQL = await extractTableSQL(architectureContent, tableName);

      if (tableSQL) {
        output += `-- Table: ${tableName}\n\n`;
        output += `${tableSQL}\n\n`;
        output += `---\n\n`;
        totalTables++;

        // Count indexes (rough estimate: 2-4 per table)
        const indexMatches = tableSQL.match(/INDEX/gi);
        if (indexMatches) totalIndexes += indexMatches.length;
      }
    }
  }

  // Add summary
  output += `\n-- ============================================================================\n`;
  output += `-- END OF MASTER MIGRATION\n`;
  output += `-- ============================================================================\n\n`;
  output += `-- Summary:\n`;
  output += `--   Tables created: ${totalTables}/45\n`;
  output += `--   Topological levels: 7\n`;
  output += `--   ENUM types: 3\n`;
  output += `--   Extensions: 2\n`;
  output += `--   Estimated indexes: ${totalIndexes}\n\n`;

  console.log(`\n✅ Generated migration with ${totalTables} tables`);
  console.log(`💾 Saving to ${OUTPUT_PATH}...`);

  await fs.writeFile(OUTPUT_PATH, output, 'utf-8');

  console.log(`\n✨ Done!`);
  console.log(`\nValidation steps:`);
  console.log(`1. Review ${OUTPUT_PATH}`);
  console.log(`2. Check for syntax errors: psql --dry-run -f ${OUTPUT_PATH}`);
  console.log(`3. Verify all 45 tables present`);
  console.log(`4. Test on clean database`);

  return {totalTables, totalIndexes};
}

function getLevelDescription(level) {
  const descriptions = {
    0: 'Foundation tables (no dependencies)',
    1: 'Settings & infrastructure (depend on Level 0)',
    2: 'Master data (products, routings)',
    3: 'BOM structure & product details',
    4: 'Orders & planning (WO, PO, TO)',
    5: 'Order details & execution',
    6: 'Inventory & traceability (LP genealogy)'
  };
  return descriptions[level] || 'Additional tables';
}

generateMigration().catch(console.error);
