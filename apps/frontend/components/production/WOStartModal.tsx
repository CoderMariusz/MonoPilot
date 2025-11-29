'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle } from 'lucide-react'
import type { WOStartModalData } from '@/lib/services/wo-start-service'

interface WOStartModalProps {
  woId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (woData: any) => void
}

export default function WOStartModal({ woId, open, onOpenChange, onSuccess }: WOStartModalProps) {
  const [woData, setWoData] = useState<WOStartModalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load WO data when modal opens
  useEffect(() => {
    if (!open || !woId) return

    const fetchWOData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/production/work-orders/${woId}/modal-data`)
        if (!response.ok) {
          throw new Error('Failed to load WO data')
        }
        const { data } = await response.json()
        setWoData(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load WO data'
        setError(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWOData()
  }, [open, woId, toast])

  const handleConfirmStart = async () => {
    if (!woData) return

    setConfirming(true)
    setError(null)

    try {
      const response = await fetch(`/api/production/work-orders/${woId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const { message, error: errorCode } = await response.json()
        throw new Error(message || errorCode || 'Failed to start WO')
      }

      const { data } = await response.json()

      toast({
        title: 'Success',
        description: 'Work order started successfully',
      })

      // Auto-close after 1 second for feedback
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.(data)
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start WO'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {woData ? `Start Work Order: ${woData.wo_number}` : 'Loading...'}
          </DialogTitle>
          <DialogDescription>
            Confirm production start and review material availability
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : error && !woData ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : woData ? (
          <div className="space-y-4">
            {/* WO Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Work Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">WO Number:</span>
                    <p className="font-medium">{woData.wo_number}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <p className="font-medium">{woData.product_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <p className="font-medium">
                      {woData.planned_qty} {woData.uom}
                    </p>
                  </div>
                  {woData.scheduled_date && (
                    <div>
                      <span className="text-gray-600">Scheduled Date:</span>
                      <p className="font-medium">{new Date(woData.scheduled_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Line & Machine */}
            {woData.line_name && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Production Line</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div>
                    <span className="text-gray-600">Assigned Line/Machine:</span>
                    <p className="font-medium">{woData.line_name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Material Availability */}
            {woData.materials && woData.materials.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Material Availability</CardTitle>
                  <CardDescription>
                    Check available inventory for required materials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {woData.materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{material.material_name}</p>
                        <p className="text-xs text-gray-600">
                          Need: {material.required_qty} {material.uom} / Have:{' '}
                          {material.available_qty.toFixed(2)} {material.uom}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">{material.available_pct.toFixed(0)}%</p>
                        </div>
                        {material.has_shortage && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            ⚠️
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-600 italic mt-2">
                    ℹ️ Material shortages are shown for reference only. Production can proceed.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmStart}
            disabled={confirming || !woData || !!error}
            className="gap-2"
          >
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              'Confirm Start'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
