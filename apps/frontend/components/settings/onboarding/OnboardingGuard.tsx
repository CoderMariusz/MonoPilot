/**
 * OnboardingGuard Component
 * Story: 01.3 - Onboarding Wizard Launcher (TD-102)
 *
 * Wrapper component that checks onboarding status and auto-launches
 * the onboarding modal for admin users on first login.
 *
 * Features:
 * - Checks if user is admin (owner, admin roles)
 * - Checks onboarding status from API
 * - Auto-launches modal if onboarding not started
 * - Respects localStorage "don't show again" preference
 * - Non-blocking - shows children while loading
 *
 * Conditions for showing modal:
 * - User has admin role (owner or admin)
 * - Onboarding step is 0 (not started)
 * - Onboarding not completed
 * - Onboarding not skipped
 * - Modal not dismissed via localStorage
 *
 * @see SET-001 wireframe specification
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { OnboardingWizardModal } from './OnboardingWizardModal'

/** LocalStorage key for tracking modal dismissal */
const ONBOARDING_DISMISSED_KEY = 'onboarding_modal_dismissed'

/** Admin roles that can see onboarding wizard */
const ADMIN_ROLES = ['owner', 'admin']

interface OnboardingGuardProps {
  /** Child components to render */
  children: React.ReactNode
}

/**
 * OnboardingGuard
 *
 * Wraps authenticated layout to check onboarding status
 * and auto-launch modal for first-time admin users.
 *
 * @param children - Child components to render
 *
 * @example
 * // In authenticated layout
 * <OnboardingGuard>
 *   {children}
 * </OnboardingGuard>
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const [showModal, setShowModal] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  /**
   * Check if user should see onboarding modal
   */
  const checkOnboardingStatus = useCallback(async () => {
    try {
      // Check if user previously dismissed the modal
      if (typeof window !== 'undefined') {
        const isDismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY)
        if (isDismissed === 'true') {
          setIsChecking(false)
          return
        }
      }

      // 1. Get user context to check role
      const contextResponse = await fetch('/api/v1/settings/context')
      if (!contextResponse.ok) {
        setIsChecking(false)
        return
      }

      const context = await contextResponse.json()
      const isAdmin = ADMIN_ROLES.includes(context.role_code)

      // Only show to admin users
      if (!isAdmin) {
        setIsChecking(false)
        return
      }

      // 2. Check onboarding status
      const statusResponse = await fetch('/api/v1/settings/onboarding/status')
      if (!statusResponse.ok) {
        setIsChecking(false)
        return
      }

      const status = await statusResponse.json()

      // Auto-launch conditions:
      // - step is 0 (not started)
      // - not completed (is_complete is false)
      // - not skipped
      const shouldShowModal =
        status.step === 0 &&
        !status.is_complete &&
        !status.skipped

      if (shouldShowModal) {
        setShowModal(true)
      }

      setIsChecking(false)
    } catch (error) {
      console.error('[OnboardingGuard] Error checking onboarding status:', error)
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkOnboardingStatus()
  }, [checkOnboardingStatus])

  /**
   * Handle modal close (X, ESC, backdrop)
   * Stores dismissal in localStorage
   */
  const handleModalClose = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true')
    }
    setShowModal(false)
  }, [])

  /**
   * Handle skip button click
   * Calls skip API and closes modal
   */
  const handleSkip = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/settings/onboarding/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to skip onboarding')
      }

      // Clear the dismissed flag since we properly skipped
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ONBOARDING_DISMISSED_KEY)
      }
    } catch (error) {
      console.error('[OnboardingGuard] Error skipping onboarding:', error)
      throw error
    }
  }, [])

  // Always render children - modal is overlay
  return (
    <>
      {children}
      {showModal && (
        <OnboardingWizardModal
          open={showModal}
          onClose={handleModalClose}
          onSkip={handleSkip}
        />
      )}
    </>
  )
}
