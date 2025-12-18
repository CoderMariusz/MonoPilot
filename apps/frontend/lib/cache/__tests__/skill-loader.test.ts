/**
 * Skill Loader Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  previewSkillsForTask,
  getAgentSkills,
  getSkillDefinition,
  getAllSkillNames,
  clearSkillCache,
} from '../skill-loader'

describe('SkillLoader', () => {
  beforeEach(() => {
    clearSkillCache()
  })

  describe('previewSkillsForTask', () => {
    it('should load required skills for backend-dev', () => {
      const result = previewSkillsForTask({
        agent: 'backend-dev',
        task: 'Create a simple function',
      })

      // Backend-dev has these required skills
      expect(result.skills).toContain('api-rest-design')
      expect(result.skills).toContain('api-error-handling')
      expect(result.skills).toContain('typescript-patterns')
      expect(result.matchedBy['api-rest-design']).toBe('required')
    })

    it('should match skills based on task keywords', () => {
      const result = previewSkillsForTask({
        agent: 'backend-dev',
        task: 'Create REST API endpoint with validation for products',
      })

      // Should include required + matched
      expect(result.skills.length).toBeLessThanOrEqual(3)

      // Should contain at least required skills
      expect(result.skills).toContain('api-rest-design')
    })

    it('should match validation skill for validation task', () => {
      const result = previewSkillsForTask({
        agent: 'backend-dev',
        task: 'Add zod validation schema',
        maxSkills: 5, // Allow more to test matching
      })

      // api-validation should be matched by 'validation' and 'zod' keywords
      const hasValidationSkill = result.skills.includes('api-validation') ||
                                  result.skills.includes('typescript-zod')
      expect(hasValidationSkill).toBe(true)
    })

    it('should load required skills for frontend-dev', () => {
      const result = previewSkillsForTask({
        agent: 'frontend-dev',
        task: 'Create component',
      })

      expect(result.skills).toContain('react-hooks')
      expect(result.skills).toContain('typescript-patterns')
      expect(result.matchedBy['react-hooks']).toBe('required')
    })

    it('should match form skills for form task', () => {
      const result = previewSkillsForTask({
        agent: 'frontend-dev',
        task: 'Create a form with validation',
        maxSkills: 5,
      })

      // Should match react-forms by 'form' keyword
      expect(result.skills).toContain('react-forms')
    })

    it('should match test skills for test-engineer', () => {
      const result = previewSkillsForTask({
        agent: 'test-engineer',
        task: 'Write e2e tests with playwright',
        maxSkills: 5,
      })

      expect(result.skills).toContain('testing-tdd-workflow')

      // Should match testing-playwright by keywords
      const hasPlaywright = result.skills.includes('testing-playwright')
      expect(hasPlaywright).toBe(true)
    })

    it('should respect maxSkills limit', () => {
      const result = previewSkillsForTask({
        agent: 'backend-dev',
        task: 'Create REST API with validation, auth, database queries and security',
        maxSkills: 3,
      })

      expect(result.skills.length).toBeLessThanOrEqual(3)
    })

    it('should prioritize optional skills from agent definition', () => {
      const result = previewSkillsForTask({
        agent: 'backend-dev',
        task: 'Add supabase database query',
        maxSkills: 5,
      })

      // supabase-queries is in backend-dev optional list
      // Should be boosted over other supabase skills
      const hasSupabaseSkill = result.skills.some(s => s.includes('supabase'))
      expect(hasSupabaseSkill).toBe(true)
    })
  })

  describe('getAgentSkills', () => {
    it('should return skills for backend-dev', () => {
      const skills = getAgentSkills('backend-dev')

      expect(skills.required).toContain('api-rest-design')
      expect(skills.required).toContain('api-error-handling')
      expect(skills.optional).toContain('supabase-queries')
      expect(skills.optional).toContain('security-backend-checklist')
    })

    it('should return skills for frontend-dev', () => {
      const skills = getAgentSkills('frontend-dev')

      expect(skills.required).toContain('react-hooks')
      expect(skills.optional).toContain('react-forms')
      expect(skills.optional).toContain('accessibility-checklist')
    })

    it('should return empty arrays for unknown agent', () => {
      const skills = getAgentSkills('unknown-agent')

      expect(skills.required).toEqual([])
      expect(skills.optional).toEqual([])
    })
  })

  describe('getSkillDefinition', () => {
    it('should return skill definition', () => {
      const skill = getSkillDefinition('api-rest-design')

      expect(skill).not.toBeNull()
      expect(skill?.name).toBe('api-rest-design')
      expect(skill?.tokens).toBe(700)
      expect(skill?.tags).toContain('api')
      expect(skill?.tags).toContain('rest')
      expect(skill?.confidence).toBe('high')
      expect(skill?.status).toBe('active')
    })

    it('should return null for unknown skill', () => {
      const skill = getSkillDefinition('unknown-skill')
      expect(skill).toBeNull()
    })
  })

  describe('getAllSkillNames', () => {
    it('should return all skill names', () => {
      const names = getAllSkillNames()

      expect(names.length).toBeGreaterThan(40) // We have 51 skills
      expect(names).toContain('api-rest-design')
      expect(names).toContain('react-hooks')
      expect(names).toContain('testing-tdd-workflow')
      expect(names).toContain('supabase-rls')
    })
  })

  describe('Keyword Matching', () => {
    it('should match API keywords', () => {
      const result = previewSkillsForTask({
        agent: 'backend-dev',
        task: 'Create REST API endpoint',
        maxSkills: 5,
      })

      // 'api', 'rest', 'endpoint' should match api-related skills
      expect(result.skills).toContain('api-rest-design')
    })

    it('should match database keywords', () => {
      const result = previewSkillsForTask({
        agent: 'backend-dev',
        task: 'Query database with supabase',
        maxSkills: 5,
      })

      const hasDbSkill = result.skills.some(s =>
        s.includes('supabase') || s.includes('database')
      )
      expect(hasDbSkill).toBe(true)
    })

    it('should match auth keywords', () => {
      const result = previewSkillsForTask({
        agent: 'backend-dev',
        task: 'Implement JWT authentication',
        maxSkills: 5,
      })

      const hasAuthSkill = result.skills.some(s =>
        s.includes('auth') || s.includes('api-authentication')
      )
      expect(hasAuthSkill).toBe(true)
    })

    it('should match testing keywords', () => {
      const result = previewSkillsForTask({
        agent: 'test-engineer',
        task: 'Write unit tests with jest',
        maxSkills: 5,
      })

      const hasTestSkill = result.skills.some(s => s.includes('testing'))
      expect(hasTestSkill).toBe(true)
    })

    it('should match styling keywords', () => {
      const result = previewSkillsForTask({
        agent: 'frontend-dev',
        task: 'Add tailwind CSS responsive styles',
        maxSkills: 5,
      })

      const hasStyleSkill = result.skills.includes('tailwind-patterns')
      expect(hasStyleSkill).toBe(true)
    })

    it('should match accessibility keywords', () => {
      const result = previewSkillsForTask({
        agent: 'frontend-dev',
        task: 'Add accessibility a11y support',
        maxSkills: 5,
      })

      const hasA11ySkill = result.skills.includes('accessibility-checklist')
      expect(hasA11ySkill).toBe(true)
    })
  })

  describe('Different Agent Types', () => {
    it('should handle test-engineer', () => {
      const result = previewSkillsForTask({
        agent: 'test-engineer',
        task: 'Design test strategy',
      })

      expect(result.skills).toContain('testing-tdd-workflow')
    })

    it('should handle architect-agent', () => {
      const result = previewSkillsForTask({
        agent: 'architect-agent',
        task: 'Design system architecture',
      })

      expect(result.skills).toContain('architecture-adr')
    })

    it('should handle ux-designer', () => {
      const result = previewSkillsForTask({
        agent: 'ux-designer',
        task: 'Design user interface',
      })

      expect(result.skills).toContain('ui-ux-patterns')
    })

    it('should handle devops-agent', () => {
      const result = previewSkillsForTask({
        agent: 'devops-agent',
        task: 'Setup CI pipeline',
      })

      expect(result.skills).toContain('ci-github-actions')
    })

    it('should handle code-reviewer', () => {
      const result = previewSkillsForTask({
        agent: 'code-reviewer',
        task: 'Review pull request',
      })

      expect(result.skills).toContain('code-review-checklist')
    })
  })
})
