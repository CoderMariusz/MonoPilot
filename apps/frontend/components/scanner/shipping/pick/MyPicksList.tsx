/**
 * My Picks List Component (Story 07.10)
 * List of assigned/in_progress pick lists with status badges
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loader2, ClipboardList } from 'lucide-react'
import type { PickListSummary } from '@/lib/types/scanner-pick'

interface MyPicksListProps {
  pick_lists: PickListSummary[]
  onSelectPickList: (pickListId: string) => void
  isLoading: boolean
  className?: string
}

// Priority color mapping
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  normal: 'bg-blue-500 text-white',
  low: 'bg-gray-400 text-white',
}

export function MyPicksList({
  pick_lists,
  onSelectPickList,
  isLoading,
  className,
}: MyPicksListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // Empty state
  if (pick_lists.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <ClipboardList className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No active pick lists</p>
        <p className="text-gray-400 text-sm">Check back later for new assignments</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {pick_lists.map((pickList) => (
        <div
          key={pickList.id}
          data-testid="pick-list-row"
          className="bg-white rounded-lg border border-gray-200 p-4 min-h-[64px] flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
          style={{ minHeight: '64px' }}
          onClick={() => onSelectPickList(pickList.id)}
          role="button"
          aria-label={`Pick list ${pickList.pick_list_number}, ${pickList.status}, ${pickList.line_count} lines`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectPickList(pickList.id)
            }
          }}
        >
          {/* Left section: Number and details */}
          <div className="flex-1">
            <p
              className="text-xl font-bold text-gray-900"
              style={{ fontSize: '24px' }}
            >
              {pickList.pick_list_number}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  PRIORITY_COLORS[pickList.priority] || PRIORITY_COLORS.normal
                )}
              >
                {pickList.priority}
              </span>
              <span className="text-sm text-gray-500">
                {pickList.line_count} lines
              </span>
            </div>
          </div>

          {/* Right section: Action button */}
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onSelectPickList(pickList.id)
            }}
            className={cn(
              'min-h-[48px] px-6 font-semibold',
              pickList.status === 'assigned'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
            aria-label={pickList.status === 'assigned' ? 'Start picking' : 'Continue picking'}
          >
            {pickList.status === 'assigned' ? 'Start' : 'Continue'}
          </Button>
        </div>
      ))}
    </div>
  )
}

export default MyPicksList
