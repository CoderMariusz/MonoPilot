// Custom LP Node Component for Genealogy Tree (Story 2.21)
import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { LicensePlate } from '@/lib/types/traceability'

export interface LPNodeData {
  lp: LicensePlate
  product_code: string
  product_name: string
  relationship_type?: 'split' | 'combine' | 'transform' | null
}

function LPNodeComponent({ data }: NodeProps<LPNodeData>) {
  const { lp, product_code, product_name } = data

  // Status-based styling
  const statusColors = {
    available: 'border-green-500 bg-green-50',
    consumed: 'border-blue-500 bg-blue-50',
    shipped: 'border-gray-500 bg-gray-50',
    quarantine: 'border-orange-500 bg-orange-50',
    recalled: 'border-red-500 bg-red-50'
  }

  const statusIcons = {
    available: '✅',
    consumed: '🔵',
    shipped: '📦',
    quarantine: '⚠️',
    recalled: '❌'
  }

  const colorClass = statusColors[lp.status] || 'border-gray-300 bg-white'
  const icon = statusIcons[lp.status] || '•'

  // Check if expiry is within 60 days or past
  const showExpiry = lp.expiry_date ? isExpiryNear(lp.expiry_date) : false

  return (
    <div
      className={`
        relative px-3 py-2.5 rounded-lg border-2 shadow-md bg-white min-w-[200px] max-w-[250px]
        ${colorClass}
        hover:shadow-lg transition-shadow
      `}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />

      {/* Status Icon */}
      <div className="absolute top-1 left-1 text-sm">{icon}</div>

      {/* LP Number */}
      <div className="font-bold text-base mt-3 mb-1">{lp.lp_number}</div>

      {/* Product Code */}
      <div className="font-medium text-sm text-gray-700">{product_code}</div>

      {/* Product Name */}
      <div className="text-xs text-gray-600 truncate mb-2" title={product_name}>
        {product_name}
      </div>

      {/* Quantity */}
      <div className="font-medium text-sm text-gray-800">
        {lp.quantity.toFixed(2)} {lp.uom}
      </div>

      {/* Batch Number */}
      {lp.batch_number && (
        <div className="text-xs text-gray-500">Batch: {lp.batch_number}</div>
      )}

      {/* Expiry Date (conditional) */}
      {showExpiry && (
        <div className="text-xs text-red-600 font-medium">
          Exp: {formatDate(lp.expiry_date!)}
        </div>
      )}

      {/* Location */}
      {lp.location_id && (
        <div className="text-xs text-gray-500 mt-1">📍 {lp.location_id}</div>
      )}
    </div>
  )
}

// Helper functions
function isExpiryNear(expiryDate: string): boolean {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry <= 60 // Show if within 60 days or past
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Memoized export (performance optimization)
export const LPNode = memo(LPNodeComponent)
