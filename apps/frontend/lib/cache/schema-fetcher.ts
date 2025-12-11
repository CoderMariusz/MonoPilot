/**
 * Schema Fetcher
 * Automatically fetches database table schemas for agent cache
 *
 * This integrates with the AgentCacheSystem to provide automatic
 * schema loading from Supabase/PostgreSQL.
 *
 * Usage:
 * ```typescript
 * import { getTableSchemaWithFetcher } from '@/lib/cache/schema-fetcher'
 *
 * // Automatically fetches and caches schema
 * const schema = await getTableSchemaWithFetcher('products')
 * ```
 */

import { createClient } from '@supabase/supabase-js'
import { getAgentCache } from './agent-cache-system'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ColumnSchema {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

export interface TableSchema {
  table_name: string
  columns: ColumnSchema[]
  primary_key: string | null
  foreign_keys: ForeignKey[]
  description?: string
}

export interface ForeignKey {
  column: string
  references_table: string
  references_column: string
}

// ═══════════════════════════════════════════════════════════════════════════
// KNOWN SCHEMAS (pre-defined for MonoPilot tables)
// This is faster than querying information_schema
// ═══════════════════════════════════════════════════════════════════════════

const KNOWN_SCHEMAS: Record<string, TableSchema> = {
  products: {
    table_name: 'products',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'sku', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'product_type', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'unit_of_measure', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'shelf_life_days', data_type: 'integer', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'version', data_type: 'integer', is_nullable: 'NO', column_default: '1', character_maximum_length: null },
      { column_name: 'status', data_type: 'text', is_nullable: 'NO', column_default: "'draft'", character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'archived_at', data_type: 'timestamptz', is_nullable: 'YES', column_default: null, character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
    ],
    description: 'Products master data - finished goods, raw materials, packaging',
  },

  allergens: {
    table_name: 'allergens',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'code', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'is_major', data_type: 'boolean', is_nullable: 'NO', column_default: 'false', character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'archived_at', data_type: 'timestamptz', is_nullable: 'YES', column_default: null, character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
    ],
    description: 'Allergen definitions for food safety compliance',
  },

  boms: {
    table_name: 'boms',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'product_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'version', data_type: 'integer', is_nullable: 'NO', column_default: '1', character_maximum_length: null },
      { column_name: 'status', data_type: 'text', is_nullable: 'NO', column_default: "'draft'", character_maximum_length: null },
      { column_name: 'effective_from', data_type: 'date', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'effective_to', data_type: 'date', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'batch_size', data_type: 'numeric', is_nullable: 'NO', column_default: '1', character_maximum_length: null },
      { column_name: 'batch_uom', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
      { column: 'product_id', references_table: 'products', references_column: 'id' },
    ],
    description: 'Bill of Materials - recipe/formula definitions',
  },

  bom_items: {
    table_name: 'bom_items',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'bom_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'product_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'quantity', data_type: 'numeric', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'uom', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'sequence', data_type: 'integer', is_nullable: 'NO', column_default: '0', character_maximum_length: null },
      { column_name: 'operation_id', data_type: 'uuid', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'scrap_percent', data_type: 'numeric', is_nullable: 'YES', column_default: '0', character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'bom_id', references_table: 'boms', references_column: 'id' },
      { column: 'product_id', references_table: 'products', references_column: 'id' },
      { column: 'operation_id', references_table: 'operations', references_column: 'id' },
    ],
    description: 'BOM line items - ingredients/components with quantities',
  },

  work_orders: {
    table_name: 'work_orders',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'wo_number', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'product_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'bom_id', data_type: 'uuid', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'planned_quantity', data_type: 'numeric', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'produced_quantity', data_type: 'numeric', is_nullable: 'NO', column_default: '0', character_maximum_length: null },
      { column_name: 'status', data_type: 'text', is_nullable: 'NO', column_default: "'draft'", character_maximum_length: null },
      { column_name: 'planned_start', data_type: 'timestamptz', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'planned_end', data_type: 'timestamptz', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'actual_start', data_type: 'timestamptz', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'actual_end', data_type: 'timestamptz', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'production_line_id', data_type: 'uuid', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
      { column: 'product_id', references_table: 'products', references_column: 'id' },
      { column: 'bom_id', references_table: 'boms', references_column: 'id' },
      { column: 'production_line_id', references_table: 'production_lines', references_column: 'id' },
    ],
    description: 'Work orders - production jobs to manufacture products',
  },

  warehouses: {
    table_name: 'warehouses',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'code', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'address', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO', column_default: 'true', character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'archived_at', data_type: 'timestamptz', is_nullable: 'YES', column_default: null, character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
    ],
    description: 'Warehouse locations for inventory storage',
  },

  locations: {
    table_name: 'locations',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'warehouse_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'code', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'location_type', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO', column_default: 'true', character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
      { column: 'warehouse_id', references_table: 'warehouses', references_column: 'id' },
    ],
    description: 'Storage locations within warehouses (bins, racks, zones)',
  },

  purchase_orders: {
    table_name: 'purchase_orders',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'po_number', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'supplier_name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'status', data_type: 'text', is_nullable: 'NO', column_default: "'draft'", character_maximum_length: null },
      { column_name: 'order_date', data_type: 'date', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'expected_date', data_type: 'date', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'warehouse_id', data_type: 'uuid', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'notes', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
      { column: 'warehouse_id', references_table: 'warehouses', references_column: 'id' },
    ],
    description: 'Purchase orders for procuring materials from suppliers',
  },

  production_lines: {
    table_name: 'production_lines',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'code', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'warehouse_id', data_type: 'uuid', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO', column_default: 'true', character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'archived_at', data_type: 'timestamptz', is_nullable: 'YES', column_default: null, character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
      { column: 'warehouse_id', references_table: 'warehouses', references_column: 'id' },
    ],
    description: 'Production lines where manufacturing occurs',
  },

  organizations: {
    table_name: 'organizations',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()', character_maximum_length: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'slug', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'settings', data_type: 'jsonb', is_nullable: 'YES', column_default: "'{}'", character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
      { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [],
    description: 'Multi-tenant organizations (companies)',
  },

  users: {
    table_name: 'users',
    columns: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'email', data_type: 'text', is_nullable: 'NO', column_default: null, character_maximum_length: null },
      { column_name: 'full_name', data_type: 'text', is_nullable: 'YES', column_default: null, character_maximum_length: null },
      { column_name: 'role', data_type: 'text', is_nullable: 'NO', column_default: "'user'", character_maximum_length: null },
      { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO', column_default: 'true', character_maximum_length: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()', character_maximum_length: null },
    ],
    primary_key: 'id',
    foreign_keys: [
      { column: 'org_id', references_table: 'organizations', references_column: 'id' },
    ],
    description: 'Application users with organization membership',
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA FETCHER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get table schema with automatic caching
 * Uses pre-defined schemas for known MonoPilot tables (faster)
 * Falls back to information_schema query for unknown tables
 */
