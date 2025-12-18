/**
 * Skill Loader with Smart Routing
 *
 * Automatically loads relevant skills based on:
 * 1. Agent type (required skills from agent definition)
 * 2. Task keywords (matched against skill tags)
 * 3. Max 3 skills per request (configurable)
 *
 * Usage:
 * ```typescript
 * import { getSkillsForTask } from '@/lib/cache/skill-loader'
 *
 * const skills = await getSkillsForTask({
 *   agent: 'backend-dev',
 *   task: 'Create REST API for products with validation'
 * })
 * // Returns: [api-rest-design, api-validation, api-error-handling]
 * ```
 */

import * as fs from 'fs'
import * as path from 'path'
import { getAgentCache } from './agent-cache-system'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SkillDefinition {
  name: string
  file: string
  tokens: number
  tags: string[]
  confidence: 'high' | 'medium' | 'low'
  status: 'active' | 'draft' | 'deprecated' | 'needs_review'
}

export interface LoadedSkill {
  name: string
  content: string
  tokens: number
  matchReason: 'required' | 'tag_match' | 'keyword_match'
}

export interface SkillMatchResult {
  skills: LoadedSkill[]
  totalTokens: number
  matchedBy: Record<string, string>
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT SKILL REQUIREMENTS (from agent frontmatter)
// ═══════════════════════════════════════════════════════════════════════════

const AGENT_REQUIRED_SKILLS: Record<string, { required: string[]; optional: string[] }> = {
  'backend-dev': {
    required: ['api-rest-design', 'api-error-handling', 'typescript-patterns'],
    optional: ['supabase-queries', 'supabase-rls', 'api-validation', 'api-authentication', 'security-backend-checklist'],
  },
  'frontend-dev': {
    required: ['react-hooks', 'typescript-patterns'],
    optional: ['react-forms', 'react-state-management', 'react-performance', 'tailwind-patterns', 'nextjs-app-router', 'nextjs-server-components', 'nextjs-middleware', 'nextjs-server-actions', 'accessibility-checklist', 'ui-ux-patterns'],
  },
  'test-engineer': {
    required: ['testing-tdd-workflow'],
    optional: ['testing-jest', 'testing-react-testing-lib', 'testing-playwright', 'testing-msw'],
  },
  'test-writer': {
    required: ['testing-tdd-workflow'],
    optional: ['testing-jest', 'testing-react-testing-lib', 'testing-playwright'],
  },
  'senior-dev': {
    required: ['refactoring-patterns', 'typescript-patterns'],
    optional: ['react-performance', 'code-review-checklist'],
  },
  'code-reviewer': {
    required: ['code-review-checklist'],
    optional: ['security-backend-checklist', 'typescript-patterns', 'react-performance'],
  },
  'architect-agent': {
    required: ['architecture-adr'],
    optional: ['api-rest-design', 'supabase-rls', 'security-backend-checklist'],
  },
  'ux-designer': {
    required: ['ui-ux-patterns'],
    optional: ['accessibility-checklist', 'tailwind-patterns'],
  },
  'pm-agent': {
    required: ['prd-structure', 'invest-stories'],
    optional: ['requirements-clarity-scoring'],
  },
  'discovery-agent': {
    required: ['discovery-interview-patterns', 'requirements-clarity-scoring'],
    optional: [],
  },
  'qa-agent': {
    required: ['qa-bug-reporting'],
    optional: ['testing-playwright'],
  },
  'tech-writer': {
    required: ['documentation-patterns'],
    optional: ['git-conventional-commits'],
  },
  'devops-agent': {
    required: ['ci-github-actions'],
    optional: ['docker-basics', 'env-configuration'],
  },
  'scrum-master': {
    required: ['agile-retrospective', 'invest-stories'],
    optional: [],
  },
  'research-agent': {
    required: ['research-source-evaluation'],
    optional: [],
  },
  'product-owner': {
    required: ['invest-stories', 'prd-structure'],
    optional: [],
  },
  'skill-creator': {
    required: ['skill-quality-standards', 'research-source-evaluation'],
    optional: ['version-changelog-patterns'],
  },
  'skill-validator': {
    required: ['skill-quality-standards', 'version-changelog-patterns'],
    optional: ['research-source-evaluation'],
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL REGISTRY (parsed from REGISTRY.yaml - key data only)
// ═══════════════════════════════════════════════════════════════════════════

const SKILL_REGISTRY: Record<string, SkillDefinition> = {
  // Supabase
  'supabase-rls': { name: 'supabase-rls', file: 'generic/supabase-rls.md', tokens: 650, tags: ['supabase', 'security', 'database', 'rls'], confidence: 'high', status: 'active' },
  'supabase-queries': { name: 'supabase-queries', file: 'generic/supabase-queries.md', tokens: 700, tags: ['supabase', 'database', 'queries', 'select', 'insert', 'update'], confidence: 'high', status: 'active' },
  'supabase-realtime': { name: 'supabase-realtime', file: 'generic/supabase-realtime.md', tokens: 600, tags: ['supabase', 'realtime', 'websocket', 'subscription'], confidence: 'high', status: 'active' },
  'supabase-auth': { name: 'supabase-auth', file: 'generic/supabase-auth.md', tokens: 700, tags: ['supabase', 'auth', 'security', 'login', 'session'], confidence: 'high', status: 'active' },
  'supabase-storage': { name: 'supabase-storage', file: 'generic/supabase-storage.md', tokens: 550, tags: ['supabase', 'storage', 'files', 'upload', 'bucket'], confidence: 'high', status: 'active' },
  'supabase-edge-functions': { name: 'supabase-edge-functions', file: 'generic/supabase-edge-functions.md', tokens: 600, tags: ['supabase', 'serverless', 'deno', 'edge', 'function'], confidence: 'high', status: 'active' },

  // React & Frontend
  'react-hooks': { name: 'react-hooks', file: 'generic/react-hooks.md', tokens: 1100, tags: ['react', 'hooks', 'frontend', 'usestate', 'useeffect', 'usememo'], confidence: 'high', status: 'active' },
  'react-performance': { name: 'react-performance', file: 'generic/react-performance.md', tokens: 950, tags: ['react', 'performance', 'optimization', 'memo', 'usecallback'], confidence: 'high', status: 'active' },
  'react-forms': { name: 'react-forms', file: 'generic/react-forms.md', tokens: 700, tags: ['react', 'forms', 'validation', 'input', 'form', 'react-hook-form'], confidence: 'high', status: 'active' },
  'react-state-management': { name: 'react-state-management', file: 'generic/react-state-management.md', tokens: 750, tags: ['react', 'state', 'zustand', 'tanstack-query', 'context'], confidence: 'high', status: 'active' },
  'nextjs-app-router': { name: 'nextjs-app-router', file: 'generic/nextjs-app-router.md', tokens: 950, tags: ['nextjs', 'routing', 'frontend', 'app', 'router', 'page'], confidence: 'high', status: 'active' },
  'nextjs-data-fetching': { name: 'nextjs-data-fetching', file: 'generic/nextjs-data-fetching.md', tokens: 700, tags: ['nextjs', 'data-fetching', 'caching', 'fetch', 'server'], confidence: 'high', status: 'active' },
  'nextjs-api-routes': { name: 'nextjs-api-routes', file: 'generic/nextjs-api-routes.md', tokens: 650, tags: ['nextjs', 'api', 'backend', 'route', 'handler', 'endpoint'], confidence: 'high', status: 'active' },
  'nextjs-server-components': { name: 'nextjs-server-components', file: 'generic/nextjs-server-components.md', tokens: 450, tags: ['nextjs', 'react', 'rsc', 'server-components', 'frontend'], confidence: 'high', status: 'active' },
  'nextjs-middleware': { name: 'nextjs-middleware', file: 'generic/nextjs-middleware.md', tokens: 400, tags: ['nextjs', 'middleware', 'auth', 'routing', 'redirect'], confidence: 'high', status: 'active' },
  'nextjs-server-actions': { name: 'nextjs-server-actions', file: 'generic/nextjs-server-actions.md', tokens: 450, tags: ['nextjs', 'react', 'forms', 'server-actions', 'mutation'], confidence: 'high', status: 'active' },
  'tailwind-patterns': { name: 'tailwind-patterns', file: 'generic/tailwind-patterns.md', tokens: 650, tags: ['tailwind', 'css', 'styling', 'responsive', 'design'], confidence: 'high', status: 'active' },

  // TypeScript
  'typescript-patterns': { name: 'typescript-patterns', file: 'generic/typescript-patterns.md', tokens: 800, tags: ['typescript', 'patterns', 'types', 'interface', 'type'], confidence: 'high', status: 'active' },
  'typescript-generics': { name: 'typescript-generics', file: 'generic/typescript-generics.md', tokens: 650, tags: ['typescript', 'generics', 'types', 'generic', 'constraint'], confidence: 'high', status: 'active' },
  'typescript-zod': { name: 'typescript-zod', file: 'generic/typescript-zod.md', tokens: 650, tags: ['typescript', 'validation', 'zod', 'schema', 'parse'], confidence: 'high', status: 'active' },
  'typescript-api-types': { name: 'typescript-api-types', file: 'generic/typescript-api-types.md', tokens: 600, tags: ['typescript', 'api', 'types', 'request', 'response'], confidence: 'high', status: 'active' },

  // Testing
  'testing-tdd-workflow': { name: 'testing-tdd-workflow', file: 'generic/testing-tdd-workflow.md', tokens: 600, tags: ['testing', 'tdd', 'workflow', 'red', 'green', 'refactor'], confidence: 'high', status: 'active' },
  'testing-jest': { name: 'testing-jest', file: 'generic/testing-jest.md', tokens: 650, tags: ['testing', 'jest', 'unit-tests', 'mock', 'expect'], confidence: 'high', status: 'active' },
  'testing-react-testing-lib': { name: 'testing-react-testing-lib', file: 'generic/testing-react-testing-lib.md', tokens: 650, tags: ['testing', 'react', 'testing-library', 'render', 'screen'], confidence: 'high', status: 'active' },
  'testing-playwright': { name: 'testing-playwright', file: 'generic/testing-playwright.md', tokens: 650, tags: ['testing', 'e2e', 'playwright', 'browser', 'automation'], confidence: 'high', status: 'active' },
  'testing-msw': { name: 'testing-msw', file: 'generic/testing-msw.md', tokens: 600, tags: ['testing', 'msw', 'mocking', 'api', 'mock'], confidence: 'high', status: 'active' },

  // API & Backend
  'api-rest-design': { name: 'api-rest-design', file: 'generic/api-rest-design.md', tokens: 700, tags: ['api', 'rest', 'backend', 'endpoint', 'http', 'crud'], confidence: 'high', status: 'active' },
  'api-error-handling': { name: 'api-error-handling', file: 'generic/api-error-handling.md', tokens: 650, tags: ['api', 'error-handling', 'backend', 'error', 'exception', 'status'], confidence: 'high', status: 'active' },
  'api-validation': { name: 'api-validation', file: 'generic/api-validation.md', tokens: 700, tags: ['api', 'validation', 'zod', 'backend', 'validate', 'schema'], confidence: 'high', status: 'active' },
  'api-authentication': { name: 'api-authentication', file: 'generic/api-authentication.md', tokens: 750, tags: ['api', 'authentication', 'jwt', 'security', 'auth', 'token'], confidence: 'high', status: 'active' },

  // Code Quality
  'code-review-checklist': { name: 'code-review-checklist', file: 'generic/code-review-checklist.md', tokens: 500, tags: ['quality', 'review', 'checklist', 'pr', 'code-review'], confidence: 'high', status: 'active' },
  'git-workflow': { name: 'git-workflow', file: 'generic/git-workflow.md', tokens: 550, tags: ['git', 'workflow', 'branching', 'branch', 'merge', 'pr'], confidence: 'high', status: 'active' },
  'git-conventional-commits': { name: 'git-conventional-commits', file: 'generic/git-conventional-commits.md', tokens: 400, tags: ['git', 'commits', 'conventions', 'commit', 'message'], confidence: 'high', status: 'active' },
  'documentation-patterns': { name: 'documentation-patterns', file: 'generic/documentation-patterns.md', tokens: 550, tags: ['documentation', 'jsdoc', 'readme', 'docs', 'comment'], confidence: 'high', status: 'active' },
  'refactoring-patterns': { name: 'refactoring-patterns', file: 'generic/refactoring-patterns.md', tokens: 650, tags: ['refactoring', 'code-quality', 'patterns', 'clean', 'extract'], confidence: 'high', status: 'active' },

  // DevOps
  'ci-github-actions': { name: 'ci-github-actions', file: 'generic/ci-github-actions.md', tokens: 700, tags: ['ci', 'github-actions', 'automation', 'pipeline', 'workflow', 'deploy'], confidence: 'high', status: 'active' },
  'docker-basics': { name: 'docker-basics', file: 'generic/docker-basics.md', tokens: 650, tags: ['docker', 'containers', 'devops', 'dockerfile', 'compose'], confidence: 'high', status: 'active' },
  'env-configuration': { name: 'env-configuration', file: 'generic/env-configuration.md', tokens: 550, tags: ['configuration', 'environment', 'security', 'env', 'secrets'], confidence: 'high', status: 'active' },

  // UX & Security
  'accessibility-checklist': { name: 'accessibility-checklist', file: 'generic/accessibility-checklist.md', tokens: 450, tags: ['accessibility', 'a11y', 'frontend', 'ux', 'aria', 'wcag'], confidence: 'high', status: 'active' },
  'security-backend-checklist': { name: 'security-backend-checklist', file: 'generic/security-backend-checklist.md', tokens: 550, tags: ['security', 'backend', 'api', 'owasp', 'injection', 'xss'], confidence: 'high', status: 'active' },
  'ui-ux-patterns': { name: 'ui-ux-patterns', file: 'generic/ui-ux-patterns.md', tokens: 550, tags: ['ui', 'ux', 'design', 'frontend', 'layout', 'component'], confidence: 'high', status: 'active' },

  // Planning & Process
  'invest-stories': { name: 'invest-stories', file: 'generic/invest-stories.md', tokens: 400, tags: ['agile', 'stories', 'planning', 'product', 'user-story', 'invest'], confidence: 'high', status: 'active' },
  'discovery-interview-patterns': { name: 'discovery-interview-patterns', file: 'generic/discovery-interview-patterns.md', tokens: 450, tags: ['discovery', 'requirements', 'interview', 'planning', 'question'], confidence: 'high', status: 'active' },
  'prd-structure': { name: 'prd-structure', file: 'generic/prd-structure.md', tokens: 400, tags: ['product', 'prd', 'requirements', 'planning', 'spec'], confidence: 'high', status: 'active' },
  'architecture-adr': { name: 'architecture-adr', file: 'generic/architecture-adr.md', tokens: 400, tags: ['architecture', 'adr', 'decisions', 'documentation', 'design'], confidence: 'high', status: 'active' },
  'requirements-clarity-scoring': { name: 'requirements-clarity-scoring', file: 'generic/requirements-clarity-scoring.md', tokens: 350, tags: ['requirements', 'discovery', 'clarity', 'planning', 'score'], confidence: 'high', status: 'active' },
  'qa-bug-reporting': { name: 'qa-bug-reporting', file: 'generic/qa-bug-reporting.md', tokens: 400, tags: ['qa', 'bugs', 'testing', 'reporting', 'bug', 'issue'], confidence: 'high', status: 'active' },
  'agile-retrospective': { name: 'agile-retrospective', file: 'generic/agile-retrospective.md', tokens: 300, tags: ['agile', 'retrospective', 'scrum', 'planning', 'retro'], confidence: 'high', status: 'active' },

  // Skills Meta
  'research-source-evaluation': { name: 'research-source-evaluation', file: 'generic/research-source-evaluation.md', tokens: 400, tags: ['research', 'sources', 'validation', 'skills', 'verify'], confidence: 'high', status: 'active' },
  'version-changelog-patterns': { name: 'version-changelog-patterns', file: 'generic/version-changelog-patterns.md', tokens: 350, tags: ['versioning', 'changelog', 'updates', 'skills', 'semver'], confidence: 'high', status: 'active' },
  'skill-quality-standards': { name: 'skill-quality-standards', file: 'generic/skill-quality-standards.md', tokens: 420, tags: ['skills', 'quality', 'standards', 'meta', 'template'], confidence: 'high', status: 'active' },
}

// ═══════════════════════════════════════════════════════════════════════════
// KEYWORD TO TAG MAPPING (for smart routing)
// ═══════════════════════════════════════════════════════════════════════════

const KEYWORD_TO_TAGS: Record<string, string[]> = {
  // API keywords
  'api': ['api', 'rest', 'endpoint'],
  'rest': ['api', 'rest'],
  'endpoint': ['api', 'endpoint', 'route'],
  'crud': ['api', 'crud'],
  'http': ['api', 'http'],

  // Database keywords
  'database': ['database', 'supabase', 'queries'],
  'query': ['queries', 'supabase', 'database'],
  'rls': ['rls', 'supabase', 'security'],
  'supabase': ['supabase'],
  'postgres': ['supabase', 'database'],

  // Auth keywords
  'auth': ['auth', 'authentication', 'security'],
  'login': ['auth', 'login', 'session'],
  'jwt': ['jwt', 'authentication', 'token'],
  'session': ['session', 'auth'],

  // Frontend keywords
  'component': ['react', 'component', 'frontend'],
  'form': ['forms', 'react', 'validation', 'input'],
  'hook': ['hooks', 'react'],
  'state': ['state', 'react', 'zustand'],
  'ui': ['ui', 'frontend', 'design'],
  'ux': ['ux', 'ui', 'design'],

  // Next.js keywords
  'page': ['nextjs', 'page', 'router'],
  'router': ['nextjs', 'routing', 'router'],
  'middleware': ['middleware', 'nextjs'],
  'server': ['server', 'nextjs', 'rsc'],

  // Testing keywords
  'test': ['testing', 'test'],
  'tdd': ['tdd', 'testing'],
  'unit': ['testing', 'jest', 'unit-tests'],
  'e2e': ['e2e', 'playwright', 'testing'],
  'mock': ['mock', 'msw', 'testing'],

  // Validation keywords
  'validation': ['validation', 'zod', 'schema'],
  'zod': ['zod', 'validation', 'schema'],
  'schema': ['schema', 'zod', 'validation'],

  // Security keywords
  'security': ['security', 'owasp'],
  'error': ['error-handling', 'error', 'exception'],

  // Style keywords
  'tailwind': ['tailwind', 'css', 'styling'],
  'css': ['css', 'tailwind', 'styling'],
  'responsive': ['responsive', 'tailwind'],
  'accessibility': ['accessibility', 'a11y', 'wcag'],
  'a11y': ['accessibility', 'a11y'],

  // DevOps keywords
  'ci': ['ci', 'github-actions', 'pipeline'],
  'cd': ['ci', 'deploy', 'pipeline'],
  'deploy': ['deploy', 'ci', 'github-actions'],
  'docker': ['docker', 'containers'],
  'github': ['github-actions', 'git'],

  // Planning keywords
  'story': ['stories', 'invest', 'agile'],
  'prd': ['prd', 'requirements', 'product'],
  'architecture': ['architecture', 'adr', 'design'],
  'refactor': ['refactoring', 'clean'],
  'review': ['review', 'code-review', 'pr'],
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL CACHE (in-memory)
// ═══════════════════════════════════════════════════════════════════════════

const skillContentCache = new Map<string, { content: string; loadedAt: number }>()
const SKILL_CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get skills for a task based on agent type and task content
 * Smart routing: matches task keywords to skill tags
 */
export async function getSkillsForTask(options: {
  agent: string
  task: string
  maxSkills?: number
  skillsBasePath?: string
}): Promise<SkillMatchResult> {
  const { agent, task, maxSkills = 3, skillsBasePath } = options

  const matchedBy: Record<string, string> = {}
  const selectedSkills: string[] = []

  // 1. Get agent's required skills (always include)
  const agentSkills = AGENT_REQUIRED_SKILLS[agent] || { required: [], optional: [] }

  for (const skillName of agentSkills.required) {
    if (selectedSkills.length < maxSkills && SKILL_REGISTRY[skillName]) {
      selectedSkills.push(skillName)
      matchedBy[skillName] = 'required'
    }
  }

  // 2. Extract keywords from task and match to skills
  if (selectedSkills.length < maxSkills) {
    const taskKeywords = extractKeywords(task)
    const matchedTags = new Set<string>()

    // Convert keywords to tags
    for (const keyword of taskKeywords) {
      const tags = KEYWORD_TO_TAGS[keyword]
      if (tags) {
        tags.forEach(tag => matchedTags.add(tag))
      }
    }

    // Find skills matching tags (prioritize by match count)
    const skillScores: { name: string; score: number }[] = []

    for (const [skillName, skill] of Object.entries(SKILL_REGISTRY)) {
      if (selectedSkills.includes(skillName)) continue
      if (skill.status !== 'active') continue

      // Count matching tags
      const matchCount = skill.tags.filter(tag => matchedTags.has(tag)).length
      if (matchCount > 0) {
        // Boost score if skill is in agent's optional list
        const optionalBoost = agentSkills.optional.includes(skillName) ? 2 : 0
        skillScores.push({ name: skillName, score: matchCount + optionalBoost })
      }
    }

    // Sort by score and add top matches
    skillScores.sort((a, b) => b.score - a.score)

    for (const { name } of skillScores) {
      if (selectedSkills.length >= maxSkills) break
      selectedSkills.push(name)
      matchedBy[name] = 'tag_match'
    }
  }

  // 3. Load skill content
  const loadedSkills: LoadedSkill[] = []
  let totalTokens = 0

  for (const skillName of selectedSkills) {
    const content = await loadSkillContent(skillName, skillsBasePath)
    if (content) {
      const skill = SKILL_REGISTRY[skillName]
      loadedSkills.push({
        name: skillName,
        content,
        tokens: skill.tokens,
        matchReason: matchedBy[skillName] as LoadedSkill['matchReason'],
      })
      totalTokens += skill.tokens
    }
  }

  console.log(`[SkillLoader] Loaded ${loadedSkills.length} skills for ${agent}: ${loadedSkills.map(s => s.name).join(', ')} (~${totalTokens} tokens)`)

  return {
    skills: loadedSkills,
    totalTokens,
    matchedBy,
  }
}

/**
 * Get skill names that would match a task (without loading content)
 * Useful for preview/debugging
 */
export function previewSkillsForTask(options: {
  agent: string
  task: string
  maxSkills?: number
}): { skills: string[]; matchedBy: Record<string, string> } {
  const { agent, task, maxSkills = 3 } = options

  const matchedBy: Record<string, string> = {}
  const selectedSkills: string[] = []

  const agentSkills = AGENT_REQUIRED_SKILLS[agent] || { required: [], optional: [] }

  // Required skills
  for (const skillName of agentSkills.required) {
    if (selectedSkills.length < maxSkills && SKILL_REGISTRY[skillName]) {
      selectedSkills.push(skillName)
      matchedBy[skillName] = 'required'
    }
  }

  // Task-based matching
  if (selectedSkills.length < maxSkills) {
    const taskKeywords = extractKeywords(task)
    const matchedTags = new Set<string>()

    for (const keyword of taskKeywords) {
      const tags = KEYWORD_TO_TAGS[keyword]
      if (tags) {
        tags.forEach(tag => matchedTags.add(tag))
      }
    }

    const skillScores: { name: string; score: number }[] = []

    for (const [skillName, skill] of Object.entries(SKILL_REGISTRY)) {
      if (selectedSkills.includes(skillName)) continue
      if (skill.status !== 'active') continue

      const matchCount = skill.tags.filter(tag => matchedTags.has(tag)).length
      if (matchCount > 0) {
        const optionalBoost = agentSkills.optional.includes(skillName) ? 2 : 0
        skillScores.push({ name: skillName, score: matchCount + optionalBoost })
      }
    }

    skillScores.sort((a, b) => b.score - a.score)

    for (const { name } of skillScores) {
      if (selectedSkills.length >= maxSkills) break
      selectedSkills.push(name)
      matchedBy[name] = 'tag_match'
    }
  }

  return { skills: selectedSkills, matchedBy }
}

/**
 * Get all available skills for an agent (required + optional)
 */
export function getAgentSkills(agent: string): { required: string[]; optional: string[] } {
  return AGENT_REQUIRED_SKILLS[agent] || { required: [], optional: [] }
}

/**
 * Get skill definition by name
 */
export function getSkillDefinition(skillName: string): SkillDefinition | null {
  return SKILL_REGISTRY[skillName] || null
}

/**
 * Get all skill names
 */
export function getAllSkillNames(): string[] {
  return Object.keys(SKILL_REGISTRY)
}

/**
 * Format skills as context string for prompt
 */
export function formatSkillsAsContext(skills: LoadedSkill[]): string {
  if (skills.length === 0) return ''

  const parts = skills.map(skill => {
    return `## Skill: ${skill.name}\n${skill.content}`
  })

  return `# Loaded Skills (${skills.length})\n\n${parts.join('\n\n---\n\n')}`
}

/**
 * Format skills as compact summary (for logging/debugging)
 */
export function formatSkillsSummary(skills: LoadedSkill[]): string {
  return skills.map(s => `${s.name} (${s.matchReason}, ~${s.tokens}t)`).join(', ')
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract keywords from task text
 */
function extractKeywords(task: string): string[] {
  const text = task.toLowerCase()
  const words = text.split(/[\s,.\-_:;!?()[\]{}'"]+/)

  // Filter to known keywords only
  const knownKeywords = Object.keys(KEYWORD_TO_TAGS)
  return words.filter(word => knownKeywords.includes(word))
}

/**
 * Load skill content from file (with caching)
 */
async function loadSkillContent(
  skillName: string,
  basePath?: string
): Promise<string | null> {
  // Check cache first
  const cached = skillContentCache.get(skillName)
  if (cached && Date.now() - cached.loadedAt < SKILL_CACHE_TTL) {
    return cached.content
  }

  const skill = SKILL_REGISTRY[skillName]
  if (!skill) return null

  // Determine base path
  const skillsPath = basePath || process.cwd() + '/.claude/skills'
  const filePath = path.join(skillsPath, skill.file)

  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Cache the content
    skillContentCache.set(skillName, {
      content,
      loadedAt: Date.now(),
    })

    return content
  } catch (error) {
    console.warn(`[SkillLoader] Failed to load skill ${skillName} from ${filePath}`)
    return null
  }
}

/**
 * Clear skill cache
 */
export function clearSkillCache(): void {
  skillContentCache.clear()
  console.log('[SkillLoader] Skill cache cleared')
}

/**
 * Get skill cache stats
 */
export function getSkillCacheStats(): { size: number; skills: string[] } {
  return {
    size: skillContentCache.size,
    skills: Array.from(skillContentCache.keys()),
  }
}
