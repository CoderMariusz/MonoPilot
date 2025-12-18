/**
 * Cache Module Exports
 *
 * Centralizes all caching functionality:
 * - Redis cache (existing) - for persistent caching
 * - Agent cache system (new) - multi-layer caching for AI agents
 * - Agent executor (new) - execute agents with caching
 * - Schema fetcher (new) - automatic schema loading with caching
 */

// ═══════════════════════════════════════════════════════════════════════════
// REDIS CACHE (existing)
// ═══════════════════════════════════════════════════════════════════════════
export { getRedis, isRedisAvailable, safeRedisOperation } from './redis-client'
export {
  getCachedWarehouses,
  setCachedWarehouses,
  invalidateWarehouseCache,
} from './warehouse-cache'

// ═══════════════════════════════════════════════════════════════════════════
// AGENT CACHE SYSTEM (new)
// ═══════════════════════════════════════════════════════════════════════════
export {
  AgentCacheSystem,
  getAgentCache,
  agentCache,
  AGENT_SYSTEM_PROMPTS,
  type AgentType,
  type CacheEntry,
  type CacheStats,
  type AgentPromptConfig,
} from './agent-cache-system'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA FETCHER (new)
// ═══════════════════════════════════════════════════════════════════════════
export {
  getTableSchemaWithFetcher,
  getTableSchemasWithFetcher,
  getAllKnownSchemas,
  getKnownTableNames,
  registerSchema,
  getSchemaCompact,
  getSchemasCompact,
  type TableSchema,
  type ColumnSchema,
  type ForeignKey,
} from './schema-fetcher'

// ═══════════════════════════════════════════════════════════════════════════
// SKILL LOADER (new) - Smart skill routing
// ═══════════════════════════════════════════════════════════════════════════
export {
  getSkillsForTask,
  previewSkillsForTask,
  getAgentSkills,
  getSkillDefinition,
  getAllSkillNames,
  formatSkillsAsContext,
  formatSkillsSummary,
  clearSkillCache,
  getSkillCacheStats,
  type SkillDefinition,
  type LoadedSkill,
  type SkillMatchResult,
} from './skill-loader'

// ═══════════════════════════════════════════════════════════════════════════
// AGENT EXECUTOR (new)
// ═══════════════════════════════════════════════════════════════════════════
export {
  AgentExecutor,
  executeAgent,
  executeAgentsParallel,
  executeAgentsRateLimited,
  getAgentCacheStats,
  clearAgentCache,
  type AgentTask,
  type AgentResult,
  type ExecutorConfig,
} from './agent-executor'
