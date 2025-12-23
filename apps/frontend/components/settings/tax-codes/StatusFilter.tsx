/**
 * StatusFilter Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Dropdown filter for status selection (Active, Expired, Scheduled)
 */

'use client'

import type { TaxCodeStatus } from '@/lib/types/tax-code'

interface StatusFilterProps {
  value: string
  onChange: (value: TaxCodeStatus | 'all') => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <select
      aria-label="Filter by status"
      value={value}
      onChange={(e) => onChange(e.target.value as TaxCodeStatus | 'all')}
      className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="expired">Expired</option>
      <option value="scheduled">Scheduled</option>
    </select>
  )
}
