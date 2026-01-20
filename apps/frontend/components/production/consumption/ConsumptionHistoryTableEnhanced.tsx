/**
 * Consumption History Table (Enhanced) - Story 04.6a
 * Displays consumption history with reversal capability
 *
 * Wireframe: PROD-003 - Consumption History section
 *
 * Features:
 * - LP number, material, qty, timestamp, user
 * - Batch and expiry info
 * - Status badge (Active/Reversed)
 * - 'Full LP' indicator
 * - [Rev] button for managers only
 * - Pagination
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { History, Undo2, AlertTriangle, FileDown, AlertCircle } from 'lucide-react'
import { ReverseConsumptionModal } from './ReverseConsumptionModal'
import type { Consumption } from '@/lib/services/consumption-service'

interface ConsumptionHistoryTableEnhancedProps {
  woId: string
  consumptions: Consumption[]
  isLoading?: boolean
  canReverse: boolean
  onRefresh?: () => void
}

export function ConsumptionHistoryTableEnhanced({
  woId,
  consumptions,
  isLoading,
  canReverse,
  onRefresh,
}: ConsumptionHistoryTableEnhancedProps) {
  const [reverseModalOpen, setReverseModalOpen] = useState(false)
  const [selectedConsumption, setSelectedConsumption] = useState<Consumption | null>(null)

  // Get display values from joined data
  const getLpNumber = (c: Consumption): string => {
    if (!c.license_plates) return 'Unknown'
    if (Array.isArray(c.license_plates)) {
      return (c.license_plates as { lp_number: string }[])[0]?.lp_number || 'Unknown'
    }
    return c.license_plates.lp_number
  }

  const getMaterialName = (c: Consumption): string => {
    if (!c.wo_materials) return 'Unknown'
    if (Array.isArray(c.wo_materials)) {
      return (c.wo_materials as { material_name: string }[])[0]?.material_name || 'Unknown'
    }
    return c.wo_materials.material_name
  }

  const getUserName = (c: Consumption): string => {
    if (!c.consumed_by_user) return 'Unknown'
    if (Array.isArray(c.consumed_by_user)) {
      const user = (c.consumed_by_user as { first_name: string; last_name: string }[])[0]
      return user ? `${user.first_name} ${user.last_name}` : 'Unknown'
    }
    return `${c.consumed_by_user.first_name} ${c.consumed_by_user.last_name}`
  }

  const getBatchNumber = (c: Consumption): string | null => {
    if (!c.license_plates) return null
    if (Array.isArray(c.license_plates)) {
      return (c.license_plates as { batch_number?: string }[])[0]?.batch_number || null
    }
    return c.license_plates.batch_number || null
  }

  const getExpiryDate = (c: Consumption): string | null => {
    if (!c.license_plates) return null
    if (Array.isArray(c.license_plates)) {
      return (c.license_plates as { expiry_date?: string }[])[0]?.expiry_date || null
    }
    return c.license_plates.expiry_date || null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`
    return `${diffDays}d ago`
  }

  const formatQty = (qty: number, uom: string) =>
    `${qty.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${uom}`

  // Handle reverse action
  const handleReverse = (consumption: Consumption) => {
    setSelectedConsumption(consumption)
    setReverseModalOpen(true)
  }

  const handleReverseSuccess = () => {
    setReverseModalOpen(false)
    setSelectedConsumption(null)
    onRefresh?.()
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="consumption-history-table-loading">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(6)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (consumptions.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-testid="consumption-history-empty"
      >
        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No consumptions recorded yet</p>
        <p className="text-sm">
          Consumption records will appear here after materials are consumed
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4" data-testid="consumption-history-table">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Consumption History (Recent)
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Permission notice */}
        {!canReverse && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Only Managers and Admins can reverse consumptions.</span>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LP Number</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Consumed At</TableHead>
                <TableHead>Consumed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumptions.map((c) => {
                const isReversed = c.status === 'reversed'
                const lpNumber = getLpNumber(c)
                const materialName = getMaterialName(c)
                const userName = getUserName(c)
                const batchNumber = getBatchNumber(c)
                const expiryDate = getExpiryDate(c)

                return (
                  <TableRow
                    key={c.id}
                    className={isReversed ? 'bg-gray-50 opacity-75' : ''}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <span
                          className={`font-mono ${isReversed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {lpNumber}
                        </span>
                        {batchNumber && (
                          <div className="text-xs text-muted-foreground">
                            Batch: {batchNumber}
                          </div>
                        )}
                        {expiryDate && (
                          <div className="text-xs text-muted-foreground">
                            Expiry:{' '}
                            {new Date(expiryDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={isReversed ? 'line-through text-muted-foreground' : ''}>
                        {materialName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono ${isReversed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {formatQty(c.consumed_qty, c.uom)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{formatRelativeTime(c.consumed_at)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(c.consumed_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{userName}</TableCell>
                    <TableCell>
                      {isReversed ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="outline"
                              className="bg-orange-50 text-orange-700 border-orange-200"
                              data-testid="consumption-status"
                            >
                              Reversed
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p>
                                Reversed: {c.reversed_at ? formatDate(c.reversed_at) : 'N/A'}
                              </p>
                              <p>Reason: {c.reverse_reason || 'No reason provided'}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isReversed && canReverse && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                              onClick={() => handleReverse(c)}
                              data-testid="reverse-consumption"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reverse this consumption</TooltipContent>
                        </Tooltip>
                      )}
                      {isReversed && (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Reversed on {c.reversed_at ? formatDate(c.reversed_at) : 'N/A'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {consumptions.length} consumptions
        </div>

        {/* Reverse Modal */}
        <ReverseConsumptionModal
          woId={woId}
          consumption={selectedConsumption}
          open={reverseModalOpen}
          onClose={() => {
            setReverseModalOpen(false)
            setSelectedConsumption(null)
          }}
          onSuccess={handleReverseSuccess}
        />
      </div>
    </TooltipProvider>
  )
}
