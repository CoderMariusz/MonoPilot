/**
 * Agent Executor with Caching
 *
 * Executes AI agents (Claude API) with multi-layer caching:
 * - Layer 1: Prompt caching (Anthropic side) - 90% cheaper
 * - Layer 2: Schema caching - shared database schemas
 * - Layer 3: Context caching - project/org context
 * - Layer 4: Result caching - query deduplication
 *
 * Usage:
 * ```typescript
 * import { executeAgent, executeAgentsParallel } from '@/lib/cache/agent-executor'
 *
 * // Single agent
 * const result = await executeAgent({
 *   agent: 'ux-designer',
 *   task: 'Design a product form',
 *   entities: ['products', 'categories']
 * })
 *
 * // Parallel agents (same feature, different concerns)
 * const results = await executeAgentsParallel([
 *   { agent: 'ux-designer', task: 'Design UI for orders' },
 *   { agent: 'api-developer', task: 'Create API for orders' },
 *   { agent: 'db-agent', task: 'Design schema for orders' }
 * ])
 * ```
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  AgentCacheSystem,
  getAgentCache,
  type AgentType,
  type AgentPromptConfig,
} from './agent-cache-system'
import {
  getTableSchemasWithFetcher,
  getSchemasCompact,
  type TableSchema,
} from './schema-fetcher'
import {
  getSkillsForTask,
  formatSkillsAsContext,
  formatSkillsSummary,
  type LoadedSkill,
} from './skill-loader'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AgentTask {
  /** Type of agent to execute */
  agent: AgentType
  /** The task/prompt for the agent */
  task: string
  /** Database entities (tables) the agent needs schema for */
  entities?: string[]
  /** Additional context to include */
  additionalContext?: Record<string, unknown>
  /** Override default model */
  model?: 'claude-sonnet-4-20250514' | 'claude-opus-4-1-20250514' | 'claude-3-5-haiku-20241022'
  /** Max tokens for response */
  maxTokens?: number
  /** Load skills automatically (default: true) */
  loadSkills?: boolean
  /** Max skills to load (default: 3) */
  maxSkills?: number
  /** Base path for skills files */
  skillsBasePath?: string
}

export interface AgentResult {
  agent: AgentType
  task: string
  response: string
  usage: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
  }
  durationMs: number
  cached: {
    prompt: boolean
    schemas: string[]
    context: boolean
  }
  skills: {
    loaded: string[]
    totalTokens: number
  }
}

