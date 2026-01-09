/**
 * RoutingsDataTable Component
 * Story: 02.7 - Routings CRUD
 * Wireframe: TEC-007 (Routings List)
 *
 * Displays routings in a responsive table/card layout with:
 * - 6 columns: Code, Name, Description, Status, Operations Count, Actions
 * - 4 action buttons: View, Edit, Clone, Delete
 * - 4 states: Loading, Error, Empty, Success
 * - Keyboard navigation and full accessibility
 */

'use client'

import { Eye, Pencil, Copy, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Routing } from '@/lib/services/routing-service'

interface RoutingsDataTableProps {
  routings: Routing[]
  loading?: boolean
  error?: Error | null
  onView: (id: string) => void
  onEdit: (routing: Routing) => void
  onClone: (routing: Routing) => void
  onDelete: (routing: Routing) => void
  onRefresh?: () => void
  readOnly?: boolean // For VIEWER role
}

export function RoutingsDataTable({
  routings,
  loading = false,
  error = null,
  onView,
  onEdit,
  onClone,
  onDelete,
  onRefresh,
  readOnly = false,
}: RoutingsDataTableProps) {
  // Loading State
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>Error loading routings: {error.message}</span>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Empty State
  if (!routings || routings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium text-muted-foreground">
            No Routings Found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first routing to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  // Truncate long descriptions
  const truncateDescription = (desc: string | null, maxLength = 50) => {
    if (!desc) return '-'
    if (desc.length <= maxLength) return desc
    return desc.substring(0, maxLength) + '...'
  }

  // Success State - Desktop Table
  return (
    <div className="space-y-4">
      {/* Desktop Table (>= 768px) */}
      <div className="hidden md:block rounded-md border">
        <Table role="table">
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Operations</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routings.map((routing) => (
              <TableRow
                key={routing.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(routing.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onView(routing.id)
                  }
                }}
              >
                <TableCell className="font-mono text-sm">{routing.code || '-'}</TableCell>
                <TableCell className="font-medium">{routing.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {truncateDescription(routing.description)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={routing.is_active ? 'default' : 'secondary'}
                    className={
                      routing.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }
                  >
                    {routing.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{routing.operations_count || 0}</Badge>
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(routing.id)
                      }}
                      aria-label="View routing"
                      className="h-12 w-12 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!readOnly && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(routing)
                          }}
                          aria-label="Edit routing"
                          className="h-12 w-12 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onClone(routing)
                          }}
                          aria-label="Clone routing"
                          className="h-12 w-12 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(routing)
                          }}
                          aria-label="Delete routing"
                          className="h-12 w-12 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout (< 768px) */}
      <div className="md:hidden space-y-4">
        {routings.map((routing) => (
          <Card
            key={routing.id}
            className="routing-card cursor-pointer hover:bg-muted/50"
            onClick={() => onView(routing.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onView(routing.id)
              }
            }}
          >
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {routing.code && (
                      <span className="font-mono text-xs text-muted-foreground">{routing.code}</span>
                    )}
                    <h3 className="font-medium">{routing.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {truncateDescription(routing.description)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={routing.is_active ? 'default' : 'secondary'}
                    className={
                      routing.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {routing.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {routing.operations_count || 0} operations
                  </Badge>
                </div>

                {!readOnly && (
                  <div
                    className="flex gap-2 pt-2 border-t"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(routing)
                      }}
                      aria-label="Edit routing"
                      className="flex-1 h-12"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClone(routing)
                      }}
                      aria-label="Clone routing"
                      className="flex-1 h-12"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Clone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(routing)
                      }}
                      aria-label="Delete routing"
                      className="flex-1 h-12 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
