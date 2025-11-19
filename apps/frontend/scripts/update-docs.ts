#!/usr/bin/env tsx

/**
 * Automatic Documentation Update Script
 * 
 * This script parses SQL migrations and TypeScript API files
 * to automatically generate/update documentation files:
 * - docs/DATABASE_SCHEMA.md (from migrations)
 * - docs/API_REFERENCE.md (from API files)
 * - docs/DATABASE_RELATIONSHIPS.md (from foreign keys)
 * 
 * Usage: pnpm docs:update
 */

import * as fs from 'fs';
import * as path from 'path';

// ========================================
// Configuration
// ========================================

const ROOT_DIR = path.join(__dirname, '../../..');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'apps/frontend/lib/supabase/migrations');
const MASTER_MIGRATION_FILE = path.join(ROOT_DIR, 'master_migration.sql');
const API_DIR = path.join(ROOT_DIR, 'apps/frontend/lib/api');
const TYPES_FILE = path.join(ROOT_DIR, 'packages/shared/types.ts');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

const OUTPUT_FILES = {
  schema: path.join(DOCS_DIR, 'DATABASE_SCHEMA.md'),
  api: path.join(DOCS_DIR, 'API_REFERENCE.md'),
  relationships: path.join(DOCS_DIR, 'DATABASE_RELATIONSHIPS.md'),
};

// ========================================
// Types
// ========================================

interface TableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    constraints: string[];
  }>;
  indexes: string[];
  foreignKeys: Array<{
    column: string;
    referencesTable: string;
    referencesColumn: string;
  }>;
  checks: string[];
  rawSql: string;
}

interface APIEndpoint {
  className: string;
  methods: Array<{
    name: string;
    params: string[];
    returnType: string;
    description: string;
  }>;
  file: string;
}

// ========================================
// SQL Parser Module
// ========================================

