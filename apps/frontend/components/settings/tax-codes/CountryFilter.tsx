/**
 * CountryFilter Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Dropdown filter for country selection
 */

'use client'

import { COUNTRY_OPTIONS } from '@/lib/types/tax-code'

interface CountryFilterProps {
  value: string
  onChange: (value: string) => void
}

export function CountryFilter({ value, onChange }: CountryFilterProps) {
  return (
    <select
      aria-label="Filter by country"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      <option value="">All countries</option>
      {COUNTRY_OPTIONS.map((country) => (
        <option key={country.code} value={country.code}>
          {country.code} - {country.name}
        </option>
      ))}
    </select>
  )
}
