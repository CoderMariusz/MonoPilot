/**
 * Pallet Detail Page
 * Epic 5 Batch 05B-2: Pallets (Stories 5.19-5.22)
 * AC-5.20: View pallet with all LPs
 * AC-5.20: Add/Remove LPs from pallet
 * AC-5.21: Move pallet to new location
 * AC-5.22: Change pallet status (open/close)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PalletStatusBadge } from '@/components/warehouse/PalletStatusBadge'
import { AddLPToPalletModal } from '@/components/warehouse/AddLPToPalletModal'
import { MovePalletModal } from '@/components/warehouse/MovePalletModal'
import { LPStatusBadge } from '@/components/warehouse/LPStatusBadge'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Package,
  Plus,
  MapPin,
  Lock,
  LockOpen,
  MoreVertical,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

interface LicensePlate {
  id: string
  lp_number: string
  product_id: string
  current_qty: number
  uom: string
  batch_number?: string
  expiry_date?: string
  product?: {
    id: string
    code: string
    name: string
  }
}

interface PalletLP {
  id: string
  added_at: string
  license_plate: LicensePlate
}

interface Pallet {
  id: string
  pallet_number: string
  status: 'open' | 'closed' | 'shipped' | 'received'
  warehouse_id: string
  warehouse?: {
    id: string
    code: string
    name: string
  }
  location_id?: string
  location?: {
    id: string
    code: string
    name: string
  }
  notes?: string
  created_at: string
  pallet_lps: PalletLP[]
}

export default function PalletDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const palletId = params.id as string

  const [pallet, setPallet] = useState<Pallet | null>(null)
  const [loading, setLoading] = useState(true)

  const [showAddLPModal, setShowAddLPModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)

  const fetchPallet = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/warehouse/pallets/${palletId}`)
      if (!response.ok) throw new Error('Failed to fetch pallet')

      const { data } = await response.json()
      setPallet(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load pallet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [palletId, toast])

  useEffect(() => {
    fetchPallet()
  }, [fetchPallet])

  const handleStatusChange = async (newStatus: 'open' | 'closed') => {
    if (!pallet) return

    try {
      const response = await fetch(`/api/warehouse/pallets/${palletId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: pallet.location_id,
          notes: pallet.notes,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      toast({
        title: 'Success',
        description: `Pallet ${newStatus === 'open' ? 'opened' : 'closed'} successfully`,
      })

      fetchPallet()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveLP = async (palletLPId: string, lpNumber: string) => {
    if (!pallet || pallet.status !== 'open') {
      toast({
        title: 'Error',
        description: 'Can only remove LPs from open pallets',
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Remove LP ${lpNumber} from pallet?`)) return

    try {
      const response = await fetch(`/api/warehouse/pallets/${palletId}/lps/${palletLPId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove LP')
      }

      toast({
        title: 'Success',
        description: `LP ${lpNumber} removed from pallet`,
      })

      fetchPallet()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove LP',
        variant: 'destructive',
      })
    }
  }

  const handleAddSuccess = () => {
    setShowAddLPModal(false)
    fetchPallet()
  }

  const handleMoveSuccess = () => {
    setShowMoveModal(false)
    fetchPallet()
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!pallet) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Pallet not found</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{pallet.pallet_number}</h1>
              <PalletStatusBadge status={pallet.status} />
            </div>
            <p className="text-muted-foreground text-sm">
              Created {format(new Date(pallet.created_at), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {pallet.status === 'open' && (
            <>
              <Button variant="outline" onClick={() => setShowMoveModal(true)}>
                <MapPin className="h-4 w-4 mr-2" />
                Move
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange('closed')}>
                <Lock className="h-4 w-4 mr-2" />
                Close
              </Button>
            </>
          )}
          {pallet.status === 'closed' && (
            <Button variant="outline" onClick={() => handleStatusChange('open')}>
              <LockOpen className="h-4 w-4 mr-2" />
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Warehouse</p>
          <p className="text-lg font-medium">{pallet.warehouse?.code}</p>
          <p className="text-sm text-muted-foreground">{pallet.warehouse?.name}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Location</p>
          {pallet.location ? (
            <>
              <p className="text-lg font-medium">{pallet.location.code}</p>
              <p className="text-sm text-muted-foreground">{pallet.location.name}</p>
            </>
          ) : (
            <p className="text-lg text-muted-foreground">Not assigned</p>
          )}
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">License Plates</p>
          <p className="text-2xl font-bold">{pallet.pallet_lps?.length || 0}</p>
        </div>
      </div>

      {/* Notes */}
      {pallet.notes && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <p className="text-sm font-medium mb-1">Notes</p>
          <p className="text-sm text-muted-foreground">{pallet.notes}</p>
        </div>
      )}

      {/* LPs Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            License Plates ({pallet.pallet_lps?.length || 0})
          </h2>
          {pallet.status === 'open' && (
            <Button onClick={() => setShowAddLPModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add LP
            </Button>
          )}
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LP Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!pallet.pallet_lps || pallet.pallet_lps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No license plates on this pallet
                  </TableCell>
                </TableRow>
              ) : (
                pallet.pallet_lps.map((palletLP) => (
                  <TableRow key={palletLP.id}>
                    <TableCell className="font-mono font-medium">
                      {palletLP.license_plate.lp_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{palletLP.license_plate.product?.code}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {palletLP.license_plate.product?.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{palletLP.license_plate.batch_number || '-'}</TableCell>
                    <TableCell className="text-right">
                      {palletLP.license_plate.current_qty} {palletLP.license_plate.uom}
                    </TableCell>
                    <TableCell>
                      {palletLP.license_plate.expiry_date ? (
                        <div className="flex items-center gap-2">
                          {isExpired(palletLP.license_plate.expiry_date) && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={
                              isExpired(palletLP.license_plate.expiry_date)
                                ? 'text-red-600 font-medium'
                                : ''
                            }
                          >
                            {format(new Date(palletLP.license_plate.expiry_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(palletLP.added_at), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>
                      {pallet.status === 'open' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                handleRemoveLP(palletLP.id, palletLP.license_plate.lp_number)
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Pallet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      <AddLPToPalletModal
        open={showAddLPModal}
        palletId={palletId}
        onClose={() => setShowAddLPModal(false)}
        onSuccess={handleAddSuccess}
      />

      <MovePalletModal
        open={showMoveModal}
        palletId={palletId}
        currentLocationId={pallet.location_id}
        warehouseId={pallet.warehouse_id}
        lpCount={pallet.pallet_lps?.length || 0}
        onClose={() => setShowMoveModal(false)}
        onSuccess={handleMoveSuccess}
      />
    </div>
  )
}
