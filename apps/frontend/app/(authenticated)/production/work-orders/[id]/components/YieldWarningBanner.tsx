'use client'

/**
 * YieldWarningBanner Component
 * Story: 04.4 - Yield Tracking
 *
 * Alert banner for low yield conditions.
 * Displays warning (yellow) for yield 70-79% and critical (red) for yield < 70%.
 * Hidden when yield >= 80%.
 *
 * AC-6: Low Yield Warnings
 */

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface YieldWarningBannerProps {
  /** Current yield percentage */
  yieldPercent: number
  /** Target threshold (default 80) */
  threshold?: number
  /** Optional callback when banner is dismissed */
  onDismiss?: () => void
}

type BannerType = 'hidden' | 'warning' | 'critical'

/**
 * Get banner type based on yield percentage
 */
function getBannerType(yieldPercent: number, threshold: number): BannerType {
  if (yieldPercent >= threshold) {
    return 'hidden'
  }
  if (yieldPercent >= 70) {
    return 'warning'
  }
  return 'critical'
}

/**
 * Storage key for dismissed state (per session)
 */
const DISMISSED_KEY = 'yield_warning_dismissed'

export function YieldWarningBanner({
  yieldPercent,
  threshold = 80,
  onDismiss,
}: YieldWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const bannerType = getBannerType(yieldPercent, threshold)

  // Check session storage on mount
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(DISMISSED_KEY)
      if (dismissed === 'true') {
        setIsDismissed(true)
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Reset dismissed state if yield goes back up
  useEffect(() => {
    if (bannerType === 'hidden') {
      setIsDismissed(false)
      try {
        sessionStorage.removeItem(DISMISSED_KEY)
      } catch {
        // Ignore storage errors
      }
    }
  }, [bannerType])

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      sessionStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // Ignore storage errors
    }
    onDismiss?.()
  }

  // Don't render if hidden or dismissed
  if (bannerType === 'hidden' || isDismissed) {
    return null
  }

  const isCritical = bannerType === 'critical'
  const formattedYield = yieldPercent.toFixed(1)

  const Icon = isCritical ? AlertCircle : AlertTriangle
  const title = isCritical
    ? `Critical Low Yield: ${formattedYield}%`
    : `Low Yield Alert: ${formattedYield}%`
  const description = isCritical
    ? 'Immediate attention required. Contact supervisor.'
    : 'Review production process for potential issues.'

  return (
    <Alert
      variant="default"
      className={cn(
        'relative',
        isCritical
          ? 'border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600'
          : 'border-yellow-200 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600'
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5" />
      <AlertTitle className="font-semibold">
        {title}
        <span className="text-sm font-normal ml-2">(Target: &ge;{threshold}%)</span>
      </AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute right-2 top-2 h-7 w-7',
          isCritical ? 'hover:bg-red-100' : 'hover:bg-yellow-100'
        )}
        onClick={handleDismiss}
        aria-label="Dismiss warning"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Screen reader announcement */}
      <span className="sr-only">
        Alert: {isCritical ? 'Critical' : ''} Low Yield. Current yield is {formattedYield} percent,
        which is below the target of {threshold} percent. {description}
      </span>
    </Alert>
  )
}

export default YieldWarningBanner
