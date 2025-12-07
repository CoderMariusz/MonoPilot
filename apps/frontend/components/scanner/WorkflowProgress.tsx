/**
 * Workflow Progress Component
 * Story 5.23: Scanner Guided Workflows
 * Step indicator for multi-step scanner workflows
 */

'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  label: string
  description?: string
}

interface WorkflowProgressProps {
  steps: WorkflowStep[]
  currentStep: number
  className?: string
}

export function WorkflowProgress({ steps, currentStep, className }: WorkflowProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Mobile: Simplified progress */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">{steps[currentStep]?.label}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Full stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isComplete = index < currentStep
            const isCurrent = index === currentStep
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors',
                      isComplete && 'bg-green-600 border-green-600 text-white',
                      isCurrent && 'bg-blue-600 border-blue-600 text-white',
                      !isComplete && !isCurrent && 'bg-white border-gray-300 text-gray-500'
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        isCurrent && 'text-blue-600',
                        isComplete && 'text-green-600',
                        !isCurrent && !isComplete && 'text-gray-500'
                      )}
                    >
                      {step.label}
                    </div>
                    {step.description && (
                      <div className="text-xs text-gray-500 max-w-24 truncate">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 mb-8 transition-colors',
                      index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
