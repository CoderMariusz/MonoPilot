/**
 * useOnboardingStatus Hook
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Hook to fetch and cache organization onboarding status.
 * Returns current step, completion status, and skip status.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface OnboardingStatus {
  step: number | null
  isComplete: boolean
  isSkipped: boolean
  loading: boolean
  error: Error | null
  refresh: () => void
}

/**
 * Hook to fetch onboarding status for the current organization
 *
 * @returns Object with onboarding status data, loading state, error, and refresh function
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { step, isComplete, isSkipped, loading, error, refresh } = useOnboardingStatus();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage onRetry={refresh} />;
 *   if (isComplete) return <Dashboard />;
 *
 *   return <OnboardingWizard currentStep={step} />;
 * }
 * ```
 */
export function useOnboardingStatus(): OnboardingStatus {
  const [step, setStep] = useState<number | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch organization data directly
      const { data, error: dbError } = await supabase
        .from('organizations')
        .select(
          'onboarding_step, onboarding_started_at, onboarding_completed_at, onboarding_skipped'
        )
        .single()

      if (dbError) {
        throw new Error(dbError.message)
      }

      if (!data) {
        throw new Error('Organization not found')
      }

      // Set state from fetched data
      const currentStep = data.onboarding_step ?? 0
      const completed = !!data.onboarding_completed_at
      const skipped = data.onboarding_skipped ?? false

      setStep(currentStep)
      setIsComplete(completed)
      setIsSkipped(skipped)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
      setStep(null)
      setIsComplete(false)
      setIsSkipped(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  return {
    step,
    isComplete,
    isSkipped,
    loading,
    error,
    refresh: fetchStatus,
  }
}
