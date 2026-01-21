/**
 * Enter Quantity Step Component (Story 04.7b)
 * Purpose: Step 2 - Enter quantity with number pad
 * Features: 64x64dp keys, decimal support, overproduction warning
 */

'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { OutputNumberPad } from './OutputNumberPad'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import type { WOData, OverproductionWarning } from '@/lib/hooks/use-scanner-output'

interface EnterQuantityStepProps {
  woData: WOData
  overproductionWarning: OverproductionWarning | null
  onConfirm: (qty: number) => void
  onBack: () => void
}

export function EnterQuantityStep({
  woData,
  overproductionWarning,
  onConfirm,
  onBack,
}: EnterQuantityStepProps) {
  const [value, setValue] = useState('')

  const numericValue = parseFloat(value) || 0
  const newTotal = woData.registered_qty + numericValue
  const newProgress = woData.planned_qty > 0 ? Math.round((newTotal / woData.planned_qty) * 100) : 0
  const isOverProduction = numericValue > woData.remaining_qty

  const handleConfirm = useCallback(() => {
    if (numericValue > 0) {
      onConfirm(numericValue)
    }
  }, [numericValue, onConfirm])

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-900">
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-4">Quantity Produced</h2>

      {/* Product summary card */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="text-slate-400 text-sm">Product: <span className="text-white">{woData.product_name}</span></div>
        <div className="text-slate-400 text-sm">Planned: <span className="text-white">{woData.planned_qty} {woData.uom}</span></div>
        <div className="text-slate-400 text-sm">Registered: <span className="text-white">{woData.registered_qty} {woData.uom} ({woData.progress_percent || 0}%)</span></div>
        <div className="text-slate-400 text-sm">Remaining: <span className="text-cyan-400">{woData.remaining_qty} {woData.uom}</span></div>
      </div>

      {/* Quantity display */}
      <div className="mb-4">
        <p className="text-slate-400 text-sm mb-2">Enter Quantity to Register:</p>
        <div className={cn(
          'h-16 bg-slate-800 rounded-lg flex items-center justify-center',
          'border-2',
          isOverProduction ? 'border-yellow-500' : 'border-slate-700'
        )}>
          <span className={cn(
            'text-3xl font-bold',
            isOverProduction ? 'text-yellow-400' : 'text-cyan-400'
          )}>
            {value || '0'}
          </span>
          <span className="text-slate-400 text-lg ml-2">{woData.uom}</span>
        </div>
      </div>

      {/* Overproduction warning */}
      {isOverProduction && (
        <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-300 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Overproduction Warning</span>
          </div>
          <p className="text-yellow-200 text-sm">
            Entered quantity ({numericValue} {woData.uom}) exceeds remaining planned quantity ({woData.remaining_qty} {woData.uom}).
            This will result in {numericValue - woData.remaining_qty} {woData.uom} overproduction.
          </p>
        </div>
      )}

      {/* Progress preview */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Progress:</span>
          <span className={cn(
            'font-medium',
            newProgress > 100 ? 'text-red-400' : 'text-green-400'
          )}>
            {newTotal} / {woData.planned_qty} {woData.uom} ({newProgress}%)
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              newProgress > 100 ? 'bg-red-500' : 'bg-green-500'
            )}
            style={{ width: `${Math.min(newProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Number pad */}
      <div className="flex-1 flex items-center">
        <OutputNumberPad
          value={value}
          onChange={setValue}
          maxDecimalPlaces={2}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 pt-4">
        <LargeTouchButton
          variant="secondary"
          size="full"
          onClick={onBack}
          className="flex-shrink-0 w-16"
        >
          <ArrowLeft className="w-5 h-5" />
        </LargeTouchButton>
        <LargeTouchButton
          variant="primary"
          size="full"
          onClick={handleConfirm}
          disabled={numericValue <= 0}
          className="flex-1"
        >
          {isOverProduction ? 'Continue Anyway' : 'Next: QA Status'}
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default EnterQuantityStep
