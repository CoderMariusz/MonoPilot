'use client'

/**
 * ConditionalFlagsSelect Component (Story 02.5b)
 *
 * Multi-select checkbox group for conditional flags:
 * - Default flags: organic, vegan, gluten_free, kosher, halal
 * - Supports custom flags
 * - Returns JSONB object with boolean values
 * - Returns null when no flags selected (not empty object)
 */

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

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

// Default flags with colors
const DEFAULT_FLAGS: AvailableFlag[] = [
  { id: 'f-1', code: 'organic', name: 'Organic' },
  { id: 'f-2', code: 'vegan', name: 'Vegan' },
  { id: 'f-3', code: 'gluten_free', name: 'Gluten-Free' },
  { id: 'f-4', code: 'kosher', name: 'Kosher' },
  { id: 'f-5', code: 'halal', name: 'Halal' },
]

const FLAG_COLORS: Record<string, string> = {
  organic: 'bg-green-100 text-green-800 border-green-200',
  vegan: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  gluten_free: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  kosher: 'bg-blue-100 text-blue-800 border-blue-200',
  halal: 'bg-purple-100 text-purple-800 border-purple-200',
}

export function ConditionalFlagsSelect({
  value,
  onChange,
  disabled = false,
  availableFlags = DEFAULT_FLAGS,
  loading = false,
}: ConditionalFlagsSelectProps) {
  // Handle flag toggle
  const handleToggle = (code: string, checked: boolean) => {
    if (disabled || loading) return

    const newFlags: ConditionFlags = { ...value }

    if (checked) {
      newFlags[code] = true
    } else {
      delete newFlags[code]
    }

    // Return null if no flags selected (not empty object)
    const hasFlags = Object.keys(newFlags).some((key) => newFlags[key] === true)
    onChange(hasFlags ? newFlags : null)
  }

  // Count selected flags
  const selectedCount = value
    ? Object.keys(value).filter((k) => value[k] === true).length
    : 0

  // Flags to display (use available or default)
  const flags = availableFlags.length > 0 ? availableFlags : DEFAULT_FLAGS

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
              const colorClass = FLAG_COLORS[flag.code] || 'bg-gray-100 text-gray-800'

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
}
