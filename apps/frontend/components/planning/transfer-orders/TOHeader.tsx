/**
 * TO Header Component
 * Story 03.8: Transfer Orders CRUD + Lines
 * Displays transfer order summary header with info cards
 */

'use client'

import { Calendar, Warehouse, User, FileText, ArrowRight } from 'lucide-react'
import { TOStatusBadge } from './TOStatusBadge'
import { TOPriorityBadge } from './TOPriorityBadge'
import type { TransferOrderWithLines } from '@/lib/types/transfer-order'

interface TOHeaderProps {
  transferOrder: TransferOrderWithLines
}

export function TOHeader({ transferOrder }: TOHeaderProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  }

  // Calculate shipped/received progress
  const totalRequested = transferOrder.lines?.reduce(
    (sum, line) => sum + line.quantity,
    0
  ) || 0
  const totalShipped = transferOrder.lines?.reduce(
    (sum, line) => sum + (line.shipped_qty || 0),
    0
  ) || 0
  const totalReceived = transferOrder.lines?.reduce(
    (sum, line) => sum + (line.received_qty || 0),
    0
  ) || 0
  const shippedPercent = totalRequested > 0
    ? Math.round((totalShipped / totalRequested) * 100)
    : 0

  return (
    <div className="border rounded-lg bg-white">
      {/* Main Header */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {transferOrder.to_number}
              </h1>
              <TOStatusBadge status={transferOrder.status} size="lg" />
            </div>
            {transferOrder.created_by_user && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <User className="h-4 w-4" />
                Created by {transferOrder.created_by_user.first_name}{' '}
                {transferOrder.created_by_user.last_name} on{' '}
                {formatDate(transferOrder.created_at)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <TOPriorityBadge priority={transferOrder.priority} size="lg" />
            {shippedPercent > 0 && shippedPercent < 100 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{shippedPercent}%</span> shipped
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
        {/* From Warehouse */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Warehouse className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                From Warehouse
              </p>
              <p className="font-medium text-gray-900 truncate">
                {transferOrder.from_warehouse?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500">
                {transferOrder.from_warehouse?.code}
              </p>
            </div>
          </div>
        </div>

        {/* To Warehouse */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Warehouse className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                To Warehouse
              </p>
              <p className="font-medium text-gray-900 truncate">
                {transferOrder.to_warehouse?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500">
                {transferOrder.to_warehouse?.code}
              </p>
            </div>
          </div>
        </div>

        {/* Planned Ship Date */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Planned Ship
              </p>
              <p className="font-medium text-gray-900">
                {formatDate(transferOrder.planned_ship_date)}
              </p>
              <p className="text-sm text-gray-500">
                {getRelativeDate(transferOrder.planned_ship_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Planned Receive Date */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Planned Receive
              </p>
              <p className="font-medium text-gray-900">
                {formatDate(transferOrder.planned_receive_date)}
              </p>
              <p className="text-sm text-gray-500">
                {getRelativeDate(transferOrder.planned_receive_date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {transferOrder.notes && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-gray-700">{transferOrder.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actual Dates (if shipped/received) */}
      {(transferOrder.actual_ship_date || transferOrder.actual_receive_date) && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex flex-wrap gap-6">
            {transferOrder.actual_ship_date && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Actual Ship Date
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Actual Ship Date: {transferOrder.actual_ship_date}
                </p>
              </div>
            )}
            {transferOrder.actual_receive_date && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Actual Receive Date
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Actual Receive Date: {transferOrder.actual_receive_date}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TOHeader
