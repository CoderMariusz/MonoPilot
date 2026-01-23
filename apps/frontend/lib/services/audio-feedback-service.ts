/**
 * Audio Feedback Service
 * Story: 06.8 Scanner QA Pass/Fail
 * AC-8.10: Audio Feedback
 *
 * Provides audio beep/chime player for scanner operations:
 * - Success beep: 440 Hz, 100ms (valid LP scan)
 * - Error beep: 220 Hz, 200ms (invalid barcode)
 * - Success chime: Ascending tone (inspection pass)
 * - Alert tone: Descending tone (inspection fail)
 */

const MUTE_KEY = 'scanner_audio_muted'

// =============================================================================
// Audio Context Factory
// =============================================================================

function getAudioContext(): AudioContext | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = typeof globalThis !== 'undefined' ? globalThis : (global as any)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioCtx = (g as any).AudioContext || (g as any).webkitAudioContext

  if (!AudioCtx) {
    return null
  }

  try {
    return new AudioCtx()
  } catch {
    return null
  }
}

// =============================================================================
// Mute Control
// =============================================================================

/**
 * Check if audio is muted
 */
export function isMuted(): boolean {
  if (typeof localStorage === 'undefined') {
    return false
  }
  return localStorage.getItem(MUTE_KEY) === 'true'
}

/**
 * Toggle audio mute
 */
export function toggleMute(): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  const currentlyMuted = isMuted()
  localStorage.setItem(MUTE_KEY, currentlyMuted ? 'false' : 'true')
}

// =============================================================================
// Audio Playback Functions
// =============================================================================

/**
 * Play success beep (440 Hz, 100ms)
 * Used for valid LP scan
 */
export function playSuccessBeep(): void {
  if (isMuted()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 440 // Hz
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3 // Volume

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1) // 100ms
  } catch {
    // Handle devices without audio support gracefully
  }
}

/**
 * Play error beep (220 Hz, 200ms)
 * Used for invalid barcode
 */
export function playErrorBeep(): void {
  if (isMuted()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 220 // Hz (lower than success)
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3 // Volume

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2) // 200ms
  } catch {
    // Handle devices without audio support gracefully
  }
}

/**
 * Play success chime (ascending tone)
 * Used for inspection pass completion
 */
export function playSuccessChime(): void {
  if (isMuted()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // First tone
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.frequency.value = 440 // C
    osc1.type = 'sine'
    gain1.gain.value = 0.3
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.1)

    // Second tone (higher)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.frequency.value = 523 // C5
    osc2.type = 'sine'
    gain2.gain.value = 0.3
    osc2.start(ctx.currentTime + 0.1)
    osc2.stop(ctx.currentTime + 0.2)

    // Third tone (highest)
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.connect(gain3)
    gain3.connect(ctx.destination)
    osc3.frequency.value = 659 // E5
    osc3.type = 'sine'
    gain3.gain.value = 0.3
    osc3.start(ctx.currentTime + 0.2)
    osc3.stop(ctx.currentTime + 0.35)
  } catch {
    // Handle devices without audio support gracefully
  }
}

/**
 * Play alert tone (descending tone)
 * Used for inspection fail completion
 */
export function playAlertTone(): void {
  if (isMuted()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // First tone (higher)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.frequency.value = 440 // A4
    osc1.type = 'sine'
    gain1.gain.value = 0.3
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.15)

    // Second tone (lower)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.frequency.value = 330 // E4
    osc2.type = 'sine'
    gain2.gain.value = 0.3
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.3)

    // Third tone (lowest)
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.connect(gain3)
    gain3.connect(ctx.destination)
    osc3.frequency.value = 220 // A3
    osc3.type = 'sine'
    gain3.gain.value = 0.3
    osc3.start(ctx.currentTime + 0.3)
    osc3.stop(ctx.currentTime + 0.5)
  } catch {
    // Handle devices without audio support gracefully
  }
}

// =============================================================================
// Default Export (Object with all methods)
// =============================================================================

export const AudioFeedbackService = {
  playSuccessBeep,
  playErrorBeep,
  playSuccessChime,
  playAlertTone,
  isMuted,
  toggleMute,
}

export default AudioFeedbackService
