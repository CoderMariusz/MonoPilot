/**
 * UserStatusBadge Component
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * Displays active/inactive status badge for users
 * - Active: Green badge
 * - Inactive: Red badge
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface UserStatusBadgeProps {
  is_active: boolean
  className?: string
}

export function UserStatusBadge({ is_active, className }: UserStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        'text-xs',
        is_active
          ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
          : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
        className
      )}
    >
      {is_active ? 'Active' : 'Inactive'}
    </Badge>
  )
}
