/**
 * CountryFilter Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Dropdown filter for country selection
 */

'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COUNTRY_OPTIONS } from '@/lib/types/tax-code'

interface CountryFilterProps {
  value: string
  onChange: (value: string) => void
}

export function CountryFilter({ value, onChange }: CountryFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]" aria-label="Filter by country">
        <SelectValue placeholder="All countries" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All countries</SelectItem>
        {COUNTRY_OPTIONS.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            {country.code} - {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
