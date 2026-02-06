/**
 * Warehouse Layout Page
 * Route: /warehouse/layout
 * Purpose: Visual warehouse layout management and location configuration
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Settings } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Warehouse Layout | MonoPilot',
  description: 'Manage and visualize warehouse layout configuration',
}

export default function WarehouseLayoutPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Layout</h1>
          <p className="text-muted-foreground">
            Visualize and manage your warehouse layout configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/warehouses">
              <Settings className="mr-2 h-4 w-4" />
              Configure Warehouses
            </Link>
          </Button>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Layout Visualization
          </CardTitle>
          <CardDescription>
            This feature is under development. Check back soon for interactive warehouse layout visualization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LayoutGrid className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              The warehouse layout visualization tool will allow you to view and manage 
              zones, aisles, racks, and bin locations in an interactive visual interface.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/settings/locations">
                Manage Locations
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