export async function getTableSchemaWithFetcher(
  tableName: string
): Promise<TableSchema | null> {
  const cache = getAgentCache()

  return cache.getTableSchema(tableName, async () => {
    // Check pre-defined schemas first (instant)
    if (KNOWN_SCHEMAS[tableName]) {
      console.log(`[SchemaFetcher] Using pre-defined schema for: ${tableName}`)
      return KNOWN_SCHEMAS[tableName]
    }

    // Fall back to database query
    console.log(`[SchemaFetcher] Fetching schema from DB for: ${tableName}`)
    return fetchSchemaFromDatabase(tableName)
  }) as Promise<TableSchema | null>
}

/**
 * Get multiple table schemas at once
 * Efficient for agents that need several tables
 */
export async function getTableSchemasWithFetcher(
  tableNames: string[]
): Promise<Record<string, TableSchema>> {
  const results: Record<string, TableSchema> = {}

  await Promise.all(
    tableNames.map(async (tableName) => {
      const schema = await getTableSchemaWithFetcher(tableName)
      if (schema) {
        results[tableName] = schema
      }
    })
  )

  return results
}

/**
 * Get all known schemas (for agents that need full context)
 */
export function getAllKnownSchemas(): Record<string, TableSchema> {
  return { ...KNOWN_SCHEMAS }
}

/**
 * Get list of known table names
 */
export function getKnownTableNames(): string[] {
  return Object.keys(KNOWN_SCHEMAS)
}

/**
 * Add or update a known schema
 * Use this when you add new tables to MonoPilot
 */
export function registerSchema(schema: TableSchema): void {
  KNOWN_SCHEMAS[schema.table_name] = schema
  // Also invalidate cache to force refresh
  getAgentCache().invalidateTableSchema(schema.table_name)
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE QUERY (fallback for unknown tables)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchSchemaFromDatabase(tableName: string): Promise<TableSchema | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[SchemaFetcher] Supabase not configured, cannot fetch schema')
    return null
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Query information_schema for columns
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { p_table_name: tableName })

    if (error) {
      // RPC might not exist, try raw query approach
      console.warn(`[SchemaFetcher] RPC failed, table ${tableName} may not exist`)
      return null
    }

    if (!columns || columns.length === 0) {
      return null
    }

    // Build schema object
    const schema: TableSchema = {
      table_name: tableName,
      columns: columns.map((col: any) => ({
        column_name: col.column_name,
        data_type: col.data_type,
        is_nullable: col.is_nullable,
        column_default: col.column_default,
        character_maximum_length: col.character_maximum_length,
      })),
      primary_key: columns.find((c: any) => c.is_primary_key)?.column_name ?? null,
      foreign_keys: [], // Would need additional query
    }

    return schema
  } catch (error) {
    console.error(`[SchemaFetcher] Failed to fetch schema for ${tableName}:`, error)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA SUMMARY (for smaller context)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a compact summary of table schema
 * Useful when you need schema info but want to save tokens
 */
export function getSchemaCompact(schema: TableSchema): string {
  const columns = schema.columns
    .map((c) => `${c.column_name}:${c.data_type}${c.is_nullable === 'NO' ? '!' : ''}`)
    .join(', ')

  const fks = schema.foreign_keys
    .map((fk) => `${fk.column}->${fk.references_table}`)
    .join(', ')

  return `${schema.table_name}(${columns})${fks ? ` FK:[${fks}]` : ''}`
}

/**
 * Get compact summaries for multiple tables
 */
export function getSchemasCompact(schemas: Record<string, TableSchema>): string {
  return Object.values(schemas)
    .map(getSchemaCompact)
    .join('\n')
}
