/**
 * Story 01.4: Organization Profile Step - Validation Schema
 * Epic: 01-settings
 *
 * Zod schema for wizard step 1 (Organization Profile).
 * Used in OrganizationProfileStep component.
 */

import { z } from 'zod';

/**
 * Organization Profile Step Schema
 *
 * Validates 4 fields:
 * - name: Organization name (2-100 characters)
 * - timezone: IANA timezone string
 * - language: ISO 639-1 language code (pl, en, de, fr)
 * - currency: ISO 4217 currency code (PLN, EUR, USD, GBP)
 */
export const organizationProfileStepSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .transform((val) => val.trim()) // Trim whitespace
    .refine((val) => val.length >= 2, 'Organization name must be at least 2 characters')
    .refine((val) => val.length <= 100, 'Organization name must be at most 100 characters'),

  timezone: z
    .string()
    .min(1, 'Timezone is required')
    .refine(
      (tz) => {
        // Special case for UTC (commonly used)
        if (tz === 'UTC') return true

        try {
          return Intl.supportedValuesOf('timeZone').includes(tz)
        } catch {
          return false
        }
      },
      'Invalid timezone'
    ),

  language: z
    .enum(['pl', 'en', 'de', 'fr'], {
      errorMap: () => ({ message: 'Invalid language selection' }),
    }),

  currency: z
    .enum(['PLN', 'EUR', 'USD', 'GBP'], {
      errorMap: () => ({ message: 'Invalid currency selection' }),
    }),
});

/**
 * TypeScript type inferred from schema
 */
export type OrganizationProfileStepData = z.infer<typeof organizationProfileStepSchema>;

/**
 * Default values for form initialization
 */
export const organizationProfileStepDefaults: Partial<OrganizationProfileStepData> = {
  name: '',
  timezone: 'Europe/Warsaw',
  language: 'en',
  currency: 'EUR',
};
