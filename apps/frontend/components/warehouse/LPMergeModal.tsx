/**
 * LP Merge Modal Component
 * Story 5.6: LP Merge
 * AC-5.6.1: Merge multiple LPs (same product, same location)
 * AC-5.6.2: Show earliest expiry warning
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle, Calendar } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'

interface LicensePlate {
  id: string
  lp_number: string
  product_id: string
  product?: {
    code: string
    name: string
    uom: string
  }
  location_id: string
  location?: {
    code: string
  }
  current_qty: number
  expiry_date?: string
  status: string
}

interface LPMergeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (newLP: string) => void
}

export function LPMergeModal({ open, onClose, onSuccess }: LPMergeModalProps) {
  const [availableLPs, setAvailableLPs] = useState<LicensePlate[]>([])
  const [selectedLPIds, setSelectedLPIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Fetch available LPs for merging
  useEffect(() => {
    if (!open) return

    const fetchAvailableLPs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/warehouse/license-plates?status=available&limit=100')
        if (!response.ok) throw new Error('Failed to fetch license plates')

        const data = await response.json()
        setAvailableLPs(data.data || [])
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load available license plates',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableLPs()
  }, [open, toast])

  const handleToggleLP = (lpId: string) => {
    setSelectedLPIds((prev) =>
      prev.includes(lpId) ? prev.filter((id) => id !== lpId) : [...prev, lpId]
    )
  }

  const selectedLPs = availableLPs.filter((lp) => selectedLPIds.includes(lp.id))

  // Group by product+location for validation
  const canMerge = () => {
    if (selectedLPs.length < 2) return false

    const firstLP = selectedLPs[0]
    return selectedLPs.every(
      (lp) => lp.product_id === firstLP.product_id && lp.location_id === firstLP.location_id
    )
  }

  const getTotalQuantity = () => {
    return selectedLPs.reduce((sum, lp) => sum + lp.current_qty, 0)
  }

  const getEarliestExpiry = () => {
    const expiries = selectedLPs
      .filter((lp) => lp.expiry_date)
      .map((lp) => new Date(lp.expiry_date!))

    if (expiries.length === 0) return null
    return new Date(Math.min(...expiries.map((d) => d.getTime())))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canMerge()) {
      toast({
        title: 'Validation Error',
        description: 'Selected LPs must have same product and location',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/warehouse/license-plates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_ids: selectedLPIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to merge license plates')
      }

      const data = await response.json()

      toast({
        title: 'Success',
        description: `Merged into ${data.new_lp_number}`,
      })

      onSuccess(data.new_lp_number)
      handleClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedLPIds([])
    onClose()
  }

  const earliestExpiry = getEarliestExpiry()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge License Plates</DialogTitle>
          <DialogDescription>
            Select license plates to merge (must be same product and location)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Available LPs */}
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {availableLPs.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No available license plates found
                  </div>
                ) : (
                  <div className="divide-y">
                    {availableLPs.map((lp) => (
                      <div
                        key={lp.id}
                        className="p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleToggleLP(lp.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedLPIds.includes(lp.id)}
                            onCheckedChange={() => handleToggleLP(lp.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-mono font-medium">{lp.lp_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {lp.product?.code} - {lp.product?.name}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {lp.current_qty} {lp.product?.uom}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {lp.location?.code}
                                </p>
                              </div>
                            </div>
                            {lp.expiry_date && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires: {format(new Date(lp.expiry_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selection Summary */}
              {selectedLPs.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected LPs:</span>
                    <span className="font-bold">{selectedLPs.length}</span>
                  </div>
                  {selectedLPs.length > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Product:</span>
                        <span className="font-medium">{selectedLPs[0].product?.code}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{selectedLPs[0].location?.code}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Quantity:</span>
                        <span className="font-bold">
                          {getTotalQuantity().toFixed(3)} {selectedLPs[0].product?.uom}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Expiry Warning */}
              {earliestExpiry && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Merged LP will use earliest expiry date: {format(earliestExpiry, 'PPP')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Validation Errors */}
              {selectedLPs.length >= 2 && !canMerge() && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    All selected LPs must have the same product and location
                  </AlertDescription>
                </Alert>
              )}

              {selectedLPs.length === 1 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Select at least 2 license plates to merge</AlertDescription>
                </Alert>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canMerge() || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Merge {selectedLPs.length > 0 && `(${selectedLPs.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
