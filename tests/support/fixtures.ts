/**
 * Playwright Test Fixtures
 * Provides userFactory and authHelper for E2E tests
 */

import { test as base, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { createClient } from '@supabase/supabase-js'

// Supabase client for test setup/teardown
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Types
export interface TestUser {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'operator' | 'viewer' | 'planner' | 'technical' | 'purchasing' | 'warehouse' | 'qc' | 'finance'
  status: 'active' | 'invited' | 'inactive'
  org_id: string
}

export interface UserFactory {
  createUser(overrides?: Partial<TestUser>): Promise<TestUser>
  cleanup(): Promise<void>
}

export interface AuthHelper {
  login(page: any, email: string, password: string): Promise<void>
  logout(page: any): Promise<void>
  getAuthToken(page: any): Promise<string | null>
}

// User Factory Implementation
class UserFactoryImpl implements UserFactory {
  private createdUsers: string[] = []

  async createUser(overrides?: Partial<TestUser>): Promise<TestUser> {
    const password = overrides?.password || 'TestPassword123!'
    const email = overrides?.email || faker.internet.email().toLowerCase()
    const first_name = overrides?.first_name || faker.person.firstName()
    const last_name = overrides?.last_name || faker.person.lastName()
    const role = overrides?.role || 'operator'
    const status = overrides?.status || 'active'

    // Create user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
      },
    })

    if (authError || !authUser.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`)
    }

    // Get or create test organization
    let org_id = overrides?.org_id
    if (!org_id) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Test Organization')
        .single()

      if (orgs) {
        org_id = orgs.id
      } else {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: 'Test Organization',
            slug: 'test-org',
          })
          .select('id')
          .single()

        if (orgError || !newOrg) {
          throw new Error(`Failed to create organization: ${orgError?.message}`)
        }
        org_id = newOrg.id
      }
    }

    // Create user in public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        first_name,
        last_name,
        role,
        status,
        org_id,
      })
      .select()
      .single()

    if (publicError || !publicUser) {
      throw new Error(`Failed to create public user: ${publicError?.message}`)
    }

    this.createdUsers.push(authUser.user.id)

    return {
      id: authUser.user.id,
      email,
      password,
      first_name,
      last_name,
      role,
      status,
      org_id,
    }
  }

  async cleanup() {
    for (const userId of this.createdUsers) {
      try {
        // Delete from public.users (will cascade due to FK)
        await supabase.from('users').delete().eq('id', userId)

        // Delete from auth.users
        await supabase.auth.admin.deleteUser(userId)
      } catch (error) {
        console.error(`Failed to cleanup user ${userId}:`, error)
      }
    }
    this.createdUsers = []
  }
}

// Auth Helper Implementation
class AuthHelperImpl implements AuthHelper {
  async login(page: any, email: string, password: string) {
    await page.goto('/auth/sign-in')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard or successful login
    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 10000 })
  }

  async logout(page: any) {
    // Navigate to a page with logout button
    await page.goto('/dashboard')

    // Click user menu and logout
    await page.click('[aria-label="User menu"]')
    await page.click('text=Sign out')

    // Wait for redirect to login
    await page.waitForURL('/auth/sign-in', { timeout: 5000 })
  }

  async getAuthToken(page: any): Promise<string | null> {
    // Get auth token from localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('sb-auth-token')
    })
    return token
  }
}

// Fixture Definition
interface TestFixtures {
  userFactory: UserFactory
  authHelper: AuthHelper
}

export const test = base.extend<TestFixtures>({
  userFactory: async ({}, use) => {
    const factory = new UserFactoryImpl()
    await use(factory)
    await factory.cleanup()
  },

  authHelper: async ({}, use) => {
    const helper = new AuthHelperImpl()
    await use(helper)
  },
})

export { expect }
