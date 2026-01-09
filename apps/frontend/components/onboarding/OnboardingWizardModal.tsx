'use client'

import { useCallback, useState, useEffect, type ReactNode } from 'react'
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
import { Loader2, Check, AlertTriangle, Building2, MapPin, Package, ClipboardList, CheckCircle2, type LucideIcon } from 'lucide-react'
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus'
import { OrganizationProfileStep } from '@/components/settings/onboarding/OrganizationProfileStep'
import type { OrganizationProfileStepData } from '@/lib/validation/organization-profile-step'

/**
 * Reusable error alert component for wizard error states.
 * Extracted to eliminate duplication across skip dialog, launcher, and step views.
 */
interface ErrorAlertProps {
  message: string
  title?: string
}

function ErrorAlert({ message, title = 'Error' }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          {title && (
            <p className="text-sm font-medium text-red-900">{title}</p>
          )}
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Step icon configuration for consistent step UI rendering.
 */
interface StepIconConfig {
  icon: LucideIcon
  bgColor: string
  iconColor: string
}

const STEP_ICONS: Record<number, StepIconConfig> = {
  2: { icon: Building2, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  3: { icon: MapPin, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  4: { icon: Package, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  5: { icon: ClipboardList, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  6: { icon: CheckCircle2, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
}

/**
 * Placeholder step card for steps 2-5 that are not yet implemented.
 * Extracted to eliminate duplication in the wizard steps view.
 */
interface PlaceholderStepCardProps {
  stepNumber: number
  title: string
  description: string
  storyRef: string
}

function PlaceholderStepCard({ stepNumber, title, description, storyRef }: PlaceholderStepCardProps) {
  const config = STEP_ICONS[stepNumber] || STEP_ICONS[2]
  const Icon = config.icon

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm text-amber-800">
          <strong>Coming Soon:</strong> {title} form will be available in story {storyRef}.
          For now, click Next to continue or Skip to use demo data.
        </p>
      </div>
    </div>
  )
}

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
 * Wizard step configuration with step number, title, estimated time, and icon.
 */
interface WizardStep {
  number: number
  title: string
  time: string
  description: string
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
  { number: 1, title: 'Organization Profile', time: '2 min', description: 'Set up your organization name, timezone, and regional settings.' },
  { number: 2, title: 'First Warehouse', time: '3 min', description: 'Create your primary warehouse for inventory management.' },
  { number: 3, title: 'Storage Locations', time: '4 min', description: 'Define storage locations within your warehouse.' },
  { number: 4, title: 'First Product', time: '3 min', description: 'Add your first product to the system.' },
  { number: 5, title: 'Demo Work Order', time: '2 min', description: 'Create a sample work order to see production in action.' },
  { number: 6, title: 'Review & Complete', time: '1 min', description: 'Review your setup and complete the onboarding.' },
] as const

export function OnboardingWizardModal({
  open,
  onOpenChange,
}: OnboardingWizardModalProps) {
  const router = useRouter()
  const { step: currentStep, refresh } = useOnboardingStatus()
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStep, setLocalStep] = useState<number>(0)

  // Sync local step with server step
  useEffect(() => {
    if (currentStep !== null) {
      setLocalStep(currentStep)
    }
  }, [currentStep])

  // Determine which view to show based on current step
  const isLauncherView = localStep === 0
  const activeStep = localStep || 0

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

  /**
   * Navigate to previous step
   */
  const handleBack = useCallback(async () => {
    if (activeStep <= 1 || isNavigating) return

    setIsNavigating(true)
    setError(null)
    try {
      const prevStep = activeStep - 1
      const response = await fetch('/api/v1/settings/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: prevStep }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to navigate')
      }

      setLocalStep(prevStep)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to navigate')
    } finally {
      setIsNavigating(false)
    }
  }, [activeStep, isNavigating, refresh])

  /**
   * Navigate to next step (for launcher -> step 1)
   */
  const handleStartWizard = useCallback(async () => {
    if (isNavigating) return

    setIsNavigating(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/settings/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1 }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start wizard')
      }

      setLocalStep(1)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start wizard')
    } finally {
      setIsNavigating(false)
    }
  }, [isNavigating, refresh])

  /**
   * Handle Step 1 completion (Organization Profile)
   */
  const handleStep1Complete = useCallback(async (data: OrganizationProfileStepData) => {
    setIsNavigating(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || 'Failed to save organization profile')
      }

      const responseData = await response.json()
      setLocalStep(responseData.next_step || 2)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organization profile')
    } finally {
      setIsNavigating(false)
    }
  }, [refresh])

  /**
   * Handle placeholder step completion (Steps 2-5)
   */
  const handlePlaceholderStepComplete = useCallback(async () => {
    if (isNavigating || activeStep >= TOTAL_STEPS) return

    setIsNavigating(true)
    setError(null)
    try {
      // For placeholder steps, use the progress endpoint to advance
      const nextStep = activeStep + 1
      const response = await fetch('/api/v1/settings/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: nextStep }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to advance step')
      }

      setLocalStep(nextStep)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance step')
    } finally {
      setIsNavigating(false)
    }
  }, [activeStep, isNavigating, refresh])

  /**
   * Handle wizard completion (Step 6)
   */
  const handleComplete = useCallback(async () => {
    if (isNavigating) return

    setIsNavigating(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/settings/onboarding/step/6', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete wizard')
      }

      refresh()
      if (onOpenChange) onOpenChange(false)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete wizard')
    } finally {
      setIsNavigating(false)
    }
  }, [isNavigating, refresh, onOpenChange, router])

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
            {error && <ErrorAlert message={error} title="Failed to skip wizard" />}

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

            {/* Error display */}
            {error && <ErrorAlert message={error} />}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleSkipClick} disabled={isNavigating}>
                Skip Onboarding
              </Button>
              <Button onClick={handleStartWizard} disabled={isNavigating} className="gap-2">
                {isNavigating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Start Onboarding Wizard
              </Button>
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
                    const isCurrent = wizardStep.number === activeStep
                    return (
                      <div
                        key={wizardStep.number}
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                          isComplete
                            ? 'bg-green-100 text-green-700'
                            : isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                        data-testid={
                          isComplete
                            ? `step-complete-${wizardStep.number}`
                            : `step-${wizardStep.number}`
                        }
                        aria-label={
                          isComplete
                            ? `Step ${wizardStep.number} completed`
                            : isCurrent
                              ? `Step ${wizardStep.number} current`
                              : `Step ${wizardStep.number} pending`
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

              {/* Error display */}
              {error && <ErrorAlert message={error} />}

              {/* Step 1: Organization Profile - Full implementation */}
              {activeStep === 1 && (
                <div className="max-h-[60vh] overflow-y-auto">
                  <OrganizationProfileStep onComplete={handleStep1Complete} />
                </div>
              )}

              {/* Steps 2-5: Placeholder cards for unimplemented steps */}
              {activeStep === 2 && (
                <PlaceholderStepCard
                  stepNumber={2}
                  title="First Warehouse"
                  description={WIZARD_STEPS[1].description}
                  storyRef="01.14"
                />
              )}

              {activeStep === 3 && (
                <PlaceholderStepCard
                  stepNumber={3}
                  title="Storage Locations"
                  description={WIZARD_STEPS[2].description}
                  storyRef="01.14"
                />
              )}

              {activeStep === 4 && (
                <PlaceholderStepCard
                  stepNumber={4}
                  title="First Product"
                  description={WIZARD_STEPS[3].description}
                  storyRef="01.14"
                />
              )}

              {activeStep === 5 && (
                <PlaceholderStepCard
                  stepNumber={5}
                  title="Demo Work Order"
                  description={WIZARD_STEPS[4].description}
                  storyRef="01.14"
                />
              )}

              {/* Step 6: Review & Complete */}
              {activeStep === 6 && (
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Review & Complete</h3>
                      <p className="text-sm text-muted-foreground">
                        {WIZARD_STEPS[5].description}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                    <p className="text-sm text-green-800">
                      <strong>Congratulations!</strong> You have completed the onboarding wizard setup.
                    </p>
                    <div className="text-sm text-green-700">
                      <p>Your organization is now ready to use MonoPilot. Click Complete to finish and go to your dashboard.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with navigation - only show for steps 2-6 (Step 1 has its own navigation) */}
            {activeStep > 1 && (
              <DialogFooter className="gap-2 sm:gap-0">
                <div className="flex w-full justify-between">
                  <Button
                    variant="outline"
                    onClick={handleSkipClick}
                    disabled={isNavigating}
                  >
                    Skip Wizard
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={activeStep === 1 || isNavigating}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={activeStep === TOTAL_STEPS ? handleComplete : handlePlaceholderStepComplete}
                      disabled={isNavigating}
                      className="gap-2"
                    >
                      {isNavigating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {activeStep === TOTAL_STEPS ? 'Complete' : 'Next'}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
