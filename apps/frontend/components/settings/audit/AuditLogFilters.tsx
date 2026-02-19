/**
 * AuditLogFilters Component
 * Story: 01.17 - Audit Trail
 *
 * User filter (multi-select), Action filter (multi-select), Entity type filter, Date range
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, CalendarIcon, ChevronsUpDown, X } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import type { AuditLogAction, AuditLogFilters } from '@/lib/types/audit-log'
import { AUDIT_LOG_ACTION_LABELS, COMMON_ENTITY_TYPES } from '@/lib/types/audit-log'

interface AuditLogFiltersProps {
  filters: AuditLogFilters
  onFilterChange: (filters: AuditLogFilters) => void
  users: { id: string; email: string; first_name?: string | null; last_name?: string | null }[]
}

type DatePreset = 'today' | 'last7' | 'last30' | 'custom'

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectPopoverProps {
  label: string
  placeholder: string
  options: MultiSelectOption[]
  selected: string[]
  onToggle: (value: string) => void
  dataTestId: string
  searchPlaceholder: string
}

function MultiSelectPopover({
  label,
  placeholder,
  options,
  selected,
  onToggle,
  dataTestId,
  searchPlaceholder,
}: MultiSelectPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9" data-testid={dataTestId}>
          {label}
          {selected.length ? (
            <Badge variant="secondary" className="ml-2">
              {selected.length}
            </Badge>
          ) : null}
          <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => onToggle(option.value)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate" title={option.label}>
                      {option.label}
                    </span>
                    <Check
                      className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selected.length === 0 && (
          <div className="px-3 pb-3 text-xs text-muted-foreground">{placeholder}</div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function AuditLogFilters({ filters, onFilterChange, users }: AuditLogFiltersProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.date_from ? new Date(filters.date_from) : undefined,
    to: filters.date_to ? new Date(filters.date_to) : undefined,
  })

  const handleActionToggle = (action: AuditLogAction) => {
    const currentActions = filters.action || []
    const newActions = currentActions.includes(action)
      ? currentActions.filter((a) => a !== action)
      : [...currentActions, action]
    onFilterChange({ ...filters, action: newActions.length ? newActions : undefined })
  }

  const handleEntityToggle = (entityType: string) => {
    const currentTypes = filters.entity_type || []
    const newTypes = currentTypes.includes(entityType)
      ? currentTypes.filter((t) => t !== entityType)
      : [...currentTypes, entityType]
    onFilterChange({ ...filters, entity_type: newTypes.length ? newTypes : undefined })
  }

  const handleUserToggle = (userId: string) => {
    const currentUsers = filters.user_id || []
    const newUsers = currentUsers.includes(userId)
      ? currentUsers.filter((id) => id !== userId)
      : [...currentUsers, userId]
    onFilterChange({ ...filters, user_id: newUsers.length ? newUsers : undefined })
  }

  const handleDatePreset = (preset: DatePreset) => {
    const now = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (preset) {
      case 'today':
        from = startOfDay(now)
        to = endOfDay(now)
        break
      case 'last7':
        from = startOfDay(subDays(now, 7))
        to = endOfDay(now)
        break
      case 'last30':
        from = startOfDay(subDays(now, 30))
        to = endOfDay(now)
        break
      case 'custom':
        return
    }

    setDateRange({ from, to })
    onFilterChange({
      ...filters,
      date_from: from?.toISOString(),
      date_to: to?.toISOString(),
    })
  }

  const clearFilters = () => {
    onFilterChange({})
    setDateRange({})
  }

  const hasActiveFilters =
    (filters.action?.length ?? 0) > 0 ||
    (filters.entity_type?.length ?? 0) > 0 ||
    (filters.user_id?.length ?? 0) > 0 ||
    filters.date_from !== undefined

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Action Filter */}
      <MultiSelectPopover
        label="Action"
        placeholder="Select actions"
        options={(Object.keys(AUDIT_LOG_ACTION_LABELS) as AuditLogAction[]).map((action) => ({
          value: action,
          label: AUDIT_LOG_ACTION_LABELS[action],
        }))}
        selected={filters.action ?? []}
        onToggle={(value) => handleActionToggle(value as AuditLogAction)}
        dataTestId="audit-filter-action"
        searchPlaceholder="Search actions..."
      />

      {/* Entity Type Filter */}
      <MultiSelectPopover
        label="Entity Type"
        placeholder="Select entity types"
        options={COMMON_ENTITY_TYPES.map((entityType) => ({
          value: entityType,
          label: entityType.replace(/_/g, ' '),
        }))}
        selected={filters.entity_type ?? []}
        onToggle={handleEntityToggle}
        dataTestId="audit-filter-entity"
        searchPlaceholder="Search entity types..."
      />

      {/* User Filter */}
      <MultiSelectPopover
        label="User"
        placeholder="Select users"
        options={users.map((user) => ({
          value: user.id,
          label:
            user.first_name || user.last_name
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : user.email,
        }))}
        selected={filters.user_id ?? []}
        onToggle={handleUserToggle}
        dataTestId="audit-filter-user"
        searchPlaceholder="Search users..."
      />

      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9"
            data-testid="audit-filter-date"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                </>
              ) : (
                format(dateRange.from, 'MMM d')
              )
            ) : (
              'Date Range'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b space-y-2">
            <div className="text-sm font-medium">Presets</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDatePreset('today')}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDatePreset('last7')}
              >
                Last 7 days
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDatePreset('last30')}
              >
                Last 30 days
              </Button>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={(range) => {
              setDateRange({ from: range?.from, to: range?.to })
              onFilterChange({
                ...filters,
                date_from: range?.from?.toISOString(),
                date_to: range?.to?.toISOString(),
              })
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9"
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
