import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, List, Settings, Users } from 'lucide-react'

export function PlanningQuickActions() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Create New</h3>
        <div className="flex gap-2 flex-wrap">
          <Button asChild>
            <Link href="/planning/purchase-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Create PO
            </Link>
          </Button>
          <Button asChild>
            <Link href="/planning/transfer-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Create TO
            </Link>
          </Button>
          <Button asChild>
            <Link href="/planning/work-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Create WO
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">View All</h3>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" asChild>
            <Link href="/planning/purchase-orders">
              <List className="mr-2 h-4 w-4" />
              All POs
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/planning/transfer-orders">
              <List className="mr-2 h-4 w-4" />
              All TOs
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/planning/work-orders">
              <List className="mr-2 h-4 w-4" />
              All WOs
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/planning/suppliers">
              <Users className="mr-2 h-4 w-4" />
              Suppliers
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Settings</h3>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/planning">
              <Settings className="mr-2 h-4 w-4" />
              Planning Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
