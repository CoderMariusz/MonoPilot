/**
 * Material Availability Panel
 * Story 3.13: Material Availability Check
 * Shows material availability status during WO creation
 */

'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, AlertTriangle, XCircle, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MaterialAvailability {
  product_id: string
  product_code: string
  product_name: string
  required_qty: number
  available_qty: number
  uom: string
  status: 'green' | 'yellow' | 'red'
  coverage_percent: number
}

interface AvailabilitySummary {
  total: number
  green: number
  yellow: number
  red: number
}

interface MaterialAvailabilityPanelProps {
  bomId: string | null
  plannedQuantity: number
  onAvailabilityChange?: (hasWarnings: boolean) => void
}

export function MaterialAvailabilityPanel({
  bomId,
  plannedQuantity,
  onAvailabilityChange,
}: MaterialAvailabilityPanelProps) {
  const [materials, setMaterials] = useState<MaterialAvailability[]>([])
  const [summary, setSummary] = useState<AvailabilitySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAvailability() {
      if (!bomId || plannedQuantity <= 0) {
        setMaterials([])
        setSummary(null)
        onAvailabilityChange?.(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/planning/work-orders/availability-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bom_id: bomId,
            planned_quantity: plannedQuantity,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to check availability')
        }

        const result = await response.json()
        setMaterials(result.data?.materials || [])
        setSummary(result.data?.summary || null)

        // Notify parent if there are warnings
        const hasWarnings =
          (result.data?.summary?.yellow || 0) > 0 ||
          (result.data?.summary?.red || 0) > 0
        onAvailabilityChange?.(hasWarnings)
      } catch (err) {
        console.error('Availability check error:', err)
        setError('Unable to check availability')
        onAvailabilityChange?.(false)
      } finally {
        setLoading(false)
      }
    }

    // Debounce to avoid too many requests
    const timer = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timer)
  }, [bomId, plannedQuantity, onAvailabilityChange])

  if (!bomId) {
    return null
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking material availability...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-4 border-yellow-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary || materials.length === 0) {
    return null
  }

  const getStatusIcon = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'yellow':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'red':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>
      case 'yellow':
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
      case 'red':
        return <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Material Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Total:</span>
            <span className="font-medium">{summary.total}</span>
          </div>
          {summary.green > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>{summary.green}</span>
            </div>
          )}
          {summary.yellow > 0 && (
            <div className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{summary.yellow}</span>
            </div>
          )}
          {summary.red > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3 w-3" />
              <span>{summary.red}</span>
            </div>
          )}
        </div>

        {/* Material List (collapsed by default, show only warnings) */}
        {(summary.yellow > 0 || summary.red > 0) && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Material</th>
                  <th className="px-3 py-2 text-right">Required</th>
                  <th className="px-3 py-2 text-right">Available</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {materials
                  .filter((m) => m.status !== 'green')
                  .map((material) => (
                    <tr key={material.product_id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{material.product_name}</div>
                        <div className="text-xs text-gray-500">{material.product_code}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {material.required_qty.toLocaleString()} {material.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {material.available_qty.toLocaleString()} {material.uom}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(material.status)}
                          <span className="text-xs">{material.coverage_percent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Warning message */}
        {(summary.yellow > 0 || summary.red > 0) && (
          <div className="text-xs text-gray-500 italic">
            ⚠️ Some materials have low or no availability. You can still create the WO.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
