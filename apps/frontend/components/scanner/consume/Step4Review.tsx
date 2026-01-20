/**
 * Step 4: Review Consumption (Story 04.6b)
 * Purpose: Review consumption details before confirmation
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, Lock, AlertTriangle } from 'lucide-react'
import type { WOData, LPData } from '@/lib/hooks/use-scanner-flow'
import type { ConsumptionMaterial } from '@/lib/services/consumption-service'

interface Step4ReviewProps {
  woData: WOData
  lpData: LPData
  material: ConsumptionMaterial
  consumeQty: number
  isFullLP: boolean
  onBack: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function Step4Review({
  woData,
  lpData,
  material,
  consumeQty,
  isFullLP,
  onBack,
  onConfirm,
  isLoading = false,
}: Step4ReviewProps) {
  const remainingAfter = lpData.quantity - consumeQty
  const willBeConsumed = remainingAfter <= 0

  // Calculate material progress
  const currentConsumed = material.consumed_qty
  const newConsumed = currentConsumed + consumeQty
  const requiredQty = material.required_qty
  const currentProgress = requiredQty > 0 ? Math.round((currentConsumed / requiredQty) * 100) : 0
  const newProgress = requiredQty > 0 ? Math.round((newConsumed / requiredQty) * 100) : 0

  return (
    <div className="flex-1 flex flex-col p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Review Consumption</h2>
        {isFullLP && (
          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-cyan-100 text-cyan-800 text-sm rounded">
            <Lock className="h-3 w-3" />
            Full LP
          </span>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-slate-800 text-white p-4 rounded-lg mb-4 space-y-3">
        <div>
          <div className="text-sm text-slate-400">Material</div>
          <div className="font-medium">{material.material_name}</div>
        </div>

        <div>
          <div className="text-sm text-slate-400">License Plate</div>
          <div className="font-medium">{lpData.lp_number}</div>
        </div>

        <div>
          <div className="text-sm text-slate-400">Quantity to Consume{isFullLP && ' (Full LP)'}</div>
          <div className="text-2xl font-bold text-cyan-400">
            {consumeQty.toLocaleString()} {lpData.uom}
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-400">LP Remaining After</div>
          <div className={cn('font-medium', willBeConsumed ? 'text-red-400' : 'text-slate-300')}>
            {remainingAfter.toLocaleString()} {lpData.uom}
            {willBeConsumed && ' (CONSUMED)'}
          </div>
        </div>

        <hr className="border-slate-600" />

        <div>
          <div className="text-sm text-slate-400">LP Details:</div>
          <ul className="text-sm text-slate-300 mt-1 space-y-0.5">
            {lpData.batch_number && <li>Batch: {lpData.batch_number}</li>}
            {lpData.expiry_date && <li>Expiry: {lpData.expiry_date}</li>}
          </ul>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-slate-50 p-4 rounded-lg mb-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Consumption Impact:</h3>

        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-500" />
          <span>
            Material progress: {currentProgress}% → {newProgress}%
          </span>
        </div>

        {willBeConsumed ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-cyan-500" />
              <span>Full LP will be consumed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>LP status will change to 'consumed' (qty = 0)</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>LP will remain available ({remainingAfter} {lpData.uom} remaining)</span>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex gap-3 pb-safe">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="w-[30%] h-12 min-h-[48px] font-semibold"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'flex-1 h-12 min-h-[48px] text-lg font-semibold',
            'bg-green-600 hover:bg-green-700 text-white'
          )}
        >
          <Check className="h-5 w-5 mr-2" />
          {isLoading ? 'Processing...' : 'Confirm'}
        </Button>
      </div>
    </div>
  )
}

export default Step4Review
