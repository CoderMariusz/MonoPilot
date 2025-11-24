import { z } from 'zod'

export const OrganizationSchema = z.object({
  // Basic Data
  company_name: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  logo_url: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().max(100, 'City name too long').optional(),
  postal_code: z.string().max(20, 'Postal code too long').optional(),
  country: z.string().length(2, 'Invalid country code').optional(),
  nip_vat: z.string().max(50, 'Tax ID too long').optional(),

  // Business Settings
  fiscal_year_start: z.string().optional(), // ISO date string
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional().default('DD/MM/YYYY'),
  number_format: z.enum(['1,234.56', '1.234,56', '1 234.56']).optional().default('1,234.56'),
  unit_system: z.enum(['metric', 'imperial']).optional().default('metric'),

  // Regional Settings
  timezone: z.string().optional().default('UTC'),
  default_currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']).optional().default('EUR'),
  default_language: z.enum(['PL', 'EN']).optional().default('EN'),
})

export type OrganizationInput = z.input<typeof OrganizationSchema>

// Organization response from API
export interface Organization extends OrganizationInput {
  id: string
  created_at: string
  updated_at: string
}
