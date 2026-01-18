/**
 * Inventory Grouping Toggle Component
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Radio button group for selecting inventory grouping mode:
 * - By Product
 * - By Location
 * - By Warehouse
 */

'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { InventoryGroupBy } from '@/lib/types/inventory-overview'
import { Package, MapPin, Warehouse } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface InventoryGroupingToggleProps {
  value: InventoryGroupBy
  onChange: (value: InventoryGroupBy) => void
  disabled?: boolean
  isLoading?: boolean
}

// =============================================================================
// Constants
// =============================================================================

const GROUPING_OPTIONS: { value: InventoryGroupBy; label: string; icon: typeof Package; description: string }[] = [
  {
    value: 'product',
    label: 'By Product',
    icon: Package,
    description: 'Group inventory by product SKU',
  },
  {
    value: 'location',
    label: 'By Location',
    icon: MapPin,
    description: 'Group inventory by storage location',
  },
  {
    value: 'warehouse',
    label: 'By Warehouse',
    icon: Warehouse,
    description: 'Group inventory by warehouse',
  },
]

// =============================================================================
// Loading Skeleton
// =============================================================================

function InventoryGroupingToggleSkeleton() {
  return (
    <div className="flex flex-wrap gap-4" data-testid="grouping-toggle-skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function InventoryGroupingToggle({
  value,
  onChange,
  disabled = false,
  isLoading = false,
}: InventoryGroupingToggleProps) {
  if (isLoading) {
    return <InventoryGroupingToggleSkeleton />
  }

  return (
    <div
      className="space-y-2"
      data-testid="inventory-grouping-toggle"
      role="group"
      aria-label="Inventory grouping options"
    >
      <Label className="text-sm font-medium text-muted-foreground">Grouping</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as InventoryGroupBy)}
        className="flex flex-wrap gap-4 md:gap-6"
        disabled={disabled}
      >
        {GROUPING_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          return (
            <div
              key={option.value}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer
                ${isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent hover:border-muted-foreground/20 hover:bg-muted/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <RadioGroupItem
                value={option.value}
                id={`grouping-${option.value}`}
                className="sr-only"
                aria-describedby={`grouping-${option.value}-desc`}
              />
              <Label
                htmlFor={`grouping-${option.value}`}
                className={`
                  flex items-center gap-2 cursor-pointer font-medium
                  ${isSelected ? 'text-primary' : 'text-foreground'}
                  ${disabled ? 'cursor-not-allowed' : ''}
                `}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                {option.label}
              </Label>
              <span id={`grouping-${option.value}-desc`} className="sr-only">
                {option.description}
              </span>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

// =============================================================================
// Mobile Variant (Dropdown)
// =============================================================================

export function InventoryGroupingToggleMobile({
  value,
  onChange,
  disabled = false,
}: Omit<InventoryGroupingToggleProps, 'isLoading'>) {
  const selectedOption = GROUPING_OPTIONS.find(o => o.value === value)
  const Icon = selectedOption?.icon || Package

  return (
    <div className="md:hidden" data-testid="inventory-grouping-toggle-mobile">
      <Label className="text-sm font-medium text-muted-foreground mb-2 block">Grouping</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as InventoryGroupBy)}
        disabled={disabled}
        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Select inventory grouping"
      >
        {GROUPING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
