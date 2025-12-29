'use client'

/**
 * QuickActionsBar Component (Story 02.12)
 * AC-12.23, AC-12.24: Quick action buttons at bottom of dashboard
 *
 * Features:
 * - Three buttons: + New Product, + New BOM, + New Routing
 * - Opens respective create modals
 * - Responsive: desktop inline, mobile stacked
 */

import { Plus, Package, ClipboardList, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuickActionsBarProps {
  onNewProduct?: () => void
  onNewBom?: () => void
  onNewRouting?: () => void
  className?: string
}

export function QuickActionsBar({
  onNewProduct,
  onNewBom,
  onNewRouting,
  className
}: QuickActionsBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg border',
        className
      )}
      data-testid="quick-actions-bar"
    >
      <Button
        onClick={onNewProduct}
        className="flex-1 sm:flex-none min-w-[120px] h-11"
        variant="default"
      >
        <Plus className="mr-2 h-4 w-4" />
        <Package className="mr-2 h-4 w-4" />
        New Product
      </Button>

      <Button
        onClick={onNewBom}
        className="flex-1 sm:flex-none min-w-[120px] h-11"
        variant="default"
      >
        <Plus className="mr-2 h-4 w-4" />
        <ClipboardList className="mr-2 h-4 w-4" />
        New BOM
      </Button>

      <Button
        onClick={onNewRouting}
        className="flex-1 sm:flex-none min-w-[120px] h-11"
        variant="default"
      >
        <Plus className="mr-2 h-4 w-4" />
        <Settings className="mr-2 h-4 w-4" />
        New Routing
      </Button>
    </div>
  )
}

export default QuickActionsBar
