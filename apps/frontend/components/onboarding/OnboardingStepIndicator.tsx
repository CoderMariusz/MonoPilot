'use client'

/**
 * OnboardingStepIndicator Component
 * Story: 01.12 - Settings > Onboarding Wizard
 * Wireframe: SET-001
 *
 * Shows 6-step wizard overview with time estimates.
 */
const WIZARD_STEPS = [
  { number: 1, title: 'Organization Profile', time: '2 min' },
  { number: 2, title: 'First Warehouse', time: '3 min' },
  { number: 3, title: 'Storage Locations', time: '4 min' },
  { number: 4, title: 'First Product', time: '3 min' },
  { number: 5, title: 'Demo Work Order', time: '2 min' },
  { number: 6, title: 'Review & Complete', time: '1 min' },
]

export function OnboardingStepIndicator() {
  return (
    <div className="space-y-3">
      {WIZARD_STEPS.map((step) => (
        <div key={step.number} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {step.number}
            </div>
            <span className="text-sm font-medium text-foreground">
              Step {step.number}: {step.title}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">({step.time})</span>
        </div>
      ))}

      <div className="mt-4 pt-4 border-t">
        <p className="text-sm font-semibold text-foreground">
          Total Time:{' '}
          <span className="text-blue-600">
            {WIZARD_STEPS.reduce((sum, step) => {
              const minutes = parseInt(step.time)
              return sum + minutes
            }, 0)}{' '}
            minutes
          </span>
        </p>
      </div>
    </div>
  )
}
