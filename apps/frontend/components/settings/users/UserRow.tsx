/**
 * UserRow Component
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * Single user row in DataTable
 * Displays: Name, Email, Role, Status, Last Login, Actions
 */

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserStatusBadge } from './UserStatusBadge'
import type { User } from '@/lib/types/user'
import { MoreVertical } from 'lucide-react'

interface UserRowProps {
  user: User
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onActivate: (user: User) => void
  showActions?: boolean
}

export function UserRow({
  user,
  onEdit,
  onDeactivate,
  onActivate,
  showActions = true,
}: UserRowProps) {
  const formatLastLogin = (lastLogin: string | null | undefined) => {
    if (!lastLogin) return 'Never'
    const date = new Date(lastLogin)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.first_name} {user.last_name}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.role?.name || 'Unknown'}</TableCell>
      <TableCell>
        <UserStatusBadge is_active={user.is_active} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatLastLogin(user.last_login_at)}
      </TableCell>
      {showActions && (
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                Edit
              </DropdownMenuItem>
              {user.is_active ? (
                <DropdownMenuItem onClick={() => onDeactivate(user)}>
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onActivate(user)}>
                  Activate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  )
}
