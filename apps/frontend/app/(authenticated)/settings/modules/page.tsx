/**
 * Module Activation Page
 * Story: 1.11 Module Activation
 * Task: BATCH 2 - Module Grid Page
 * AC-010.2: View all modules with enable/disable toggles
 * AC-010.3: Enable/disable modules with confirmation
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MODULES, type Module } from '@/lib/config/modules'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ModuleStatus {
  code: string
  enabled: boolean
}

export default function ModulesPage() {
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState<{ module: Module; newState: boolean } | null>(null)

  const { toast } = useToast()

  // Fetch current module statuses
  const fetchModuleStatuses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/modules')

      if (!response.ok) {
        throw new Error('Failed to fetch module statuses')
      }

      const data = await response.json()
      setModuleStatuses(data.modules || [])
    } catch (error) {
      console.error('Error fetching module statuses:', error)
      toast({
        title: 'Error',
        description: 'Failed to load module statuses',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModuleStatuses()
  }, [])

  // Check if module is enabled
  const isModuleEnabled = (code: string): boolean => {
    const status = moduleStatuses.find((m) => m.code === code)
    return status?.enabled || false
  }

  // Handle toggle request (AC-010.3)
  const handleToggleRequest = (module: Module, newState: boolean) => {
    setConfirmToggle({ module, newState })
  }

  // Handle toggle confirm (AC-010.3)
  const handleToggleConfirm = async () => {
    if (!confirmToggle) return

    const { module, newState } = confirmToggle

    try {
      setSubmitting(true)

      const response = await fetch('/api/settings/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: module.code,
          enabled: newState,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update module')
      }

      toast({
        title: 'Success',
        description: `Module "${module.name}" ${newState ? 'enabled' : 'disabled'} successfully. Reloading page...`,
      })

      // Reload page to refresh navigation
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error toggling module:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update module',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Get epic badge color
  const getEpicBadgeColor = (epic: number | null) => {
    if (!epic) return 'bg-gray-500'
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
    ]
    return colors[(epic - 1) % colors.length]
  }

  return (
    <div>
      <SettingsHeader currentPage="modules" />
      <div className="px-4 md:px-6 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Module Activation</CardTitle>
          <CardDescription>
            Enable or disable modules to customize your MonoPilot experience. Disabling modules will hide their features from the navigation and restrict access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AC-010.2: Module grid */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading modules...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULES.map((module) => {
                const enabled = isModuleEnabled(module.code)
                const isDefault = module.defaultEnabled

                return (
                  <Card key={module.code} className={enabled ? 'border-primary' : 'border-muted'}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {module.name}
                            {enabled ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {module.description}
                          </CardDescription>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(newState) => handleToggleRequest(module, newState)}
                          disabled={submitting}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2">
                        {module.epic && (
                          <Badge className={getEpicBadgeColor(module.epic)}>
                            Epic {module.epic}
                          </Badge>
                        )}
                        {isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                        {enabled && (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Enabled
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Module Configuration</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Core modules (Technical, Planning, Production, Warehouse) are recommended for most organizations</li>
                <li>Quality and Shipping modules add advanced workflows</li>
                <li>NPD module enables New Product Development stage-gate process</li>
                <li>Disabling a module will hide its navigation items and restrict API access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog (AC-010.3) */}
      {confirmToggle && (
        <AlertDialog open={!!confirmToggle} onOpenChange={() => setConfirmToggle(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmToggle.newState ? 'Enable' : 'Disable'} {confirmToggle.module.name} Module?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmToggle.newState ? (
                  <>
                    Are you sure you want to enable the <strong>{confirmToggle.module.name}</strong> module?
                    <br /><br />
                    This will add {confirmToggle.module.description} features to your navigation and enable API access.
                  </>
                ) : (
                  <>
                    Are you sure you want to disable the <strong>{confirmToggle.module.name}</strong> module?
                    <br /><br />
                    This will hide {confirmToggle.module.description} features from navigation and restrict API access.
                    Users will not be able to access these features until re-enabled.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleConfirm}
                disabled={submitting}
                className={confirmToggle.newState ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}
              >
                {submitting ? 'Updating...' : confirmToggle.newState ? 'Enable Module' : 'Disable Module'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      </div>
    </div>
  )
}
