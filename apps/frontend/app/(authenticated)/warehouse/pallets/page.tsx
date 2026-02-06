/**
 * Warehouse Pallets Page
 * Route: /warehouse/pallets
 * Purpose: Pallet management and tracking within the warehouse
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Plus, Search } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Pallets | Warehouse | MonoPilot',
  description: 'Manage and track pallets in your warehouse',
}

export default function WarehousePalletsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pallets</h1>
          <p className="text-muted-foreground">
            View and manage pallets across your warehouse
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Find Pallet
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Pallet
          </Button>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pallet Management
          </CardTitle>
          <CardDescription>
            This feature is under development. Check back soon for comprehensive pallet tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              The pallet management system will allow you to create, track, and manage 
              pallets throughout the warehouse lifecycle, including consolidation and mixed pallets.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/warehouse/license-plates">
                View License Plates
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
