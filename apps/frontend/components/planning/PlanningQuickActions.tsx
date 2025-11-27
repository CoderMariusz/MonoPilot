'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function PlanningQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Primary Actions - Create */}
      <Button asChild size="sm">
        <Link href="/planning/purchase-orders?action=new">Create PO</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/planning/transfer-orders?action=new">Create TO</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/planning/work-orders?action=new">Create WO</Link>
      </Button>

      {/* Secondary Actions - View All */}
      <Button asChild variant="secondary" size="sm">
        <Link href="/planning/purchase-orders">View All POs</Link>
      </Button>
      <Button asChild variant="secondary" size="sm">
        <Link href="/planning/transfer-orders">View All TOs</Link>
      </Button>
      <Button asChild variant="secondary" size="sm">
        <Link href="/planning/work-orders">View All WOs</Link>
      </Button>
    </div>
  )
}
