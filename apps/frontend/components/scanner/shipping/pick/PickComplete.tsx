/**
 * Pick Complete Component (Story 07.10)
 * Celebration screen when pick list complete
 */

'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AudioFeedback } from '../../shared/AudioFeedback'
import { HapticFeedback } from '../../shared/HapticFeedback'
import type { PickListDetail, PickCompleteSummary } from '@/lib/types/scanner-pick'

interface PickCompleteProps {
  pick_list: PickListDetail
  summary: PickCompleteSummary
  onReturnToHome: () => void
  className?: string
}

export function PickComplete({
  pick_list,
  summary,
  onReturnToHome,
  className,
}: PickCompleteProps) {
  // Play victory feedback on mount
  useEffect(() => {
    AudioFeedback.playConfirm()
    HapticFeedback.confirm()
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[80vh] p-6',
        'animate-in fade-in duration-300',
        className
      )}
    >
      {/* Animated checkmark */}
      <div
        data-testid="success-checkmark"
        className="mb-6 animate-in zoom-in duration-500"
      >
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
          <Check className="w-14 h-14 text-white" strokeWidth={3} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        PICK LIST COMPLETE!
      </h1>

      {/* Summary card */}
      <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Lines</span>
            <span className="font-semibold">{summary.total_lines}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Picked</span>
            <span className="font-semibold text-green-600">{summary.picked_lines}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Short Picks</span>
            <span className="font-semibold text-amber-600">{summary.short_picks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Qty</span>
            <span className="font-semibold">{summary.total_qty}</span>
          </div>
          <div className="flex justify-between pt-3 border-t">
            <span className="text-gray-600">Duration</span>
            <span className="font-semibold">{summary.duration_minutes} mins</span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <Button
        onClick={onReturnToHome}
        className="w-full max-w-sm h-14 min-h-[56px] text-lg font-semibold bg-blue-600 hover:bg-blue-700"
        aria-label="Return to My Picks"
      >
        Return to My Picks
      </Button>
    </div>
  )
}

export default PickComplete
