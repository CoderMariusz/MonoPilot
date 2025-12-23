/**
 * Tax Code Types
 * Story: 01.13 - Tax Codes CRUD
 *
 * TypeScript types and interfaces for tax code management.
 * Includes database entity types, API input/output types, and constants.
 *
 * @module tax-code-types
 */

/**
 * Tax code validity status based on current date and validity period.
 * - 'active': Currently valid (valid_from <= today <= valid_to)
 * - 'expired': Past validity (valid_to < today)
 * - 'scheduled': Future validity (valid_from > today)
 */
export type TaxCodeStatus = 'active' | 'expired' | 'scheduled'

/**
 * Tax code entity matching the database schema.
 * Represents a tax rate configuration with jurisdiction and validity period.
 */
export interface TaxCode {
  /** UUID primary key */
  id: string
  /** Organization ID for multi-tenant isolation */
  org_id: string
  /** Tax code identifier (e.g., VAT23, GST5). Uppercase alphanumeric + hyphens. */
  code: string
  /** Human-readable name (e.g., "VAT 23%") */
  name: string
  /** Tax rate percentage (0-100, 2 decimal places) */
  rate: number
  /** ISO 3166-1 alpha-2 country code (e.g., PL, DE, GB) */
  country_code: string
  /** Start date of validity (YYYY-MM-DD) */
  valid_from: string
  /** End date of validity (YYYY-MM-DD), null = no expiry */
  valid_to: string | null
  /** Whether this is the default tax code for the organization */
  is_default: boolean
  /** Soft delete flag */
  is_deleted: boolean
  /** Timestamp of soft deletion */
  deleted_at: string | null
  /** User who performed soft deletion */
  deleted_by: string | null
  /** Creation timestamp */
  created_at: string
  /** Last update timestamp */
  updated_at: string
  /** User who created the record */
  created_by: string
  /** User who last updated the record */
  updated_by: string
}

/**
 * Input for creating a new tax code.
 * All required fields must be provided.
 */
export interface CreateTaxCodeInput {
  /** Tax code identifier (2-20 chars, uppercase alphanumeric + hyphens) */
  code: string
  /** Human-readable name (2-100 chars) */
  name: string
  /** Tax rate percentage (0-100, max 2 decimal places) */
  rate: number
  /** ISO 3166-1 alpha-2 country code */
  country_code: string
  /** Start date of validity (YYYY-MM-DD) */
  valid_from: string
  /** End date of validity (YYYY-MM-DD), null = no expiry */
  valid_to?: string | null
  /** Set as default tax code for organization */
  is_default?: boolean
}

/**
 * Input for updating an existing tax code.
 * All fields are optional - only provided fields will be updated.
 */
export type UpdateTaxCodeInput = Partial<CreateTaxCodeInput>

/**
 * Parameters for listing tax codes with filters and pagination.
 */
export interface TaxCodeListParams {
  /** Search term for code or name (min 2 chars for filtering) */
  search?: string
  /** Filter by ISO 3166-1 alpha-2 country code */
  country_code?: string
  /** Filter by status (active/expired/scheduled) or 'all' */
  status?: TaxCodeStatus | 'all'
  /** Sort field (code, name, rate, country_code, valid_from, created_at) */
  sort?: string
  /** Sort order */
  order?: 'asc' | 'desc'
  /** Page number (1-indexed) */
  page?: number
  /** Items per page (max 100) */
  limit?: number
}

/**
 * Generic paginated response wrapper.
 * Used for list endpoints with pagination support.
 */
export interface PaginatedResult<T> {
  /** Array of items for current page */
  data: T[]
  /** Total count of items across all pages */
  total: number
  /** Current page number (1-indexed) */
  page: number
  /** Items per page */
  limit: number
  /** Total number of pages */
  total_pages?: number
}

/**
 * Result of tax code uniqueness validation.
 * Used to check if a code is available before create/update.
 */
export interface TaxCodeValidation {
  /** Whether the code is available (not in use) */
  available: boolean
  /** Optional message explaining validation result */
  message?: string
}

/**
 * Result of checking tax code references.
 * Used to determine if a tax code can be deleted.
 */
export interface TaxCodeReferences {
  /** Number of entities referencing this tax code */
  count: number
  /** List of entity types (e.g., ['suppliers', 'invoices']) */
  entities: string[]
}

/**
 * Result of delete eligibility check.
 */
export interface CanDeleteResult {
  /** Whether deletion is allowed */
  allowed: boolean
  /** Reason if deletion is not allowed */
  reason?: string
}

/** Country option for dropdown selection */
interface CountryOption {
  /** ISO 3166-1 alpha-2 code */
  code: string
  /** Full country name */
  name: string
}

/**
 * Available countries for tax code jurisdiction.
 * Common EU countries for food manufacturing operations.
 */
export const COUNTRY_OPTIONS: readonly CountryOption[] = [
  { code: 'PL', name: 'Poland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
] as const

/**
 * Resolves country code to full country name.
 *
 * @param code - ISO 3166-1 alpha-2 country code
 * @returns Full country name or the code if not found
 *
 * @example
 * ```ts
 * getCountryName('PL') // "Poland"
 * getCountryName('XX') // "XX" (unknown code returned as-is)
 * ```
 */
export function getCountryName(code: string): string {
  const country = COUNTRY_OPTIONS.find((c) => c.code === code)
  return country?.name || code
}
