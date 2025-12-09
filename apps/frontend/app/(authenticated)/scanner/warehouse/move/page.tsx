/**
 * Scanner Warehouse Move LP Workflow
 * Story 5.14: LP Location Move (Scanner)
 *
 * Flow: Scan LP → Show LP Details → Scan Destination → Confirm Move
 *
 * Validation:
 * - Cannot move to same location
 * - Destination must be valid storage location
 * - LP must not be reserved/blocked
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRightLeft, Loader2, MapPin, Package } from 'lucide-react'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'
import { WorkflowProgress } from '@/components/scanner/WorkflowProgress'
import { useToast } from '@/hooks/use-toast'

type WorkflowStep = 'scan-lp' | 'scan-destination' | 'confirm' | 'complete'

interface LPData {
  id: string
  lp_number: string
  product_name: string
  quantity: number
  uom: string
  current_location: string
  current_location_id: string
  status?: string
}

interface LocationData {
  id: string
  code: string
  name: string
  warehouse_name: string
  type: string
}

export default function ScannerWarehouseMovePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<WorkflowStep>('scan-lp')
  const [loading, setLoading] = useState(false)
  const [lpData, setLpData] = useState<LPData | null>(null)
  const [destinationData, setDestinationData] = useState<LocationData | null>(null)

  const [feedback, setFeedback] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({ show: false, type: 'success', message: '' })

  const steps = [
    { id: 'scan-lp', label: 'Scan LP', description: 'Scan license plate' },
    { id: 'scan-destination', label: 'Scan Location', description: 'Scan destination' },
    { id: 'confirm', label: 'Confirm', description: 'Confirm move' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  // Step 1: Scan LP
  const handleScanLP = useCallback(async (barcode: string) => {
    setLoading(true)
    try {
      // Use scanner lookup API
      const response = await fetch(`/api/scanner/lookup?barcode=${encodeURIComponent(barcode)}`)

      if (!response.ok) {
        setFeedback({ show: true, type: 'error', message: 'LP Not Found' })
        return
      }

      const data = await response.json()

      if (data.type !== 'license_plate') {
        setFeedback({ show: true, type: 'error', message: 'Invalid barcode type' })
        return
      }

      const lp = data.data

      // Validate LP status
      if (lp.status === 'reserved') {
        setFeedback({ show: true, type: 'warning', message: 'LP is reserved!' })
        return
      }

      if (lp.status === 'blocked') {
        setFeedback({ show: true, type: 'error', message: 'LP is blocked!' })
        return
      }

      setLpData({
        id: lp.id,
        lp_number: lp.lp_number,
        product_name: lp.product?.name || 'Unknown Product',
        quantity: lp.current_qty || lp.quantity,
        uom: lp.product?.uom || 'EA',
        current_location: lp.location?.code || 'Unknown',
        current_location_id: lp.location_id,
        status: lp.status,
      })

      setFeedback({ show: true, type: 'success', message: 'LP Loaded' })
      setStep('scan-destination')
    } catch (error) {
      console.error('LP scan error:', error)
      setFeedback({ show: true, type: 'error', message: 'Scan Failed' })
    } finally {
      setLoading(false)
    }
  }, [])

  // Step 2: Scan destination
  const handleScanDestination = useCallback(
    async (barcode: string) => {
      setLoading(true)
      try {
        // Use scanner lookup API
        const response = await fetch(`/api/scanner/lookup?barcode=${encodeURIComponent(barcode)}`)

        if (!response.ok) {
          setFeedback({ show: true, type: 'error', message: 'Location Not Found' })
          return
        }

        const data = await response.json()

        if (data.type !== 'location') {
          setFeedback({ show: true, type: 'error', message: 'Invalid barcode type' })
          return
        }

        const location = data.data

        // Validate not moving to same location
        if (location.id === lpData?.current_location_id) {
          setFeedback({ show: true, type: 'warning', message: 'Same Location!' })
          return
        }

        // Validate destination is storage location
        if (location.type && !['storage', 'staging', 'buffer'].includes(location.type)) {
          setFeedback({ show: true, type: 'warning', message: 'Invalid destination type' })
          return
        }

        setDestinationData({
          id: location.id,
          code: location.code,
          name: location.name || location.code,
          warehouse_name: location.warehouse?.name || 'Unknown Warehouse',
          type: location.type || 'storage',
        })

        setFeedback({ show: true, type: 'success', message: 'Location OK' })
        setStep('confirm')
      } catch (error) {
        console.error('Location scan error:', error)
        setFeedback({ show: true, type: 'error', message: 'Scan Failed' })
      } finally {
        setLoading(false)
      }
    },
    [lpData]
  )

  // Step 3: Confirm and execute move
  const handleConfirmMove = async () => {
    if (!lpData || !destinationData) return

    setLoading(true)
    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpData.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_location_id: destinationData.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Move failed')
      }

      setFeedback({ show: true, type: 'success', message: 'Move Complete!' })
      toast({
        title: 'Success',
        description: `${lpData.lp_number} moved to ${destinationData.code}`,
      })
      setStep('complete')
    } catch (error) {
      console.error('Move error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Move Failed'
      setFeedback({ show: true, type: 'error', message: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  // Reset workflow
  const handleReset = () => {
    setLpData(null)
    setDestinationData(null)
    setStep('scan-lp')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <WorkflowProgress steps={steps} currentStep={currentStepIndex} />

      {/* STEP 1: Scan LP */}
      {step === 'scan-lp' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Scan License Plate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScannerInput
              onSubmit={handleScanLP}
              loading={loading}
              placeholder="Scan LP barcode..."
              autoFocus
            />
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Scan Destination */}
      {step === 'scan-destination' && lpData && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="text-sm text-gray-500">Moving LP</div>
              <div className="text-xl font-bold font-mono">{lpData.lp_number}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{lpData.product_name}</div>
                  <div className="text-sm text-gray-600">
                    {lpData.quantity} {lpData.uom}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {lpData.current_location}
                  </Badge>
                  {lpData.status && lpData.status !== 'available' && (
                    <Badge variant="secondary" className="text-xs">
                      {lpData.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Scan Destination Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScannerInput
                onSubmit={handleScanDestination}
                loading={loading}
                placeholder="Scan location barcode..."
                autoFocus
              />

              <Button variant="outline" className="w-full" onClick={() => setStep('scan-lp')}>
                Back to LP Scan
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Confirm */}
      {step === 'confirm' && lpData && destinationData && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Move</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* LP Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-500">License Plate</div>
                <div className="text-lg font-bold font-mono">{lpData.lp_number}</div>
                <div className="text-sm text-gray-600">
                  {lpData.product_name} • {lpData.quantity} {lpData.uom}
                </div>
              </div>

              {/* Move Arrow */}
              <div className="flex items-center justify-center">
                <ArrowRightLeft className="h-8 w-8 text-gray-400" />
              </div>

              {/* From → To */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <div className="text-xs text-gray-500">From</div>
                  <div className="font-mono font-bold">{lpData.current_location}</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-gray-500">To</div>
                  <div className="font-mono font-bold text-green-700">{destinationData.code}</div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium">{destinationData.name}</div>
                <div className="text-gray-600">{destinationData.warehouse_name}</div>
                <div className="text-xs text-gray-500 mt-1">Type: {destinationData.type}</div>
              </div>
            </div>

            <Button
              onClick={handleConfirmMove}
              disabled={loading}
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirm Move'}
            </Button>

            <Button variant="outline" className="w-full" onClick={() => setStep('scan-destination')}>
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Complete */}
      {step === 'complete' && lpData && destinationData && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <ArrowRightLeft className="h-20 w-20 text-green-500 mx-auto" />
            <div className="text-2xl font-bold text-green-600">Move Complete!</div>
            <div className="space-y-1">
              <div className="font-mono text-lg">{lpData.lp_number}</div>
              <div className="text-sm text-gray-600">
                moved to <span className="font-bold">{destinationData.code}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button variant="outline" className="h-14" onClick={() => router.push('/scanner')}>
                Scanner Home
              </Button>
              <Button className="h-14 bg-blue-600" onClick={handleReset}>
                Move Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      <ScannerFeedback
        show={feedback.show}
        type={feedback.type}
        message={feedback.message}
        onHide={() => setFeedback({ ...feedback, show: false })}
      />
    </div>
  )
}
