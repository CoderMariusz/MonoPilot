'use client'

import { ReactNode } from 'react'
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { OnboardingWizardLauncher } from './OnboardingWizardLauncher'

/**
 * OnboardingGuard Component
 * Story: 01.12 - Settings > Onboarding Wizard Entry Point
 *
 * Guards pages to show onboarding wizard if needed.
 * Redirects new organizations to SET-001 launcher.
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
  const { data: context, isLoading, error } = useOrgContext()

  // Loading state - show launcher skeleton
  if (isLoading) {
    return <OnboardingWizardLauncher />
  }

  // Error state - show launcher error
  if (error) {
    return <OnboardingWizardLauncher />
  }

  // Check if wizard should be shown
  const shouldShowWizard =
    context &&
    !context.organization.onboarding_completed_at &&
    !context.organization.onboarding_skipped

  // Show wizard launcher if needed
  if (shouldShowWizard) {
    return <OnboardingWizardLauncher />
  }

  // Wizard complete or skipped - show children
  return <>{children}</>
}
