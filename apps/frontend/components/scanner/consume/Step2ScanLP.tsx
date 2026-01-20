/**
 * Step 2: Scan LP Barcode (Story 04.6b)
 * Purpose: Scan license plate for material consumption
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScanBarcode, Keyboard, Lock, Package } from 'lucide-react'
import type { WOData } from '@/lib/hooks/use-scanner-flow'
import type { ConsumptionMaterial } from '@/lib/services/consumption-service'

interface Step2ScanLPProps {
  woData: WOData
  material?: ConsumptionMaterial
  onScan: (barcode: string) => void
  isLoading?: boolean
}

export function Step2ScanLP({ woData, material, onScan, isLoading = false }: Step2ScanLPProps) {
  const [barcode, setBarcode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = barcode.trim()
    if (trimmed) {
      onScan(trimmed)
      setBarcode('')
    }
  }, [barcode, onScan])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // Calculate remaining qty needed
  const requiredQty = material?.required_qty || 0
  const consumedQty = material?.consumed_qty || 0
  const remainingQty = Math.max(0, requiredQty - consumedQty)
  const progress = requiredQty > 0 ? Math.round((consumedQty / requiredQty) * 100) : 0

  return (
    <div className="flex-1 flex flex-col p-4 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Scan LP Barcode</h2>
        {material && (
          <>
            <p className="text-gray-500">
              Next Required Material: <span className="font-medium text-gray-700">{material.material_name}</span>
            </p>
            <p className="text-gray-500">
              ({remainingQty.toLocaleString()} {material.uom} remaining)
            </p>
            {material.consume_whole_lp && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-sm rounded">
                <Lock className="h-3 w-3" />
                Full LP Required
              </span>
            )}
          </>
        )}
      </div>

      {/* Scan icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-[68px] h-[68px] flex items-center justify-center bg-slate-100 rounded-lg">
          <ScanBarcode className="w-12 h-12 text-slate-600" />
        </div>
      </div>

      {/* Barcode input */}
      <div className="mb-4">
        <Input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="LP-2025-01234"
          className={cn(
            'h-12 min-h-[48px] text-xl font-mono text-center',
            'border-2 focus:border-cyan-500'
          )}
          autoComplete="off"
          autoFocus
          disabled={isLoading}
        />
        <button
          type="button"
          className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
        >
          <Keyboard className="h-4 w-4" />
          Tap to type manually
        </button>
      </div>

      {/* Materials list */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Expected Materials ({woData.materials.filter((m) => m.consumed_qty < m.required_qty).length} of{' '}
          {woData.materials.length}):
        </h3>
        <div className="space-y-2 max-h-[200px] overflow-auto">
          {woData.materials.map((mat) => {
            const matProgress = mat.required_qty > 0
              ? Math.round((mat.consumed_qty / mat.required_qty) * 100)
              : 0
            const isActive = material?.id === mat.id
            const isComplete = mat.consumed_qty >= mat.required_qty

            return (
              <div
                key={mat.id}
                className={cn(
                  'p-3 rounded-lg border min-h-[64px]',
                  isActive ? 'bg-cyan-900/10 border-cyan-600' : 'bg-slate-50 border-slate-200',
                  isComplete && 'opacity-50'
                )}
              >
                <div className="flex items-start gap-2">
                  <Package className={cn('h-5 w-5 mt-0.5', isActive ? 'text-cyan-600' : 'text-slate-500')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-medium truncate', isActive && 'text-cyan-700')}>
                        {mat.material_name}
                      </span>
                      {(mat as ConsumptionMaterial).consume_whole_lp && (
                        <Lock className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Required: {mat.required_qty} {(mat as ConsumptionMaterial).uom || 'units'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Consumed: {mat.consumed_qty} ({matProgress}%)
                    </p>
                    {/* Progress bar */}
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          isComplete ? 'bg-green-500' : 'bg-cyan-500'
                        )}
                        style={{ width: `${matProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action bar - only show if barcode entered */}
      {barcode.trim() && (
        <div className="pb-safe">
          <Button
            onClick={handleSubmit}
            disabled={!barcode.trim() || isLoading}
            className={cn(
              'w-full h-12 min-h-[48px] text-lg font-semibold',
              'bg-cyan-600 hover:bg-cyan-700 text-white'
            )}
          >
            {isLoading ? 'Validating...' : 'Scan'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default Step2ScanLP
