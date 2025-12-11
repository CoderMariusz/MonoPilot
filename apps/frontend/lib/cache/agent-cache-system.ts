/**
 * Agent Cache System
 * Multi-layer caching for AI agents (Claude API)
 *
 * Layers:
 * 1. Prompt Cache (Anthropic API) - 90% savings on repeated system prompts
 * 2. Schema Cache (In-memory) - Database schemas, rarely change
 * 3. Context Cache (In-memory + Redis) - Project context with TTL
 * 4. Result Cache (Redis) - Agent results for identical queries
 *
 * Usage:
 * ```typescript
 * import { AgentCacheSystem } from '@/lib/cache/agent-cache-system'
 *
 * const cache = new AgentCacheSystem()
 * const schema = await cache.getTableSchema('products')
 * const context = await cache.getProjectContext()
 * ```
 */

import { safeRedisOperation, isRedisAvailable, getRedis } from './redis-client'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AgentType =
  | 'ux-designer'
  | 'api-developer'
  | 'db-agent'
  | 'test-agent'
  | 'code-reviewer'
  | 'research-agent'
  | 'scrum-master'
  | 'architect'
  | 'frontend-dev'
  | 'backend-dev'

export interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  oldestEntry: number | null
}

export interface AgentPromptConfig {
  type: 'text'
  text: string
  cache_control: { type: 'ephemeral' }
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 1: PROMPT CACHE (Anthropic API side)
// These are sent with cache_control to Anthropic - they cache on their servers
// ═══════════════════════════════════════════════════════════════════════════

export const AGENT_SYSTEM_PROMPTS: Record<AgentType, AgentPromptConfig> = {
  'ux-designer': {
    type: 'text',
    text: `You are UX-DESIGNER, an expert in user interface and user experience design.

RESPONSIBILITIES:
- Design intuitive user interfaces following modern UX principles
- Create wireframes, user flows, and component specifications
- Ensure accessibility (WCAG 2.1 AA compliance)
- Apply consistent design patterns across the application
- Consider mobile-first responsive design

TECH STACK CONTEXT:
- Framework: Next.js 15 with React 19
- Styling: TailwindCSS with ShadCN UI components
- Design System: Follow existing patterns in /components

OUTPUT FORMAT:
- Component specifications with props and states
- User flow diagrams in markdown
- Accessibility considerations
- Responsive breakpoint notes

CONSTRAINTS:
- Use existing ShadCN components when possible
- Follow established color scheme and typography
- Consider loading states and error handling UX`,
    cache_control: { type: 'ephemeral' },
  },

  'api-developer': {
    type: 'text',
    text: `You are API-DEVELOPER, an expert in building REST APIs with Next.js and Supabase.

RESPONSIBILITIES:
- Design and implement RESTful API endpoints
- Follow /api/[module]/[resource]/[id]/[action] pattern
- Implement proper validation with Zod schemas
- Handle errors consistently with proper status codes
- Ensure multi-tenant security (org_id isolation)

TECH STACK CONTEXT:
- Framework: Next.js 15 API Routes
- Database: Supabase (PostgreSQL)
- Validation: Zod schemas in /lib/validation
- Auth: Supabase Auth with JWT cookies

API PATTERNS:
- GET: List with pagination, filtering, sorting
- POST: Create with validation
- PUT/PATCH: Update with partial validation
- DELETE: Soft delete (archived_at) or hard delete

OUTPUT FORMAT:
- TypeScript code for API routes
- Zod schema definitions
- Error handling with proper HTTP codes
- Response type definitions

CONSTRAINTS:
- Always validate org_id from session
- Use service layer for business logic
- Return consistent response shape`,
    cache_control: { type: 'ephemeral' },
  },

  'db-agent': {
    type: 'text',
    text: `You are DB-AGENT, an expert in PostgreSQL database design and optimization.

RESPONSIBILITIES:
- Design efficient database schemas
- Write optimized SQL queries
- Create Supabase migrations
- Implement Row Level Security (RLS) policies
- Optimize indexes and query performance

TECH STACK CONTEXT:
- Database: PostgreSQL via Supabase
- Migrations: supabase/migrations/*.sql
- RLS: All tables must have org_id policies
- Types: Generated in lib/supabase/generated.types.ts

SCHEMA PATTERNS:
- Multi-tenant: org_id UUID NOT NULL with RLS
- Audit: created_at, updated_at, created_by, updated_by
- Soft delete: archived_at timestamp
- UUIDs: Use gen_random_uuid() for PKs

OUTPUT FORMAT:
- SQL migration files
- RLS policy definitions
- Index recommendations
- Query optimization suggestions

CONSTRAINTS:
- Always include RLS policies for new tables
- Use snake_case for column names
- Add appropriate indexes for foreign keys
- Consider query performance for large datasets`,
    cache_control: { type: 'ephemeral' },
  },

  'test-agent': {
    type: 'text',
    text: `You are TEST-AGENT, an expert in automated testing and TDD.

RESPONSIBILITIES:
- Write unit tests with Vitest
- Write E2E tests with Playwright
- Follow Test-Driven Development (RED-GREEN-REFACTOR)
- Ensure high test coverage for critical paths
- Create test fixtures and factories

TECH STACK CONTEXT:
- Unit Testing: Vitest with React Testing Library
- E2E Testing: Playwright
- Test Location: __tests__ folders or *.test.ts
- Fixtures: tests/fixtures

TEST PATTERNS:
- Unit: Test isolated functions and components
- Integration: Test API routes with mocked DB
- E2E: Test critical user flows

OUTPUT FORMAT:
- TypeScript test code
- Test descriptions following "should..." pattern
- Proper setup/teardown
- Meaningful assertions

CONSTRAINTS:
- Tests must be deterministic (no flaky tests)
- Mock external dependencies
- Use data factories for test data
- Follow AAA pattern (Arrange, Act, Assert)`,
    cache_control: { type: 'ephemeral' },
  },

  'code-reviewer': {
    type: 'text',
    text: `You are CODE-REVIEWER, an expert in code quality and best practices.

RESPONSIBILITIES:
- Review code for correctness and quality
- Identify bugs, security issues, performance problems
- Ensure consistency with codebase patterns
- Verify proper error handling
- Check for proper TypeScript usage

REVIEW CRITERIA:
- Correctness: Does it work as intended?
- Security: No injection, proper auth, data validation
- Performance: No N+1 queries, proper caching
- Maintainability: Clean code, proper naming, comments
- Testing: Are there adequate tests?

OUTPUT FORMAT:
- APPROVE or REQUEST_CHANGES decision
- Specific issues with file:line references
- Suggested fixes or improvements
- Severity: Critical/High/Medium/Low

CONSTRAINTS:
- Be constructive and specific
- Prioritize issues by severity
- Suggest concrete improvements
- Don't nitpick style (let linters handle it)`,
    cache_control: { type: 'ephemeral' },
  },

  'research-agent': {
    type: 'text',
    text: `You are RESEARCH-AGENT, an expert in technical research and analysis.

RESPONSIBILITIES:
- Research technologies, libraries, and best practices
- Analyze market and competitive landscape
- Evaluate technical solutions and trade-offs
- Gather requirements and clarify ambiguities
- Document findings in structured format

RESEARCH AREAS:
- Technology evaluation and comparison
- Best practices and patterns
- Security vulnerabilities and mitigations
- Performance optimization techniques
- Industry standards and compliance

OUTPUT FORMAT:
- Structured research reports
- Pro/con analysis for options
- Recommendations with rationale
- Sources and references

CONSTRAINTS:
- Cite sources when possible
- Distinguish facts from opinions
- Consider context and constraints
- Provide actionable recommendations`,
    cache_control: { type: 'ephemeral' },
  },

  'scrum-master': {
    type: 'text',
    text: `You are SCRUM-MASTER, an expert in agile project management.

RESPONSIBILITIES:
- Facilitate sprint planning and retrospectives
- Remove blockers and impediments
- Track sprint progress and velocity
- Ensure team follows agile practices
- Manage backlog and prioritization

AGILE PRACTICES:
- Sprint planning with story points
- Daily standups and blockers
- Sprint retrospectives
- Backlog grooming and refinement

OUTPUT FORMAT:
- Sprint status reports
- Blocker analysis and resolution
- Velocity tracking
- Process improvement suggestions

CONSTRAINTS:
- Focus on team productivity
- Identify and escalate blockers quickly
- Keep meetings focused and timeboxed
- Balance process with practicality`,
    cache_control: { type: 'ephemeral' },
  },

  architect: {
    type: 'text',
    text: `You are ARCHITECT, an expert in system design and technical architecture.

RESPONSIBILITIES:
- Design system architecture and components
- Make technology selection decisions
- Create architectural decision records (ADRs)
- Ensure scalability, security, and maintainability
- Define integration patterns and APIs

ARCHITECTURE AREAS:
- System design and component breakdown
- Database schema and data modeling
- API design and integration patterns
- Security architecture
- Performance and scalability

OUTPUT FORMAT:
- Architecture diagrams (mermaid)
- ADR documents
- Component specifications
- Integration contracts

CONSTRAINTS:
- Consider existing tech stack
- Balance complexity with needs
- Document trade-offs and decisions
- Plan for future scalability`,
    cache_control: { type: 'ephemeral' },
  },

  'frontend-dev': {
    type: 'text',
    text: `You are FRONTEND-DEV, an expert in React and Next.js development.

RESPONSIBILITIES:
- Implement UI components with React
- Build pages with Next.js App Router
- Handle client-side state with React Query
- Ensure accessibility and responsive design
- Optimize performance and user experience

TECH STACK CONTEXT:
- Framework: Next.js 15 with App Router
- UI: React 19 with Server Components
- Styling: TailwindCSS + ShadCN UI
- State: React Query for server state
- Forms: React Hook Form + Zod

PATTERNS:
- Server Components by default
- Client Components for interactivity
- Proper loading and error states
- Optimistic updates where appropriate

OUTPUT FORMAT:
- TypeScript React components
- Proper type definitions
- Responsive styles
- Accessibility attributes

CONSTRAINTS:
- Use existing components when possible
- Follow established patterns
- Consider mobile experience
- Handle loading and error states`,
    cache_control: { type: 'ephemeral' },
  },

  'backend-dev': {
    type: 'text',
    text: `You are BACKEND-DEV, an expert in server-side development with Next.js and Supabase.

RESPONSIBILITIES:
- Implement business logic in service layer
- Build API endpoints with proper validation
- Integrate with Supabase database
- Handle errors and edge cases
- Ensure multi-tenant data isolation

TECH STACK CONTEXT:
- Framework: Next.js 15 API Routes
- Database: Supabase (PostgreSQL + RLS)
- Validation: Zod schemas
- Auth: Supabase Auth with JWT

SERVICE PATTERNS:
- Services in /lib/services/*-service.ts
- Validation before database operations
- Proper error handling and logging
- Transaction support for complex operations

OUTPUT FORMAT:
- TypeScript service functions
- API route handlers
- Error handling with proper types
- Database query implementations

CONSTRAINTS:
- Always validate org_id
- Use RLS for data security
- Handle all error cases
- Log important operations`,
    cache_control: { type: 'ephemeral' },
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 2 & 3: IN-MEMORY CACHE
// ═══════════════════════════════════════════════════════════════════════════

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly maxSize: number
  private readonly ttlMs: number
  private stats = { hits: 0, misses: 0 }

  constructor(options: { maxSize?: number; ttlMs?: number } = {}) {
    this.maxSize = options.maxSize ?? 1000
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000 // 5 minutes default
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    entry.hits++
    this.stats.hits++
    return entry.data
  }

  set(key: string, data: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    })
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  getStats(): CacheStats {
    let oldestEntry: number | null = null

    for (const entry of this.cache.values()) {
      if (oldestEntry === null || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp
      }
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      oldestEntry,
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CACHE SYSTEM CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class AgentCacheSystem {
  // Layer 2: Schema cache (long TTL - schemas rarely change)
  private schemaCache = new MemoryCache<Record<string, unknown>>({
    maxSize: 100,
    ttlMs: 30 * 60 * 1000, // 30 minutes
  })

  // Layer 3: Context cache (medium TTL)
  private contextCache = new MemoryCache<unknown>({
    maxSize: 500,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  })

  // Layer 3b: Query result cache (short TTL)
  private queryCache = new MemoryCache<unknown>({
    maxSize: 200,
    ttlMs: 2 * 60 * 1000, // 2 minutes
  })

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 1: Get system prompt for agent (uses Anthropic's prompt caching)
  // ═══════════════════════════════════════════════════════════════════════

  getSystemPrompt(agentType: AgentType): AgentPromptConfig {
    return AGENT_SYSTEM_PROMPTS[agentType]
  }

  getAllSystemPrompts(): Record<AgentType, AgentPromptConfig> {
    return AGENT_SYSTEM_PROMPTS
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 2: Schema caching (database table schemas)
  // ═══════════════════════════════════════════════════════════════════════

  async getTableSchema(
    tableName: string,
    fetcher?: () => Promise<Record<string, unknown>>
  ): Promise<Record<string, unknown> | null> {
    const cacheKey = `schema:${tableName}`

    // Check memory cache first
    const cached = this.schemaCache.get(cacheKey)
    if (cached) {
      console.log(`[AgentCache] Schema cache HIT: ${tableName}`)
      return cached
    }

    // If no fetcher provided, try Redis as fallback
    if (!fetcher) {
      const redisResult = await this.getFromRedis<Record<string, unknown>>(cacheKey)
      if (redisResult) {
        this.schemaCache.set(cacheKey, redisResult)
        return redisResult
      }
      console.log(`[AgentCache] Schema cache MISS: ${tableName}`)
      return null
    }

    // Fetch and cache
    console.log(`[AgentCache] Schema cache MISS: ${tableName}, fetching...`)
    const data = await fetcher()
    this.schemaCache.set(cacheKey, data)

    // Also store in Redis for persistence
    await this.setInRedis(cacheKey, data, 1800) // 30 min TTL

    return data
  }

  invalidateTableSchema(tableName: string): void {
    const cacheKey = `schema:${tableName}`
    this.schemaCache.delete(cacheKey)
    this.deleteFromRedis(cacheKey)
    console.log(`[AgentCache] Schema invalidated: ${tableName}`)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 3: Context caching (project context, shared data)
  // ═══════════════════════════════════════════════════════════════════════

  async getContext<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttlSeconds?: number } = {}
  ): Promise<T> {
    const cacheKey = `context:${key}`
    const ttl = options.ttlSeconds ?? 300 // 5 min default

    // Check memory cache
    const cached = this.contextCache.get(cacheKey) as T | null
    if (cached !== null) {
      console.log(`[AgentCache] Context cache HIT: ${key}`)
      return cached
    }

    // Check Redis
    const redisResult = await this.getFromRedis<T>(cacheKey)
    if (redisResult !== null) {
      console.log(`[AgentCache] Context Redis HIT: ${key}`)
      this.contextCache.set(cacheKey, redisResult)
      return redisResult
    }

    // Fetch fresh data
    console.log(`[AgentCache] Context cache MISS: ${key}, fetching...`)
    const data = await fetcher()

    // Store in both caches
    this.contextCache.set(cacheKey, data)
    await this.setInRedis(cacheKey, data, ttl)

    return data
  }

  invalidateContext(key: string): void {
    const cacheKey = `context:${key}`
    this.contextCache.delete(cacheKey)
    this.deleteFromRedis(cacheKey)
    console.log(`[AgentCache] Context invalidated: ${key}`)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 4: Query result caching (for expensive operations)
  // ═══════════════════════════════════════════════════════════════════════

  async getCachedQuery<T>(
    queryKey: string,
    fetcher: () => Promise<T>,
    options: { ttlSeconds?: number } = {}
  ): Promise<T> {
    const cacheKey = `query:${queryKey}`
    const ttl = options.ttlSeconds ?? 120 // 2 min default

    // Check memory cache only (queries are short-lived)
    const cached = this.queryCache.get(cacheKey) as T | null
    if (cached !== null) {
      console.log(`[AgentCache] Query cache HIT: ${queryKey}`)
      return cached
    }

    // Fetch and cache
    console.log(`[AgentCache] Query cache MISS: ${queryKey}`)
    const data = await fetcher()
    this.queryCache.set(cacheKey, data)

    // Optionally store in Redis for cross-request caching
    if (ttl > 60) {
      await this.setInRedis(cacheKey, data, ttl)
    }

    return data
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONVENIENCE METHODS: Common MonoPilot contexts
  // ═══════════════════════════════════════════════════════════════════════

  async getProjectContext(): Promise<{
    name: string
    version: string
    currentEpic: number
    modules: string[]
    techStack: string
  }> {
    return this.getContext('monopilot-project', async () => ({
      name: 'MonoPilot',
      version: '1.0.0',
      currentEpic: 4,
      modules: ['settings', 'technical', 'planning', 'production', 'warehouse', 'quality', 'shipping'],
      techStack: 'Next.js 15, React 19, Supabase, TypeScript, TailwindCSS, ShadCN UI',
    }))
  }

  async getModuleContext(
    moduleName: string,
    fetcher: () => Promise<unknown>
  ): Promise<unknown> {
    return this.getContext(`module:${moduleName}`, fetcher, { ttlSeconds: 600 })
  }

  async getOrgContext(
    orgId: string,
    fetcher: () => Promise<unknown>
  ): Promise<unknown> {
    return this.getContext(`org:${orgId}`, fetcher, { ttlSeconds: 300 })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REDIS HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  private async getFromRedis<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) return null

    return safeRedisOperation(async (redis) => {
      const data = await redis.get<T>(`agent:${key}`)
      return data
    })
  }

  private async setInRedis<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    if (!isRedisAvailable()) return

    await safeRedisOperation(async (redis) => {
      await redis.set(`agent:${key}`, data, { ex: ttlSeconds })
      return true
    })
  }

  private async deleteFromRedis(key: string): Promise<void> {
    if (!isRedisAvailable()) return

    await safeRedisOperation(async (redis) => {
      await redis.del(`agent:${key}`)
      return true
    })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATS & MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  getStats(): {
    schema: CacheStats
    context: CacheStats
    query: CacheStats
  } {
    return {
      schema: this.schemaCache.getStats(),
      context: this.contextCache.getStats(),
      query: this.queryCache.getStats(),
    }
  }

  clearAll(): void {
    this.schemaCache.clear()
    this.contextCache.clear()
    this.queryCache.clear()
    console.log('[AgentCache] All caches cleared')
  }

  clearSchemas(): void {
    this.schemaCache.clear()
    console.log('[AgentCache] Schema cache cleared')
  }

  clearContexts(): void {
    this.contextCache.clear()
    console.log('[AgentCache] Context cache cleared')
  }

  clearQueries(): void {
    this.queryCache.clear()
    console.log('[AgentCache] Query cache cleared')
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

// Global singleton for consistent caching across the application
let agentCacheInstance: AgentCacheSystem | null = null

export function getAgentCache(): AgentCacheSystem {
  if (!agentCacheInstance) {
    agentCacheInstance = new AgentCacheSystem()
  }
  return agentCacheInstance
}

// Named export for direct instantiation if needed
export const agentCache = getAgentCache()
