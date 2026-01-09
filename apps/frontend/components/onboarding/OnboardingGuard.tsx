'use client'

import { ReactNode } from 'react'
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Settings } from 'lucide-react'

/**
 * OnboardingGuard Component
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Guards authenticated routes to show onboarding wizard if needed.
 * - Shows wizard modal for admin/owner when onboarding incomplete
 * - Shows "Setup in progress" message for non-admin users
 * - Renders children when onboarding complete or skipped
 *
 * Usage:
 * ```tsx
 * <OnboardingGuard>
 *   <YourPage />
 * </OnboardingGuard>
 * ```
 */
interface OnboardingGuardProps {
  children: ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { data: context, isLoading, error, refetch } = useOrgContext()
  const onboardingStatus = useOnboardingStatus()

  // Loading state
  if (isLoading || onboardingStatus.loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
          <p className="text-muted-foreground">Loading your organization...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || onboardingStatus.error) {
    const errorMessage =
      error?.message ||
      onboardingStatus.error?.message ||
      'Failed to load organization'

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md space-y-4">
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-red-200 bg-red-50 p-6"
          >
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check if onboarding is complete
  if (onboardingStatus.isComplete || onboardingStatus.isSkipped) {
    return <>{children}</>
  }

  // Onboarding incomplete - check user role
  const isAdmin =
    context?.role_code === 'admin' || context?.role_code === 'owner'

  // Admin/Owner: Show wizard modal
  if (isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full space-y-6 p-6">
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <div className="text-center space-y-4">
              <Settings className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="text-2xl font-bold">Onboarding Wizard</h2>
              <p className="text-muted-foreground">
                Complete the setup to get started with MonoPilot
              </p>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Current progress: Step {onboardingStatus.step || 0} of 6
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Non-admin: Show setup in progress message
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-8">
          <div className="text-center space-y-4">
            <Settings className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="text-xl font-semibold text-blue-900">
              Organization Setup in Progress
            </h2>
            <p className="text-sm text-blue-700">
              Your administrator is currently setting up the organization.
              Please contact your administrator for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
