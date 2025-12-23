/**
 * User Management Page (Story 01.5a)
 * Using UsersDataTable component with data fetching
 */

'use client'

import { useState } from 'react'
import { UsersDataTable } from '@/components/settings/users/UsersDataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus } from 'lucide-react'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { useUsers } from '@/lib/hooks/use-users'
import type { UsersListParams, UserFilters } from '@/lib/types/user'

export default function UsersPageNew() {
  const [params, setParams] = useState<UsersListParams>({
    page: 1,
    limit: 25,
    search: '',
    role: undefined,
    status: undefined,
  })

  const { data, isLoading, error } = useUsers(params)

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }

  const handleSearch = (search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }))
  }

  const handleFilter = (filters: UserFilters) => {
    setParams((prev) => ({
      ...prev,
      role: filters.role,
      status: filters.status,
      page: 1,
    }))
  }

  const handleEdit = (user: any) => {
    console.log('Edit user:', user)
    // TODO: Open edit modal
  }

  const handleDeactivate = (user: any) => {
    console.log('Deactivate user:', user)
    // TODO: Implement deactivate
  }

  const handleActivate = (user: any) => {
    console.log('Activate user:', user)
    // TODO: Implement activate
  }

  return (
    <div>
      <SettingsHeader currentPage="users" />

      <div className="px-4 md:px-6 py-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>User Management</CardTitle>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <UsersDataTable
              users={data?.users || []}
              total={data?.total || 0}
              page={params.page || 1}
              limit={params.limit || 25}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onFilter={handleFilter}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              isLoading={isLoading}
              error={error?.message}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
