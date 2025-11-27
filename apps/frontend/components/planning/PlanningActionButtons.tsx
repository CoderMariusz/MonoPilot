'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PlanningActionButtonsProps {
  showPO?: boolean
  showTO?: boolean
  showWO?: boolean
}

export function PlanningActionButtons({
  showPO = true,
  showTO = true,
  showWO = true,
}: PlanningActionButtonsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {showPO && (
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/planning/purchase-orders/new">
            <Plus className="h-4 w-4 mr-1" />
            Create PO
          </Link>
        </Button>
      )}
      {showTO && (
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/planning/transfer-orders/new">
            <Plus className="h-4 w-4 mr-1" />
            Create TO
          </Link>
        </Button>
      )}
      {showWO && (
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/planning/work-orders/new">
            <Plus className="h-4 w-4 mr-1" />
            Create WO
          </Link>
        </Button>
      )}
    </div>
  )
}
