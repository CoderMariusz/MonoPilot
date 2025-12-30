'use client'

/**
 * CostDriversPanel Component (Story 02.15)
 * Top 5 cost drivers (ingredients with highest cost impact)
 */

import { useState } from 'react'
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
import { CostTrendIndicator } from './CostTrendIndicator'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { CostDriver } from '@/lib/types/cost-history'

export interface CostDriversPanelProps {
  /** Array of cost drivers */
  drivers: CostDriver[]
  /** The ingredient with biggest impact */
  biggestDriver: CostDriver | null
}

export function CostDriversPanel({
  drivers,
  biggestDriver,
}: CostDriversPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  // Show top 5 by default, all when expanded
  const displayedDrivers = isExpanded ? drivers : drivers.slice(0, 5)
  const hasMore = drivers.length > 5

  if (drivers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Top Cost Drivers (Material)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No cost driver data available.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Top Cost Drivers (Material)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Biggest driver summary */}
        {biggestDriver && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  Biggest Driver: {biggestDriver.ingredient_name}
                </p>
                <p className="text-sm text-amber-700">
                  {biggestDriver.change_amount > 0 ? '+' : ''}
                  {formatCurrency(biggestDriver.change_amount)}, accounts for{' '}
                  {biggestDriver.impact_percent.toFixed(0)}% of total increase
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Drivers table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Ingredient</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">3mo Ago</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedDrivers.map((driver) => (
                <TableRow key={driver.ingredient_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{driver.ingredient_name}</p>
                      <p className="text-xs text-gray-500">
                        {driver.ingredient_code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(driver.current_cost)}
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {formatCurrency(driver.historical_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>
                        {driver.change_amount > 0 ? '+' : ''}
                        {formatCurrency(driver.change_amount)}
                      </span>
                      <CostTrendIndicator
                        value={driver.change_percent}
                        showValue
                        size="sm"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        driver.impact_percent > 0
                          ? 'text-red-600'
                          : driver.impact_percent < 0
                            ? 'text-green-600'
                            : 'text-gray-600'
                      }
                    >
                      {driver.impact_percent > 0 ? '+' : ''}
                      {driver.impact_percent.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Expand/Collapse button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show All ({drivers.length} ingredients)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
