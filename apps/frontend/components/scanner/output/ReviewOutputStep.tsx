/**
 * Review Output Step Component (Story 04.7b)
 * Purpose: Step 4 - Review output details before confirmation
 * Features: Summary card, edit links, LP preview
 */

'use client'

import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { ArrowLeft, Pencil, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { WOData, ReviewData } from '@/lib/hooks/use-scanner-output'

interface ReviewOutputStepProps {
  woData: WOData
  reviewData: ReviewData
  onConfirm: () => void
  onBack: () => void
  onEditQuantity: () => void
  onEditQAStatus: () => void
}

const QA_STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-900/30',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/30',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-900/30',
  },
}

export function ReviewOutputStep({
  woData,
  reviewData,
  onConfirm,
  onBack,
  onEditQuantity,
  onEditQAStatus,
}: ReviewOutputStepProps) {
  const qaConfig = QA_STATUS_CONFIG[reviewData.qa_status]
  const QAIcon = qaConfig.icon

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-900">
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-4">Review Output Details</h2>

      {/* Summary card */}
      <div className="bg-slate-800 rounded-lg overflow-hidden flex-1">
        {/* Product section */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm">Product</span>
          </div>
          <p className="text-white text-lg font-medium">{reviewData.product_name}</p>
        </div>

        {/* Quantity section */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-slate-400 text-sm block">Quantity</span>
              <p className="text-cyan-400 text-2xl font-bold">
                {reviewData.quantity} <span className="text-lg text-slate-400">{woData.uom}</span>
              </p>
            </div>
            <button
              onClick={onEditQuantity}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-3 py-2 min-h-[44px]"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* QA Status section */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-slate-400 text-sm block">QA Status</span>
              <div className={cn('flex items-center gap-2 mt-1', qaConfig.color)}>
                <QAIcon className="w-5 h-5" />
                <span className="text-lg font-medium">{qaConfig.label}</span>
              </div>
            </div>
            <button
              onClick={onEditQAStatus}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-3 py-2 min-h-[44px]"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Batch section */}
        <div className="p-4 border-b border-slate-700">
          <span className="text-slate-400 text-sm block">Batch Number</span>
          <p className="text-white text-lg font-medium">{reviewData.batch_number}</p>
        </div>

        {/* Expiry section */}
        <div className="p-4 border-b border-slate-700">
          <span className="text-slate-400 text-sm block">Expiry Date</span>
          <p className="text-white text-lg font-medium">
            {new Date(reviewData.expiry_date).toLocaleDateString()}
          </p>
        </div>

        {/* LP Preview section */}
        <div className="p-4">
          <span className="text-slate-400 text-sm block">LP Number (Preview)</span>
          <p className="text-white text-lg font-mono font-medium">{reviewData.lp_preview}</p>
        </div>
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
          variant="success"
          size="full"
          onClick={onConfirm}
          className="flex-1"
        >
          Confirm Registration
        </LargeTouchButton>
      </div>
    </div>
  )
}

export default ReviewOutputStep
