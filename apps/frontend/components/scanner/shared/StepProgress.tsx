/**
 * Step Progress Component (Story 05.19)
 * Purpose: Step progress indicator for wizard
 * Features: 32dp height, step dots, step label
 *
 * BUG-101: Added dark variant for visibility on dark backgrounds (scanner pages)
 *
 * BUG-084: Step dots are intentionally NOT interactive (design decision):
 * - Mobile scanner UIs prioritize explicit touch targets (back/forward buttons)
 * - Small dots (8px) are poor touch targets for warehouse environments
 * - Wizard steps have dependencies; skipping could cause data issues
 * - Users can use the back button or edit buttons on confirmation screens
 */

'use client'

import { cn } from '@/lib/utils'

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  /** Use 'dark' variant for dark backgrounds (e.g., scanner pages with bg-slate-900) */
  variant?: 'light' | 'dark'
  className?: string
}

export function StepProgress({
  currentStep,
  totalSteps,
  stepLabels,
  variant = 'light',
  className,
}: StepProgressProps) {
  const currentLabel = stepLabels?.[currentStep - 1] || `Step ${currentStep}`
  const isDark = variant === 'dark'

  return (
    <div
      className={cn(
        'h-8 min-h-[32px] px-4 flex items-center justify-between',
        isDark
          ? 'bg-slate-800 border-b border-slate-700'
          : 'bg-gray-50 border-b border-gray-200',
        className
      )}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}: ${currentLabel}`}
    >
      {/* Step text */}
      <span className={cn(
        'text-sm font-medium',
        isDark ? 'text-slate-200' : 'text-gray-700'
      )}>
        Step {currentStep} of {totalSteps}: {currentLabel}
      </span>

      {/* Step dots */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              i + 1 === currentStep
                ? 'bg-cyan-500'
                : i + 1 < currentStep
                  ? 'bg-green-500'
                  : isDark ? 'bg-slate-600' : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  )
}

export default StepProgress
