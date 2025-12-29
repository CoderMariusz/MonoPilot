'use client'

/**
 * ProductionLinesCheckbox Component (Story 02.5b)
 *
 * Multi-select checkbox group for production lines:
 * - Displays all active production lines
 * - null value = item available on all lines
 * - Selected lines = item restricted to those lines
 * - Empty array is normalized to null
 *
 * Performance: Wrapped with React.memo to prevent unnecessary re-renders
 * when parent components update but props remain unchanged.
 */

import { memo, useCallback, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { normalizeLineIds } from '@/lib/constants/bom-items'

interface ProductionLine {
  id: string
  code: string
  name: string
  is_active: boolean
}

interface ProductionLinesCheckboxProps {
  value?: string[] | null
  onChange: (lineIds: string[] | null) => void
  disabled?: boolean
  productionLines?: ProductionLine[]
  loading?: boolean
}

/**
 * Threshold for showing Select All / Clear All buttons
 */
const SELECT_ALL_THRESHOLD = 3

export const ProductionLinesCheckbox = memo(function ProductionLinesCheckbox({
  value,
  onChange,
  disabled = false,
  productionLines = [],
  loading = false,
}: ProductionLinesCheckboxProps) {
  // Filter only active lines
  const activeLines = useMemo(
    () => productionLines.filter((line) => line.is_active),
    [productionLines]
  )

  // Check if all lines are available (null or undefined)
  const isAllLines = value === null || value === undefined

  // Handle line toggle
  const handleToggle = useCallback(
    (lineId: string, checked: boolean) => {
      if (disabled || loading) return

      const current = value || []
      let newValue: string[]

      if (checked) {
        newValue = [...current, lineId]
      } else {
        newValue = current.filter((id) => id !== lineId)
      }

      // Use helper to normalize empty array to null
      onChange(normalizeLineIds(newValue))
    },
    [disabled, loading, value, onChange]
  )

  // Select all lines
  const handleSelectAll = useCallback(() => {
    if (disabled || loading) return
    onChange(activeLines.map((line) => line.id))
  }, [disabled, loading, activeLines, onChange])

  // Clear all selections (set to null = all lines available)
  const handleClearAll = useCallback(() => {
    if (disabled || loading) return
    onChange(null)
  }, [disabled, loading, onChange])

  // Get selected line names for display
  const selectedLineNames = useMemo(
    () =>
      activeLines
        .filter((line) => value?.includes(line.id))
        .map((line) => line.name),
    [activeLines, value]
  )

  // Show select/clear buttons only when more than threshold lines
  const showBulkActions = activeLines.length > SELECT_ALL_THRESHOLD

  return (
    <div className="space-y-2" role="group" aria-label="Production Lines">
      <div className="flex items-center justify-between">
        <Label>Production Lines (Optional)</Label>
        {showBulkActions && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={disabled || loading}
              className="text-xs"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled || loading}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading production lines...</span>
        </div>
      ) : activeLines.length === 0 ? (
        <div className="p-3 border rounded-md text-sm text-muted-foreground">
          No production lines configured. Items will be available on all lines.
        </div>
      ) : (
        <>
          <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
            {activeLines.map((line) => (
              <ProductionLineItem
                key={line.id}
                line={line}
                isChecked={value?.includes(line.id) ?? false}
                disabled={disabled || loading}
                onToggle={handleToggle}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {isAllLines ? (
              <>
                <span className="font-medium text-green-600">
                  Available on all lines.
                </span>{' '}
                Select specific lines to restrict usage.
              </>
            ) : (
              <>
                <span className="font-medium">
                  Restricted to {value?.length || 0} line
                  {(value?.length || 0) !== 1 ? 's' : ''}:
                </span>{' '}
                {selectedLineNames.join(', ')}
              </>
            )}
          </p>
        </>
      )}
    </div>
  )
})

/**
 * Individual production line checkbox item
 * Extracted as memoized sub-component for better performance
 */
interface ProductionLineItemProps {
  line: ProductionLine
  isChecked: boolean
  disabled: boolean
  onToggle: (lineId: string, checked: boolean) => void
}

const ProductionLineItem = memo(function ProductionLineItem({
  line,
  isChecked,
  disabled,
  onToggle,
}: ProductionLineItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`line-${line.id}`}
        checked={isChecked}
        onCheckedChange={(checked) => onToggle(line.id, !!checked)}
        disabled={disabled}
        aria-label={`${line.code} - ${line.name}`}
      />
      <Label
        htmlFor={`line-${line.id}`}
        className="text-sm font-normal cursor-pointer flex-1"
      >
        <span className="font-medium">{line.code}</span>
        <span className="text-muted-foreground ml-2">{line.name}</span>
      </Label>
    </div>
  )
})
