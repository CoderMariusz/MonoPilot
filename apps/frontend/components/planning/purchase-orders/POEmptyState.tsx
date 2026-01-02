/**
 * PO Empty State Component
 * Story 03.3: PO CRUD + Lines
 * Empty state display per PLAN-004
 */

'use client'

import { ShoppingCart, Upload, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface POEmptyStateProps {
  onCreateClick?: () => void
  onImportClick?: () => void
  onSuppliersClick?: () => void
  className?: string
}

export function POEmptyState({
  onCreateClick,
  onImportClick,
  onSuppliersClick,
  className,
}: POEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="mb-6 rounded-full bg-blue-50 p-4">
        <ShoppingCart className="h-12 w-12 text-blue-600" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No Purchase Orders Yet
      </h3>

      {/* Description */}
      <p className="text-gray-500 max-w-md mb-8">
        Create your first purchase order to start managing procurement.
        You can also bulk import from Excel.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button
          size="lg"
          onClick={onCreateClick}
          className="gap-2"
        >
          <ShoppingCart className="h-5 w-5" />
          Create First Purchase Order
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onImportClick}
          className="gap-2"
        >
          <Upload className="h-5 w-5" />
          Import from Excel
        </Button>
      </div>

      {/* Tip */}
      <div className="bg-gray-50 rounded-lg p-4 max-w-md">
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Quick Tip:</span> Set up your suppliers first
          in the Suppliers section to enable default pricing and lead times.
        </p>
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto text-blue-600 hover:text-blue-700"
          onClick={onSuppliersClick}
        >
          Go to Suppliers Setup
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default POEmptyState
