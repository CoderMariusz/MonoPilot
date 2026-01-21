/**
 * Haptic Feedback Utility (Story 05.19)
 * Purpose: Provides haptic/vibration feedback for scanner operations
 * Uses navigator.vibrate API
 */

'use client'

let isEnabled = true

function vibrate(pattern: number | number[]): void {
  if (!isEnabled) return

  if (typeof window === 'undefined') return
  if (!navigator.vibrate) return

  try {
    navigator.vibrate(pattern)
  } catch (e) {
    // Silently ignore vibration errors
    console.warn('Vibration not supported:', e)
  }
}

/**
 * Haptic Feedback utility object
 * All methods are safe to call even if vibration is not available
 */
export const HapticFeedback = {
  /**
   * Short success buzz (50ms)
   * Used for: valid scan, button press
   */
  success: (): void => {
    vibrate(50)
  },

  /**
   * Double error buzz (50ms, 50ms gap, 50ms)
   * Used for: invalid scan, error
   */
  error: (): void => {
    vibrate([50, 50, 50])
  },

  /**
   * Long confirmation buzz (100ms)
   * Used for: successful submission
   */
  confirm: (): void => {
    vibrate(100)
  },

  /**
   * Warning buzz (75ms)
   * Used for: location mismatch, warnings
   */
  warning: (): void => {
    vibrate(75)
  },

  /**
   * Enable or disable haptic feedback
   */
  setEnabled: (enabled: boolean): void => {
    isEnabled = enabled
  },

  /**
   * Check if haptic feedback is supported
   */
  isSupported: (): boolean => {
    if (typeof window === 'undefined') return false
    return 'vibrate' in navigator
  },

  /**
   * Check if haptic feedback is enabled
   */
  isEnabled: (): boolean => {
    return isEnabled
  },
}

export default HapticFeedback