function parseSQLMigrations(): TableSchema[] {
  const tables: TableSchema[] = [];

  // Parse master_migration.sql first (contains base schema from Epic 0.8 consolidation)
  if (fs.existsSync(MASTER_MIGRATION_FILE)) {
    console.log(`📄 Parsing master_migration.sql (base schema)`);
    const masterContent = fs.readFileSync(MASTER_MIGRATION_FILE, 'utf-8');
    const masterTables = parseCreateTableStatements(masterContent, 'master_migration.sql');
    tables.push(...masterTables);
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.warn(`⚠️  Migrations directory not found: ${MIGRATIONS_DIR}`);
    return tables;
  }

  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📄 Found ${migrationFiles.length} migration files`);

  // First pass: parse CREATE TABLE statements from individual migrations
  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const fileTables = parseCreateTableStatements(content, file);
    for (const table of fileTables) {
      const existingTable = tables.find(t => t.name === table.name);
      if (existingTable) {
        // Merge columns (avoid duplicates)
        for (const col of table.columns) {
          if (!existingTable.columns.find(c => c.name === col.name)) {
            existingTable.columns.push(col);
          }
        }
        // Merge indexes
        for (const idx of table.indexes) {
          if (!existingTable.indexes.includes(idx)) {
            existingTable.indexes.push(idx);
          }
        }
        // Merge foreign keys
        for (const fk of table.foreignKeys) {
          if (!existingTable.foreignKeys.find(f => f.column === fk.column)) {
            existingTable.foreignKeys.push(fk);
          }
        }
      } else {
        tables.push(table);
      }
    }
  }
  
  // Second pass: parse ALTER TABLE statements to add new columns
  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    applyAlterTableStatements(content, tables);
  }
  
  return tables;
}

function parseCreateTableStatements(sql: string, sourceFile: string): TableSchema[] {
  const tables: TableSchema[] = [];
  
  // Match CREATE TABLE statements (including IF NOT EXISTS)
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi;
  let match;
  
  while ((match = createTableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const tableBody = match[2];
    const rawSql = match[0];
    
    const table: TableSchema = {
      name: tableName,
      columns: [],
      indexes: [],
      foreignKeys: [],
      checks: [],
      rawSql: rawSql.trim(),
    };
    
    // Parse columns
    const lines = tableBody.split('\n').map(l => l.trim()).filter(l => l);
    
    for (const line of lines) {
      // Skip constraints at table level
      if (line.startsWith('PRIMARY KEY') || 
          line.startsWith('FOREIGN KEY') ||
          line.startsWith('UNIQUE') ||
          line.startsWith('CHECK')) {
        continue;
      }
      
      // Parse column definition
      const columnMatch = line.match(/^(\w+)\s+([A-Z]+(?:\([^)]+\))?)(.*)/);
      if (columnMatch) {
        const [, colName, colType, rest] = columnMatch;
        const constraints: string[] = [];
        
        if (rest.includes('PRIMARY KEY')) constraints.push('PRIMARY KEY');
        if (rest.includes('NOT NULL')) constraints.push('NOT NULL');
        if (rest.includes('UNIQUE')) constraints.push('UNIQUE');
        if (rest.includes('DEFAULT')) {
          const defaultMatch = rest.match(/DEFAULT\s+([^,]+)/);
          if (defaultMatch) constraints.push(`DEFAULT ${defaultMatch[1].trim()}`);
        }
        
        // Parse REFERENCES
        const referencesMatch = rest.match(/REFERENCES\s+(\w+)\((\w+)\)/);
        if (referencesMatch) {
          table.foreignKeys.push({
            column: colName,
            referencesTable: referencesMatch[1],
            referencesColumn: referencesMatch[2],
          });
          constraints.push(`REFERENCES ${referencesMatch[1]}(${referencesMatch[2]})`);
        }
        
        table.columns.push({
          name: colName,
          type: colType,
          constraints,
        });
      }
    }
    
    tables.push(table);
  }
  
  // Parse CREATE INDEX statements
  const createIndexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([\s\S]*?)\);/gi;
  
  while ((match = createIndexRegex.exec(sql)) !== null) {
    const indexName = match[1];
    const tableName = match[2];
    const columns = match[3];
    
    const table = tables.find(t => t.name === tableName);
    if (table) {
      table.indexes.push(`${indexName} ON (${columns})`);
    }
  }
  
  return tables;
}

/**
 * Parse ALTER TABLE statements and apply changes to existing tables
 */
function applyAlterTableStatements(sql: string, tables: TableSchema[]): void {
  // Match ALTER TABLE blocks (handles multiple ADD COLUMN separated by commas or newlines)
  // Pattern: ALTER TABLE table_name ADD COLUMN ... , ADD COLUMN ... ; or multiple lines
  // Important: Match across newlines, but stop at semicolon
  const alterTableRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+([\s\S]*?);/gi;
  let blockMatch;
  
  while ((blockMatch = alterTableRegex.exec(sql)) !== null) {
    const tableName = blockMatch[1];
    let blockContent = blockMatch[2].trim();
    
    const table = tables.find(t => t.name === tableName);
    if (!table) {
      console.warn(`⚠️  Table ${tableName} not found for ALTER TABLE ADD COLUMN`);
      continue;
    }
    
    // Normalize: replace newlines with spaces for easier parsing
    blockContent = blockContent.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    
    // Find all ADD COLUMN statements (including IF NOT EXISTS)
    // Pattern: ADD COLUMN [IF NOT EXISTS] column_name type [constraints]
    // Must handle multiple ADD COLUMN in one statement separated by commas
    const addColumnPattern = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+(\w+(?:\([^)]+\))?)(?:\s+([^,;]+))?/gi;
    let colMatch;
    
    // Reset regex lastIndex to ensure we catch all matches
    addColumnPattern.lastIndex = 0;
    
    while ((colMatch = addColumnPattern.exec(blockContent)) !== null) {
      const colName = colMatch[1]; // Group 1 is column name
      const colType = colMatch[2].trim(); // Group 2 is type
      const rest = (colMatch[3] || '').trim(); // Group 3 is constraints/options
      
      if (table.columns.find(c => c.name === colName)) {
        // Column already exists, skip
        continue;
      }
      const constraints: string[] = [];
        
      // Check for NOT NULL
      if (rest.includes('NOT NULL')) {
        constraints.push('NOT NULL');
      }
      
      // Check for DEFAULT
      const defaultMatch = rest.match(/DEFAULT\s+([^,;]+)/i);
      if (defaultMatch) {
        constraints.push(`DEFAULT ${defaultMatch[1].trim()}`);
      }
      
      // Check for REFERENCES
      const referencesMatch = rest.match(/REFERENCES\s+(\w+)\((\w+)\)/);
      if (referencesMatch) {
        table.foreignKeys.push({
          column: colName,
          referencesTable: referencesMatch[1],
          referencesColumn: referencesMatch[2],
        });
        constraints.push(`REFERENCES ${referencesMatch[1]}(${referencesMatch[2]})`);
      }
      
      table.columns.push({
        name: colName,
        type: colType,
        constraints,
      });
    }
  }
  
  // Match CREATE INDEX statements that might be in ALTER TABLE migrations
  const createIndexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([\s\S]*?)\)/gi;
  let match;
  
  while ((match = createIndexRegex.exec(sql)) !== null) {
    const indexName = match[1];
    const tableName = match[2];
    const columns = match[3].trim();
    
    const table = tables.find(t => t.name === tableName);
    if (table) {
      const indexStr = `${indexName} ON (${columns})`;
      if (!table.indexes.includes(indexStr)) {
        table.indexes.push(indexStr);
      }
    }
  }
}

// ========================================
// TypeScript API Parser Module
// ========================================

function parseAPIFiles(): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];
  
  if (!fs.existsSync(API_DIR)) {
    console.warn(`⚠️  API directory not found: ${API_DIR}`);
    return endpoints;
  }
  
  const apiFiles = fs.readdirSync(API_DIR)
    .filter(f => f.endsWith('.ts') && f !== 'config.ts' && f !== 'index.ts');
  
  console.log(`📄 Found ${apiFiles.length} API files`);
  
  for (const file of apiFiles) {
    const content = fs.readFileSync(path.join(API_DIR, file), 'utf-8');
    const endpoint = parseAPIClass(content, file);
    if (endpoint) {
      endpoints.push(endpoint);
    }
  }
  
  return endpoints;
}

function parseAPIClass(content: string, file: string): APIEndpoint | null {
  // Match class definition
  const classMatch = content.match(/export\s+class\s+(\w+API)/);
  if (!classMatch) return null;
  
  const className = classMatch[1];
  const methods: APIEndpoint['methods'] = [];
  
  // Match static methods
  const methodRegex = /static\s+async\s+(\w+)\s*\(([^)]*)\)\s*:\s*Promise<([^>]+)>/g;
  let match;
  
  while ((match = methodRegex.exec(content)) !== null) {
    const methodName = match[1];
    const paramsStr = match[2];
    const returnType = match[3];
    
    // Parse parameters
    const params: string[] = [];
    if (paramsStr.trim()) {
      const paramList = paramsStr.split(',').map(p => p.trim());
      for (const param of paramList) {
        const paramMatch = param.match(/(\w+)(?::\s*([^=]+))?(?:\s*=\s*(.+))?/);
        if (paramMatch) {
          params.push(param);
        }
      }
    }
    
    // Try to extract JSDoc comment
    const methodStartIndex = content.indexOf(`static async ${methodName}`);
    const beforeMethod = content.substring(Math.max(0, methodStartIndex - 200), methodStartIndex);
    const commentMatch = beforeMethod.match(/\/\*\*\s*([\s\S]*?)\*\//);
    const description = commentMatch ? commentMatch[1].replace(/\s*\*\s*/g, ' ').trim() : '';
    
    methods.push({
      name: methodName,
      params,
      returnType,
      description,
    });
  }
  
  return {
    className,
    methods,
    file,
  };
}

// ========================================
// Markdown Generator Module
// ========================================

function generateDatabaseSchemaMarkdown(tables: TableSchema[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  
  let markdown = `# Database Schema Documentation

## Overview

This document describes the complete database schema for the MonoPilot MES system, including all tables, relationships, constraints, and business rules.

**Last Updated**: ${timestamp} (auto-generated)
**Version**: Auto-generated from migrations

## Tables

`;
  
  for (const table of tables) {
    markdown += `### ${table.name}\n\n`;
    
    // Columns table
    markdown += `**Columns**:\n\n`;
    markdown += `| Column | Type | Constraints |\n`;
    markdown += `|--------|------|-------------|\n`;
    
    for (const col of table.columns) {
      const constraints = col.constraints.join(', ') || '-';
      markdown += `| ${col.name} | ${col.type} | ${constraints} |\n`;
    }
    
    markdown += `\n`;
    
    // Foreign Keys
    if (table.foreignKeys.length > 0) {
      markdown += `**Foreign Keys**:\n\n`;
      for (const fk of table.foreignKeys) {
        markdown += `- \`${fk.column}\` → \`${fk.referencesTable}.${fk.referencesColumn}\`\n`;
      }
      markdown += `\n`;
    }
    
    // Indexes
    if (table.indexes.length > 0) {
      markdown += `**Indexes**:\n\n`;
      for (const idx of table.indexes) {
        markdown += `- ${idx}\n`;
      }
      markdown += `\n`;
    }
    
    // Raw SQL (collapsible)
    markdown += `<details>\n<summary>SQL Definition</summary>\n\n\`\`\`sql\n${table.rawSql}\n\`\`\`\n\n</details>\n\n`;
    markdown += `---\n\n`;
  }
  
  return markdown;
}

