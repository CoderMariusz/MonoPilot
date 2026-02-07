/**
 * Step 1: Select PO Component (Story 05.19)
 * Purpose: Select PO source via list or scan
 * BUG-083: Added search/filter on PO list by PO number and supplier
 */

'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { LargeTouchButton } from '../shared/LargeTouchButton'
import { Loader2, ScanLine, Package, Search, X } from 'lucide-react'
import type { PendingReceiptSummary } from '@/lib/validation/scanner-receive'

interface Step1SelectPOProps {
  pendingPOs: PendingReceiptSummary[]
  isLoading?: boolean
  error?: string
  onPOSelected: (poId: string) => void
  onScanBarcode?: () => void
}

export function Step1SelectPO({
  pendingPOs,
  isLoading,
  error,
  onPOSelected,
  onScanBarcode,
}: Step1SelectPOProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter POs by search query (PO number or supplier name)
  const filteredPOs = useMemo(() => {
    if (!searchQuery.trim()) return pendingPOs
    
    const query = searchQuery.toLowerCase().trim()
    return pendingPOs.filter(
      (po) =>
        po.po_number.toLowerCase().includes(query) ||
        po.supplier_name.toLowerCase().includes(query)
    )
  }, [pendingPOs, searchQuery])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-2 text-gray-600">Loading pending orders...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 text-center">{error}</p>
        <LargeTouchButton variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </LargeTouchButton>
      </div>
    )
  }

  // Empty state
  if (pendingPOs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Package className="h-16 w-16 text-gray-400" />
        <p className="mt-4 text-gray-600 text-center">No pending orders to receive</p>
        {onScanBarcode && (
          <LargeTouchButton variant="primary" className="mt-6" onClick={onScanBarcode}>
            <ScanLine className="h-5 w-5 mr-2" />
            Scan PO Barcode
          </LargeTouchButton>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Search Bar */}
      <div className="p-4 pb-2 bg-white border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PO number or supplier..."
            className={cn(
              'w-full h-12 pl-10 pr-10 rounded-lg border border-gray-200',
              'bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              'text-base placeholder:text-gray-400 transition-colors outline-none'
            )}
            data-testid="po-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-500">
            {filteredPOs.length} of {pendingPOs.length} orders
          </p>
        )}
      </div>

      {/* PO List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredPOs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500 text-center">
              No orders match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-blue-600 text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredPOs.map((po) => (
            <button
              key={po.id}
              onClick={() => onPOSelected(po.id)}
              className={cn(
                'w-full min-h-[64px] p-4 rounded-lg border border-gray-200',
                'bg-white hover:bg-gray-50 active:bg-gray-100',
                'flex flex-col items-start text-left transition-colors'
              )}
              data-testid="po-list-item"
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">{po.po_number}</span>
                <span className="text-sm text-gray-500">
                  {po.lines_pending}/{po.lines_total} lines
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">{po.supplier_name}</div>
              <div className="mt-1 flex justify-between items-center w-full text-sm">
                <span className="text-gray-500">Expected: {po.expected_date}</span>
                <span className="text-blue-600 font-medium">
                  {po.total_qty_received}/{po.total_qty_ordered}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-200 bg-white space-y-3 safe-area-bottom">
        {onScanBarcode && (
          <LargeTouchButton size="full" variant="primary" onClick={onScanBarcode}>
            <ScanLine className="h-5 w-5 mr-2" />
            Scan PO Barcode
          </LargeTouchButton>
        )}
      </div>
    </div>
  )
}

export default Step1SelectPO
