/**
 * MachineFilters Component
 * Story: 01.10 - Machines CRUD
 *
 * Filter controls for machines list
 * Filters: Search (code/name), Type, Status, Location
 */

'use client'

import { Input } from '@/components/ui/input'
import type { MachineType, MachineStatus } from '@/lib/types/machine'
import { MACHINE_TYPE_LABELS, MACHINE_STATUS_LABELS } from '@/lib/types/machine'

interface MachineFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  typeFilter: string
  onTypeChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
}

const MACHINE_TYPES: MachineType[] = [
  'MIXER',
  'OVEN',
  'FILLER',
  'PACKAGING',
  'CONVEYOR',
  'BLENDER',
  'CUTTER',
  'LABELER',
  'OTHER',
]

const MACHINE_STATUSES: MachineStatus[] = [
  'ACTIVE',
  'MAINTENANCE',
  'OFFLINE',
  'DECOMMISSIONED',
]

export function MachineFilters({
  searchValue,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
}: MachineFiltersProps) {
  return (
    <div className="flex gap-4">
      <Input
        placeholder="Search machines..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1"
      />

      <select
        aria-label="Filter by type"
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">All types</option>
        {MACHINE_TYPES.map((type) => (
          <option key={type} value={type}>
            {MACHINE_TYPE_LABELS[type]}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by status"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        {MACHINE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {MACHINE_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  )
}
