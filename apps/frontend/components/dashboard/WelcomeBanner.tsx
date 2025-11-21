'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface WelcomeBannerProps {
  show: boolean
  onDismiss?: () => void
}

export function WelcomeBanner({ show, onDismiss }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(show)

  if (!visible) return null

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>👋</span>
            Welcome to MonoPilot!
          </h2>
          <p className="text-base opacity-90">
            Let&apos;s set up your organization to get started.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
      <div className="mt-4 flex gap-4">
        <Button
          asChild
          className="bg-white text-blue-600 hover:bg-gray-100"
        >
          <a href="/settings/wizard">Start Setup Wizard</a>
        </Button>
        <Button
          onClick={handleDismiss}
          variant="outline"
          className="border-white text-white hover:bg-white/10"
        >
          Skip for now
        </Button>
      </div>
    </div>
  )
}
