/**
 * Success Animation Component (Story 05.19)
 * Purpose: Green checkmark animation for successful operations
 * Features: 64x64 minimum size, 500ms animation
 */

'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SuccessAnimationProps {
  show: boolean
  size?: number
  duration?: number
  className?: string
}

export function SuccessAnimation({
  show,
  size = 64,
  duration = 500,
  className,
}: SuccessAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (show) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!show && !isAnimating) return null

  return (
    <div
      data-testid="success-animation"
      className={cn(
        'flex items-center justify-center',
        'animate-in fade-in zoom-in duration-300',
        className
      )}
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          'rounded-full bg-green-500 flex items-center justify-center',
          'shadow-lg shadow-green-500/30',
          isAnimating && 'animate-pulse'
        )}
        style={{ width: size, height: size }}
      >
        <Check
          className="text-white"
          style={{ width: size * 0.6, height: size * 0.6 }}
          strokeWidth={3}
        />
      </div>
    </div>
  )
}

export default SuccessAnimation
