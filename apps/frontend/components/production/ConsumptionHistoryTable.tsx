/**
 * Consumption History Table Component
 * Story 4.10: Consumption Correction
 * Displays consumption records with reverse functionality (AC-4.10.8)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Loader2, Undo2, History, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ReverseConsumptionDialog } from './ReverseConsumptionDialog'

interface Consumption {
  id: string
  material_id: string
  reservation_id: string
  lp_id: string
  consumed_qty: number
  uom: string
  consumed_at: string
  status: string
  reverse_reason: string | null
  reversed_at: string | null
  wo_materials?: { material_name: string; product_id: string } | null
  license_plates?: { lp_number: string } | null
  consumed_by_user?: { first_name: string; last_name: string; email: string } | null
}

interface ConsumptionHistoryTableProps {
  woId: string
  woStatus: string
}

export function ConsumptionHistoryTable({ woId, woStatus }: ConsumptionHistoryTableProps) {
  const [consumptions, setConsumptions] = useState<Consumption[]>([])
  const [loading, setLoading] = useState(true)
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false)
  const [selectedConsumption, setSelectedConsumption] = useState<Consumption | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const { toast } = useToast()

  // Fetch user role on mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.user?.role || '')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }
    fetchUserRole()
  }, [])

  const fetchConsumptions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/production/work-orders/${woId}/consume`)

      if (!response.ok) {
        throw new Error('Failed to fetch consumptions')
      }

      const result = await response.json()
      setConsumptions(result.consumptions || [])
    } catch (error) {
      console.error('Error fetching consumptions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load consumption history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [woId, toast])

  useEffect(() => {
    fetchConsumptions()
  }, [fetchConsumptions])

  // Check if user can reverse consumptions (Manager/Admin only - AC-4.10.4)
  const canReverse = ['admin', 'manager'].includes(userRole.toLowerCase()) && woStatus === 'in_progress'

  // Format quantity
  const formatQty = (qty: number, uom: string) => {
    return `${qty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })} ${uom}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get material name from joined data
  const getMaterialName = (consumption: Consumption): string => {
    if (!consumption.wo_materials) return 'Unknown'
    if (Array.isArray(consumption.wo_materials)) {
      return (consumption.wo_materials as { material_name: string }[])[0]?.material_name || 'Unknown'
    }
    return consumption.wo_materials.material_name
  }

  // Get LP number from joined data
  const getLpNumber = (consumption: Consumption): string => {
    if (!consumption.license_plates) return 'Unknown'
    if (Array.isArray(consumption.license_plates)) {
      return (consumption.license_plates as { lp_number: string }[])[0]?.lp_number || 'Unknown'
    }
    return consumption.license_plates.lp_number
  }

  // Get user name from joined data
  const getUserName = (consumption: Consumption): string => {
    if (!consumption.consumed_by_user) return 'Unknown'
    if (Array.isArray(consumption.consumed_by_user)) {
      const user = (consumption.consumed_by_user as { first_name: string; last_name: string }[])[0]
      return user ? `${user.first_name} ${user.last_name}` : 'Unknown'
    }
    return `${consumption.consumed_by_user.first_name} ${consumption.consumed_by_user.last_name}`
  }

  // Handle reverse button click
  const handleReverse = (consumption: Consumption) => {
    setSelectedConsumption(consumption)
    setReverseDialogOpen(true)
  }

  // Handle reverse success
  const handleReverseSuccess = () => {
    fetchConsumptions()
    setReverseDialogOpen(false)
    setSelectedConsumption(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading consumption history...</span>
      </div>
    )
  }

  if (consumptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No consumption records yet.</p>
        <p className="text-sm">Consumption records will appear here after materials are consumed.</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Permission notice */}
        {!canReverse && userRole && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>
              Only Managers and Admins can reverse consumptions.
            </span>
          </div>
        )}

        {/* Consumption Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>LP Number</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Consumed By</TableHead>
                <TableHead>Consumed At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumptions.map((consumption) => {
                const isReversed = consumption.status === 'reversed'

                return (
                  <TableRow
                    key={consumption.id}
                    className={isReversed ? 'bg-gray-50 opacity-75' : ''}
                  >
                    <TableCell>
                      <span className={isReversed ? 'line-through text-gray-500' : ''}>
                        {getMaterialName(consumption)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">
                      <span className={isReversed ? 'line-through text-gray-500' : ''}>
                        {getLpNumber(consumption)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={isReversed ? 'line-through text-gray-500' : ''}>
                        {formatQty(consumption.consumed_qty, consumption.uom)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getUserName(consumption)}
                    </TableCell>
                    <TableCell>
                      {formatDate(consumption.consumed_at)}
                    </TableCell>
                    <TableCell>
                      {isReversed ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="bg-orange-100 text-orange-800">
                              Reversed
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p>Reversed: {consumption.reversed_at ? formatDate(consumption.reversed_at) : 'N/A'}</p>
                              <p>Reason: {consumption.reverse_reason || 'No reason provided'}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          Consumed
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
                              onClick={() => handleReverse(consumption)}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Reverse
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Reverse this consumption (restores LP quantity)
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isReversed && (
                        <span className="text-sm text-gray-500">
                          Reversed on {consumption.reversed_at ? formatDate(consumption.reversed_at) : 'N/A'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Reverse Confirmation Dialog */}
        {selectedConsumption && (
          <ReverseConsumptionDialog
            open={reverseDialogOpen}
            onOpenChange={setReverseDialogOpen}
            woId={woId}
            consumption={{
              id: selectedConsumption.id,
              lp_number: getLpNumber(selectedConsumption),
              consumed_qty: selectedConsumption.consumed_qty,
              uom: selectedConsumption.uom,
              material_name: getMaterialName(selectedConsumption),
              consumed_at: selectedConsumption.consumed_at,
            }}
            onSuccess={handleReverseSuccess}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
