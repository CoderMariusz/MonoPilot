/**
 * Split LP Preview Component (Story 05.17)
 * Shows preview of split result before confirmation
 *
 * Displays:
 * - Source LP remaining quantity
 * - New LP quantity and inherited properties
 * - Genealogy record preview
 *
 * Per WH-008 wireframe
 */

'use client'

import { ArrowRight, GitBranch, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LPInfo {
  lp_number: string
  quantity: number
  uom: string
  batch_number: string | null
  expiry_date: string | null
  qa_status: string
  location_name: string
  product_name: string
  product_code: string
}

interface SplitLPPreviewProps {
  sourceLp: LPInfo
  splitQty: number
  destinationLocationName?: string
  newLpNumber?: string
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

function getQAStatusBadge(status: string) {
  switch (status) {
    case 'passed':
      return <Badge variant="default" className="bg-green-100 text-green-800">Passed</Badge>
    case 'pending':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
    case 'quarantine':
      return <Badge variant="outline" className="bg-orange-100 text-orange-800">Quarantine</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function SplitLPPreview({
  sourceLp,
  splitQty,
  destinationLocationName,
  newLpNumber = 'Auto-generated',
}: SplitLPPreviewProps) {
  const remainingQty = sourceLp.quantity - splitQty
  const targetLocation = destinationLocationName || sourceLp.location_name

  // Only show preview if split quantity is valid
  if (splitQty <= 0 || splitQty >= sourceLp.quantity) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" />
          Split Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          After split, you will have:
        </p>

        {/* Source LP */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="font-semibold text-sm">Source LP: {sourceLp.lp_number}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Original Qty:</span>{' '}
              <span className="line-through text-gray-400">{sourceLp.quantity} {sourceLp.uom}</span>
            </div>
            <div>
              <span className="text-gray-500">Remaining:</span>{' '}
              <span className="font-medium text-green-600">{remainingQty.toFixed(2)} {sourceLp.uom}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Location:</span>{' '}
              <span className="font-medium">{sourceLp.location_name}</span>
              <span className="text-gray-400 ml-1">(unchanged)</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </div>

        {/* New LP */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-800/50">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-sm text-blue-800 dark:text-blue-200">
              New LP: {newLpNumber}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Quantity:</span>{' '}
              <span className="font-medium text-blue-600">{splitQty.toFixed(2)} {sourceLp.uom}</span>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>{' '}
              <span className="font-medium">{targetLocation}</span>
            </div>
            <div>
              <span className="text-gray-500">Batch:</span>{' '}
              <span className="font-medium">{sourceLp.batch_number || 'N/A'}</span>
              <span className="text-gray-400 ml-1">(inherited)</span>
            </div>
            <div>
              <span className="text-gray-500">Expiry:</span>{' '}
              <span className="font-medium">{formatDate(sourceLp.expiry_date)}</span>
              <span className="text-gray-400 ml-1">(inherited)</span>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-gray-500">QA Status:</span>
              {getQAStatusBadge(sourceLp.qa_status)}
              <span className="text-gray-400">(inherited)</span>
            </div>
          </div>
        </div>

        {/* Genealogy Record */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-700 dark:bg-purple-800/50">
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="h-4 w-4 text-purple-600" />
            <span className="text-purple-800 dark:text-purple-200">
              <strong>Genealogy Record:</strong> Parent LP {sourceLp.lp_number} {'->'} Child LP {newLpNumber}
            </span>
          </div>
          <p className="text-xs text-purple-600 mt-1">
            Full traceability maintained
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
