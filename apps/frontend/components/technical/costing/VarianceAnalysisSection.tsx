'use client'

/**
 * VarianceAnalysisSection Component (Story 02.15)
 * Standard vs Actual variance comparison
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CostTrendIndicator } from './CostTrendIndicator'
import { AlertTriangle, ExternalLink, FileBarChart } from 'lucide-react'
import type { VarianceReportResponse } from '@/lib/types/variance'

export interface VarianceAnalysisSectionProps {
  /** Variance report data (null if no data) */
  variance: VarianceReportResponse | null
  /** Current period in days */
  period: number
  /** Handler for period change */
  onPeriodChange: (days: number) => void
  /** Handler for viewing detailed report */
  onViewDetailedReport?: () => void
  /** Loading state */
  isLoading?: boolean
}

export function VarianceAnalysisSection({
  variance,
  period,
  onPeriodChange,
  onViewDetailedReport,
  isLoading,
}: VarianceAnalysisSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const hasVarianceData = variance?.components !== null && variance?.work_orders_analyzed > 0

  // Show empty state if no work orders
  if (!variance || (!hasVarianceData && !isLoading)) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Variance Analysis (Standard vs Actual)
          </CardTitle>
          <Select
            value={String(period)}
            onValueChange={(value) => onPeriodChange(Number(value))}
          >
            <SelectTrigger className="w-[150px]" aria-label="Select period">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileBarChart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No variance data available yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Run production to compare standard vs actual costs.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const components = variance.components!

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Variance Analysis (Standard vs Actual)
        </CardTitle>
        <Select
          value={String(period)}
          onValueChange={(value) => onPeriodChange(Number(value))}
        >
          <SelectTrigger className="w-[150px]" aria-label="Select period">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Period: Last {period} Days</span>
          <span className="text-gray-300">|</span>
          <span>Work Orders Analyzed: {variance.work_orders_analyzed}</span>
        </div>

        {/* Variance table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Component</TableHead>
                <TableHead className="text-right">Standard</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">% Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Material Cost</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(components.material.standard)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(components.material.actual)}
                </TableCell>
                <TableCell className="text-right">
                  {components.material.variance > 0 ? '+' : ''}
                  {formatCurrency(components.material.variance)}
                </TableCell>
                <TableCell className="text-right">
                  <CostTrendIndicator
                    value={components.material.variance_percent}
                    showValue
                    size="sm"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Labor Cost</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(components.labor.standard)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(components.labor.actual)}
                </TableCell>
                <TableCell className="text-right">
                  {components.labor.variance > 0 ? '+' : ''}
                  {formatCurrency(components.labor.variance)}
                </TableCell>
                <TableCell className="text-right">
                  <CostTrendIndicator
                    value={components.labor.variance_percent}
                    showValue
                    size="sm"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Overhead Cost</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(components.overhead.standard)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(components.overhead.actual)}
                </TableCell>
                <TableCell className="text-right">
                  {components.overhead.variance > 0 ? '+' : ''}
                  {formatCurrency(components.overhead.variance)}
                </TableCell>
                <TableCell className="text-right">
                  <CostTrendIndicator
                    value={components.overhead.variance_percent}
                    showValue
                    size="sm"
                  />
                </TableCell>
              </TableRow>
              {/* Total row */}
              <TableRow className="font-bold border-t-2">
                <TableCell>Total Cost</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(components.total.standard)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(components.total.actual)}
                </TableCell>
                <TableCell className="text-right">
                  {components.total.variance > 0 ? '+' : ''}
                  {formatCurrency(components.total.variance)}
                </TableCell>
                <TableCell className="text-right">
                  <CostTrendIndicator
                    value={components.total.variance_percent}
                    showValue
                    size="sm"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Significant variance warnings */}
        {variance.significant_variances.length > 0 && (
          <div className="space-y-2">
            {variance.significant_variances.map((sv, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                role="alert"
              >
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-amber-800">
                  Significant variance in{' '}
                  <span className="font-medium capitalize">{sv.component} Cost</span> (
                  {sv.direction === 'over' ? '+' : ''}
                  {sv.variance_percent.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* View detailed report button */}
        {onViewDetailedReport && (
          <Button
            variant="outline"
            onClick={onViewDetailedReport}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Detailed Variance Report
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
