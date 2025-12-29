/**
 * Module Activation Page
 * Story: 1.11 Module Activation
 * Story: TD-104 - Module Grouping and Dependencies
 * Task: BATCH 2 - Module Grid Page
 * AC-010.2: View all modules with enable/disable toggles
 * AC-010.3: Enable/disable modules with confirmation
 *
 * Features (TD-104):
 * - Grouped sections (CORE/PREMIUM/NEW)
 * - Expand/collapse functionality
 * - Module count per group
 * - Dependency indicators
 * - Pricing labels
 * - Confirmation dialog with dependency warnings
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  MODULES,
  MODULE_GROUPS,
  getModulesByGroup,
  getDisableBlockers,
  type Module,
  type ModuleGroup,
} from '@/lib/config/modules'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { ModuleCard } from '@/components/settings/modules/ModuleCard'
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
  const [confirmToggle, setConfirmToggle] = useState<{
    module: Module
    newState: boolean
    blockers?: Module[]
  } | null>(null)

  // Expanded groups state (TD-104)
  const [expandedGroups, setExpandedGroups] = useState<ModuleGroup[]>(['core'])

  const { toast } = useToast()

  // Get enabled module codes for dependency checking (TD-104)
  const enabledModuleCodes = useMemo(() => {
    return moduleStatuses.filter(m => m.enabled).map(m => m.code)
  }, [moduleStatuses])

  // Calculate summary stats (TD-104)
  const summaryStats = useMemo(() => {
    const enabled = moduleStatuses.filter(m => m.enabled).length
    const disabled = MODULES.length - enabled
    return { enabled, disabled, total: MODULES.length }
  }, [moduleStatuses])

  // Get stats per group (TD-104)
  const getGroupStats = (groupId: ModuleGroup) => {
    const groupModules = getModulesByGroup(groupId)
    const enabled = groupModules.filter(m =>
      moduleStatuses.find(s => s.code === m.code)?.enabled
    ).length
    return { enabled, total: groupModules.length }
  }

  // Toggle group expand/collapse (TD-104)
  const toggleGroup = (groupId: ModuleGroup) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  // Expand all groups (TD-104)
  const expandAll = () => {
    setExpandedGroups(MODULE_GROUPS.map(g => g.id))
  }

  // Collapse all groups (TD-104)
  const collapseAll = () => {
    setExpandedGroups([])
  }

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

  // Handle toggle request (AC-010.3) - Updated for TD-104 dependency warnings
  const handleToggleRequest = (module: Module, newState: boolean) => {
    // Check for blockers when disabling (TD-104)
    if (!newState) {
      const blockers = getDisableBlockers(module.code, enabledModuleCodes)
      setConfirmToggle({ module, newState, blockers: blockers.length > 0 ? blockers : undefined })
    } else {
      setConfirmToggle({ module, newState })
    }
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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Modules</h1>
            <p className="text-muted-foreground">
              Enable or disable modules for your organization
            </p>
          </div>
        </div>

        {/* Summary Card (TD-104) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Module Status</div>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        <span className="text-green-600">{summaryStats.enabled}</span>
                        {' '}enabled, {' '}
                        <span className="text-muted-foreground">{summaryStats.disabled}</span>
                        {' '}disabled
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  disabled={loading}
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  disabled={loading}
                >
                  Collapse All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {MODULE_GROUPS.map(group => (
              <Card key={group.id}>
                <div className="p-4">
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Grouped Module Cards (TD-104) */
          <div className="space-y-4">
            {MODULE_GROUPS.map((group) => {
              const groupModules = getModulesByGroup(group.id)
              const groupStats = getGroupStats(group.id)
              const isExpanded = expandedGroups.includes(group.id)

              return (
                <Card key={group.id} data-testid={`module-group-${group.id}`}>
                  {/* Group Header - Clickable */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroup(group.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleGroup(group.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-label={`${group.name} - ${isExpanded ? 'collapse' : 'expand'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <h2 className="text-xl font-semibold">{group.name}</h2>
                          <p className="text-sm text-muted-foreground">
                            {group.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {groupStats.enabled}/{groupStats.total} enabled
                        </Badge>
                        <Badge variant="secondary">
                          {groupModules.length} modules
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Group Content - Modules Grid */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                        {groupModules.map((module) => (
                          <ModuleCard
                            key={module.code}
                            module={module}
                            enabled={isModuleEnabled(module.code)}
                            disabled={submitting}
                            onToggle={handleToggleRequest}
                            showPricing={true}
                            showDependencies={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
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
              <li>Core modules are essential features included in all plans</li>
              <li>Premium modules require a subscription ($50/user/month)</li>
              <li>Check dependency requirements before disabling modules</li>
              <li>Disabling a module will hide its navigation and restrict API access</li>
            </ul>
          </div>
        </div>

        {/* Confirmation Dialog (AC-010.3) - Updated for TD-104 */}
        {confirmToggle && (
          <AlertDialog open={!!confirmToggle} onOpenChange={() => setConfirmToggle(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  {confirmToggle.blockers && confirmToggle.blockers.length > 0 && (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  {confirmToggle.newState ? 'Enable' : 'Disable'} {confirmToggle.module.name} Module?
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    {confirmToggle.newState ? (
                      <p>
                        Are you sure you want to enable the <strong>{confirmToggle.module.name}</strong> module?
                        This will add {confirmToggle.module.description} features to your navigation and enable API access.
                      </p>
                    ) : (
                      <>
                        <p>
                          Are you sure you want to disable the <strong>{confirmToggle.module.name}</strong> module?
                          This will hide {confirmToggle.module.description} features from navigation and restrict API access.
                        </p>

                        {/* Dependency Warning (TD-104) */}
                        {confirmToggle.blockers && confirmToggle.blockers.length > 0 && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-800">
                            <p className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Warning: Dependent Modules
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              The following modules depend on {confirmToggle.module.name} and may stop working:
                            </p>
                            <ul className="mt-2 list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                              {confirmToggle.blockers.map(blocker => (
                                <li key={blocker.code}>{blocker.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    {/* Dependency info for enabling */}
                    {confirmToggle.newState && confirmToggle.module.dependencies && confirmToggle.module.dependencies.length > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Note:</strong> This module requires the following modules to be enabled: {confirmToggle.module.dependencies.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
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
