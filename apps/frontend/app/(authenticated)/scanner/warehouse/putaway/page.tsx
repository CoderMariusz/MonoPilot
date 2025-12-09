/**
 * Scanner Warehouse Putaway Workflow
 * Putaway workflow for moving received items to storage locations
 * Flow: Select/Scan LP → View Suggestions → Scan Destination → Confirm
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRightLeft, Loader2, MapPin, Package, Lightbulb, ChevronLeft } from 'lucide-react'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'
import { WorkflowProgress } from '@/components/scanner/WorkflowProgress'
import { useToast } from '@/hooks/use-toast'

type WorkflowStep = 'list' | 'scan-lp' | 'scan-destination' | 'confirm' | 'complete'

interface LPData {
  id: string
  lp_number: string
  product_id: string
  product_name: string
  product_code: string
  quantity: number
  uom: string
  current_location: string
  current_location_id: string
  batch_number: string
}

interface LocationData {
  id: string
  code: string
  name: string
  warehouse_name: string
  type: string
}

interface SuggestedLocation extends LocationData {
  reason: 'same_product' | 'empty_slot'
  same_product_qty?: number
}

export default function ScannerPutawayPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<WorkflowStep>('list')
  const [loading, setLoading] = useState(false)
  const [pendingLPs, setPendingLPs] = useState<LPData[]>([])
  const [lpData, setLpData] = useState<LPData | null>(null)
  const [suggestedLocations, setSuggestedLocations] = useState<SuggestedLocation[]>([])
  const [destinationData, setDestinationData] = useState<LocationData | null>(null)

  const [feedback, setFeedback] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({ show: false, type: 'success', message: '' })

  const steps = [
    { id: 'scan-lp', label: 'Select LP', description: 'Select or scan LP' },
    { id: 'scan-destination', label: 'Scan Location', description: 'Scan destination' },
    { id: 'confirm', label: 'Confirm', description: 'Confirm putaway' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  // Load pending putaway LPs on mount
  useEffect(() => {
    if (step === 'list') {
      loadPendingLPs()
    }
  }, [step])

  // Load LPs in receiving locations
  const loadPendingLPs = async () => {
    setLoading(true)
    try {
      // Get LPs with status 'available' in receiving-type locations
      const response = await fetch('/api/warehouse/license-plates?status=available&limit=100')
      if (!response.ok) throw new Error('Failed to fetch LPs')

      const { data } = await response.json()

      // Filter for receiving locations (assuming location.type = 'receiving')
      const receivingLPs = (data || [])
        .filter((lp: any) => lp.location?.type === 'receiving')
        .map((lp: any) => ({
          id: lp.id,
          lp_number: lp.lp_number,
          product_id: lp.product_id,
          product_name: lp.product?.name || 'Unknown Product',
          product_code: lp.product?.code || '',
          quantity: lp.current_qty,
          uom: lp.product?.uom || 'EA',
          current_location: lp.location?.code || 'Unknown',
          current_location_id: lp.location_id,
          batch_number: lp.batch_number || '',
        }))

      setPendingLPs(receivingLPs)
    } catch (error) {
      console.error('Failed to load pending LPs:', error)
      toast({ title: 'Error', description: 'Failed to load pending LPs', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Select LP from list
  const handleSelectLP = async (lp: LPData) => {
    setLpData(lp)
    await loadSuggestedLocations(lp)
    setStep('scan-destination')
  }

  // Step 1: Scan LP
  const handleScanLP = useCallback(async (barcode: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/warehouse/license-plates?search=${encodeURIComponent(barcode)}&limit=1`)
      if (!response.ok) throw new Error('LP not found')

      const { data } = await response.json()
      const lp = data?.[0]

      if (!lp) {
        setFeedback({ show: true, type: 'error', message: 'LP Not Found' })
        return
      }

      // Check if LP is in receiving location
      if (lp.location?.type !== 'receiving') {
        setFeedback({ show: true, type: 'warning', message: 'LP not in receiving area' })
        return
      }

      const lpData: LPData = {
        id: lp.id,
        lp_number: lp.lp_number,
        product_id: lp.product_id,
        product_name: lp.product?.name || 'Unknown Product',
        product_code: lp.product?.code || '',
        quantity: lp.current_qty,
        uom: lp.product?.uom || 'EA',
        current_location: lp.location?.code || 'Unknown',
        current_location_id: lp.location_id,
        batch_number: lp.batch_number || '',
      }

      setLpData(lpData)
      setFeedback({ show: true, type: 'success', message: 'LP Loaded' })

      // Load suggested locations
      await loadSuggestedLocations(lpData)
      setStep('scan-destination')
    } catch (error) {
      console.error('LP scan error:', error)
      setFeedback({ show: true, type: 'error', message: 'Scan Failed' })
    } finally {
      setLoading(false)
    }
  }, [])

  // Load suggested storage locations
  const loadSuggestedLocations = async (lp: LPData) => {
    try {
      // Try to get suggested locations from API
      // For now, we'll fetch storage locations and build suggestions client-side
      const response = await fetch('/api/settings/locations?type=storage&is_active=true&limit=50')
      if (!response.ok) return

      const { data } = await response.json()
      const locations = data || []

      const suggestions: SuggestedLocation[] = []

      // Get LPs at each location to find same product
      for (const loc of locations) {
        try {
          const lpResponse = await fetch(
            `/api/warehouse/license-plates?location_id=${loc.id}&product_id=${lp.product_id}&status=available&limit=1`
          )
          if (lpResponse.ok) {
            const { data: lpsAtLocation } = await lpResponse.json()
            if (lpsAtLocation && lpsAtLocation.length > 0) {
              const totalQty = lpsAtLocation.reduce((sum: number, l: any) => sum + (l.current_qty || 0), 0)
              suggestions.push({
                id: loc.id,
                code: loc.code,
                name: loc.name || loc.code,
                warehouse_name: loc.warehouse?.name || 'Unknown Warehouse',
                type: loc.type || 'storage',
                reason: 'same_product',
                same_product_qty: totalQty,
              })
            }
          }
        } catch {
          // Skip this location
        }
      }

      // Add empty slots (top 3 storage locations without same product)
      const emptySlots = locations
        .filter((loc: any) => !suggestions.find((s) => s.id === loc.id))
        .slice(0, 3)
        .map((loc: any) => ({
          id: loc.id,
          code: loc.code,
          name: loc.name || loc.code,
          warehouse_name: loc.warehouse?.name || 'Unknown Warehouse',
          type: loc.type || 'storage',
          reason: 'empty_slot' as const,
        }))

      setSuggestedLocations([...suggestions.slice(0, 5), ...emptySlots])
    } catch (error) {
      console.error('Failed to load suggestions:', error)
      setSuggestedLocations([])
    }
  }

  // Step 2: Scan destination
  const handleScanDestination = useCallback(
    async (barcode: string) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/settings/locations?search=${encodeURIComponent(barcode)}&limit=1`)
        if (!response.ok) throw new Error('Location not found')

        const { data } = await response.json()
        const location = data?.[0]

        if (!location) {
          setFeedback({ show: true, type: 'error', message: 'Location Not Found' })
          return
        }

        // Validate destination is storage type
        if (location.type !== 'storage') {
          setFeedback({ show: true, type: 'warning', message: 'Must be storage location' })
          return
        }

        // Validate not moving to same location
        if (location.id === lpData?.current_location_id) {
          setFeedback({ show: true, type: 'warning', message: 'Same Location!' })
          return
        }

        if (!location.is_active) {
          setFeedback({ show: true, type: 'error', message: 'Location Inactive' })
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

  // Select suggested location
  const handleSelectSuggestion = (location: SuggestedLocation) => {
    setDestinationData(location)
    setFeedback({ show: true, type: 'success', message: 'Location Selected' })
    setStep('confirm')
  }

  // Step 3: Confirm and execute putaway
  const handleConfirmPutaway = async () => {
    if (!lpData || !destinationData) return

    setLoading(true)
    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpData.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_location_id: destinationData.id,
          notes: `Putaway from ${lpData.current_location} to ${destinationData.code}`,
        }),
      })

      if (!response.ok) throw new Error('Putaway failed')

      setFeedback({ show: true, type: 'success', message: 'Putaway Complete!' })
      toast({
        title: 'Success',
        description: `${lpData.lp_number} moved to ${destinationData.code}`,
      })
      setStep('complete')
    } catch (error) {
      console.error('Putaway error:', error)
      setFeedback({ show: true, type: 'error', message: 'Putaway Failed' })
      toast({ title: 'Error', description: 'Failed to complete putaway', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Reset workflow
  const handleReset = () => {
    setLpData(null)
    setDestinationData(null)
    setSuggestedLocations([])
    setStep('list')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-safe">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/scanner')}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Package className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold">Putaway</h1>
      </div>

      {/* Progress (hide on list step) */}
      {step !== 'list' && step !== 'complete' && (
        <div className="mb-4">
          <WorkflowProgress steps={steps} currentStep={currentStepIndex} />
        </div>
      )}

      {/* STEP: Pending List */}
      {step === 'list' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Putaway</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <div className="text-sm text-gray-500 mt-2">Loading...</div>
                </div>
              ) : pendingLPs.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <div>No items pending putaway</div>
                </div>
              ) : (
                pendingLPs.map((lp) => (
                  <Card
                    key={lp.id}
                    className="cursor-pointer hover:bg-blue-50 active:scale-95 transition-all border-2"
                    onClick={() => handleSelectLP(lp)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-mono font-bold text-lg">{lp.lp_number}</div>
                          <div className="text-sm text-gray-600">{lp.product_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {lp.quantity} {lp.uom}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {lp.current_location}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRightLeft className="h-6 w-6 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Or scan LP */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Or Scan LP Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <ScannerInput
                onSubmit={handleScanLP}
                loading={loading}
                placeholder="Scan LP barcode..."
                autoFocus={false}
              />
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full h-14" onClick={() => router.push('/scanner')}>
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Scanner
          </Button>
        </div>
      )}

      {/* STEP 1: Scan Destination */}
      {step === 'scan-destination' && lpData && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* LP Info */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="text-sm text-gray-500">Putting Away</div>
              <div className="text-xl font-bold font-mono">{lpData.lp_number}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{lpData.product_name}</div>
                  <div className="text-xs text-gray-500 font-mono">{lpData.product_code}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {lpData.quantity} {lpData.uom}
                  </div>
                </div>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {lpData.current_location}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Locations */}
          {suggestedLocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Suggested Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedLocations.map((loc) => (
                  <Card
                    key={loc.id}
                    className="cursor-pointer hover:bg-green-50 active:scale-95 transition-all border-2"
                    onClick={() => handleSelectSuggestion(loc)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold">{loc.code}</div>
                          <div className="text-xs text-gray-600">{loc.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {loc.reason === 'same_product' && (
                              <span className="text-blue-600">
                                Same product nearby ({loc.same_product_qty} {lpData.uom})
                              </span>
                            )}
                            {loc.reason === 'empty_slot' && <span className="text-gray-500">Empty slot</span>}
                          </div>
                        </div>
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Scan Destination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Scan Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScannerInput
                onSubmit={handleScanDestination}
                loading={loading}
                placeholder="Scan storage location..."
                autoFocus
              />

              <Button variant="outline" className="w-full" onClick={() => setStep('list')}>
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 2: Confirm */}
      {step === 'confirm' && lpData && destinationData && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Confirm Putaway</CardTitle>
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
                  {lpData.batch_number && (
                    <div className="text-xs text-gray-500 mt-1 font-mono">Batch: {lpData.batch_number}</div>
                  )}
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
                    <div className="text-xs text-gray-500 mt-1">Receiving</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-gray-500">To</div>
                    <div className="font-mono font-bold text-green-700">{destinationData.code}</div>
                    <div className="text-xs text-gray-500 mt-1">Storage</div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium">{destinationData.name}</div>
                  <div className="text-gray-600">{destinationData.warehouse_name}</div>
                </div>
              </div>

              <Button
                onClick={handleConfirmPutaway}
                disabled={loading}
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirm Putaway'}
              </Button>

              <Button variant="outline" className="w-full" onClick={() => setStep('scan-destination')}>
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Complete */}
      {step === 'complete' && lpData && destinationData && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <ArrowRightLeft className="h-20 w-20 text-green-500 mx-auto" />
              <div className="text-2xl font-bold text-green-600">Putaway Complete!</div>
              <div className="space-y-1">
                <div className="font-mono text-lg">{lpData.lp_number}</div>
                <div className="text-sm text-gray-600">
                  moved to <span className="font-bold">{destinationData.code}</span>
                </div>
                <div className="text-xs text-gray-500">{destinationData.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button variant="outline" className="h-14" onClick={() => router.push('/scanner')}>
                  Scanner Home
                </Button>
                <Button className="h-14 bg-blue-600" onClick={handleReset}>
                  Putaway Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
