/**
 * Print Label Step Component (Story 04.7b)
 * Purpose: Step 6 - Print LP label
 * Features: Label preview, print button, skip option
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { Printer, SkipForward, AlertCircle, Check, Loader2 } from 'lucide-react'
import type { LPData } from '@/lib/hooks/use-scanner-output'

interface PrintLabelStepProps {
  lpData: LPData
  canPrint: boolean
  printDisabledReason: string | null
  onPrint: () => Promise<void>
  onSkip: () => void
}

export function PrintLabelStep({
  lpData,
  canPrint,
  printDisabledReason,
  onPrint,
  onSkip,
}: PrintLabelStepProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePrint = async () => {
    if (!canPrint || isPrinting) return

    setIsPrinting(true)
    setPrintStatus('idle')
    setErrorMessage(null)

    try {
      await onPrint()
      setPrintStatus('success')
    } catch (err) {
      setPrintStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Print failed')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-900">
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-4">Print LP Label</h2>

      {/* Label preview */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded p-4">
          {/* Barcode placeholder */}
          <div className="flex justify-center mb-4">
            <div className="bg-black h-16 w-48 flex items-center justify-center">
              <span className="text-white text-xs font-mono">{lpData.lp_number}</span>
            </div>
          </div>

          {/* Label content */}
          <div className="text-center">
            <p className="text-lg font-bold text-black font-mono">{lpData.lp_number}</p>
            <p className="text-sm text-gray-600 mt-1">{lpData.qty} {lpData.uom}</p>
            <p className="text-sm text-gray-600">Batch: {lpData.batch_number}</p>
            <p className="text-sm text-gray-600">
              Exp: {new Date(lpData.expiry_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Status messages */}
      {!canPrint && printDisabledReason && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <span>{printDisabledReason}</span>
          </div>
        </div>
      )}

      {printStatus === 'success' && (
        <div className="bg-green-900/30 border border-green-600 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <span>Label printed successfully!</span>
          </div>
        </div>
      )}

      {printStatus === 'error' && errorMessage && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <LargeTouchButton
          variant="primary"
          size="full"
          onClick={handlePrint}
          disabled={!canPrint || isPrinting}
        >
          {isPrinting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="w-5 h-5 mr-2" />
              Print Label
            </>
          )}
        </LargeTouchButton>

        <LargeTouchButton
          variant="secondary"
          size="full"
          onClick={onSkip}
        >
          <SkipForward className="w-5 h-5 mr-2" />
          Skip
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default PrintLabelStep
