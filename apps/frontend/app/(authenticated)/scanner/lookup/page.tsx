/**
 * Scanner Lookup Page
 * Universal barcode lookup - scan any barcode to identify entity
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Package, MapPin, Box, FileText, Loader2 } from 'lucide-react'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'

type EntityType = 'license_plate' | 'location' | 'product' | 'work_order' | 'pallet' | 'unknown'

interface LookupResult {
  type: EntityType
  id: string
  barcode: string
  data: any
}

export default function ScannerLookupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)

  const [feedback, setFeedback] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({ show: false, type: 'success', message: '' })

  const handleLookup = useCallback(async (barcode: string) => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/scanner/lookup?barcode=${encodeURIComponent(barcode)}`)

      if (!response.ok) {
        setFeedback({ show: true, type: 'error', message: 'Not Found' })
        return
      }

      const { data } = await response.json()

      setResult({
        type: data.type,
        id: data.id,
        barcode,
        data: data.details,
      })

      setFeedback({ show: true, type: 'success', message: 'Found!' })
    } catch (error) {
      console.error('Lookup error:', error)
      setFeedback({ show: true, type: 'error', message: 'Lookup Failed' })
    } finally {
      setLoading(false)
    }
  }, [])

  const getIcon = (type: EntityType) => {
    switch (type) {
      case 'license_plate':
        return <Package className="h-8 w-8" />
      case 'location':
        return <MapPin className="h-8 w-8" />
      case 'product':
        return <Box className="h-8 w-8" />
      case 'work_order':
        return <FileText className="h-8 w-8" />
      default:
        return <Search className="h-8 w-8" />
    }
  }

  const getTypeLabel = (type: EntityType) => {
    switch (type) {
      case 'license_plate':
        return 'License Plate'
      case 'location':
        return 'Location'
      case 'product':
        return 'Product'
      case 'work_order':
        return 'Work Order'
      case 'pallet':
        return 'Pallet'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            Universal Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScannerInput
            onSubmit={handleLookup}
            loading={loading}
            placeholder="Scan any barcode..."
            icon="search"
            autoFocus
          />
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <div className="mt-4 text-gray-600">Searching...</div>
          </CardContent>
        </Card>
      )}

      {/* Result - License Plate */}
      {result && result.type === 'license_plate' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getIcon(result.type)}
                License Plate
              </CardTitle>
              <Badge variant="default">Found</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-500">LP Number</div>
              <div className="text-2xl font-bold font-mono">{result.data.lp_number}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Product</div>
                <div className="font-medium text-sm truncate">{result.data.product_name}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Quantity</div>
                <div className="font-mono font-bold">
                  {result.data.quantity} {result.data.uom}
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Location</div>
              <div className="font-mono">{result.data.location_code || 'Unknown'}</div>
            </div>

            {result.data.status && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Status</div>
                <Badge variant="outline">{result.data.status}</Badge>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => router.push(`/warehouse/license-plates/${result.id}`)}
              >
                View Details
              </Button>
              <Button className="h-12" onClick={() => setResult(null)}>
                Scan Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result - Location */}
      {result && result.type === 'location' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getIcon(result.type)}
                Location
              </CardTitle>
              <Badge variant="default">Found</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-500">Location Code</div>
              <div className="text-2xl font-bold font-mono">{result.data.code}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Warehouse</div>
                <div className="font-medium text-sm">{result.data.warehouse_name}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Type</div>
                <Badge variant="outline">{result.data.type}</Badge>
              </div>
            </div>

            {result.data.zone && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Zone</div>
                <div className="font-medium">{result.data.zone}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => router.push(`/settings/locations/${result.id}`)}
              >
                View Details
              </Button>
              <Button className="h-12" onClick={() => setResult(null)}>
                Scan Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result - Product */}
      {result && result.type === 'product' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getIcon(result.type)}
                Product
              </CardTitle>
              <Badge variant="default">Found</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-500">Product Name</div>
              <div className="text-xl font-bold">{result.data.name}</div>
              <div className="text-sm text-gray-600 font-mono">{result.data.code}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Type</div>
                <Badge variant="outline">{result.data.type}</Badge>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">UOM</div>
                <div className="font-mono font-bold">{result.data.uom}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => router.push(`/technical/products/${result.id}`)}
              >
                View Details
              </Button>
              <Button className="h-12" onClick={() => setResult(null)}>
                Scan Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result - Work Order */}
      {result && result.type === 'work_order' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getIcon(result.type)}
                Work Order
              </CardTitle>
              <Badge variant="default">Found</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-500">WO Number</div>
              <div className="text-2xl font-bold font-mono">{result.data.wo_number}</div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Product</div>
              <div className="font-medium">{result.data.product_name}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-xs text-gray-500">Planned</div>
                <div className="font-mono font-bold">{result.data.planned_qty}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-xs text-gray-500">Produced</div>
                <div className="font-mono font-bold">{result.data.output_qty}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-xs text-gray-500">Status</div>
                <Badge variant="outline" className="text-xs">
                  {result.data.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => router.push(`/planning/work-orders/${result.id}`)}
              >
                View Details
              </Button>
              <Button className="h-12" onClick={() => setResult(null)}>
                Scan Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generic Result */}
      {result && !['license_plate', 'location', 'product', 'work_order'].includes(result.type) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getIcon(result.type)}
                {getTypeLabel(result.type)}
              </CardTitle>
              <Badge variant="default">Found</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Barcode</div>
              <div className="text-xl font-mono font-bold">{result.barcode}</div>
            </div>

            <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(result.data, null, 2)}
            </pre>

            <Button className="w-full h-12" onClick={() => setResult(null)}>
              Scan Another
            </Button>
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
