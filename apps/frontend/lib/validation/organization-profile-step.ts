/**
 * Story 01.4: Organization Profile Step - Validation Schema (TD-001 Fix)
 * Epic: 01-settings
 *
 * Zod schema for wizard step 1 (Organization Profile).
 * Used in OrganizationProfileStep component.
 */

import { z } from 'zod';

/**
 * Organization Profile Step Schema
 *
 * Validates 12 fields (TD-001 completed):
 * - name: Organization name (2-100 characters)
 * - address_line1: Address line 1 (optional)
 * - address_line2: Address line 2 (optional)
 * - city: City (optional)
 * - postal_code: Postal code (optional)
 * - country: ISO 3166-1 alpha-2 country code (REQUIRED)
 * - contact_email: Contact email (optional, validated)
 * - contact_phone: Contact phone (optional)
 * - timezone: IANA timezone string
 * - language: ISO 639-1 language code (pl, en, de, fr)
 * - currency: ISO 4217 currency code (PLN, EUR, USD, GBP)
 * - date_format: Date format preference (REQUIRED)
 */
export const organizationProfileStepSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .transform((val) => val.trim()) // Trim whitespace
    .refine((val) => val.length >= 2, 'Organization name must be at least 2 characters')
    .refine((val) => val.length <= 100, 'Organization name must be at most 100 characters'),

  // Address fields (optional)
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z
    .string()
    .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)'),

  // Contact fields (optional)
  contact_email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  contact_phone: z.string().optional(),

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
    .enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], {
      errorMap: () => ({ message: 'Invalid date format selection' }),
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
  date_format: 'YYYY-MM-DD',
  address_line1: '',
  address_line2: '',
  city: '',
  postal_code: '',
  country: '',
  contact_email: '',
  contact_phone: '',
};
