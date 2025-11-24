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
  'admin',
  'manager',
  'operator',
  'viewer',
  'planner',
  'technical',
  'purchasing',
  'warehouse',
  'qc',
  'finance',
])

export type UserRole = z.infer<typeof UserRoleEnum>

export const UserStatusEnum = z.enum(['invited', 'active', 'inactive'])

export type UserStatus = z.infer<typeof UserStatusEnum>

// ============================================================================
// CREATE USER SCHEMA (AC-002.1)
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
    .max(50, 'First name must be less than 50 characters')
    .trim(),

  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),

  role: UserRoleEnum,
})

export type CreateUserInput = z.input<typeof CreateUserSchema>

// ============================================================================
// UPDATE USER SCHEMA (AC-002.3)
// ============================================================================

export const UpdateUserSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name cannot be empty')
    .max(50, 'First name must be less than 50 characters')
    .trim()
    .optional(),

  last_name: z
    .string()
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name must be less than 50 characters')
    .trim()
    .optional(),

  role: UserRoleEnum.optional(),

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
  admin: 'Admin',
  manager: 'Manager',
  operator: 'Operator',
  viewer: 'Viewer',
  planner: 'Planner',
  technical: 'Technical',
  purchasing: 'Purchasing',
  warehouse: 'Warehouse',
  qc: 'Quality Control',
  finance: 'Finance',
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