function generateAPIReferenceMarkdown(endpoints: APIEndpoint[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  
  let markdown = `# API Reference Documentation

## Overview

The MonoPilot MES system uses a dual-mode API layer that seamlessly switches between mock data (development) and real Supabase data (production).

**Last Updated**: ${timestamp} (auto-generated)

## API Classes

`;
  
  for (const endpoint of endpoints) {
    markdown += `### ${endpoint.className}\n\n`;
    markdown += `**Source**: \`apps/frontend/lib/api/${endpoint.file}\`\n\n`;
    
    if (endpoint.methods.length > 0) {
      markdown += `**Methods**:\n\n`;
      
      for (const method of endpoint.methods) {
        markdown += `#### \`${method.name}()\`\n\n`;
        
        if (method.description) {
          markdown += `${method.description}\n\n`;
        }
        
        markdown += `**Signature**:\n\`\`\`typescript\n`;
        const paramsStr = method.params.join(', ');
        markdown += `static async ${method.name}(${paramsStr}): Promise<${method.returnType}>\n`;
        markdown += `\`\`\`\n\n`;
        
        if (method.params.length > 0) {
          markdown += `**Parameters**:\n`;
          for (const param of method.params) {
            markdown += `- \`${param}\`\n`;
          }
          markdown += `\n`;
        }
        
        markdown += `**Returns**: \`Promise<${method.returnType}>\`\n\n`;
        markdown += `---\n\n`;
      }
    }
  }
  
  return markdown;
}

function generateRelationshipsMarkdown(tables: TableSchema[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  
  let markdown = `# Database Relationships Documentation

## Overview

This document describes the relationships between tables in the MonoPilot MES system.

**Last Updated**: ${timestamp} (auto-generated)

## Entity Relationship Diagram (Text)

`;
  
  // Group by referenced table
  const relationshipMap = new Map<string, Array<{ fromTable: string; fromColumn: string; toColumn: string }>>();
  
  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      if (!relationshipMap.has(fk.referencesTable)) {
        relationshipMap.set(fk.referencesTable, []);
      }
      relationshipMap.get(fk.referencesTable)!.push({
        fromTable: table.name,
        fromColumn: fk.column,
        toColumn: fk.referencesColumn,
      });
    }
  }
  
  for (const [toTable, relationships] of relationshipMap) {
    markdown += `### ${toTable}\n\n`;
    markdown += `**Referenced by**:\n\n`;
    
    for (const rel of relationships) {
      markdown += `- \`${rel.fromTable}.${rel.fromColumn}\` → \`${toTable}.${rel.toColumn}\`\n`;
    }
    
    markdown += `\n`;
  }
  
  return markdown;
}

