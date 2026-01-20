/**
 * Step 3: Enter Quantity (Story 04.6b)
 * Purpose: Enter consumption quantity with number pad
 * Features: Full Consumption button, decimal support
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NumberPad } from '../shared/NumberPad'
import { Check, Lock, AlertCircle } from 'lucide-react'
import type { LPData } from '@/lib/hooks/use-scanner-flow'
import type { ConsumptionMaterial } from '@/lib/services/consumption-service'

interface Step3EnterQtyProps {
  lpData: LPData
  material: ConsumptionMaterial
  value: number | null
  onChange: (qty: number) => void
  onFullConsumption: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function Step3EnterQty({
  lpData,
  material,
  value,
  onChange,
  onFullConsumption,
  onConfirm,
  isLoading = false,
}: Step3EnterQtyProps) {
  const [qtyString, setQtyString] = useState(value?.toString() || '')
  const [error, setError] = useState<string | null>(null)

  const isFullLPRequired = material.consume_whole_lp

  // Update parent when qty changes
  useEffect(() => {
    const qty = parseFloat(qtyString)
    if (!isNaN(qty) && qty > 0) {
      onChange(qty)
      setError(null)
    }
  }, [qtyString, onChange])

  // Pre-fill for full LP required
  useEffect(() => {
    if (isFullLPRequired && lpData.quantity) {
      setQtyString(lpData.quantity.toString())
      onChange(lpData.quantity)
    }
  }, [isFullLPRequired, lpData.quantity, onChange])

  const handleQtyChange = useCallback(
    (newValue: string) => {
      // Don't allow changes if full LP is required
      if (isFullLPRequired) return
      setQtyString(newValue)
    },
    [isFullLPRequired]
  )

  const handleQuickAdjust = useCallback(
    (delta: number) => {
      if (isFullLPRequired) return
      const current = parseFloat(qtyString) || 0
      const newValue = Math.max(0, current + delta)
      if (newValue <= lpData.quantity) {
        setQtyString(newValue.toString())
      }
    },
    [qtyString, lpData.quantity, isFullLPRequired]
  )

  const handleConfirm = useCallback(() => {
    const qty = parseFloat(qtyString)

    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    if (qty > lpData.quantity) {
      setError(`Insufficient quantity. LP has ${lpData.quantity} ${lpData.uom}`)
      return
    }

    if (isFullLPRequired && qty !== lpData.quantity) {
      setError(`Full LP consumption required. LP quantity is ${lpData.quantity} ${lpData.uom}`)
      return
    }

    setError(null)
    onConfirm()
  }, [qtyString, lpData, isFullLPRequired, onConfirm])

  const parsedQty = parseFloat(qtyString) || 0
  const isValidQty = parsedQty > 0 && parsedQty <= lpData.quantity
  const isFullLPQty = parsedQty === lpData.quantity

  return (
    <div className="flex-1 flex flex-col p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Enter Quantity to Consume</h2>
        {isFullLPRequired && (
          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-sm rounded">
            <Lock className="h-3 w-3" />
            Full LP Required
          </span>
        )}
      </div>

      {/* LP Summary Card */}
      <div className="bg-slate-800 text-white p-4 rounded-lg mb-4">
        <div className="text-sm text-slate-400">LP: {lpData.lp_number}</div>
        <div className="font-medium">{lpData.product_name}</div>
        <div className="text-cyan-400 font-bold">Available: {lpData.quantity} {lpData.uom}</div>
      </div>

      {/* Full LP Warning for required materials */}
      {isFullLPRequired && (
        <div className="bg-yellow-900/20 border border-yellow-600 p-3 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-medium">Full LP Consumption Required</p>
              <p>
                This material requires consuming the entire LP. Quantity is pre-filled and cannot be changed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Display */}
      <div
        className={cn(
          'border-2 rounded-lg p-4 text-center mb-4',
          error ? 'border-red-500 bg-red-50' : 'border-gray-200'
        )}
      >
        <div className="text-4xl font-bold text-gray-900">
          {qtyString || '0'}
          <span className="text-xl font-normal text-gray-500 ml-2">{lpData.uom}</span>
        </div>
        {isFullLPRequired && <Lock className="inline-block h-5 w-5 text-gray-400 mt-2" />}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Consumption Button */}
      <Button
        onClick={onFullConsumption}
        className={cn(
          'w-full h-16 min-h-[64px] text-lg font-bold',
          'bg-green-600 hover:bg-green-700 text-white',
          'flex items-center justify-center gap-2'
        )}
      >
        <Check className="h-6 w-6" />
        Full Consumption ({lpData.quantity} {lpData.uom})
      </Button>

      {/* Number Pad */}
      <div className={cn('mt-4', isFullLPRequired && 'opacity-50 pointer-events-none')}>
        <NumberPad
          value={qtyString}
          onChange={handleQtyChange}
          allowDecimal={true}
          maxValue={lpData.quantity}
          onQuickAdjust={handleQuickAdjust}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Next Button */}
      <div className="pb-safe mt-4">
        <Button
          onClick={handleConfirm}
          disabled={!isValidQty || isLoading || (isFullLPRequired && !isFullLPQty)}
          className={cn(
            'w-full h-12 min-h-[48px] text-lg font-semibold',
            'bg-cyan-600 hover:bg-cyan-700 text-white',
            'disabled:bg-slate-300 disabled:cursor-not-allowed'
          )}
        >
          Next: Review
        </Button>
      </div>
    </div>
  )
}

export default Step3EnterQty
