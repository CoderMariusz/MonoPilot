'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'
import { OnboardingWizardModal } from './OnboardingWizardModal'
import { OnboardingStepIndicator } from './OnboardingStepIndicator'
import { SetupInProgressMessage } from './SetupInProgressMessage'

/**
 * OnboardingLauncher Component
 * Story: 01.12 - Settings > Onboarding Wizard
 * Wireframe: SET-001
 *
 * Entry point for 15-minute onboarding wizard.
 * Shows wizard overview, progress, and options to start or skip.
 */
export function OnboardingWizardLauncher() {
  const router = useRouter()
  const { data: context, isLoading, error, refetch } = useOrgContext()
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = useCallback(async () => {
    setIsStarting(true)
    try {
      const response = await fetch('/api/v1/settings/onboarding/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1 }),
      })
      if (response.ok) {
        router.push('/onboarding/step-1')
      }
    } catch (error) {
      console.error('Failed to start wizard:', error)
    } finally {
      setIsStarting(false)
    }
  }, [router])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="w-full max-w-2xl space-y-8 px-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="text-lg text-muted-foreground">
            Loading your organization...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="w-full max-w-2xl space-y-6 px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
              <div className="text-left">
                <h3 className="font-semibold text-red-900">
                  Failed to Load Onboarding Wizard
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  Unable to retrieve organization settings.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
            <Button variant="ghost">Contact Support</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!context) return null

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">MonoPilot</h1>
          <span className="text-sm text-muted-foreground">Welcome</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700" />
            </div>
            <h2 className="text-3xl font-bold">
              Welcome to MonoPilot Food Manufacturing MES
            </h2>
          </div>

          {/* Wizard Overview Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">
              Quick Onboarding Wizard
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Let&apos;s get your organization ready in 15 minutes:
            </p>
            <OnboardingStepIndicator />
            <p className="mt-6 text-sm text-muted-foreground">
              You can skip any step and configure later.
            </p>
          </div>

          {/* Progress Status Card */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <SetupInProgressMessage context={context} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSkipDialog(true)}
              disabled={isStarting}
            >
              Skip Onboarding
            </Button>
            <Button
              size="lg"
              onClick={handleStart}
              disabled={isStarting}
              className="gap-2"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Start Onboarding Wizard
            </Button>
          </div>
        </div>
      </main>

      {/* Skip Confirmation Dialog */}
      <OnboardingWizardModal
        open={showSkipDialog}
        onOpenChange={setShowSkipDialog}
      />
    </div>
  )
}
