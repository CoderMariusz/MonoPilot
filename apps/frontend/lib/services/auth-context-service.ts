/**
 * Auth Context Service - Story 02.10a
 * Purpose: Authentication context utilities for API routes
 *
 * Provides helper functions for:
 * - Getting current user's org_id
 * - Getting current user's id
 * - Checking permissions
 *
 * Note: These are thin wrappers around Supabase auth for easier mocking in tests
 */

import { createServerSupabase } from '../supabase/server'

/**
 * Get current authenticated user's org_id
 * Returns null if not authenticated or no org assigned
 */
export async function getCurrentOrgId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (error || !userData?.org_id) {
      console.error('Failed to get org_id for user:', user.id, error)
      return null
    }

    return userData.org_id
  } catch (error) {
    console.error('Error in getCurrentOrgId:', error)
    return null
  }
}

/**
 * Get current authenticated user's id
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) return null

    return user.id
  } catch (error) {
    console.error('Error in getCurrentUserId:', error)
    return null
  }
}

/**
 * Check if current user has a specific permission for a module
 *
 * @param module - Module name (e.g., 'technical', 'settings')
 * @param operation - Operation letter (C, R, U, D)
 * @returns true if user has the permission
 */
export async function hasPermission(
  module: string,
  operation: 'C' | 'R' | 'U' | 'D'
): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) return false

    const { data: userData, error } = await supabase
      .from('users')
      .select(
        `
        role:roles (
          code,
          permissions
        )
      `
      )
      .eq('id', user.id)
      .single()

    if (error || !userData?.role) {
      console.error('Failed to get role for user:', user.id, error)
      return false
    }

    const permissions = (userData.role as { permissions?: Record<string, string> })?.permissions
    if (!permissions) return false

    const modulePerms = permissions[module.toLowerCase()]
    if (!modulePerms || modulePerms === '-') return false

    return modulePerms.includes(operation)
  } catch (error) {
    console.error('Error in hasPermission:', error)
    return false
  }
}