// ========================================
// File Operations Module
// ========================================

function createBackup(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup-${timestamp}`;
  
  fs.copyFileSync(filePath, backupPath);
  console.log(`  ✅ Backup created: ${path.basename(backupPath)}`);
}

function writeDocument(filePath: string, content: string): void {
  // Note: Backups disabled - auto-generate before commit, files should be clean after commit
  // createBackup(filePath);

  // Write new content
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✅ Updated: ${path.basename(filePath)}`);
}

// ========================================
// Main Script
// ========================================

async function main() {
  console.log('🚀 Starting automatic documentation update...\n');
  
  try {
    // Parse SQL migrations
    console.log('📊 Parsing SQL migrations...');
    const tables = parseSQLMigrations();
    console.log(`  ✅ Parsed ${tables.length} tables\n`);
    
    // Parse API files
    console.log('🔌 Parsing API files...');
    const endpoints = parseAPIFiles();
    console.log(`  ✅ Parsed ${endpoints.length} API classes\n`);
    
    // Generate documentation
    console.log('📝 Generating documentation...');
    
    const schemaMarkdown = generateDatabaseSchemaMarkdown(tables);
    const apiMarkdown = generateAPIReferenceMarkdown(endpoints);
    const relationshipsMarkdown = generateRelationshipsMarkdown(tables);
    
    // Write documents
    console.log('\n💾 Writing documentation files...');
    writeDocument(OUTPUT_FILES.schema, schemaMarkdown);
    writeDocument(OUTPUT_FILES.api, apiMarkdown);
    writeDocument(OUTPUT_FILES.relationships, relationshipsMarkdown);
    
    console.log('\n✅ Documentation update complete!');
    console.log('\nGenerated files:');
    console.log(`  - ${path.relative(ROOT_DIR, OUTPUT_FILES.schema)}`);
    console.log(`  - ${path.relative(ROOT_DIR, OUTPUT_FILES.api)}`);
    console.log(`  - ${path.relative(ROOT_DIR, OUTPUT_FILES.relationships)}`);
    
  } catch (error) {
    console.error('\n❌ Error during documentation update:', error);
    process.exit(1);
  }
}

// Run the script
main();

