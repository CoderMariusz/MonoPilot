/**
 * Work Orders Page
 * Story 3.10: Work Order CRUD
 * Story 3.27: Work Orders Table + Spreadsheet Mode
 *
 * Features:
 * - Table View (default)
 * - Spreadsheet Mode for bulk editing (desktop only)
 * - View mode toggle
 */

'use client'

import { useState } from 'react'
import { WorkOrdersTable } from '@/components/planning/WorkOrdersTable'
import { WorkOrdersSpreadsheet } from '@/components/planning/WorkOrdersSpreadsheet'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import { PlanningActionButtons } from '@/components/planning/PlanningActionButtons'
import { Button } from '@/components/ui/button'
import { useResponsiveView } from '@/hooks/use-responsive-view'
import { TableIcon, LayoutGrid, CalendarDays } from 'lucide-react'

type ViewMode = 'table' | 'spreadsheet' | 'timeline'

export default function WorkOrdersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const { isMobile } = useResponsiveView()

  return (
    <div>
      <PlanningHeader currentPage="wo" />

      <div className="px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Work Orders</h1>
            <p className="text-muted-foreground text-sm">Manage production work orders</p>
          </div>

          {/* View Mode Toggle - Desktop only */}
          {!isMobile && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-white shadow-sm' : ''}
              >
                <TableIcon className="h-4 w-4 mr-1" />
                Table View
              </Button>
              <Button
                variant={viewMode === 'spreadsheet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('spreadsheet')}
                className={viewMode === 'spreadsheet' ? 'bg-white shadow-sm' : ''}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Spreadsheet
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className={viewMode === 'timeline' ? 'bg-white shadow-sm' : ''}
                disabled
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Timeline
              </Button>
            </div>
          )}
        </div>

        {viewMode === 'table' && (
          <PlanningActionButtons showPO={false} showTO={false} />
        )}

        {/* Render based on view mode */}
        {viewMode === 'table' || isMobile ? (
          <WorkOrdersTable />
        ) : viewMode === 'spreadsheet' ? (
          <WorkOrdersSpreadsheet />
        ) : (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
            <div className="text-center text-gray-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Timeline View</p>
              <p className="text-sm">Coming Soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
