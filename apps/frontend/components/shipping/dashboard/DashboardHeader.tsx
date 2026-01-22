/**
 * Dashboard Header Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Header with title, auto-refresh toggle, and manual refresh button
 */

'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DashboardHeaderProps {
  isRefreshing: boolean
  onManualRefresh: () => void
  autoRefreshEnabled: boolean
  onToggleAutoRefresh: (enabled: boolean) => void
  nextRefreshIn: number
}

export function DashboardHeader({
  isRefreshing,
  onManualRefresh,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  nextRefreshIn,
}: DashboardHeaderProps) {
  return (
    <div
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      data-testid="dashboard-header"
    >
      <h1 className="text-2xl font-semibold">Shipping Dashboard</h1>

      <div className="flex items-center gap-4">
        {/* Auto-refresh toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="auto-refresh"
            checked={autoRefreshEnabled}
            onCheckedChange={onToggleAutoRefresh}
            aria-label="Auto-refresh"
          />
          <Label htmlFor="auto-refresh" className="text-sm text-gray-600">
            Auto-refresh
          </Label>
          {autoRefreshEnabled && nextRefreshIn > 0 && (
            <span className="text-xs text-gray-500 tabular-nums">
              {nextRefreshIn}s
            </span>
          )}
        </div>

        {/* Manual refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onManualRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard"
          className="focus-visible:ring-2"
        >
          {isRefreshing ? (
            <Loader2
              className="h-4 w-4 animate-spin"
              data-testid="refresh-spinner"
            />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>
    </div>
  )
}

export default DashboardHeader
