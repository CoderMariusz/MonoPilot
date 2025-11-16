#!/usr/bin/env node
/**
 * Extract SQL CREATE TABLE statements from DATABASE_SCHEMA.md
 * and generate content to add to Architecture.md
 *
 * Story 0.12 - Task 1: Fill Architecture.md Gaps
 */

import fs from 'fs/promises';
import path from 'path';

const DATABASE_SCHEMA_PATH = 'docs/DATABASE_SCHEMA.md';
const OUTPUT_PATH = 'docs/architecture-schema-extracted.md';

// List of 35 missing tables from Story 0.11 audit
const MISSING_TABLES = {
  planning: ['suppliers', 'po_header', 'po_line', 'po_correction', 'to_header', 'to_line', 'work_orders', 'wo_operations', 'wo_reservations'],
  technical: ['boms', 'bom_history', 'routings', 'routing_operations', 'routing_operation_names'],
  warehouse: ['warehouses', 'locations', 'lp_compositions', 'lp_genealogy', 'pallets', 'pallet_items', 'grns', 'grn_items', 'asns', 'asn_items', 'stock_moves', 'warehouse_settings', 'settings_warehouse'],
  settings: ['settings_tax_codes', 'allergens', 'product_allergens', 'audit_log'],
  cost: ['material_costs', 'bom_costs', 'product_prices', 'wo_costs']
};

// Existing tables (to be updated with missing columns)
const EXISTING_TABLES = ['bom_items', 'license_plates', 'lp_reservations', 'machines', 'production_lines', 'production_outputs', 'products', 'users', 'wo_by_products', 'wo_materials'];

async function extractSQLForTable(content, tableName) {
  // Find the section for this table
  const tableHeaderRegex = new RegExp(`^### ${tableName}$`, 'm');
  const match = content.match(tableHeaderRegex);

  if (!match) {
    console.warn(`⚠️  Table ${tableName} not found in DATABASE_SCHEMA.md`);
    return null;
  }

  const startIndex = match.index;
  const nextSectionMatch = content.slice(startIndex + match[0].length).match(/^---$/m);
  const endIndex = nextSectionMatch ? startIndex + match[0].length + nextSectionMatch.index : content.length;

  const tableSection = content.slice(startIndex, endIndex);

  // Extract SQL CREATE TABLE statement
  const sqlMatch = tableSection.match(/```sql\n(CREATE TABLE[\s\S]+?)\n```/);

  if (!sqlMatch) {
    console.warn(`⚠️  No SQL found for table ${tableName}`);
    return null;
  }

  return {
    tableName,
    sql: sqlMatch[1],
    fullSection: tableSection
  };
}

async function main() {
  console.log('📖 Reading DATABASE_SCHEMA.md...');
  const schemaContent = await fs.readFile(DATABASE_SCHEMA_PATH, 'utf-8');

  let output = `# Database Schema Reference (Extracted for Architecture.md)

**Generated**: ${new Date().toISOString()}
**Source**: DATABASE_SCHEMA.md
**Purpose**: Complete schema definitions for all 45 tables (Story 0.12, Task 1)

---

`;

  // Extract SQL for all missing tables
  let totalExtracted = 0;

  for (const [module, tables] of Object.entries(MISSING_TABLES)) {
    output += `\n## ${module.charAt(0).toUpperCase() + module.slice(1)} Module\n\n`;

    for (const tableName of tables) {
      console.log(`  Extracting ${tableName}...`);
      const tableData = await extractSQLForTable(schemaContent, tableName);

      if (tableData) {
        output += `### ${tableName}\n\n`;
        output += `\`\`\`sql\n${tableData.sql}\n\`\`\`\n\n`;
        output += `---\n\n`;
        totalExtracted++;
      }
    }
  }

  // Also extract existing tables for completeness
  output += `\n## Existing Tables (For Reference)\n\n`;
  for (const tableName of EXISTING_TABLES) {
    console.log(`  Extracting ${tableName} (existing)...`);
    const tableData = await extractSQLForTable(schemaContent, tableName);

    if (tableData) {
      output += `### ${tableName}\n\n`;
      output += `\`\`\`sql\n${tableData.sql}\n\`\`\`\n\n`;
      output += `---\n\n`;
      totalExtracted++;
    }
  }

  console.log(`\n✅ Extracted ${totalExtracted} tables`);
  console.log(`💾 Saving to ${OUTPUT_PATH}...`);

  await fs.writeFile(OUTPUT_PATH, output, 'utf-8');

  console.log(`\n✨ Done! Now review and add to Architecture.md`);
  console.log(`\nNext steps:`);
  console.log(`1. Review ${OUTPUT_PATH}`);
  console.log(`2. Add "Database Schema Reference" section to Architecture.md (before Appendix)`);
  console.log(`3. Copy content from extracted file`);
  console.log(`4. Verify all 45 tables present`);
}

main().catch(console.error);
