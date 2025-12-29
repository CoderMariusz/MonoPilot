'use client'

/**
 * ConditionalFlagsSelect Component (Story 02.5b)
 *
 * Multi-select checkbox group for conditional flags:
 * - Default flags: organic, vegan, gluten_free, kosher, halal
 * - Supports custom flags
 * - Returns JSONB object with boolean values
 * - Returns null when no flags selected (not empty object)
 *
 * Performance: Wrapped with React.memo to prevent unnecessary re-renders
 * when parent components update but props remain unchanged.
 */

import { memo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { DEFAULT_CONDITIONAL_FLAGS, getFlagColor, normalizeConditionFlags } from '@/lib/constants/bom-items'

interface ConditionFlags {
  organic?: boolean
  vegan?: boolean
  gluten_free?: boolean
  kosher?: boolean
  halal?: boolean
  [key: string]: boolean | undefined
}

interface AvailableFlag {
  id: string
  code: string
  name: string
}

interface ConditionalFlagsSelectProps {
  value?: ConditionFlags | null
  onChange: (flags: ConditionFlags | null) => void
  disabled?: boolean
  availableFlags?: AvailableFlag[]
  loading?: boolean
}

export const ConditionalFlagsSelect = memo(function ConditionalFlagsSelect({
  value,
  onChange,
  disabled = false,
  availableFlags,
  loading = false,
}: ConditionalFlagsSelectProps) {
  // Handle flag toggle with normalization
  const handleToggle = (code: string, checked: boolean) => {
    if (disabled || loading) return

    const newFlags: ConditionFlags = { ...value }

    if (checked) {
      newFlags[code] = true
    } else {
      delete newFlags[code]
    }

    // Use helper to normalize (returns null if no flags)
    onChange(normalizeConditionFlags(newFlags))
  }

  // Count selected flags
  const selectedCount = value
    ? Object.keys(value).filter((k) => value[k] === true).length
    : 0

  // Flags to display (use available or default)
  const flags = availableFlags && availableFlags.length > 0
    ? availableFlags
    : (DEFAULT_CONDITIONAL_FLAGS as unknown as AvailableFlag[])

  return (
    <div className="space-y-2" role="group" aria-label="Conditional Flags">
      <Label>Conditional Flags (Optional)</Label>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading flags...</span>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 p-3 border rounded-md">
            {flags.map((flag) => {
              const isChecked = value?.[flag.code] === true
              const colorClass = getFlagColor(flag.code)

              return (
                <div key={flag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`flag-${flag.code}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleToggle(flag.code, !!checked)
                    }
                    disabled={disabled || loading}
                    aria-label={flag.name}
                  />
                  <Label
                    htmlFor={`flag-${flag.code}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    <Badge
                      variant="outline"
                      className={isChecked ? colorClass : 'bg-gray-50'}
                    >
                      {flag.name}
                    </Badge>
                  </Label>
                </div>
              )
            })}
          </div>

          {selectedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedCount} flag{selectedCount !== 1 ? 's' : ''} selected. Use
              for variant recipes (e.g., organic version of product).
            </p>
          )}

          {selectedCount === 0 && (
            <p className="text-xs text-muted-foreground">
              Select flags to indicate special variants or certifications.
            </p>
          )}
        </>
      )}
    </div>
  )
})
