/**
 * Step Progress Component (Story 05.19)
 * Purpose: Step progress indicator for wizard
 * Features: 32dp height, step dots, step label
 */

'use client'

import { cn } from '@/lib/utils'

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  className?: string
}

export function StepProgress({
  currentStep,
  totalSteps,
  stepLabels,
  className,
}: StepProgressProps) {
  const currentLabel = stepLabels?.[currentStep - 1] || `Step ${currentStep}`

  return (
    <div
      className={cn(
        'h-8 min-h-[32px] px-4 flex items-center justify-between',
        'bg-gray-50 border-b border-gray-200',
        className
      )}
    >
      {/* Step text */}
      <span className="text-sm font-medium text-gray-700">
        Step {currentStep} of {totalSteps}: {currentLabel}
      </span>

      {/* Step dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              i + 1 === currentStep
                ? 'bg-blue-600'
                : i + 1 < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  )
}

export default StepProgress
