/**
 * Error Animation Component (Story 05.19)
 * Purpose: Red X animation for error operations
 * Features: 64x64 minimum size, 500ms animation
 */

'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ErrorAnimationProps {
  show: boolean
  message?: string
  size?: number
  duration?: number
  className?: string
}

export function ErrorAnimation({
  show,
  message,
  size = 64,
  duration = 500,
  className,
}: ErrorAnimationProps) {
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
      data-testid="error-animation"
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        'animate-in fade-in zoom-in duration-300',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full bg-red-500 flex items-center justify-center',
          'shadow-lg shadow-red-500/30',
          isAnimating && 'animate-pulse'
        )}
        style={{ width: size, height: size }}
      >
        <X
          className="text-white"
          style={{ width: size * 0.6, height: size * 0.6 }}
          strokeWidth={3}
        />
      </div>
      {message && (
        <p className="text-red-600 text-sm font-medium text-center max-w-[200px]">{message}</p>
      )}
    </div>
  )
}

export default ErrorAnimation
