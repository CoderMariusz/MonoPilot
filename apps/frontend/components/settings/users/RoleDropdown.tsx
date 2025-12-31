/**
 * RoleDropdown Component
 * Story: 01.6 - Role-Based Permissions (10 Roles)
 *
 * Dropdown component for selecting user roles.
 * Shows all roles, with Owner role only visible to current owner users.
 */

'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User, Role } from '@/lib/types/user'

export interface RoleDropdownProps {
  /** Current logged-in user (to determine if owner role should be shown) */
  currentUser: User
  /** Currently selected role ID */
  selectedRoleId: string
  /** Callback when role is changed */
  onRoleChange: (roleId: string) => void
  /** Whether the dropdown is disabled */
  disabled?: boolean
}

/**
 * RoleDropdown - Dropdown for selecting user roles
 *
 * Features:
 * - Shows all 10 system roles
 * - Owner role only visible to current owner
 * - Displays role names (not codes)
 * - Disabled state support
 */
export function RoleDropdown({
  currentUser,
  selectedRoleId,
  onRoleChange,
  disabled = false,
}: RoleDropdownProps) {
  // Placeholder: Will fetch roles from API
  // For now, show placeholder text
  const isOwner = currentUser?.role?.code === 'owner'

  // Mock roles for placeholder
  const roles: Role[] = []

  if (roles.length === 0) {
    return (
      <Select
        value={selectedRoleId}
        onValueChange={onRoleChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Loading roles..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={selectedRoleId}>Loading...</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  // Filter out owner role if current user is not owner
  const availableRoles = isOwner
    ? roles
    : roles.filter((r) => r.code !== 'owner')

  // Sort: Owner first, then alphabetically
  const sortedRoles = [...availableRoles].sort((a, b) => {
    if (a.code === 'owner') return -1
    if (b.code === 'owner') return 1
    return a.name.localeCompare(b.name)
  })

  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  return (
    <Select
      value={selectedRoleId}
      onValueChange={onRoleChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue>{selectedRole?.name || 'Select role'}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {sortedRoles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
