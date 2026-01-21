/**
 * Move Direction Arrow Component (Story 05.20)
 * Purpose: Visual indicator showing movement direction (From -> To)
 * Features: Animated arrow, minimum 24x24 size
 */

'use client'

import { cn } from '@/lib/utils'
import { ArrowDown } from 'lucide-react'

interface MoveDirectionArrowProps {
  className?: string
}

export function MoveDirectionArrow({ className }: MoveDirectionArrowProps) {
  return (
    <div
      data-testid="direction-arrow"
      className={cn(
        'flex items-center justify-center py-2',
        className
      )}
      style={{ minWidth: 24, minHeight: 24 }}
    >
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
        <ArrowDown className="h-6 w-6 text-blue-600" />
      </div>
    </div>
  )
}

export default MoveDirectionArrow
