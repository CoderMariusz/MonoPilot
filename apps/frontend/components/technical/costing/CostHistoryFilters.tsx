'use client'

/**
 * CostHistoryFilters Component (Story 02.15)
 * Filter controls for cost history
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RotateCcw, Download, Calendar } from 'lucide-react'

export interface CostHistoryFiltersState {
  from: string | null
  to: string | null
  costType: 'all' | 'standard' | 'actual' | 'planned'
  components: {
    material: boolean
    labor: boolean
    overhead: boolean
  }
  chartType: 'line' | 'bar' | 'area'
}

export interface CostHistoryFiltersProps {
  /** Current filter values */
  filters: CostHistoryFiltersState
  /** Handler for filter changes */
  onChange: (filters: CostHistoryFiltersState) => void
  /** Handler for reset */
  onReset: () => void
  /** Handler for export button */
  onExport: () => void
}

const DEFAULT_FILTERS: CostHistoryFiltersState = {
  from: null,
  to: null,
  costType: 'all',
  components: {
    material: true,
    labor: true,
    overhead: true,
  },
  chartType: 'line',
}

export function CostHistoryFilters({
  filters,
  onChange,
  onReset,
  onExport,
}: CostHistoryFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Update local state when props change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Debounced update
  const debouncedUpdate = useCallback(
    (newFilters: CostHistoryFiltersState) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(newFilters)
      }, 500) // 500ms debounce per spec
    },
    [onChange]
  )

  const handleFilterChange = <K extends keyof CostHistoryFiltersState>(
    key: K,
    value: CostHistoryFiltersState[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    debouncedUpdate(newFilters)
  }

  const handleComponentToggle = (
    component: 'material' | 'labor' | 'overhead',
    checked: boolean
  ) => {
    const newFilters = {
      ...localFilters,
      components: {
        ...localFilters.components,
        [component]: checked,
      },
    }
    setLocalFilters(newFilters)
    debouncedUpdate(newFilters)
  }

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS)
    onChange(DEFAULT_FILTERS)
    onReset()
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium text-gray-700">Filters</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date range */}
        <div className="space-y-2">
          <Label htmlFor="date-from" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Date Range
          </Label>
          <div className="flex gap-2">
            <Input
              id="date-from"
              type="date"
              value={localFilters.from || ''}
              onChange={(e) =>
                handleFilterChange('from', e.target.value || null)
              }
              aria-label="From date"
              className="flex-1"
            />
            <span className="self-center text-gray-400">to</span>
            <Input
              id="date-to"
              type="date"
              value={localFilters.to || ''}
              onChange={(e) => handleFilterChange('to', e.target.value || null)}
              aria-label="To date"
              className="flex-1"
            />
          </div>
        </div>

        {/* Cost type */}
        <div className="space-y-2">
          <Label htmlFor="cost-type">Cost Type</Label>
          <Select
            value={localFilters.costType}
            onValueChange={(value) =>
              handleFilterChange(
                'costType',
                value as CostHistoryFiltersState['costType']
              )
            }
          >
            <SelectTrigger id="cost-type" aria-label="Select cost type">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="actual">Actual</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chart type */}
        <div className="space-y-2">
          <Label htmlFor="chart-type">Chart Type</Label>
          <Select
            value={localFilters.chartType}
            onValueChange={(value) =>
              handleFilterChange(
                'chartType',
                value as CostHistoryFiltersState['chartType']
              )
            }
          >
            <SelectTrigger id="chart-type" aria-label="Select chart type">
              <SelectValue placeholder="Line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="area">Area</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Component checkboxes */}
        <div className="space-y-2">
          <Label>Show Components</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-material"
                checked={localFilters.components.material}
                onCheckedChange={(checked) =>
                  handleComponentToggle('material', checked === true)
                }
              />
              <Label
                htmlFor="filter-material"
                className="text-sm cursor-pointer"
              >
                Material
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-labor"
                checked={localFilters.components.labor}
                onCheckedChange={(checked) =>
                  handleComponentToggle('labor', checked === true)
                }
              />
              <Label htmlFor="filter-labor" className="text-sm cursor-pointer">
                Labor
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-overhead"
                checked={localFilters.components.overhead}
                onCheckedChange={(checked) =>
                  handleComponentToggle('overhead', checked === true)
                }
              />
              <Label
                htmlFor="filter-overhead"
                className="text-sm cursor-pointer"
              >
                Overhead
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset Filters
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-1" />
          Export to CSV
        </Button>
      </div>
    </div>
  )
}

export { DEFAULT_FILTERS }
