/**
 * Roles & Permissions Page
 * Story: TD-003 - Roles & Permissions Page
 * Route: /settings/roles
 *
 * Displays read-only permission matrix for 10 system roles × 12 modules
 * - All 4 states: Loading, Error, Empty, Success
 * - Export to CSV
 * - Print functionality
 * - Responsive design with sticky columns
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionMatrixTable } from '@/components/settings/PermissionMatrixTable'
import { RoleExportActions } from '@/components/settings/RoleExportActions'
import { PermissionLegend } from '@/components/settings/PermissionLegend'
import { AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import type { Role } from '@/lib/services/role-service'

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/settings/roles')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch roles')
      }

      const data = await response.json()
      setRoles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles')
      console.error('Error fetching roles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Banner Skeleton */}
        <Skeleton className="h-20 w-full" />

        {/* Table Skeleton */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>

        {/* Legend Skeleton */}
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            System roles and their module permissions (read-only)
          </p>
        </div>

        {/* Error Alert */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading roles</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchRoles}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty State
  if (roles.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            System roles and their module permissions (read-only)
          </p>
        </div>

        {/* Empty State Card */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No roles found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              System roles have not been configured yet. Please contact your administrator.
            </p>
            <Button variant="outline" onClick={fetchRoles}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success State
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            System roles and their module permissions (read-only)
          </p>
        </div>
        <RoleExportActions roles={roles} />
      </div>

      {/* Info Banner */}
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Read-Only View</AlertTitle>
        <AlertDescription>
          System roles are pre-configured and cannot be modified. These permissions apply to all
          users based on their assigned role. Contact your administrator to change user roles.
        </AlertDescription>
      </Alert>

      {/* Permission Matrix Table */}
      <PermissionMatrixTable roles={roles} />

      {/* Legend */}
      <PermissionLegend />

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          /* Hide non-essential elements */
          header,
          nav,
          .print:hidden {
            display: none !important;
          }

          /* Optimize table for printing */
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }

          /* Ensure table fits on page */
          table {
            font-size: 10px;
          }

          /* Remove shadows and borders */
          .shadow,
          .shadow-sm,
          .shadow-md {
            box-shadow: none !important;
          }

          /* Add page breaks */
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  )
}
