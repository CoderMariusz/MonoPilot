'use client'

/**
 * ParameterEditor Component
 * Story: 06.4 - Test Parameters
 *
 * Main component for managing specification parameters.
 * Integrates into Specification Detail page.
 *
 * Features:
 * - Parameter list with drag-to-reorder (draft only)
 * - Add/Edit/Delete parameters (draft only)
 * - Parameter count summary
 * - All 4 states: loading, error, empty, success
 */

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  AlertCircle,
  TestTube,
  RefreshCw,
} from 'lucide-react'
import { ParameterTable } from './ParameterTable'
import { ParameterForm } from './ParameterForm'
import { DeleteParameterDialog } from './DeleteParameterDialog'
import {
  useSpecParameters,
  useCreateParameter,
  useUpdateParameter,
  useDeleteParameter,
  useReorderParameters,
} from '@/lib/hooks/use-spec-parameters'
import { useToast } from '@/hooks/use-toast'
import type {
  QualitySpecParameter,
  CreateParameterRequest,
  UpdateParameterRequest,
  SpecificationStatus,
  ParameterType,
} from '@/lib/types/quality'

export interface ParameterEditorProps {
  /** Specification ID */
  specId: string
  /** Specification status */
  specStatus: SpecificationStatus
}

/**
 * Get parameter type breakdown
 */
function getTypeBreakdown(parameters: QualitySpecParameter[]): string {
  const counts: Record<ParameterType, number> = {
    numeric: 0,
    text: 0,
    boolean: 0,
    range: 0,
  }

  parameters.forEach((p) => {
    counts[p.parameter_type]++
  })

  const parts: string[] = []
  if (counts.numeric > 0) parts.push(`${counts.numeric} numeric`)
  if (counts.text > 0) parts.push(`${counts.text} text`)
  if (counts.boolean > 0) parts.push(`${counts.boolean} boolean`)
  if (counts.range > 0) parts.push(`${counts.range} range`)

  return parts.join(', ')
}

export function ParameterEditor({ specId, specStatus }: ParameterEditorProps) {
  const { toast } = useToast()
  const isDraft = specStatus === 'draft'

  // Fetch parameters
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useSpecParameters(specId)

  // Mutations
  const createMutation = useCreateParameter()
  const updateMutation = useUpdateParameter()
  const deleteMutation = useDeleteParameter()
  const reorderMutation = useReorderParameters()

  // Local state for dialogs
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingParameter, setEditingParameter] = React.useState<QualitySpecParameter | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingParameter, setDeletingParameter] = React.useState<QualitySpecParameter | null>(null)

  const parameters = data?.parameters || []
  const criticalCount = parameters.filter((p) => p.is_critical).length

  // Handlers
  const handleAdd = () => {
    setEditingParameter(null)
    setFormOpen(true)
  }

  const handleEdit = (parameter: QualitySpecParameter) => {
    setEditingParameter(parameter)
    setFormOpen(true)
  }

  const handleDeleteClick = (parameter: QualitySpecParameter) => {
    setDeletingParameter(parameter)
    setDeleteDialogOpen(true)
  }

  const handleSave = async (formData: CreateParameterRequest | UpdateParameterRequest) => {
    try {
      if (editingParameter) {
        // Update
        await updateMutation.mutateAsync({
          specId,
          parameterId: editingParameter.id,
          data: formData as UpdateParameterRequest,
        })
        toast({
          title: 'Parameter Updated',
          description: `"${(formData as UpdateParameterRequest).parameter_name || editingParameter.parameter_name}" has been updated.`,
        })
      } else {
        // Create
        await createMutation.mutateAsync({
          specId,
          data: formData as CreateParameterRequest,
        })
        toast({
          title: 'Parameter Added',
          description: `"${(formData as CreateParameterRequest).parameter_name}" has been added.`,
        })
      }
      setFormOpen(false)
      setEditingParameter(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save parameter',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deletingParameter) return

    try {
      await deleteMutation.mutateAsync({
        specId,
        parameterId: deletingParameter.id,
      })
      toast({
        title: 'Parameter Deleted',
        description: `"${deletingParameter.parameter_name}" has been deleted.`,
      })
      setDeleteDialogOpen(false)
      setDeletingParameter(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete parameter',
        variant: 'destructive',
      })
    }
  }

  const handleReorder = async (parameterIds: string[]) => {
    try {
      await reorderMutation.mutateAsync({
        specId,
        parameterIds,
      })
      // No toast for reorder - optimistic update is enough feedback
    } catch (err) {
      toast({
        title: 'Reorder Failed',
        description: err instanceof Error ? err.message : 'Failed to reorder parameters',
        variant: 'destructive',
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold">Error Loading Parameters</h3>
              <p className="mt-1 text-red-600 text-sm">
                {error instanceof Error ? error.message : 'Failed to load parameters'}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (parameters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TestTube className="h-5 w-5" />
            Test Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
            <TestTube className="w-12 h-12 text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-medium">No Parameters Defined</h3>
              <p className="mt-1 text-muted-foreground text-sm max-w-sm">
                Add parameters to define the test criteria for this specification.
                Parameters enable inspections and quality tracking.
              </p>
            </div>
            {isDraft && (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
            )}
          </div>
        </CardContent>

        {/* Form Dialog */}
        <ParameterForm
          open={formOpen}
          onOpenChange={setFormOpen}
          parameter={editingParameter}
          saving={createMutation.isPending || updateMutation.isPending}
          onSave={handleSave}
        />
      </Card>
    )
  }

  // Success state with parameters
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TestTube className="h-5 w-5" />
              Test Parameters
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="font-normal">
                {parameters.length} parameter{parameters.length !== 1 ? 's' : ''}
              </Badge>
              {criticalCount > 0 && (
                <Badge variant="destructive" className="font-normal">
                  {criticalCount} critical
                </Badge>
              )}
              <span className="hidden sm:inline">|</span>
              <span className="text-xs">{getTypeBreakdown(parameters)}</span>
            </div>
          </div>
          {isDraft && (
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Parameter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Read-only notice for non-draft specs */}
        {!isDraft && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            Parameters are read-only for {specStatus} specifications.
            {specStatus === 'active' && ' Clone as new version to make changes.'}
          </div>
        )}

        {/* Parameter list */}
        <ParameterTable
          parameters={parameters}
          draggable={isDraft}
          editable={isDraft}
          onReorder={handleReorder}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </CardContent>

      {/* Form Dialog */}
      <ParameterForm
        open={formOpen}
        onOpenChange={setFormOpen}
        parameter={editingParameter}
        saving={createMutation.isPending || updateMutation.isPending}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteParameterDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        parameterName={deletingParameter?.parameter_name || ''}
        deleting={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  )
}

export default ParameterEditor
