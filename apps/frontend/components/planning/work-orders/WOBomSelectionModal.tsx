/**
 * WO BOM Selection Modal Component
 * Story 03.10: Work Order CRUD - Manual BOM Selection
 * Modal to manually select from available BOMs per PLAN-014
 */

'use client'

import { Check, CalendarDays, Package, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { BomPreview } from '@/lib/types/work-order'

interface WOBomSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boms: BomPreview[]
  selectedBomId: string | null
  onSelect: (bomId: string | null) => void
  isLoading?: boolean
  scheduledDate?: string
  productName?: string
}

export function WOBomSelectionModal({
  open,
  onOpenChange,
  boms,
  selectedBomId,
  onSelect,
  isLoading = false,
  scheduledDate,
  productName,
}: WOBomSelectionModalProps) {
  const handleConfirm = () => {
    onOpenChange(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isBomActiveOnDate = (bom: BomPreview, date: string | undefined): boolean => {
    if (!date) return true
    const schedDate = new Date(date)
    const effectiveFrom = new Date(bom.effective_from)
    const effectiveTo = bom.effective_to ? new Date(bom.effective_to) : null

    if (schedDate < effectiveFrom) return false
    if (effectiveTo && schedDate > effectiveTo) return false
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select BOM Version
          </DialogTitle>
          <DialogDescription>
            {productName && (
              <span>
                Choose a BOM version for <strong>{productName}</strong>
              </span>
            )}
            {scheduledDate && (
              <span className="block mt-1 text-sm">
                Scheduled date: {formatDate(scheduledDate)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : boms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-400" />
              <p className="font-medium">No BOMs Available</p>
              <p className="text-sm mt-1">
                This product has no active BOM versions.
              </p>
            </div>
          ) : (
            <RadioGroup
              value={selectedBomId || ''}
              onValueChange={(value) => onSelect(value || null)}
              className="space-y-3"
            >
              {boms.map((bom) => {
                const isActive = isBomActiveOnDate(bom, scheduledDate)
                const isSelected = selectedBomId === bom.bom_id

                return (
                  <Label
                    key={bom.bom_id}
                    htmlFor={bom.bom_id}
                    className={cn(
                      'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300',
                      !isActive && 'opacity-60'
                    )}
                  >
                    <RadioGroupItem
                      value={bom.bom_id}
                      id={bom.bom_id}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          v{bom.bom_version} - {bom.bom_code}
                        </span>
                        {bom.is_recommended && (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                            Recommended
                          </Badge>
                        )}
                        {!isActive && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                            Not active on date
                          </Badge>
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-500 ml-auto" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(bom.effective_from)}
                            {bom.effective_to && ` - ${formatDate(bom.effective_to)}`}
                          </span>
                        </div>
                        <div>
                          Output: {bom.output_qty} {bom.output_uom}
                        </div>
                        <div>
                          Materials: {bom.item_count}
                        </div>
                        {bom.routing_name && (
                          <div>
                            Routing: {bom.routing_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </Label>
                )
              })}
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || boms.length === 0}>
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default WOBomSelectionModal
