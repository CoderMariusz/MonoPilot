/**
 * Audit Logs Page
 * Story: 01.17 - Audit Trail
 * Route: /settings/audit-logs
 *
 * Displays audit logs with table, filters, search, row expansion, CSV export.
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAuditLogs } from '@/lib/hooks/use-audit-logs'
import {
  AuditLogsTable,
  AuditLogFilters,
  AuditLogSearch,
  AuditLogExportButton,
} from '@/components/settings/audit'
import type { AuditLogFilters as AuditLogFiltersType } from '@/lib/types/audit-log'

// Mock users data - in production this would come from an API
const MOCK_USERS = [
  { id: 'user-1', email: 'admin@example.com', first_name: 'Admin', last_name: 'User' },
  { id: 'user-2', email: 'operator@example.com', first_name: 'Production', last_name: 'Operator' },
  { id: 'user-3', email: 'manager@example.com', first_name: 'Production', last_name: 'Manager' },
]

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFiltersType>({})

  // Fetch audit logs with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useAuditLogs(filters)

  // Flatten all pages into single array
  const allLogs = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? []
  }, [data])

  // Calculate total
  const total = data?.pages[0]?.total ?? 0

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.action?.length ?? 0) > 0 ||
      (filters.entity_type?.length ?? 0) > 0 ||
      (filters.user_id?.length ?? 0) > 0 ||
      filters.date_from !== undefined ||
      filters.search !== undefined
    )
  }, [filters])

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }))
  }, [])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: AuditLogFiltersType) => {
    setFilters(newFilters)
  }, [])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({})
  }, [])

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all changes made in the system for compliance and security.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <AuditLogSearch
            value={filters.search || ''}
            onSearch={handleSearch}
          />
          <div className="flex gap-3 items-center">
            <AuditLogFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              users={MOCK_USERS}
            />
            <AuditLogExportButton filters={filters} />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <AuditLogsTable
        logs={allLogs}
        total={total}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        error={error}
        onLoadMore={fetchNextPage}
        hasFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />
    </div>
  )
}
