/**
 * StatusFilter Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Dropdown filter for status selection (Active, Expired, Scheduled)
 */

'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TaxCodeStatus } from '@/lib/types/tax-code'

interface StatusFilterProps {
  value: string
  onChange: (value: TaxCodeStatus | 'all') => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as TaxCodeStatus | 'all')}>
      <SelectTrigger
        className="w-[180px]"
        aria-label="Filter by status"
        data-testid="status-filter"
      >
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="expired">Expired</SelectItem>
        <SelectItem value="scheduled">Scheduled</SelectItem>
      </SelectContent>
    </Select>
  )
}
