/**
 * API Authentication Utilities (Inspection Module)
 * Story: 06.5 - Incoming Inspection (Refactored P4)
 *
 * Extracted common auth/permission patterns to reduce code duplication:
 * - User session validation
 * - User data fetching with org_id and role
 * - Permission checking helpers
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.5.incoming-inspection.md}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { unauthorizedResponse, forbiddenResponse, userNotFoundResponse } from './error-handler';

// =============================================================================
// Types
// =============================================================================

export type RoleCode = 'viewer' | 'qa_inspector' | 'qa_manager' | 'admin' | 'owner';

export interface AuthContext {
  userId: string;
  orgId: string;
  roleCode: RoleCode;
}

// =============================================================================
// Constants
// =============================================================================

/** UUID v4 regex pattern for validation */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// =============================================================================
// Role Constants
// =============================================================================

const ADMIN_ROLES = new Set<RoleCode>(['qa_manager', 'admin', 'owner']);
const INSPECTOR_ROLES = new Set<RoleCode>(['qa_inspector', 'qa_manager', 'admin', 'owner']);

// =============================================================================
// Auth Functions
// =============================================================================

/**
 * Check if user is authenticated and fetch auth context
 * Returns user ID, org ID, and role code
 */
export async function getAuthContext(): Promise<AuthContext | NextResponse> {
  const supabase = await createServerSupabase();

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return unauthorizedResponse();
  }

  // Get user's org_id and role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id, roles(code)')
    .eq('id', session.user.id)
    .single();

  if (userError || !userData) {
    return userNotFoundResponse();
  }

  const roleCode = ((userData.roles as any)?.code?.toLowerCase() || 'viewer') as RoleCode;

  return {
    userId: session.user.id,
    orgId: userData.org_id,
    roleCode,
  };
}

/**
 * Check if user has required permission
 * Returns true or forbidden response
 */
export function checkPermission(
  roleCode: RoleCode,
  requiredRoles: RoleCode[]
): true | NextResponse {
  if (requiredRoles.includes(roleCode)) {
    return true;
  }
  return forbiddenResponse();
}

/**
 * Check admin permission (QA_MANAGER+)
 */
export function checkAdminPermission(roleCode: RoleCode): true | NextResponse {
  return checkPermission(roleCode, Array.from(ADMIN_ROLES));
}

/**
 * Check inspector permission (QA_INSPECTOR+)
 */
export function checkInspectorPermission(roleCode: RoleCode): true | NextResponse {
  return checkPermission(roleCode, Array.from(INSPECTOR_ROLES));
}

/**
 * Check if role is admin-level
 */
export function isAdminRole(roleCode: RoleCode): boolean {
  return ADMIN_ROLES.has(roleCode);
}

/**
 * Check if role is inspector-level or higher
 */
export function isInspectorRole(roleCode: RoleCode): boolean {
  return INSPECTOR_ROLES.has(roleCode);
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}
