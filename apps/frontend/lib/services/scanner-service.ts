/**
 * Scanner Service for Audio/Vibration Feedback
 * Story 04.6b: Material Consumption Scanner
 *
 * Provides audio and haptic feedback for scanner operations:
 * - Success: 500ms beep at 440Hz + 200ms vibration
 * - Error: 2x 200ms beeps at lower frequency + pattern vibration
 */

/**
 * Create AudioContext instance
 * Creates a new context for each sound (for test isolation)
 */
function createAudioContext(): AudioContext | null {
  // Check if running in a browser environment with window
  if (typeof window === 'undefined') {
    return null
  }

  // Get AudioContext from window (supports both standard and webkit prefixed)
   
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext

  if (!AudioCtx) {
    return null
  }

  try {
    return new AudioCtx()
  } catch {
    return null
  }
}

export const ScannerService = {
  /**
   * Play success sound: 500ms beep at 440Hz
   * FR-04.6b-003: Audio feedback for valid scan
   */
  playSuccessSound(): void {
    try {
      const ctx = createAudioContext()
      if (!ctx) return

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 440
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3 // Volume

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5) // 500ms
    } catch {
      // Handle devices without audio support gracefully
    }
  },

  /**
   * Play error sound: 2x 200ms beeps with 100ms gap at lower frequency
   * AC-04.6b-002: Error feedback with 2 short beeps
   */
  playErrorSound(): void {
    try {
      const ctx = createAudioContext()
      if (!ctx) return

      // First beep at 300Hz (lower than success)
      const oscillator1 = ctx.createOscillator()
      const gainNode1 = ctx.createGain()
      oscillator1.connect(gainNode1)
      gainNode1.connect(ctx.destination)
      oscillator1.frequency.value = 300
      oscillator1.type = 'sine'
      gainNode1.gain.value = 0.3
      oscillator1.start(ctx.currentTime)
      oscillator1.stop(ctx.currentTime + 0.2) // 200ms

      // Second beep after 300ms delay (200ms duration + 100ms gap)
      const oscillator2 = ctx.createOscillator()
      const gainNode2 = ctx.createGain()
      oscillator2.connect(gainNode2)
      gainNode2.connect(ctx.destination)
      oscillator2.frequency.value = 300
      oscillator2.type = 'sine'
      gainNode2.gain.value = 0.3
      oscillator2.start(ctx.currentTime + 0.3) // 300ms delay
      oscillator2.stop(ctx.currentTime + 0.5) // +200ms duration
    } catch {
      // Handle devices without audio support gracefully
    }
  },

  /**
   * Trigger device vibration
   * AC-04.6b-003: 200ms vibration for success
   * @param duration - Duration in ms or pattern array [vibrate, pause, vibrate]
   */
  triggerVibration(duration: number | number[]): void {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(duration)
      }
    } catch {
      // Handle devices without vibration support gracefully
    }
  },

  /**
   * Combined success feedback: sound + vibration + visual
   * FR-04.6b-005: Combined feedback for successful consumption
   */
  showSuccessFeedback(): void {
    this.playSuccessSound()
    this.triggerVibration(200) // 200ms for success
  },

  /**
   * Combined error feedback: sound + vibration + visual
   * AC-04.6b-002: Combined error feedback
   */
  showErrorFeedback(): void {
    this.playErrorSound()
    this.triggerVibration([100, 50, 100]) // 2 short pulses pattern
  },
}

export default ScannerService
