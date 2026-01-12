/**
 * Loading Overlay Component (Story 05.19)
 * Purpose: Full-screen loading spinner
 * Features: 48x48 spinner, blocks interaction
 */

'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  show: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ show, message = 'Loading...', className }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <div
      data-testid="loading-overlay"
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-white/80 backdrop-blur-sm',
        className
      )}
    >
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  )
}

export default LoadingOverlay
