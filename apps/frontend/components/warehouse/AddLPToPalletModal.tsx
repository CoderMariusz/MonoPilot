/**
 * Add LP to Pallet Modal Component
 * Story 5.20: Pallet LP Management
 * Modal for adding license plates to pallets
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Search, Package } from 'lucide-react'

interface AddLPToPalletModalProps {
  open: boolean
  palletId: string
  onClose: () => void
  onSuccess: () => void
}

interface LicensePlate {
  id: string
  lp_number: string
  product?: {
    code: string
    name: string
  }
  current_qty: number
  uom: string
  batch_number?: string
  status: string
}

export function AddLPToPalletModal({ open, palletId, onClose, onSuccess }: AddLPToPalletModalProps) {
  const { toast } = useToast()

  const [lpNumber, setLpNumber] = useState('')
  const [selectedLP, setSelectedLP] = useState<LicensePlate | null>(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLpNumber('')
      setSelectedLP(null)
    }
  }, [open])

  const handleSearch = async () => {
    if (!lpNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an LP number',
        variant: 'destructive',
      })
      return
    }

    try {
      setSearching(true)

      const response = await fetch(
        `/api/warehouse/license-plates?search=${encodeURIComponent(lpNumber)}&limit=1`
      )
      if (!response.ok) throw new Error('Failed to search LP')

      const data = await response.json()

      if (!data.data || data.data.length === 0) {
        toast({
          title: 'Not Found',
          description: 'License plate not found',
          variant: 'destructive',
        })
        setSelectedLP(null)
        return
      }

      const lp = data.data[0]

      // Validation
      if (lp.status !== 'available') {
        toast({
          title: 'Invalid LP',
          description: `License plate is not available (status: ${lp.status})`,
          variant: 'destructive',
        })
        setSelectedLP(null)
        return
      }

      if (lp.current_qty <= 0) {
        toast({
          title: 'Invalid LP',
          description: 'License plate has zero quantity',
          variant: 'destructive',
        })
        setSelectedLP(null)
        return
      }

      setSelectedLP(lp)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search license plate',
        variant: 'destructive',
      })
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedLP) {
      toast({
        title: 'Validation Error',
        description: 'Please search and select an LP first',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/warehouse/pallets/${palletId}/lps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: selectedLP.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add LP to pallet')
      }

      toast({
        title: 'Success',
        description: `LP ${selectedLP.lp_number} added to pallet`,
      })

      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add LP to pallet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !selectedLP) {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add License Plate to Pallet</DialogTitle>
          <DialogDescription>Scan or enter LP number to add to this pallet</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* LP Search */}
          <div className="space-y-2">
            <Label htmlFor="lp-number">
              LP Number <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="lp-number"
                value={lpNumber}
                onChange={(e) => setLpNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scan or enter LP number..."
                disabled={searching || !!selectedLP}
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearch}
                disabled={searching || !!selectedLP}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected LP Details */}
          {selectedLP && (
            <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                License Plate Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">LP Number:</p>
                  <p className="font-mono font-medium">{selectedLP.lp_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity:</p>
                  <p className="font-medium">
                    {selectedLP.current_qty} {selectedLP.uom}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Product:</p>
                  <p className="font-medium">{selectedLP.product?.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Batch:</p>
                  <p>{selectedLP.batch_number || '-'}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedLP(null)
                  setLpNumber('')
                }}
              >
                Clear & Search Another
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedLP}>
              {loading ? 'Adding...' : 'Add to Pallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
