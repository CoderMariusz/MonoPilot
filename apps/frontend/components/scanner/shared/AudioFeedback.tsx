/**
 * Audio Feedback Utility (Story 05.19)
 * Purpose: Provides audio feedback for scanner operations
 * Uses Web Audio API for generating tones
 */

'use client'

// Audio context singleton
let audioContext: AudioContext | null = null
let isEnabled = true

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch (e) {
      console.warn('Web Audio API not supported:', e)
      return null
    }
  }

  return audioContext
}

function playTone(frequency: number, duration: number): void {
  if (!isEnabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  // Resume audio context if suspended (needed for mobile)
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.frequency.value = frequency
  oscillator.type = 'sine'

  // Smooth fade out
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration / 1000)
}

function playDualTone(freq1: number, freq2: number, duration: number): void {
  if (!isEnabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc1.connect(gainNode)
  osc2.connect(gainNode)
  gainNode.connect(ctx.destination)

  osc1.frequency.value = freq1
  osc2.frequency.value = freq2
  osc1.type = 'sine'
  osc2.type = 'sine'

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

  osc1.start(ctx.currentTime)
  osc2.start(ctx.currentTime)
  osc1.stop(ctx.currentTime + duration / 1000)
  osc2.stop(ctx.currentTime + duration / 1000)
}

function playRepeatingTone(frequency: number, duration: number, repeats: number): void {
  if (!isEnabled) return

  const interval = duration / repeats
  for (let i = 0; i < repeats; i++) {
    setTimeout(() => {
      playTone(frequency, interval * 0.8)
    }, i * interval)
  }
}

/**
 * Audio Feedback utility object
 * All methods are safe to call even if audio is not available
 */
export const AudioFeedback = {
  /**
   * Play success tone (880Hz, 200ms) - high pitch beep
   * Used for: valid barcode scan, successful operation
   */
  playSuccess: (): void => {
    playTone(880, 200)
  },

  /**
   * Play error tone (220Hz, 300ms) - low pitch beep
   * Used for: invalid barcode, validation error
   */
  playError: (): void => {
    playTone(220, 300)
  },

  /**
   * Play confirmation chime (660Hz + 880Hz, 500ms) - dual tone chord
   * Used for: successful receipt submission
   */
  playConfirm: (): void => {
    playDualTone(660, 880, 500)
  },

  /**
   * Play alert tone (440Hz, 400ms repeating 3x) - mid pitch repeating
   * Used for: network error, timeout
   */
  playAlert: (): void => {
    playRepeatingTone(440, 400, 3)
  },

  /**
   * Enable or disable audio feedback
   */
  setEnabled: (enabled: boolean): void => {
    isEnabled = enabled
  },

  /**
   * Check if audio is enabled
   */
  isEnabled: (): boolean => {
    return isEnabled
  },
}

export default AudioFeedback
