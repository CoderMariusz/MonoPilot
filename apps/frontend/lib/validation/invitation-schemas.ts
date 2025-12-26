/**
 * Invitation Validation Schemas
 * Story: 01.16 - User Invitations (Email)
 * Description: Zod schemas for invitation request validation
 */

import { z } from 'zod'

/**
 * Schema for inviting a new user
 * AC-1: Email and role validation
 */
export const inviteUserSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase()
    .trim(),
  role_id: z
    .string({ required_error: 'Role ID is required' })
    .uuid('Invalid role ID format'),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>

/**
 * Schema for accepting an invitation
 * AC-3: Password requirements validation
 */
export const acceptInvitationSchema = z.object({
  token: z
    .string({ required_error: 'Invitation token is required' })
    .length(64, 'Invalid invitation token')
    .regex(/^[0-9a-f]{64}$/, 'Invalid token format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>

/**
 * Schema for resending an invitation
 */
export const resendInvitationSchema = z.object({
  invitation_id: z
    .string({ required_error: 'Invitation ID is required' })
    .uuid('Invalid invitation ID'),
})

export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>

/**
 * Schema for cancelling an invitation
 */
export const cancelInvitationSchema = z.object({
  invitation_id: z
    .string({ required_error: 'Invitation ID is required' })
    .uuid('Invalid invitation ID'),
})

export type CancelInvitationInput = z.infer<typeof cancelInvitationSchema>
