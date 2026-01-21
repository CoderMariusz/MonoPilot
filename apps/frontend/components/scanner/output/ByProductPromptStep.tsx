/**
 * By-Product Prompt Step Component (Story 04.7b)
 * Purpose: Step 7 - By-product registration prompt
 * Features: Expected qty calculation, Yes/No/Skip options
 */

'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { OutputNumberPad } from './OutputNumberPad'
import { AlertCircle, Package, Check } from 'lucide-react'
import type { ByProductInfo } from '@/lib/services/scanner-output-service'

interface ByProductPromptStepProps {
  byProduct: ByProductInfo & { expected_qty: number }
  onYes: (data: { id: string }) => void
  onSkip: () => void
  onSkipAll: () => void
}

export function ByProductPromptStep({
  byProduct,
  onYes,
  onSkip,
  onSkipAll,
}: ByProductPromptStepProps) {
  const [showRegistration, setShowRegistration] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [showZeroWarning, setShowZeroWarning] = useState(false)

  const numericQty = parseFloat(quantity) || 0

  const handleYes = useCallback(() => {
    setShowRegistration(true)
    setQuantity(String(byProduct.expected_qty))
  }, [byProduct.expected_qty])

  const handleConfirm = useCallback(() => {
    if (numericQty === 0) {
      setShowZeroWarning(true)
      return
    }
    onYes({ id: byProduct.id })
  }, [numericQty, onYes, byProduct.id])

  const handleConfirmZero = useCallback(() => {
    onYes({ id: byProduct.id })
  }, [onYes, byProduct.id])

  // Zero quantity warning dialog
  if (showZeroWarning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 text-center">
          By-product quantity is 0. Continue?
        </h2>
        <p className="text-slate-400 text-center mb-6">
          This will create an LP with zero quantity.
        </p>
        <div className="flex gap-4 w-full max-w-sm">
          <LargeTouchButton
            variant="secondary"
            size="full"
            onClick={() => setShowZeroWarning(false)}
            className="flex-1"
          >
            Go Back
          </LargeTouchButton>
          <LargeTouchButton
            variant="primary"
            size="full"
            onClick={handleConfirmZero}
            className="flex-1"
          >
            Confirm 0 Qty
          </LargeTouchButton>
        </div>
      </div>
    )
  }

  // Registration mini-wizard
  if (showRegistration) {
    return (
      <div className="flex-1 flex flex-col p-4 bg-slate-900">
        <h2 className="text-xl font-bold text-white mb-4">Register By-Product</h2>

        {/* By-product info */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-slate-400" />
            <span className="text-white font-medium">{byProduct.name}</span>
          </div>
          <div className="text-slate-400 text-sm">
            Expected: <span className="text-cyan-400">{byProduct.expected_qty} {byProduct.uom}</span>
          </div>
        </div>

        {/* Quantity input */}
        <div className="mb-4">
          <p className="text-slate-400 text-sm mb-2">Enter Actual Quantity:</p>
          <div className="h-14 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-700">
            <span className="text-2xl font-bold text-cyan-400">{quantity || '0'}</span>
            <span className="text-slate-400 text-lg ml-2">{byProduct.uom}</span>
          </div>
        </div>

        {/* Number pad */}
        <div className="flex-1 flex items-center">
          <OutputNumberPad
            value={quantity}
            onChange={setQuantity}
            maxDecimalPlaces={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <LargeTouchButton
            variant="secondary"
            size="full"
            onClick={() => setShowRegistration(false)}
            className="flex-1"
          >
            Cancel
          </LargeTouchButton>
          <LargeTouchButton
            variant="primary"
            size="full"
            onClick={handleConfirm}
            className="flex-1"
          >
            <Check className="w-5 h-5 mr-2" />
            Register
          </LargeTouchButton>
        </div>
      </div>
    )
  }

  // Initial prompt
  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-900">
      <h2 className="text-xl font-bold text-white mb-4">By-Product Registration</h2>

      {/* By-product info card */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-cyan-900/50 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-medium text-lg">{byProduct.name}</p>
            <p className="text-slate-400 text-sm">{byProduct.code}</p>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Expected Quantity:</span>
            <span className="text-cyan-400 text-xl font-bold">
              {byProduct.expected_qty} {byProduct.uom}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            Based on {byProduct.yield_percent}% yield rate
          </p>
        </div>
      </div>

      <p className="text-white text-center mb-6">
        Do you want to register this by-product?
      </p>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <LargeTouchButton
          variant="success"
          size="full"
          onClick={handleYes}
        >
          Yes, Register By-Product
        </LargeTouchButton>

        <LargeTouchButton
          variant="secondary"
          size="full"
          onClick={onSkip}
        >
          Skip This By-Product
        </LargeTouchButton>

        <LargeTouchButton
          variant="secondary"
          size="full"
          onClick={onSkipAll}
          className="text-slate-400"
        >
          Skip All Remaining
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default ByProductPromptStep
