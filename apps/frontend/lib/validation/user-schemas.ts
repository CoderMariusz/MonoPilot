import { z } from 'zod'

/**
 * User Management Validation Schemas
 * Story: 1.2 User Management - CRUD
 *
 * Zod schemas for user CRUD operations with role-based access control
 */

// ============================================================================
// ENUMS
// ============================================================================

export const UserRoleEnum = z.enum([
  'owner',
  'admin',
  'production_manager',
  'quality_manager',
  'warehouse_manager',
  'production_operator',
  'quality_inspector',
  'warehouse_operator',
  'planner',
  'viewer',
])

export type UserRole = z.infer<typeof UserRoleEnum>

export const UserStatusEnum = z.enum(['invited', 'active', 'inactive'])

export type UserStatus = z.infer<typeof UserStatusEnum>

// ============================================================================
// CREATE USER SCHEMA (AC-002.1) - Updated for Story 01.5a
// ============================================================================

export const CreateUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),

  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters')
    .trim(),

  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters')
    .trim(),

  role_id: z
    .string()
    .min(1, 'Role is required'),

  language: z
    .string()
    .optional()
    .default('en'),
})

export type CreateUserInput = z.input<typeof CreateUserSchema>

// ============================================================================
// UPDATE USER SCHEMA (AC-002.3) - Updated for Story 01.5a
// ============================================================================

export const UpdateUserSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be at most 100 characters')
    .trim()
    .optional(),

  last_name: z
    .string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be at most 100 characters')
    .trim()
    .optional(),

  role_id: z
    .string()
    .min(1, 'Role is required')
    .optional(),

  language: z
    .string()
    .optional(),

  status: UserStatusEnum.optional(),

  // Email is explicitly excluded - cannot be updated (security requirement)
})

export type UpdateUserInput = z.input<typeof UpdateUserSchema>

// ============================================================================
// USER FILTERS SCHEMA (AC-002.2)
// ============================================================================

export const UserFiltersSchema = z.object({
  role: z.union([UserRoleEnum, z.array(UserRoleEnum)]).optional(),
  status: UserStatusEnum.optional(),
  search: z.string().optional(), // Search by name or email
})

export type UserFilters = z.infer<typeof UserFiltersSchema>

// ============================================================================
// USER RESPONSE TYPE
// ============================================================================

export interface User {
  id: string
  org_id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  status: UserStatus
  last_login_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates create user input
 * @throws ZodError if validation fails
 */
export function validateCreateUser(data: unknown): CreateUserInput {
  return CreateUserSchema.parse(data)
}

/**
 * Validates update user input
 * @throws ZodError if validation fails
 */
export function validateUpdateUser(data: unknown): UpdateUserInput {
  return UpdateUserSchema.parse(data)
}

/**
 * Validates user filters
 * @throws ZodError if validation fails
 */
export function validateUserFilters(data: unknown): UserFilters {
  return UserFiltersSchema.parse(data)
}

// ============================================================================
// ROLE DISPLAY HELPERS
// ============================================================================

export const roleLabels: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  production_manager: 'Production Manager',
  quality_manager: 'Quality Manager',
  warehouse_manager: 'Warehouse Manager',
  production_operator: 'Production Operator',
  quality_inspector: 'Quality Inspector',
  warehouse_operator: 'Warehouse Operator',
  planner: 'Planner',
  viewer: 'Viewer',
}

export const statusLabels: Record<UserStatus, string> = {
  invited: 'Invited',
  active: 'Active',
  inactive: 'Inactive',
}

/**
 * Gets display label for user role
 */
export function getRoleLabel(role: UserRole): string {
  return roleLabels[role]
}

/**
 * Gets display label for user status
 */
export function getStatusLabel(status: UserStatus): string {
  return statusLabels[status]
}
