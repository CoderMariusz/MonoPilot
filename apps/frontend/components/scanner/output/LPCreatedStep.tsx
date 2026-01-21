/**
 * LP Created Step Component (Story 04.7b)
 * Purpose: Step 5 - Success confirmation
 * Features: Green check animation (96dp), voice announcement, progress update
 */

'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SuccessAnimation } from '../shared/SuccessAnimation'
import { Check } from 'lucide-react'
import type { LPData, WOProgress } from '@/lib/hooks/use-scanner-output'

interface LPCreatedStepProps {
  lpData: LPData
  woProgress: WOProgress
  onNext: () => void
}

export function LPCreatedStep({ lpData, woProgress, onNext }: LPCreatedStepProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900">
      {/* Success animation */}
      <div
        className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300"
        data-testid="success-animation"
        style={{ minWidth: 96, minHeight: 96 }}
      >
        <Check className="w-14 h-14 text-white" strokeWidth={3} />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">LP Created!</h2>

      {/* LP details card */}
      <div className="bg-slate-800 rounded-lg p-4 w-full max-w-sm mb-6">
        <div className="text-center mb-4">
          <span className="text-slate-400 text-sm">LP Number</span>
          <p className="text-cyan-400 text-2xl font-mono font-bold">{lpData.lp_number}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <span className="text-slate-400 text-sm block">Quantity</span>
            <span className="text-white font-medium">{lpData.qty} {lpData.uom}</span>
          </div>
          <div>
            <span className="text-slate-400 text-sm block">Batch</span>
            <span className="text-white font-medium">{lpData.batch_number}</span>
          </div>
        </div>
      </div>

      {/* Progress update */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">WO Progress:</span>
          <span className="text-green-400 font-medium">
            {woProgress.output_qty} ({woProgress.progress_percent}%)
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(woProgress.progress_percent, 100)}%` }}
          />
        </div>
        <p className="text-slate-400 text-sm text-center mt-2">
          Remaining: {woProgress.remaining_qty}
        </p>
      </div>

      {/* Auto-advance indicator */}
      <p className="text-slate-500 text-sm">
        Proceeding to print label...
      </p>
    </div>
  )
}

export default LPCreatedStep
