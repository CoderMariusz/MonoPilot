/**
 * Scanner Feedback Component
 * Story 5.25: Scanner Feedback (Sound, Vibration, Visual)
 * Success/Error overlays with audio and haptic feedback
 */

'use client'

import { useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type FeedbackType = 'success' | 'error' | 'warning'

interface ScannerFeedbackProps {
  show: boolean
  type: FeedbackType
  message: string
  duration?: number
  onHide?: () => void
  enableSound?: boolean
  enableVibration?: boolean
}

// Audio feedback using Web Audio API
function playBeep(frequency: number, duration: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = frequency
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration / 1000)
  } catch {
    // Audio not supported
  }
}

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export function ScannerFeedback({
  show,
  type,
  message,
  duration = 2000,
  onHide,
  enableSound = true,
  enableVibration = true,
}: ScannerFeedbackProps) {
  // Play feedback when shown
  useEffect(() => {
    if (!show) return

    // Audio feedback (Story 5.25 - AC1)
    if (enableSound) {
      if (type === 'success') {
        playBeep(800, 150)
      } else if (type === 'error') {
        playBeep(300, 150)
        setTimeout(() => playBeep(300, 150), 200)
      } else if (type === 'warning') {
        playBeep(600, 200)
      }
    }

    // Haptic feedback (Story 5.25 - AC2)
    if (enableVibration) {
      if (type === 'success') {
        vibrate(100)
      } else if (type === 'error') {
        vibrate([100, 50, 100])
      } else if (type === 'warning') {
        vibrate([50, 50, 50])
      }
    }

    // Auto-hide
    const timer = setTimeout(() => {
      onHide?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [show, type, duration, enableSound, enableVibration, onHide])

  if (!show) return null

  const config = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-green-600',
      textColor: 'text-white',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-600',
      textColor: 'text-white',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-orange-600',
      textColor: 'text-white',
    },
  }

  const { icon: Icon, bgColor, textColor } = config[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div
        className={cn(
          'flex flex-col items-center gap-4 p-8 rounded-lg shadow-2xl max-w-sm mx-4',
          bgColor,
          textColor
        )}
      >
        <Icon className="h-20 w-20 animate-in zoom-in duration-300" />
        <div className="text-2xl font-bold text-center">{message}</div>
      </div>
    </div>
  )
}
