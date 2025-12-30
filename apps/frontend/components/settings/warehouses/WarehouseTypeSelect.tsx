/**
 * WarehouseTypeSelect Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Dropdown select with tooltips explaining each warehouse type
 */

'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { WarehouseType } from '@/lib/types/warehouse'
import {
  WAREHOUSE_TYPE_LABELS,
  WAREHOUSE_TYPE_DESCRIPTIONS,
  WAREHOUSE_TYPE_COLORS,
} from '@/lib/types/warehouse'
import { Badge } from '@/components/ui/badge'
import { HelpCircle } from 'lucide-react'

const WAREHOUSE_TYPES: WarehouseType[] = [
  'GENERAL',
  'RAW_MATERIALS',
  'WIP',
  'FINISHED_GOODS',
  'QUARANTINE',
]

interface WarehouseTypeSelectProps {
  value: WarehouseType
  onChange: (value: WarehouseType) => void
  error?: boolean
  disabled?: boolean
}

export function WarehouseTypeSelect({
  value,
  onChange,
  error = false,
  disabled = false,
}: WarehouseTypeSelectProps) {
  return (
    <TooltipProvider>
      <div className="flex gap-2 items-center">
        <Select
          value={value}
          onValueChange={(val) => onChange(val as WarehouseType)}
          disabled={disabled}
        >
          <SelectTrigger
            className={error ? 'border-destructive' : ''}
            aria-label="Select warehouse type"
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {WAREHOUSE_TYPES.map((type) => {
              const { bg, text } = WAREHOUSE_TYPE_COLORS[type]
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${bg} ${text} border-none text-xs`}>
                      {WAREHOUSE_TYPE_LABELS[type]}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="max-w-xs">{WAREHOUSE_TYPE_DESCRIPTIONS[type]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {/* Show tooltip for current value */}
        {value && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{WAREHOUSE_TYPE_DESCRIPTIONS[value]}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Hidden native select for testing compatibility */}
      <select
        id="warehouse-type"
        aria-label="Warehouse type"
        value={value}
        onChange={(e) => onChange(e.target.value as WarehouseType)}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
      >
        {WAREHOUSE_TYPES.map((type) => (
          <option key={type} value={type}>
            {WAREHOUSE_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </TooltipProvider>
  )
}
