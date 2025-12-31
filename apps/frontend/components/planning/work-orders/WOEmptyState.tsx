/**
 * WO Empty State Component
 * Story 03.10: Work Order CRUD
 * Empty state illustration per PLAN-013
 */

'use client'

import { FileText, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WOEmptyStateProps {
  type: 'no_data' | 'filtered_empty'
  onCreateClick?: () => void
  onClearFilters?: () => void
  activeFilters?: string[]
  className?: string
}

export function WOEmptyState({
  type,
  onCreateClick,
  onClearFilters,
  activeFilters = [],
  className,
}: WOEmptyStateProps) {
  if (type === 'filtered_empty') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-16 px-4 text-center',
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Work Orders Match Your Filters
        </h3>
        <p className="text-gray-500 max-w-md mb-4">
          Try adjusting or clearing some filters to see more results.
        </p>
        {activeFilters.length > 0 && (
          <p className="text-sm text-gray-400 mb-4">
            Currently filtering by: {activeFilters.join(', ')}
          </p>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClearFilters}>
            Clear All Filters
          </Button>
          <Button variant="ghost" onClick={onClearFilters}>
            Modify Filters
          </Button>
        </div>
      </div>
    )
  }

  // No data empty state
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
        <FileText className="h-10 w-10 text-blue-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No Work Orders Yet
      </h3>
      <p className="text-gray-500 max-w-lg mb-2">
        Create your first work order to schedule production.
        Plan materials, assign lines, and track progress.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button onClick={onCreateClick} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create First Work Order
        </Button>
      </div>

      <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200 max-w-md">
        <p className="text-sm text-amber-800">
          <strong>Quick Tip:</strong> Make sure you have BOMs configured for your
          products before creating work orders.
        </p>
        <Button
          variant="link"
          size="sm"
          className="px-0 text-amber-700 mt-1"
          onClick={() => (window.location.href = '/technical/boms')}
        >
          Go to BOM Management
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default WOEmptyState
