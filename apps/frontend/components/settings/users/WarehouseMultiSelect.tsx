/**
 * Warehouse Multi-Select Component
 * Story: 01.5b - User Warehouse Access Restrictions (TD-103)
 * Wireframe: SET-009 (User Create/Edit Modal)
 *
 * Multi-select dropdown for warehouse access assignment.
 * Features:
 * - Search/filter warehouses
 * - Select multiple warehouses
 * - Badge display for selections
 * - Remove individual selections
 * - Keyboard navigation
 * - ARIA labels for accessibility
 *
 * States:
 * - Loading: Skeleton while fetching warehouses
 * - Empty: No warehouses available message
 * - Error: Error fetching warehouses
 * - Success: Multi-select with options
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, X, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export interface Warehouse {
  id: string
  code: string
  name: string
  type?: string
  is_active?: boolean
}

interface WarehouseMultiSelectProps {
  /** Currently selected warehouse IDs */
  value: string[]
  /** Callback when selection changes */
  onChange: (value: string[]) => void
  /** List of available warehouses */
  warehouses: Warehouse[]
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string | null
  /** Disabled state */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Custom class name */
  className?: string
  /** Aria label for accessibility */
  'aria-label'?: string
}

/**
 * WarehouseMultiSelect
 *
 * A multi-select dropdown component for selecting warehouses.
 * Implements FR-SET-018 (User Warehouse Access Restrictions).
 */
export function WarehouseMultiSelect({
  value = [],
  onChange,
  warehouses = [],
  isLoading = false,
  error = null,
  disabled = false,
  placeholder = 'Select warehouses...',
  className,
  'aria-label': ariaLabel = 'Warehouse access selection',
}: WarehouseMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Handle selection toggle
  const handleSelect = useCallback((warehouseId: string) => {
    const newValue = value.includes(warehouseId)
      ? value.filter(id => id !== warehouseId)
      : [...value, warehouseId]
    onChange(newValue)
  }, [value, onChange])

  // Handle removing a selected warehouse via badge
  const handleRemove = useCallback((warehouseId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    onChange(value.filter(id => id !== warehouseId))
  }, [value, onChange])

  // Get selected warehouse objects
  const selectedWarehouses = warehouses.filter(w => value.includes(w.id))

  // Get display text for trigger button
  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder
    }
    if (value.length === 1) {
      const warehouse = warehouses.find(w => w.id === value[0])
      return warehouse ? `${warehouse.code} - ${warehouse.name}` : '1 warehouse selected'
    }
    return `${value.length} warehouses selected`
  }

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev < warehouses.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : warehouses.length - 1
        )
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < warehouses.length) {
          handleSelect(warehouses[focusedIndex].id)
        }
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(warehouses.length - 1)
        break
    }
  }, [open, warehouses, focusedIndex, handleSelect])

  // Reset focused index when dropdown closes
  useEffect(() => {
    if (!open) {
      setFocusedIndex(-1)
    }
  }, [open])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)} data-testid="warehouse-multiselect-loading">
        <Skeleton className="h-10 w-full" />
        <div className="text-sm text-muted-foreground">Loading warehouses...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('space-y-2', className)} data-testid="warehouse-multiselect-error">
        <div className="flex items-center gap-2 p-3 border border-destructive rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      </div>
    )
  }

  // Empty state (no warehouses available)
  if (warehouses.length === 0) {
    return (
      <div className={cn('space-y-2', className)} data-testid="warehouse-multiselect-empty">
        <div className="flex items-center gap-2 p-3 border border-muted rounded-md bg-muted/50">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            No warehouses available. Please create a warehouse first.
          </span>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className={cn('space-y-2', className)} data-testid="warehouse-multiselect">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              value.length === 0 && 'text-muted-foreground'
            )}
            onKeyDown={handleKeyDown}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command onKeyDown={handleKeyDown}>
            <CommandInput
              placeholder="Search warehouses..."
              aria-label="Search warehouses"
            />
            <CommandList>
              <CommandEmpty>No warehouse found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {warehouses.map((warehouse, index) => (
                  <CommandItem
                    key={warehouse.id}
                    value={`${warehouse.code} ${warehouse.name}`}
                    onSelect={() => handleSelect(warehouse.id)}
                    className={cn(
                      'cursor-pointer',
                      focusedIndex === index && 'bg-accent'
                    )}
                    aria-selected={value.includes(warehouse.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(warehouse.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {warehouse.code} - {warehouse.name}
                      </span>
                      {warehouse.type && (
                        <span className="text-xs text-muted-foreground">
                          Type: {warehouse.type}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selectedWarehouses.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Selected warehouses"
        >
          {selectedWarehouses.map((warehouse) => (
            <Badge
              key={warehouse.id}
              variant="secondary"
              className="flex items-center gap-1"
              role="listitem"
            >
              {warehouse.code}
              <button
                type="button"
                onClick={(e) => handleRemove(warehouse.id, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRemove(warehouse.id)
                  }
                }}
                className="ml-1 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm"
                aria-label={`Remove ${warehouse.code}`}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
