/**
 * Agent Cache System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AgentCacheSystem,
  getAgentCache,
  AGENT_SYSTEM_PROMPTS,
  type AgentType,
} from '../agent-cache-system'
import {
  getTableSchemaWithFetcher,
  getTableSchemasWithFetcher,
  getAllKnownSchemas,
  getKnownTableNames,
  getSchemaCompact,
} from '../schema-fetcher'

describe('AgentCacheSystem', () => {
  let cache: AgentCacheSystem

  beforeEach(() => {
    cache = new AgentCacheSystem()
    cache.clearAll()
  })

  describe('System Prompts (Layer 1)', () => {
    it('should return system prompt for each agent type', () => {
      const agentTypes: AgentType[] = [
        'ux-designer',
        'api-developer',
        'db-agent',
        'test-agent',
        'code-reviewer',
        'research-agent',
        'scrum-master',
        'architect',
        'frontend-dev',
        'backend-dev',
      ]

      agentTypes.forEach((agentType) => {
        const prompt = cache.getSystemPrompt(agentType)
        expect(prompt).toBeDefined()
        expect(prompt.type).toBe('text')
        expect(prompt.text.length).toBeGreaterThan(100)
        expect(prompt.cache_control).toEqual({ type: 'ephemeral' })
      })
    })

    it('should have cache_control on all prompts', () => {
      Object.values(AGENT_SYSTEM_PROMPTS).forEach((prompt) => {
        expect(prompt.cache_control).toEqual({ type: 'ephemeral' })
      })
    })
  })

  describe('Schema Cache (Layer 2)', () => {
    it('should cache schema on first fetch', async () => {
      const testSchema = { table: 'test', columns: ['id', 'name'] }

      const result1 = await cache.getTableSchema('test_table', async () => testSchema)
      expect(result1).toEqual(testSchema)

      // Second call should use cache (no fetcher needed)
      const result2 = await cache.getTableSchema('test_table')
      expect(result2).toEqual(testSchema)
    })

    it('should track cache hits and misses', async () => {
      const testSchema = { table: 'stats_test' }

      // First call - miss
      await cache.getTableSchema('stats_table', async () => testSchema)

      // Second call - hit
      await cache.getTableSchema('stats_table')

      // Third call - hit
      await cache.getTableSchema('stats_table')

      const stats = cache.getStats()
      expect(stats.schema.hits).toBeGreaterThanOrEqual(2)
      expect(stats.schema.misses).toBeGreaterThanOrEqual(1)
    })

    it('should invalidate schema cache', async () => {
      const testSchema = { table: 'invalidate_test' }

      await cache.getTableSchema('invalidate_table', async () => testSchema)
      cache.invalidateTableSchema('invalidate_table')

      // Should be null after invalidation (no fetcher)
      const result = await cache.getTableSchema('invalidate_table')
      expect(result).toBeNull()
    })
  })

  describe('Context Cache (Layer 3)', () => {
    it('should cache context data', async () => {
      let fetchCount = 0
      const fetcher = async () => {
        fetchCount++
        return { project: 'MonoPilot', version: '1.0' }
      }

      const result1 = await cache.getContext('project', fetcher)
      const result2 = await cache.getContext('project', fetcher)
      const result3 = await cache.getContext('project', fetcher)

      expect(result1).toEqual({ project: 'MonoPilot', version: '1.0' })
      expect(result2).toEqual(result1)
      expect(result3).toEqual(result1)
      expect(fetchCount).toBe(1) // Fetcher called only once!
    })

    it('should return project context', async () => {
      const context = await cache.getProjectContext()

      expect(context.name).toBe('MonoPilot')
      expect(context.techStack).toContain('Next.js')
      expect(context.modules).toContain('production')
    })
  })

  describe('Query Cache (Layer 4)', () => {
    it('should cache query results', async () => {
      let queryCount = 0
      const fetcher = async () => {
        queryCount++
        return [{ id: 1 }, { id: 2 }]
      }

      const result1 = await cache.getCachedQuery('products-list', fetcher)
      const result2 = await cache.getCachedQuery('products-list', fetcher)

      expect(result1).toEqual([{ id: 1 }, { id: 2 }])
      expect(result2).toEqual(result1)
      expect(queryCount).toBe(1)
    })
  })

  describe('Cache Stats', () => {
    it('should return cache statistics', () => {
      const stats = cache.getStats()

      expect(stats).toHaveProperty('schema')
      expect(stats).toHaveProperty('context')
      expect(stats).toHaveProperty('query')
      expect(stats.schema).toHaveProperty('hits')
      expect(stats.schema).toHaveProperty('misses')
      expect(stats.schema).toHaveProperty('size')
    })
  })

  describe('Singleton', () => {
    it('should return same instance', () => {
      const cache1 = getAgentCache()
      const cache2 = getAgentCache()

      expect(cache1).toBe(cache2)
    })
  })
})

describe('SchemaFetcher', () => {
  describe('Known Schemas', () => {
    it('should have pre-defined schemas for MonoPilot tables', () => {
      const knownTables = getKnownTableNames()

      expect(knownTables).toContain('products')
      expect(knownTables).toContain('boms')
      expect(knownTables).toContain('work_orders')
      expect(knownTables).toContain('warehouses')
      expect(knownTables).toContain('locations')
      expect(knownTables).toContain('allergens')
      expect(knownTables).toContain('purchase_orders')
      expect(knownTables).toContain('production_lines')
      expect(knownTables).toContain('organizations')
      expect(knownTables).toContain('users')
    })

    it('should return schema for known table', async () => {
      const schema = await getTableSchemaWithFetcher('products')

      expect(schema).toBeDefined()
      expect(schema?.table_name).toBe('products')
      expect(schema?.columns.length).toBeGreaterThan(5)
      expect(schema?.primary_key).toBe('id')
    })

    it('should return multiple schemas at once', async () => {
      const schemas = await getTableSchemasWithFetcher(['products', 'boms', 'warehouses'])

      expect(Object.keys(schemas)).toHaveLength(3)
      expect(schemas.products).toBeDefined()
      expect(schemas.boms).toBeDefined()
      expect(schemas.warehouses).toBeDefined()
    })

    it('should return all known schemas', () => {
      const allSchemas = getAllKnownSchemas()

      expect(Object.keys(allSchemas).length).toBeGreaterThan(5)
      expect(allSchemas.products).toBeDefined()
    })
  })

  describe('Schema Compact', () => {
    it('should generate compact schema representation', async () => {
      const schema = await getTableSchemaWithFetcher('products')
      const compact = getSchemaCompact(schema!)

      expect(compact).toContain('products')
      expect(compact).toContain('id:uuid')
      expect(compact).toContain('org_id:uuid')
      expect(compact.length).toBeLessThan(500) // Much smaller than full JSON
    })
  })

  describe('Cache Integration', () => {
    it('should cache schema on repeated calls', async () => {
      const cache = getAgentCache()
      cache.clearSchemas()

      // First call
      await getTableSchemaWithFetcher('products')
      const stats1 = cache.getStats()

      // Second call (should be cached)
      await getTableSchemaWithFetcher('products')
      const stats2 = cache.getStats()

      expect(stats2.schema.hits).toBeGreaterThan(stats1.schema.hits)
    })
  })
})
