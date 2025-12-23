'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertTriangle } from 'lucide-react'
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus'

/**
 * OnboardingWizardModal Component
 * Story: 01.3 - Onboarding Wizard Launcher
 * Wireframe: SET-001
 *
 * Main wizard modal that shows:
 * - Launcher view (step 0)
 * - Wizard steps (steps 1-6)
 * - Skip confirmation dialog
 * - Progress indicator
 * - Navigation controls
 */
interface OnboardingWizardModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Wizard step configuration with step number, title, and estimated time.
 */
interface WizardStep {
  number: number
  title: string
  time: string
}

/**
 * Total number of steps in the onboarding wizard.
 */
const TOTAL_STEPS = 6

/**
 * Configuration for all wizard steps.
 * Used for progress display and step navigation.
 */
const WIZARD_STEPS: readonly WizardStep[] = [
  { number: 1, title: 'Organization Profile', time: '2 min' },
  { number: 2, title: 'First Warehouse', time: '3 min' },
  { number: 3, title: 'Storage Locations', time: '4 min' },
  { number: 4, title: 'First Product', time: '3 min' },
  { number: 5, title: 'Demo Work Order', time: '2 min' },
  { number: 6, title: 'Review & Complete', time: '1 min' },
] as const

export function OnboardingWizardModal({
  open,
  onOpenChange,
}: OnboardingWizardModalProps) {
  const router = useRouter()
  const { step: currentStep, refresh } = useOnboardingStatus()
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine which view to show based on current step
  const isLauncherView = currentStep === 0
  const activeStep = currentStep || 0

  const handleSkipClick = useCallback(() => {
    setShowSkipDialog(true)
  }, [])

  const handleSkipConfirm = useCallback(async () => {
    setIsSkipping(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/settings/onboarding/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to skip wizard')
      }

      const data = await response.json()
      refresh()
      setShowSkipDialog(false)
      if (onOpenChange) onOpenChange(false)
      router.push(data.redirect || '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip wizard')
    } finally {
      setIsSkipping(false)
    }
  }, [router, onOpenChange, refresh])

  const handleSkipCancel = useCallback(() => {
    setShowSkipDialog(false)
    setError(null)
  }, [])

  const handleBack = useCallback(() => {
    // Navigation logic would go here
  }, [])

  const handleNext = useCallback(() => {
    // Navigation logic would go here
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {/* Skip Confirmation View */}
        {showSkipDialog && (
          <>
            <DialogHeader>
              <DialogTitle>Skip Onboarding Wizard?</DialogTitle>
              <DialogDescription>
                We&apos;ll create a demo warehouse and default location so you can
                start exploring MonoPilot immediately. You can configure
                everything manually in Settings.
              </DialogDescription>
            </DialogHeader>

            {/* Error display */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">
                      Failed to skip wizard
                    </p>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleSkipCancel}
                disabled={isSkipping}
              >
                Continue Setup
              </Button>
              <Button
                onClick={handleSkipConfirm}
                disabled={isSkipping}
                className="gap-2"
              >
                {isSkipping ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Skip Wizard
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Launcher View (step 0) */}
        {!showSkipDialog && isLauncherView && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Welcome to MonoPilot Food Manufacturing MES
              </DialogTitle>
              <DialogDescription>
                Quick Onboarding Wizard
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Let&apos;s get your organization ready in 15 minutes:
              </p>

              {/* Step overview */}
              <div className="space-y-3">
                {WIZARD_STEPS.map((wizardStep) => (
                  <div
                    key={wizardStep.number}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {wizardStep.number}
                      </div>
                      <span className="text-sm font-medium">
                        Step {wizardStep.number}: {wizardStep.title} ({wizardStep.time})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleSkipClick}>
                Skip Onboarding
              </Button>
              <Button onClick={handleNext}>Start Onboarding Wizard</Button>
            </DialogFooter>
          </>
        )}

        {/* Wizard Steps View (steps 1-6) */}
        {!showSkipDialog && !isLauncherView && (
          <>
            <DialogHeader>
              <DialogTitle>
                {WIZARD_STEPS[activeStep - 1]?.title}
              </DialogTitle>
              <DialogDescription>
                Step {activeStep} of {TOTAL_STEPS}
              </DialogDescription>
            </DialogHeader>

            {/* Progress indicator */}
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  {WIZARD_STEPS.map((wizardStep) => {
                    const isComplete = wizardStep.number < activeStep
                    return (
                      <div
                        key={wizardStep.number}
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isComplete
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        data-testid={
                          isComplete
                            ? `step-complete-${wizardStep.number}`
                            : `step-${wizardStep.number}`
                        }
                      >
                        {isComplete ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          wizardStep.number
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Wizard step content would go here */}
              <div className="rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">
                  Wizard step content goes here
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <div className="flex w-full justify-between">
                <Button variant="outline" onClick={handleSkipClick}>
                  Skip Wizard
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={activeStep === 1}
                  >
                    Back
                  </Button>
                  <Button onClick={handleNext}>
                    {activeStep === TOTAL_STEPS ? 'Complete' : 'Next'}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
