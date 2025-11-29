/**
 * Material Reservations Table Component
 * Story 4.7: Material Reservation (Desktop)
 * Displays WO materials with reservation status and progress
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import {
  Loader2,
  Plus,
  X,
  Package,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MaterialReservationModal } from './MaterialReservationModal'
import { UnreserveConfirmDialog } from './UnreserveConfirmDialog'

interface Reservation {
  id: string
  lp_id: string
  lp_number: string
  reserved_qty: number
  sequence_number: number
  status: string
  reserved_at: string
  reserved_by_user: {
    id: string
    name: string
  }
}

interface Material {
  id: string
  product_id: string
  material_name: string
  required_qty: number
  reserved_qty: number
  consumed_qty: number
  uom: string
  consume_whole_lp: boolean
  reservations: Reservation[]
}

interface MaterialReservationsTableProps {
  woId: string
  woStatus: string
}

export function MaterialReservationsTable({ woId, woStatus }: MaterialReservationsTableProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set())
  const [reserveModalOpen, setReserveModalOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [unreserveDialogOpen, setUnreserveDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<{
    reservation: Reservation
    material: Material
  } | null>(null)
  const { toast } = useToast()

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/production/work-orders/${woId}/materials`)

      if (!response.ok) {
        throw new Error('Failed to fetch materials')
      }

      const result = await response.json()
      setMaterials(result.data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast({
        title: 'Error',
        description: 'Failed to load materials',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [woId, toast])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  // Toggle expanded state for material
  const toggleExpanded = (materialId: string) => {
    setExpandedMaterials((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(materialId)) {
        newSet.delete(materialId)
      } else {
        newSet.add(materialId)
      }
      return newSet
    })
  }

  // Calculate progress percentage
  const getProgress = (material: Material) => {
    if (material.required_qty === 0) return 100
    return Math.min(100, (material.reserved_qty / material.required_qty) * 100)
  }

  // Get status badge
  const getStatusBadge = (material: Material) => {
    const progress = getProgress(material)
    if (progress >= 100) {
      return <Badge className="bg-green-100 text-green-800">Complete</Badge>
    } else if (progress > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>
  }

  // Format quantity
  const formatQty = (qty: number, uom: string) => {
    return `${qty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })} ${uom}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle reserve button click
  const handleReserve = (material: Material) => {
    setSelectedMaterial(material)
    setReserveModalOpen(true)
  }

  // Handle unreserve button click
  const handleUnreserve = (reservation: Reservation, material: Material) => {
    setSelectedReservation({ reservation, material })
    setUnreserveDialogOpen(true)
  }

  // Handle reservation success
  const handleReservationSuccess = () => {
    fetchMaterials()
    setReserveModalOpen(false)
    setSelectedMaterial(null)
  }

  // Handle unreserve success
  const handleUnreserveSuccess = () => {
    fetchMaterials()
    setUnreserveDialogOpen(false)
    setSelectedReservation(null)
  }

  // Check if reservation actions are allowed
  const canReserve = woStatus === 'in_progress'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading materials...</span>
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No materials found for this work order.</p>
        <p className="text-sm">Materials are copied from BOM when the WO is created.</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Status message if not in_progress */}
        {!canReserve && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            <span>
              Material reservation is only available when WO is in progress.
              Current status: <strong>{woStatus}</strong>
            </span>
          </div>
        )}

        {/* Materials Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="w-[150px]">Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const isExpanded = expandedMaterials.has(material.id)
                const progress = getProgress(material)
                const remaining = Math.max(0, material.required_qty - material.reserved_qty)

                return (
                  <>
                    {/* Material Row */}
                    <TableRow key={material.id} className="hover:bg-gray-50">
                      <TableCell>
                        {material.reservations.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleExpanded(material.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{material.material_name}</div>
                        {material.consume_whole_lp && (
                          <div className="text-xs text-orange-600">Whole LP required</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatQty(material.required_qty, material.uom)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatQty(material.reserved_qty, material.uom)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatQty(remaining, material.uom)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2" />
                          <span className="text-xs text-gray-500 w-10">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(material)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReserve(material)}
                                disabled={!canReserve || remaining <= 0}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Reserve
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {!canReserve
                                ? 'WO must be in_progress to reserve'
                                : remaining <= 0
                                  ? 'Material fully reserved'
                                  : 'Reserve LP for this material'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Reservations */}
                    {isExpanded && material.reservations.length > 0 && (
                      <TableRow key={`${material.id}-reservations`}>
                        <TableCell colSpan={8} className="bg-gray-50 p-0">
                          <div className="px-8 py-3">
                            <div className="text-sm font-medium text-gray-600 mb-2">
                              Reserved LPs (in sequence order):
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[60px]">Seq</TableHead>
                                  <TableHead>LP Number</TableHead>
                                  <TableHead className="text-right">Qty</TableHead>
                                  <TableHead>Reserved By</TableHead>
                                  <TableHead>Reserved At</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {material.reservations.map((reservation) => (
                                  <TableRow key={reservation.id}>
                                    <TableCell>
                                      <Badge variant="outline">#{reservation.sequence_number}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono">
                                      {reservation.lp_number}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {formatQty(reservation.reserved_qty, material.uom)}
                                    </TableCell>
                                    <TableCell>{reservation.reserved_by_user.name}</TableCell>
                                    <TableCell>{formatDate(reservation.reserved_at)}</TableCell>
                                    <TableCell className="text-right">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                            onClick={() => handleUnreserve(reservation, material)}
                                            disabled={!canReserve}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {canReserve ? 'Cancel reservation' : 'WO must be in_progress'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Reserve Modal */}
        {selectedMaterial && (
          <MaterialReservationModal
            open={reserveModalOpen}
            onOpenChange={setReserveModalOpen}
            woId={woId}
            material={selectedMaterial}
            onSuccess={handleReservationSuccess}
          />
        )}

        {/* Unreserve Confirmation Dialog */}
        {selectedReservation && (
          <UnreserveConfirmDialog
            open={unreserveDialogOpen}
            onOpenChange={setUnreserveDialogOpen}
            woId={woId}
            reservation={selectedReservation.reservation}
            materialName={selectedReservation.material.material_name}
            uom={selectedReservation.material.uom}
            onSuccess={handleUnreserveSuccess}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
