/**
 * Box Selector Component (Story 07.12)
 * Purpose: Select between multiple open boxes
 * Features: Visual indicator for active box, item counts
 */

'use client'

import { cn } from '@/lib/utils'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ShipmentBox } from '@/lib/hooks/use-scanner-pack'

interface BoxSelectorProps {
  boxes: ShipmentBox[]
  activeBoxId: string | null
  onSelectBox: (boxId: string) => void
  onCreateBox: () => void
  className?: string
}

export function BoxSelector({
  boxes,
  activeBoxId,
  onSelectBox,
  onCreateBox,
  className,
}: BoxSelectorProps) {
  return (
    <div className={cn('flex gap-2 flex-wrap', className)}>
      {boxes.map((box) => {
        const isActive = box.id === activeBoxId
        const isClosed = box.status === 'closed'

        return (
          <Button
            key={box.id}
            variant="outline"
            onClick={() => !isClosed && onSelectBox(box.id)}
            disabled={isClosed}
            className={cn(
              'h-12 min-h-[48px] px-4 gap-2',
              isActive && 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
              isClosed && 'opacity-50 line-through'
            )}
          >
            <Package className="h-4 w-4" />
            <span>Box {box.boxNumber}</span>
            {box.itemCount !== undefined && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                isActive ? 'bg-blue-500' : 'bg-gray-100'
              )}>
                {box.itemCount} items
              </span>
            )}
          </Button>
        )
      })}

      {/* Create new box button */}
      <Button
        variant="outline"
        onClick={onCreateBox}
        className="h-12 min-h-[48px] px-4 gap-2 border-dashed"
      >
        <Plus className="h-4 w-4" />
        <span>Create</span>
      </Button>
    </div>
  )
}

export default BoxSelector
