/**
 * Story 01.4: Organization Profile Step - Validation Schema
 * Epic: 01-settings
 *
 * Zod schema for wizard step 1 (Organization Profile).
 * MVP validation for 4 core fields.
 */

import { z } from 'zod'

/**
 * Organization Profile Step Schema
 *
 * Validates all fields for wizard step 1:
 * - name: Organization name (2-100 characters, required)
 * - timezone: IANA timezone string (required, must be valid)
 * - language: ISO 639-1 language code (pl, en, de, fr, required)
 * - currency: ISO 4217 currency code (PLN, EUR, USD, GBP, required)
 * - date_format: Date display format (required)
 * - address_line1, address_line2, city, postal_code, country: Address fields (optional)
 * - contact_email, contact_phone: Contact fields (optional)
 */
export const organizationProfileStepSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim()) // Trim whitespace first
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

  date_format: z
    .enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'], {
      errorMap: () => ({ message: 'Invalid date format selection' }),
    }),

  address_line1: z.string(),
  address_line2: z.string(),
  city: z.string(),
  postal_code: z.string(),
  country: z.string(),
  contact_email: z.string().email().or(z.literal('')),
  contact_phone: z.string(),
})

/**
 * TypeScript type inferred from schema
 */
export type OrganizationProfileStepData = z.infer<typeof organizationProfileStepSchema>

/**
 * Default values for form initialization
 */
export const organizationProfileStepDefaults: Partial<OrganizationProfileStepData> = {
  name: '',
  timezone: 'Europe/Warsaw',
  language: 'en',
  currency: 'EUR',
  date_format: 'YYYY-MM-DD',
  address_line1: '',
  address_line2: '',
  city: '',
  postal_code: '',
  country: '',
  contact_email: '',
  contact_phone: '',
}
