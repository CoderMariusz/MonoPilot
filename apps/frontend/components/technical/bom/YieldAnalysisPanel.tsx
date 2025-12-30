/**
 * YieldAnalysisPanel Component (Story 02.14)
 * Yield metrics display on BOM detail page
 * FR-2.34: Yield calculation display
 *
 * Features:
 * - Theoretical yield calculation
 * - Expected vs actual comparison
 * - Variance warning indicator
 * - Configure yield button
 * - All 4 UI states (loading, error, empty, success)
 */

'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Settings,
  RefreshCw,
  Info,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useBOMYield } from '@/lib/hooks/use-bom-yield'
import { YieldConfigModal } from './YieldConfigModal'
import { cn } from '@/lib/utils'

// ========================================
// Props Interface
// ========================================

export interface YieldAnalysisPanelProps {
  /** BOM ID to display yield for */
  bomId: string
  /** Additional className */
  className?: string
}

// ========================================
// YieldAnalysisPanel Component
// ========================================

export function YieldAnalysisPanel({ bomId, className }: YieldAnalysisPanelProps) {
  const [showConfigModal, setShowConfigModal] = useState(false)

  const {
    data: yieldData,
    isLoading,
    error,
    refetch,
  } = useBOMYield(bomId)

  // Loading State
  if (isLoading) {
    return <YieldAnalysisPanelLoading className={className} />
  }

  // Error State
  if (error) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Yield Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error.message || 'Failed to load yield data'}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Empty State (no yield data configured)
  if (!yieldData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Yield Analysis
          </CardTitle>
          <CardDescription>
            Configure expected yield to track production efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No yield configuration found for this BOM.
            </p>
            <Button onClick={() => setShowConfigModal(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configure Yield
            </Button>
          </div>

          <YieldConfigModal
            bomId={bomId}
            currentYield={null}
            isOpen={showConfigModal}
            onClose={() => setShowConfigModal(false)}
            onSave={() => {
              setShowConfigModal(false)
              refetch()
            }}
          />
        </CardContent>
      </Card>
    )
  }

  // Success State
  const theoreticalYield = yieldData.theoretical_yield_percent
  const expectedYield = yieldData.expected_yield_percent
  const actualYield = yieldData.actual_yield_avg
  const hasWarning = yieldData.variance_warning
  const variance = yieldData.variance_from_expected

  // Determine yield status color
  const getYieldColor = (yield_: number) => {
    if (yield_ >= 95) return 'bg-green-500'
    if (yield_ >= 85) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className={cn(hasWarning && 'border-orange-300', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Yield Analysis
            {hasWarning && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Variance Warning
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowConfigModal(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
        <CardDescription>
          Input: {yieldData.input_total_kg.toFixed(2)} kg | Output: {yieldData.output_qty_kg.toFixed(2)} kg
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Yield Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Theoretical Yield */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    Theoretical
                    <Info className="h-3 w-3" />
                  </p>
                  <p className="text-2xl font-bold">{theoreticalYield.toFixed(1)}%</p>
                  <Progress
                    value={theoreticalYield}
                    className={cn('h-2 mt-2', getYieldColor(theoreticalYield))}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Calculated from output/input ratio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Expected Yield */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    Expected
                    <Info className="h-3 w-3" />
                  </p>
                  <p className="text-2xl font-bold">
                    {expectedYield !== null ? `${expectedYield.toFixed(1)}%` : 'Not set'}
                  </p>
                  {expectedYield !== null && (
                    <Progress
                      value={expectedYield}
                      className="h-2 mt-2 bg-blue-200"
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configured expected yield target</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Actual Yield (from production) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'p-4 rounded-lg',
                  hasWarning ? 'bg-orange-50' : 'bg-green-50'
                )}>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    Actual (Avg)
                    <Info className="h-3 w-3" />
                  </p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {actualYield !== null ? `${actualYield.toFixed(1)}%` : 'No data'}
                    {variance !== null && variance !== 0 && (
                      <span className={cn(
                        'text-sm flex items-center',
                        variance > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {variance > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                      </span>
                    )}
                  </p>
                  {actualYield !== null && (
                    <Progress
                      value={actualYield}
                      className={cn('h-2 mt-2', getYieldColor(actualYield))}
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average yield from production runs (Phase 1)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Variance Warning Alert */}
        {hasWarning && variance !== null && (
          <Alert className="border-orange-300 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">Yield Variance Detected</AlertTitle>
            <AlertDescription className="text-orange-700">
              Actual yield ({actualYield?.toFixed(1)}%) deviates from expected yield ({expectedYield?.toFixed(1)}%)
              by {Math.abs(variance).toFixed(1)}%. This exceeds the configured threshold.
            </AlertDescription>
          </Alert>
        )}

        {/* Loss Factors (Phase 1 - placeholder) */}
        {yieldData.loss_factors.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Loss Factors</h4>
            <div className="space-y-2">
              {yieldData.loss_factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{factor.type}: {factor.description}</span>
                  <Badge variant="outline">{factor.loss_percent.toFixed(1)}%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Config Modal */}
      <YieldConfigModal
        bomId={bomId}
        currentYield={expectedYield}
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={() => {
          setShowConfigModal(false)
          refetch()
        }}
      />
    </Card>
  )
}

// ========================================
// Loading Skeleton
// ========================================

function YieldAnalysisPanelLoading({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default YieldAnalysisPanel
