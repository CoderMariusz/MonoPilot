/**
 * Scanner Settings Component (Story 07.10)
 * Settings modal (audio, vibration, display)
 */

'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { AudioFeedback } from '../../shared/AudioFeedback'
import { HapticFeedback } from '../../shared/HapticFeedback'
import type { ScannerSettings as ScannerSettingsType } from '@/lib/types/scanner-pick'

interface ScannerSettingsProps {
  onClose: () => void
  currentSettings: ScannerSettingsType
  onUpdate: (settings: ScannerSettingsType) => void
  className?: string
}

export function ScannerSettings({
  onClose,
  currentSettings,
  onUpdate,
  className,
}: ScannerSettingsProps) {
  const [settings, setSettings] = useState<ScannerSettingsType>(currentSettings)

  const handleChange = useCallback(
    (key: keyof ScannerSettingsType, value: number | boolean) => {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      onUpdate(newSettings)
    },
    [settings, onUpdate]
  )

  const handleTestAudio = useCallback(() => {
    AudioFeedback.playSuccess()
  }, [])

  const handleTestVibration = useCallback(() => {
    HapticFeedback.success()
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
        className
      )}
      role="dialog"
      aria-labelledby="settings-modal-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            id="settings-modal-title"
            className="text-xl font-bold text-gray-900"
          >
            Scanner Settings
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Audio Settings */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Audio</h3>

          <label className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-700">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.audio_volume}
              onChange={(e) => handleChange('audio_volume', Number(e.target.value))}
              className="w-32"
              aria-label="Volume"
            />
          </label>

          <label className="flex items-center justify-between py-3 border-b cursor-pointer">
            <span className="text-gray-700">Mute</span>
            <input
              type="checkbox"
              checked={settings.audio_muted}
              onChange={(e) => handleChange('audio_muted', e.target.checked)}
              className="h-5 w-5 rounded"
              aria-label="Mute audio"
            />
          </label>

          <Button
            variant="outline"
            onClick={handleTestAudio}
            className="mt-3 min-h-[48px]"
            aria-label="Test Audio"
          >
            Test Audio
          </Button>
        </section>

        {/* Vibration Settings */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Vibration</h3>

          <label className="flex items-center justify-between py-3 border-b cursor-pointer">
            <span className="text-gray-700">Enable Vibration</span>
            <input
              type="checkbox"
              checked={settings.vibration_enabled}
              onChange={(e) => handleChange('vibration_enabled', e.target.checked)}
              className="h-5 w-5 rounded"
              aria-label="Enable vibration"
            />
          </label>

          <Button
            variant="outline"
            onClick={handleTestVibration}
            className="mt-3 min-h-[48px]"
            aria-label="Test Vibration"
          >
            Test Vibration
          </Button>
        </section>

        {/* Display Settings */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Display</h3>

          <label className="flex items-center justify-between py-3 border-b cursor-pointer">
            <span className="text-gray-700">High Contrast</span>
            <input
              type="checkbox"
              checked={settings.high_contrast}
              onChange={(e) => handleChange('high_contrast', e.target.checked)}
              className="h-5 w-5 rounded"
              aria-label="Enable high contrast"
            />
          </label>

          <label className="flex items-center justify-between py-3 border-b cursor-pointer">
            <span className="text-gray-700">Large Text</span>
            <input
              type="checkbox"
              checked={settings.large_text}
              onChange={(e) => handleChange('large_text', e.target.checked)}
              className="h-5 w-5 rounded"
              aria-label="Enable large text"
            />
          </label>
        </section>

        {/* Done button */}
        <Button
          onClick={onClose}
          className="w-full h-12 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          aria-label="Done"
        >
          Done
        </Button>
      </div>
    </div>
  )
}

export default ScannerSettings
