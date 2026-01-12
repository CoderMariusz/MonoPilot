/**
 * LP Merge Summary Component (Story 05.18)
 * Displays summary card with merged LP details
 *
 * Shows:
 * - Product name and code
 * - Total quantity with UoM
 * - Batch number
 * - Expiry date
 * - QA status
 * - LP count
 *
 * Per AC-16
 */

'use client'

import { Package, Calendar, Hash, Scale, Shield, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MergeSummary {
  productName: string
  productCode: string
  totalQuantity: number
  uom: string
  batchNumber: string | null
  expiryDate: string | null
  qaStatus: string
  lpCount: number
}

interface LPMergeSummaryProps {
  summary: MergeSummary | null | undefined
}

function getQAStatusBadge(status: string) {
  switch (status) {
    case 'passed':
      return <Badge variant="default" className="bg-green-100 text-green-800">passed</Badge>
    case 'pending':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">pending</Badge>
    case 'failed':
      return <Badge variant="destructive">failed</Badge>
    case 'quarantine':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800">quarantine</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function LPMergeSummary({ summary }: LPMergeSummaryProps) {
  if (!summary) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Merge Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Product */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            <span>Product</span>
          </div>
          <div className="text-right">
            <div className="font-medium">{summary.productName}</div>
            <div className="text-xs text-gray-500">{summary.productCode}</div>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Scale className="h-4 w-4" />
            <span>Total Quantity</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <span>{summary.totalQuantity}</span>
            <span className="text-gray-500">{summary.uom}</span>
          </div>
        </div>

        {/* Batch Number */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Hash className="h-4 w-4" />
            <span>Batch</span>
          </div>
          <span className="font-medium">
            {summary.batchNumber || 'N/A'}
          </span>
        </div>

        {/* Expiry Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Expiry</span>
          </div>
          <span className="font-medium">
            {summary.expiryDate || 'N/A'}
          </span>
        </div>

        {/* QA Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>QA Status</span>
          </div>
          {getQAStatusBadge(summary.qaStatus)}
        </div>

        {/* LP Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Layers className="h-4 w-4" />
            <span>LPs to Merge</span>
          </div>
          <span className="font-medium">{summary.lpCount}</span>
        </div>
      </CardContent>
    </Card>
  )
}
