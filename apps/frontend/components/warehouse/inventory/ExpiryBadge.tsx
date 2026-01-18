/**
 * Expiry Badge Component
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Color-coded badge showing days until expiry with appropriate styling
 */

'use client'

import { cn } from '@/lib/utils'
import type { ExpiryTier } from '@/lib/validation/expiry-alert-schema'

interface ExpiryBadgeProps {
  daysRemaining: number
  className?: string
}

/**
 * Calculate expiry tier from days remaining
 */
function calculateTier(daysRemaining: number): ExpiryTier {
  if (daysRemaining < 0) return 'expired'
  if (daysRemaining <= 7) return 'critical'
  if (daysRemaining <= 30) return 'warning'
  return 'ok'
}

/**
 * Badge variants for each tier
 */
const variants: Record<ExpiryTier, { bg: string; text: string }> = {
  expired: { bg: 'bg-red-500', text: 'text-white' },
  critical: { bg: 'bg-orange-500', text: 'text-white' },
  warning: { bg: 'bg-yellow-500', text: 'text-black' },
  ok: { bg: 'bg-green-500', text: 'text-white' },
}

export function ExpiryBadge({ daysRemaining, className }: ExpiryBadgeProps) {
  const tier = calculateTier(daysRemaining)
  const variant = variants[tier]

  const label =
    daysRemaining < 0
      ? `Expired ${Math.abs(daysRemaining)}d ago`
      : `${daysRemaining}d`

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold',
        variant.bg,
        variant.text,
        className
      )}
      role="status"
      aria-label={
        daysRemaining < 0
          ? `Expired ${Math.abs(daysRemaining)} days ago`
          : `${daysRemaining} days until expiry`
      }
      data-testid="expiry-badge"
      data-tier={tier}
    >
      {label}
    </span>
  )
}

export { calculateTier }
