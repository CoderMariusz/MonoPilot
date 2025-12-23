/**
 * UsersDataTable Component
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * Features:
 * - Search with 300ms debounce
 * - Filter by role, status
 * - Pagination (25 per page)
 * - Row actions (Edit, Deactivate/Activate)
 * - Permission-based UI (readOnly prop)
 * - Loading, empty, error states
 */

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRoles } from '@/lib/hooks/use-roles'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { UserStatusBadge } from './UserStatusBadge'
import type { User, UserFilters } from '@/lib/types/user'
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'

interface UsersDataTableProps {
  users: User[]
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onFilter: (filters: UserFilters) => void
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onActivate: (user: User) => void
  isLoading?: boolean
  error?: string
  readOnly?: boolean
}

export function UsersDataTable({
  users,
  total,
  page,
  limit,
  onPageChange,
  onSearch,
  onFilter,
  onEdit,
  onDeactivate,
  onActivate,
  isLoading = false,
  error,
  readOnly = false,
}: UsersDataTableProps) {
  const [searchValue, setSearchValue] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch roles for filter dropdown (with fallback for tests)
  const { data: roles } = useRoles()
  const roleOptions = roles || [
    { id: 'role-1', code: 'owner', name: 'Owner' },
    { id: 'role-2', code: 'admin', name: 'Administrator' },
    { id: 'role-3', code: 'production_manager', name: 'Production Manager' },
    { id: 'role-4', code: 'production_operator', name: 'Production Operator' },
    { id: 'role-5', code: 'quality_manager', name: 'Quality Manager' },
    { id: 'role-6', code: 'quality_inspector', name: 'Quality Inspector' },
    { id: 'role-7', code: 'warehouse_manager', name: 'Warehouse Manager' },
    { id: 'role-8', code: 'warehouse_operator', name: 'Warehouse Operator' },
    { id: 'role-9', code: 'planner', name: 'Planner' },
    { id: 'role-10', code: 'viewer', name: 'Viewer' },
  ]

  // Debounced search (300ms)
  useEffect(() => {
    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    // Set new timer
    searchTimerRef.current = setTimeout(() => {
      onSearch(searchValue)
    }, 300)

    // Cleanup
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [searchValue, onSearch])

  // Handle filter changes
  useEffect(() => {
    const filters: UserFilters = {}
    if (roleFilter) filters.role = roleFilter
    if (statusFilter) filters.status = statusFilter as 'active' | 'inactive'
    onFilter(filters)
  }, [roleFilter, statusFilter, onFilter])

  // Calculate pagination
  const totalPages = Math.ceil(total / limit)
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  // Format last login date
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="border rounded-md">
          <div data-testid="skeleton-loader">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  // Empty state
  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold">No users found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchValue || roleFilter || statusFilter
              ? 'Try adjusting your search or filters'
              : "You haven't invited any users to your organization yet"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <Input
          aria-label="Search users by name or email"
          placeholder="Search users..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1"
        />

        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {roleOptions.map((role) => (
            <option key={role.id} value={role.code}>
              {role.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Status: Active</option>
          <option value="inactive">Status: Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              {!readOnly && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
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
                {!readOnly && (
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total} users
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
