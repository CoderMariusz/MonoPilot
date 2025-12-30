'use client'

/**
 * ComponentBreakdownTable Component (Story 02.15)
 * Table showing current vs historical cost breakdown
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CostTrendIndicator } from './CostTrendIndicator'
import { cn } from '@/lib/utils'
import type { ComponentBreakdownData } from '@/lib/types/cost-history'

export interface ComponentBreakdownTableProps {
  /** Component breakdown data */
  breakdown: ComponentBreakdownData
  /** Comparison period */
  comparisonPeriod: '1mo' | '3mo' | '6mo' | '1yr'
  /** Handler for period change */
  onPeriodChange: (period: '1mo' | '3mo' | '6mo' | '1yr') => void
}

const periodLabels: Record<string, string> = {
  '1mo': '1 Month Ago',
  '3mo': '3 Months Ago',
  '6mo': '6 Months Ago',
  '1yr': '1 Year Ago',
}

export function ComponentBreakdownTable({
  breakdown,
  comparisonPeriod,
  onPeriodChange,
}: ComponentBreakdownTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const calculatePercentOfTotal = (value: number, total: number) => {
    if (total === 0) return 0
    return (value / total) * 100
  }

  const getRowHighlight = (changePercent: number) => {
    if (changePercent > 5) return 'bg-red-50'
    if (changePercent < -5) return 'bg-green-50'
    return ''
  }

  const components = [
    {
      name: 'Material Cost',
      current: breakdown.current.material,
      historical: breakdown.historical.material,
      change: breakdown.changes.material,
      key: 'material',
    },
    {
      name: 'Labor Cost',
      current: breakdown.current.labor,
      historical: breakdown.historical.labor,
      change: breakdown.changes.labor,
      key: 'labor',
    },
    {
      name: 'Overhead Cost',
      current: breakdown.current.overhead,
      historical: breakdown.historical.overhead,
      change: breakdown.changes.overhead,
      key: 'overhead',
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Cost Component Breakdown
        </CardTitle>
        <Select value={comparisonPeriod} onValueChange={onPeriodChange as (value: string) => void}>
          <SelectTrigger className="w-[180px]" aria-label="Select comparison period">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1mo">1 Month Ago</SelectItem>
            <SelectItem value="3mo">3 Months Ago</SelectItem>
            <SelectItem value="6mo">6 Months Ago</SelectItem>
            <SelectItem value="1yr">1 Year Ago</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Component</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">{periodLabels[comparisonPeriod]}</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow
                  key={component.key}
                  className={cn(getRowHighlight(component.change.percent))}
                >
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(component.current)}
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {formatCurrency(component.historical)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>
                        {component.change.amount > 0 ? '+' : ''}
                        {formatCurrency(component.change.amount)}
                      </span>
                      <CostTrendIndicator
                        value={component.change.percent}
                        showValue
                        size="sm"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {calculatePercentOfTotal(
                      component.current,
                      breakdown.current.total
                    ).toFixed(1)}
                    %
                  </TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="font-bold border-t-2">
                <TableCell>Total Cost</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(breakdown.current.total)}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatCurrency(breakdown.historical.total)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>
                      {breakdown.changes.total.amount > 0 ? '+' : ''}
                      {formatCurrency(breakdown.changes.total.amount)}
                    </span>
                    <CostTrendIndicator
                      value={breakdown.changes.total.percent}
                      showValue
                      size="sm"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">100.0%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-50 border border-red-200" />
            <span>Increase greater than 5%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-50 border border-green-200" />
            <span>Decrease greater than 5%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
