/**
 * Password Validation Schemas
 * Story: 01.15 - Session & Password Management
 * Purpose: Zod schemas for password validation
 */

import { z } from 'zod'

// Password Schema - Basic password string
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// Change Password Schema
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
  })

// Validate Password Schema (for real-time validation)
export const validatePasswordSchema = z.object({
  password: z.string(),
})

// Password Policy Schema
export const passwordPolicySchema = z.object({
  min_length: z.number().int().min(8).max(128),
  require_uppercase: z.boolean(),
  require_lowercase: z.boolean(),
  require_number: z.boolean(),
  require_special: z.boolean(),
  password_expiry_days: z.number().int().positive().nullable(),
  enforce_password_history: z.boolean(),
  session_timeout_hours: z.number().int().positive(),
})

// Reset Password Schema (Admin)
export const resetPasswordSchema = z.object({
  user_id: z.string().uuid(),
  new_password: passwordSchema,
  force_change: z.boolean().default(true),
})

// Password Requirement Schema
export const passwordRequirementSchema = z.object({
  id: z.string(),
  label: z.string(),
  met: z.boolean(),
})

// Password Validation Result Schema
export const passwordValidationResultSchema = z.object({
  valid: z.boolean(),
  score: z.number().int().min(0).max(4),
  requirements: z.array(passwordRequirementSchema),
  strength_label: z.enum(['Weak', 'Medium', 'Strong']),
  strength_color: z.enum(['red', 'yellow', 'green']),
})

// TypeScript types
export type PasswordInput = z.infer<typeof passwordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ValidatePasswordInput = z.infer<typeof validatePasswordSchema>
export type PasswordPolicyInput = z.infer<typeof passwordPolicySchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type PasswordRequirementInput = z.infer<typeof passwordRequirementSchema>
export type PasswordValidationResultInput = z.infer<typeof passwordValidationResultSchema>
