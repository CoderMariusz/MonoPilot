/**
 * FullLPRequiredBadge Component (Story 04.6c)
 * Badge indicating 1:1 consumption requirement for materials
 *
 * Features:
 * - Lock icon indicating full LP consumption requirement
 * - Desktop variant: Yellow-900 bg, Yellow-300 text, 12px font
 * - Scanner variant: Yellow-600 bg, Yellow-900 text, 14px font
 * - Accessible with aria-label
 */

'use client'

import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FullLPRequiredBadgeProps {
  /** Size variant: small or medium (default) */
  size?: 'small' | 'medium'
  /** Display variant: desktop (default) or scanner */
  variant?: 'desktop' | 'scanner'
  /** Additional CSS classes */
  className?: string
}

export function FullLPRequiredBadge({
  size = 'medium',
  variant = 'desktop',
  className,
}: FullLPRequiredBadgeProps) {
  const isDesktop = variant === 'desktop'
  const isSmall = size === 'small'

  return (
    <div
      role="status"
      aria-label="Full LP Required"
      tabIndex={0}
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        // Background color
        isDesktop ? 'bg-yellow-900' : 'bg-yellow-600',
        // Text color
        isDesktop ? 'text-yellow-300' : 'text-yellow-900',
        // Font size
        isDesktop ? 'text-xs' : 'text-sm',
        // Padding based on size
        isSmall ? 'px-1.5 py-0.5' : 'px-2 py-1',
        className
      )}
    >
      <Lock
        aria-hidden="true"
        className={cn(
          // Icon size: 16px (h-4 w-4) for desktop, 20px (h-5 w-5) for scanner
          isDesktop ? 'h-4 w-4' : 'h-5 w-5'
        )}
        data-testid="lock-icon"
      />
      <span>Full LP Required</span>
    </div>
  )
}

export default FullLPRequiredBadge