export interface ExecutorConfig {
  /** Anthropic API key (defaults to env) */
  apiKey?: string
  /** Default model to use */
  defaultModel?: string
  /** Enable verbose logging */
  verbose?: boolean
  /** Custom cache instance */
  cache?: AgentCacheSystem
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT EXECUTOR CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class AgentExecutor {
  private client: Anthropic
  private cache: AgentCacheSystem
  private defaultModel: string
  private verbose: boolean

  constructor(config: ExecutorConfig = {}) {
    this.client = new Anthropic({
      apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
    })
    this.cache = config.cache ?? getAgentCache()
    this.defaultModel = config.defaultModel ?? 'claude-sonnet-4-20250514'
    this.verbose = config.verbose ?? false
  }

  /**
   * Execute a single agent with caching
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now()
    const cachedInfo = { prompt: true, schemas: [] as string[], context: true }
    const skillsInfo = { loaded: [] as string[], totalTokens: 0 }

    // 1. Get system prompt (Layer 1 - Anthropic caches this)
    const systemPrompt = this.cache.getSystemPrompt(task.agent)

    // 2. Get schemas for requested entities (Layer 2) - AUTOMATIC!
    let schemas: Record<string, TableSchema> = {}
    if (task.entities && task.entities.length > 0) {
      schemas = await getTableSchemasWithFetcher(task.entities)
      cachedInfo.schemas = Object.keys(schemas)
    }

    // 3. Get project context (Layer 3)
    const projectContext = await this.cache.getProjectContext()

    // 4. Load skills based on agent + task (Layer 4 - Smart Routing)
    let loadedSkills: LoadedSkill[] = []
    if (task.loadSkills !== false) {
      const skillResult = await getSkillsForTask({
        agent: task.agent,
        task: task.task,
        maxSkills: task.maxSkills ?? 3,
        skillsBasePath: task.skillsBasePath,
      })
      loadedSkills = skillResult.skills
      skillsInfo.loaded = loadedSkills.map(s => s.name)
      skillsInfo.totalTokens = skillResult.totalTokens

      if (this.verbose && loadedSkills.length > 0) {
        console.log(`[AgentExecutor] Skills loaded: ${formatSkillsSummary(loadedSkills)}`)
      }
    }

    // 5. Build the user message
    const userMessage = this.buildUserMessage(task, schemas, projectContext, loadedSkills)

    // 6. Execute API call
    if (this.verbose) {
      console.log(`[AgentExecutor] Executing ${task.agent}...`)
      console.log(`[AgentExecutor] Task: ${task.task.substring(0, 100)}...`)
    }

    const response = await this.client.messages.create({
      model: task.model ?? this.defaultModel,
      max_tokens: task.maxTokens ?? 4096,
      system: [systemPrompt],
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    const durationMs = Date.now() - startTime

    // Extract response text
    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    // Build result
    const result: AgentResult = {
      agent: task.agent,
      task: task.task,
      response: responseText,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: (response.usage as any).cache_read_input_tokens,
        cacheCreationTokens: (response.usage as any).cache_creation_input_tokens,
      },
      durationMs,
      cached: cachedInfo,
      skills: skillsInfo,
    }

    if (this.verbose) {
      console.log(`[AgentExecutor] ${task.agent} completed in ${durationMs}ms`)
      console.log(`[AgentExecutor] Tokens: ${result.usage.inputTokens} in, ${result.usage.outputTokens} out`)
      if (result.usage.cacheReadTokens) {
        console.log(`[AgentExecutor] Cache read tokens: ${result.usage.cacheReadTokens}`)
      }
    }

    return result
  }

  /**
   * Execute multiple agents in parallel
   * Ideal for different agents working on the same feature
   */
  async executeParallel(tasks: AgentTask[]): Promise<AgentResult[]> {
    const startTime = Date.now()

    if (this.verbose) {
      console.log(`[AgentExecutor] Executing ${tasks.length} agents in parallel...`)
    }

    // Pre-fetch all unique schemas to populate cache
    const allEntities = [...new Set(tasks.flatMap((t) => t.entities ?? []))]
    await Promise.all(
      allEntities.map((entity) => this.cache.getTableSchema(entity))
    )

    // Execute all agents in parallel
    const results = await Promise.all(tasks.map((task) => this.execute(task)))

    const totalDuration = Date.now() - startTime

    if (this.verbose) {
      console.log(`[AgentExecutor] All ${tasks.length} agents completed in ${totalDuration}ms`)
      const totalTokens = results.reduce(
        (sum, r) => sum + r.usage.inputTokens + r.usage.outputTokens,
        0
      )
      console.log(`[AgentExecutor] Total tokens used: ${totalTokens}`)
    }

    return results
  }

  /**
   * Execute agents with rate limiting (for many agents)
   * Prevents hitting API rate limits
   */
  async executeWithRateLimit(
    tasks: AgentTask[],
    options: { concurrency?: number; delayMs?: number } = {}
  ): Promise<AgentResult[]> {
    const concurrency = options.concurrency ?? 3
    const delayMs = options.delayMs ?? 100

    const results: AgentResult[] = []
    const queue = [...tasks]

    while (queue.length > 0) {
      const batch = queue.splice(0, concurrency)
      const batchResults = await Promise.all(batch.map((task) => this.execute(task)))
      results.push(...batchResults)

      if (queue.length > 0 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    return results
  }

  /**
   * Build user message with context
   */
  private buildUserMessage(
    task: AgentTask,
    schemas: Record<string, TableSchema>,
    projectContext: unknown,
    skills: LoadedSkill[] = []
  ): string {
    const parts: string[] = []

    // Task (always first)
    parts.push(`## Task\n${task.task}`)

    // Skills (right after task - most relevant context)
    if (skills.length > 0) {
      const skillsContext = formatSkillsAsContext(skills)
      parts.push(`\n${skillsContext}`)
    }

    // Project context
    parts.push(`\n## Project Context\n${JSON.stringify(projectContext, null, 2)}`)

    // Schemas (if any) - use compact format to save tokens
    if (Object.keys(schemas).length > 0) {
      // Compact format saves ~70% tokens vs full JSON
      const compactSchemas = getSchemasCompact(schemas)
      parts.push(`\n## Database Schemas (compact)\n${compactSchemas}`)

      // Also include full schema for complex agents
      if (task.agent === 'db-agent' || task.agent === 'architect') {
        parts.push(`\n## Full Schemas\n${JSON.stringify(schemas, null, 2)}`)
      }
    }

    // Additional context
    if (task.additionalContext) {
      parts.push(`\n## Additional Context\n${JSON.stringify(task.additionalContext, null, 2)}`)
    }

    return parts.join('\n')
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clearAll()
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Global executor instance
let executorInstance: AgentExecutor | null = null

function getExecutor(): AgentExecutor {
  if (!executorInstance) {
    executorInstance = new AgentExecutor({ verbose: process.env.NODE_ENV === 'development' })
  }
  return executorInstance
}

/**
 * Execute a single agent
 */
export async function executeAgent(task: AgentTask): Promise<AgentResult> {
  return getExecutor().execute(task)
}

/**
 * Execute multiple agents in parallel
 */
export async function executeAgentsParallel(tasks: AgentTask[]): Promise<AgentResult[]> {
  return getExecutor().executeParallel(tasks)
}

/**
 * Execute agents with rate limiting
 */
export async function executeAgentsRateLimited(
  tasks: AgentTask[],
  options?: { concurrency?: number; delayMs?: number }
): Promise<AgentResult[]> {
  return getExecutor().executeWithRateLimit(tasks, options)
}

/**
 * Get cache statistics
 */
export function getAgentCacheStats() {
  return getExecutor().getCacheStats()
}

/**
 * Clear agent cache
 */
export function clearAgentCache() {
  getExecutor().clearCache()
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE USAGE (for documentation)
// ═══════════════════════════════════════════════════════════════════════════

/*
// Single agent execution
const uxResult = await executeAgent({
  agent: 'ux-designer',
  task: 'Design a product creation form with allergen selection',
  entities: ['products', 'allergens', 'categories']
})

// Parallel execution for a feature
const featureResults = await executeAgentsParallel([
  {
    agent: 'ux-designer',
    task: 'Design UI for order management',
    entities: ['orders', 'order_lines']
  },
  {
    agent: 'api-developer',
    task: 'Create CRUD API endpoints for orders',
    entities: ['orders', 'order_lines']
  },
  {
    agent: 'db-agent',
    task: 'Optimize order queries for dashboard',
    entities: ['orders', 'order_lines', 'products']
  },
  {
    agent: 'test-agent',
    task: 'Write E2E tests for order flow',
    entities: ['orders']
  }
])

// Rate-limited execution for many agents
const manyResults = await executeAgentsRateLimited(
  agents.map(a => ({ agent: a, task: 'Analyze codebase', entities: [] })),
  { concurrency: 2, delayMs: 500 }
)

// Check cache stats
const stats = getAgentCacheStats()
console.log(`Cache hit rate: ${(stats.context.hits / (stats.context.hits + stats.context.misses) * 100).toFixed(1)}%`)
*/
