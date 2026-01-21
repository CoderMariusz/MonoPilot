/**
 * Step 5: Success (Story 05.21)
 * Purpose: Display putaway success with option for next LP (AC-5)
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CheckCircle, Package, MapPin } from 'lucide-react'
import { SuccessAnimation } from '../shared/SuccessAnimation'
import type { PutawayResult } from './ScannerPutawayWizard'

interface Step5SuccessProps {
  result: PutawayResult
  onPutawayAnother: () => void
  onDone: () => void
}

export function Step5Success({ result, onPutawayAnother, onDone }: Step5SuccessProps) {
  const { stockMove, lp, overrideApplied } = result

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Success animation */}
      <div className="flex flex-col items-center justify-center py-8">
        <div data-testid="success-animation">
          <SuccessAnimation show size={96} duration={2000} />
        </div>
        <h2 className="text-2xl font-bold text-green-700 mt-4">Putaway Complete!</h2>
      </div>

      {/* Result summary */}
      <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <span className="text-gray-600">LP:</span>
            <span className="font-mono font-medium text-green-700">{lp.lp_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="text-gray-600">Location:</span>
            <span className="font-mono font-medium text-green-700">
              {lp.location_path.split('/').pop()?.trim() || 'A-01-02-03'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-600">Move #:</span>
            <span className="font-mono font-medium text-green-700">{stockMove.move_number}</span>
          </div>
        </div>
      </div>

      {/* Override note */}
      {overrideApplied && (
        <p className="text-sm text-amber-600 text-center mb-4">
          Note: Location override was applied
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="pb-safe space-y-3">
        <Button
          onClick={onPutawayAnother}
          className={cn(
            'w-full h-14 min-h-[56px] text-lg font-semibold',
            'bg-cyan-600 hover:bg-cyan-700 text-white'
          )}
          aria-label="Putaway Another"
        >
          Putaway Another LP
        </Button>
        <Button
          onClick={onDone}
          variant="outline"
          className="w-full h-12 min-h-[48px]"
          aria-label="Done"
        >
          Done
        </Button>
      </div>
    </div>
  )
}

export default Step5Success
