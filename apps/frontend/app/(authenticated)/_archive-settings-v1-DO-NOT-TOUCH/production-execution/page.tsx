'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProductionSettings {
  allow_pause_wo: boolean
  auto_complete_wo: boolean
  require_operation_sequence: boolean
  require_qa_on_output: boolean
  auto_create_by_product_lp: boolean
  dashboard_refresh_seconds: number
  // Story 4.11: Over-Consumption Control
  allow_over_consumption: boolean
}

export default function ProductionSettingsPage() {
  const [settings, setSettings] = useState<ProductionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/production/settings')
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`)
      }
      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleToggle = async (field: keyof ProductionSettings, value: boolean) => {
    if (!settings) return

    const updatedSettings = { ...settings, [field]: value }
    setSettings(updatedSettings)

    try {
      setSaving(true)
      const response = await fetch('/api/production/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      })

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`)
      }

      const data = await response.json()
      setSettings(data.settings)
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      setSettings({ ...settings, [field]: !value })
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRefreshIntervalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return

    const value = parseInt(e.target.value, 10)
    if (isNaN(value)) return

    const updatedSettings = { ...settings, dashboard_refresh_seconds: value }
    setSettings(updatedSettings)

    try {
      setSaving(true)
      const response = await fetch('/api/production/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      })

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`)
      }

      const data = await response.json()
      setSettings(data.settings)
      toast({
        title: 'Success',
        description: 'Dashboard refresh interval updated',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      setSettings({ ...settings, dashboard_refresh_seconds: settings.dashboard_refresh_seconds })
      toast({
        title: 'Error',
        description: 'Failed to update dashboard refresh interval',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Failed to load settings</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Production Settings</h1>
        <p className="text-gray-600 mt-2">Configure how the Production module executes</p>
      </div>

      {/* Work Order Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Work Order Settings</CardTitle>
          <CardDescription>Control work order behavior and execution rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Allow Pause WO Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow-pause-wo" className="text-base">
                Allow Pause Work Orders
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Allow operators to pause work orders during execution
              </p>
            </div>
            <Switch
              id="allow-pause-wo"
              checked={settings.allow_pause_wo}
              onCheckedChange={(value) => handleToggle('allow_pause_wo', value)}
              disabled={saving}
            />
          </div>

          {/* Auto Complete WO Toggle */}
          <div className="flex items-center justify-between border-t pt-6">
            <div>
              <Label htmlFor="auto-complete-wo" className="text-base">
                Auto-Complete Work Orders
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Automatically complete work orders when output qty reaches planned qty
              </p>
            </div>
            <Switch
              id="auto-complete-wo"
              checked={settings.auto_complete_wo}
              onCheckedChange={(value) => handleToggle('auto_complete_wo', value)}
              disabled={saving}
            />
          </div>

          {/* Require Operation Sequence Toggle */}
          <div className="flex items-center justify-between border-t pt-6">
            <div>
              <Label htmlFor="require-operation-sequence" className="text-base">
                Require Operation Sequence
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Enforce strict operation sequence from routing (operations must be completed in order)
              </p>
            </div>
            <Switch
              id="require-operation-sequence"
              checked={settings.require_operation_sequence}
              onCheckedChange={(value) => handleToggle('require_operation_sequence', value)}
              disabled={saving}
            />
          </div>

          {/* Require QA on Output Toggle */}
          <div className="flex items-center justify-between border-t pt-6">
            <div>
              <Label htmlFor="require-qa-on-output" className="text-base">
                Require QA on Output
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Require QA check before output registration
              </p>
            </div>
            <Switch
              id="require-qa-on-output"
              checked={settings.require_qa_on_output}
              onCheckedChange={(value) => handleToggle('require_qa_on_output', value)}
              disabled={saving}
            />
          </div>

          {/* Auto Create By-Product LPs Toggle */}
          <div className="flex items-center justify-between border-t pt-6">
            <div>
              <Label htmlFor="auto-create-by-product-lp" className="text-base">
                Auto-Create By-Product LPs
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                If enabled, automatically create license plates for by-products. If disabled, prompt operator to decide.
              </p>
            </div>
            <Switch
              id="auto-create-by-product-lp"
              checked={settings.auto_create_by_product_lp}
              onCheckedChange={(value) => handleToggle('auto_create_by_product_lp', value)}
              disabled={saving}
            />
          </div>

          {/* Story 4.11: Allow Over-Consumption Toggle */}
          <div className="flex items-center justify-between border-t pt-6">
            <div>
              <Label htmlFor="allow-over-consumption" className="text-base">
                Allow Over-Consumption
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Controls over-consumption warning behavior during output registration.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                When OFF: Operators see a warning and must confirm to over-consume.
                When ON: Warning still shown, but more permissive messaging.
              </p>
            </div>
            <Switch
              id="allow-over-consumption"
              checked={settings.allow_over_consumption ?? false}
              onCheckedChange={(value) => handleToggle('allow_over_consumption', value)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Settings</CardTitle>
          <CardDescription>Configure dashboard behavior and refresh rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dashboard-refresh-seconds" className="text-base">
              Dashboard Auto-Refresh Interval
            </Label>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              How often the production dashboard refreshes data (in seconds). Minimum 30 seconds to prevent server overload.
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="dashboard-refresh-seconds"
                type="number"
                min="30"
                max="300"
                value={settings.dashboard_refresh_seconds}
                onChange={handleRefreshIntervalChange}
                disabled={saving}
                className="max-w-xs"
              />
              <span className="text-sm text-gray-600">seconds</span>
            </div>
            {(settings.dashboard_refresh_seconds < 30 || settings.dashboard_refresh_seconds > 300) && (
              <p className="text-sm text-red-500 mt-2">
                Refresh interval must be between 30 and 300 seconds
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> All changes are applied immediately and do not require a server restart.
        </p>
      </div>
    </div>
  )
}
