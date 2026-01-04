/**
 * LP Empty State Component
 * Story 05.1: License Plates UI
 */

import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

interface LPEmptyStateProps {
  onCreateClick: () => void
}

export function LPEmptyState({ onCreateClick }: LPEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="empty-state">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No License Plates Yet</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Create your first License Plate to start tracking inventory at the atomic level.
        LPs enable full traceability from receipt through production to shipping.
      </p>
      <Button onClick={onCreateClick}>Create First License Plate</Button>
      <div className="mt-8 text-sm text-muted-foreground max-w-md">
        <p className="font-medium mb-2">Quick Tips:</p>
        <ul className="text-left space-y-1">
          <li>• LPs are created automatically during Goods Receipt (GRN)</li>
          <li>• Manual LP creation is for adjustments and opening inventory</li>
          <li>• Configure auto-numbering in Warehouse Settings</li>
        </ul>
      </div>
    </div>
  )
}
