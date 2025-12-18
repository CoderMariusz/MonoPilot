import { z } from 'zod'

/**
 * Onboarding Status Response Schema
 * Returned by GET /api/v1/settings/onboarding/status
 */
export const OnboardingStatusResponseSchema = z.object({
  step: z.number().int().min(0).max(6, 'Step must be between 0 and 6'),
  started_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  skipped: z.boolean(),
  can_skip: z.boolean(),
})

export type OnboardingStatusResponse = z.infer<
  typeof OnboardingStatusResponseSchema
>

/**
 * Onboarding Progress Request Schema
 * Request body for PUT /api/v1/settings/onboarding/progress
 */
export const OnboardingProgressRequestSchema = z.object({
  step: z.number().int().min(1).max(6, 'Step must be between 1 and 6'),
})

export type OnboardingProgressRequest = z.infer<
  typeof OnboardingProgressRequestSchema
>

/**
 * Onboarding Skip Response Schema
 * Returned by POST /api/v1/settings/onboarding/skip
 */
export const OnboardingSkipResponseSchema = z.object({
  success: z.boolean(),
  demo_data: z.object({
    warehouse_id: z.string().uuid().optional(),
    location_id: z.string().uuid().optional(),
    product_id: z.string().uuid().optional(),
  }),
  redirect: z.string().url().or(z.literal('/dashboard')),
})

export type OnboardingSkipResponse = z.infer<typeof OnboardingSkipResponseSchema>
