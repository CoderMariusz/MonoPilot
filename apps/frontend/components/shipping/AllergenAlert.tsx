/**
 * AllergenAlert Component
 * Story: 07.6 - SO Allergen Validation
 *
 * Alert banner for displaying allergen conflicts and override status.
 *
 * States:
 * - conflict_blocking: Red alert with conflicts list and override button (if Manager)
 * - conflict_no_override_allowed: Red alert with conflicts but no override button
 * - override_approved: Orange alert showing override status
 *
 * Wireframe: SHIP-004
 */

'use client'

import { AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export interface AllergenConflict {
  line_id: string
  line_number: number
  product_id: string
  product_code: string
  product_name: string
  allergen_id: string
  allergen_code: string
  allergen_name: string
}

export interface AllergenAlertProps {
  /** Array of allergen conflicts */
  conflicts: AllergenConflict[]
  /** Whether override has been approved */
  overrideApproved?: boolean
  /** Reason provided for override */
  overrideReason?: string
  /** Name of user who approved override */
  overriddenBy?: string
  /** Timestamp of override approval (ISO 8601) */
  overriddenAt?: string
  /** Whether current user can override (Manager+) */
  canOverride: boolean
  /** Callback when override button clicked */
  onOverride: () => void
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// =============================================================================
// Component
// =============================================================================

export function AllergenAlert({
  conflicts,
  overrideApproved = false,
  overrideReason,
  overriddenBy,
  overriddenAt,
  canOverride,
  onOverride,
}: AllergenAlertProps) {
  // If no conflicts and no override, don't render anything
  if (conflicts.length === 0 && !overrideApproved) {
    return null
  }

  // Override approved state
  if (overrideApproved) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          'relative w-full rounded-lg border-l-4 p-4',
          'bg-orange-50 border-orange-500'
        )}
        data-testid="allergen-alert-override-approved"
      >
        <div className="flex items-start gap-3">
          <Info
            className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5"
            data-testid="info-icon"
            aria-hidden="true"
          />
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-orange-800">
              Allergen Override Approved
            </h4>
            {overriddenBy && overriddenAt && (
              <p className="text-sm text-orange-700">
                Approved by <span className="font-medium">{overriddenBy}</span> on{' '}
                {formatDate(overriddenAt)}
              </p>
            )}
            {overrideReason && (
              <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm text-gray-700">
                {overrideReason}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Conflict blocking state
  const conflictCount = conflicts.length
  const title =
    conflictCount === 1
      ? 'Allergen Conflict Detected'
      : `${conflictCount} Allergen Conflicts Detected`

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'relative w-full rounded-lg border-l-4 p-4',
        'bg-red-50 border-red-500'
      )}
      data-testid="allergen-alert-conflict"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
          data-testid="alert-triangle-icon"
          aria-hidden="true"
        />
        <div className="flex-1 space-y-3">
          <h4 className="font-semibold text-red-800">{title}</h4>

          {/* Conflicts list */}
          <ul className="space-y-2">
            {conflicts.map((conflict) => (
              <li
                key={`${conflict.line_id}-${conflict.allergen_id}`}
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-red-700 font-medium">
                  Line {conflict.line_number}:
                </span>
                <span className="text-gray-700">{conflict.product_name}</span>
                <span className="text-gray-500">({conflict.product_code})</span>
                <span className="text-gray-400">-</span>
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-200"
                >
                  {conflict.allergen_code}
                </Badge>
                <span className="text-gray-600">{conflict.allergen_name}</span>
              </li>
            ))}
          </ul>

          {/* Override button or info text */}
          <div className="pt-2">
            {canOverride ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onOverride}
                className="border-red-300 text-red-700 hover:bg-red-100"
                aria-label="Override Allergen Block"
              >
                Override
              </Button>
            ) : (
              <p className="text-sm text-gray-600 italic">
                Contact manager to override this allergen block.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AllergenAlert
