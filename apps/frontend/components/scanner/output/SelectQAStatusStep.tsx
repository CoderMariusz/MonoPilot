/**
 * Select QA Status Step Component (Story 04.7b)
 * Purpose: Step 3 - Select QA status
 * Features: 64dp height buttons, color coding, checkmark selection
 */

'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { Check, ArrowLeft } from 'lucide-react'
import type { QAStatus } from '@/lib/hooks/use-scanner-output'

interface SelectQAStatusStepProps {
  productName: string
  quantity: number
  batchNumber: string
  onSelect: (status: QAStatus) => void
  onBack: () => void
}

interface QAOption {
  value: QAStatus
  label: string
  color: string
  bgColor: string
  selectedBgColor: string
  borderColor: string
}

const QA_OPTIONS: QAOption[] = [
  {
    value: 'approved',
    label: 'Approved',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    selectedBgColor: 'bg-green-600',
    borderColor: 'border-green-500',
  },
  {
    value: 'pending',
    label: 'Pending',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    selectedBgColor: 'bg-yellow-600',
    borderColor: 'border-yellow-500',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    selectedBgColor: 'bg-red-600',
    borderColor: 'border-red-500',
  },
]

export function SelectQAStatusStep({
  productName,
  quantity,
  batchNumber,
  onSelect,
  onBack,
}: SelectQAStatusStepProps) {
  const [selected, setSelected] = useState<QAStatus | null>(null)

  const handleSelect = useCallback((status: QAStatus) => {
    setSelected(status)
  }, [])

  const handleConfirm = useCallback(() => {
    if (selected) {
      onSelect(selected)
    }
  }, [selected, onSelect])

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-900">
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-4">Select QA Status</h2>

      {/* Product summary */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <div className="text-slate-400 text-sm">Product: <span className="text-white">{productName}</span></div>
        <div className="text-slate-400 text-sm">Quantity: <span className="text-cyan-400">{quantity}</span></div>
        <div className="text-slate-400 text-sm">Batch: <span className="text-white">{batchNumber}</span></div>
      </div>

      {/* QA Status buttons */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        {QA_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={cn(
              'h-16 min-h-[64px] w-full rounded-lg',
              'flex items-center justify-between px-6',
              'border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
              selected === option.value
                ? cn(option.selectedBgColor, 'border-transparent text-white')
                : cn(option.bgColor, option.borderColor, option.color)
            )}
            data-testid={`qa-button-${option.value}`}
          >
            <span className="text-xl font-semibold">{option.label}</span>
            {selected === option.value && (
              <Check className="w-6 h-6" />
            )}
          </button>
        ))}
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
          disabled={!selected}
          className="flex-1"
        >
          Next: Review
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default SelectQAStatusStep
