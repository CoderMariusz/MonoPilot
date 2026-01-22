/**
 * Specification Detail Page
 * Story: 06.3 - Product Specifications
 *
 * Route: /quality/specifications/[id]
 *
 * Features:
 * - View specification details
 * - Version history
 * - Actions: Edit (draft), Approve (draft), Clone, Complete Review (active), Delete (draft)
 * - All 4 states (loading, error, empty, success)
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { SpecificationDetail } from '@/components/quality/specifications'
import {
  useSpecification,
  useApproveSpecification,
  useCloneSpecification,
  useCompleteReview,
  useDeleteSpecification,
} from '@/lib/hooks/use-specifications'
import { useToast } from '@/hooks/use-toast'

export default function SpecificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const specId = params.id as string

  // Fetch specification
  const { data, isLoading, error, refetch } = useSpecification(specId)

  // Mutations
  const approveMutation = useApproveSpecification()
  const cloneMutation = useCloneSpecification()
  const reviewMutation = useCompleteReview()
  const deleteMutation = useDeleteSpecification()

  // Handle approve
  const handleApprove = async (notes?: string) => {
    try {
      const result = await approveMutation.mutateAsync({ id: specId, notes })
      toast({
        title: 'Specification Approved',
        description: `${result.specification.spec_number} is now active.`,
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve specification',
        variant: 'destructive',
      })
    }
  }

  // Handle clone
  const handleClone = async () => {
    try {
      const result = await cloneMutation.mutateAsync(specId)
      toast({
        title: 'New Version Created',
        description: `Draft version v${result.specification.version} has been created.`,
      })
      // Navigate to new draft
      router.push(`/quality/specifications/${result.specification.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clone specification',
        variant: 'destructive',
      })
    }
  }

  // Handle complete review
  const handleCompleteReview = async (notes?: string) => {
    try {
      const result = await reviewMutation.mutateAsync({ id: specId, notes })
      toast({
        title: 'Review Completed',
        description: `Next review date: ${new Date(result.next_review_date).toLocaleDateString()}`,
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete review',
        variant: 'destructive',
      })
    }
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(specId)
      toast({
        title: 'Specification Deleted',
        description: 'The specification has been deleted.',
      })
      router.push('/quality/specifications')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete specification',
        variant: 'destructive',
      })
    }
  }

  // Determine permissions (simplified - in production, check actual user roles)
  const specification = data?.specification
  const isDraft = specification?.status === 'draft'
  const isActive = specification?.status === 'active'

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <SpecificationDetail
        specification={specification || null}
        versionHistory={data?.version_history || []}
        parametersCount={data?.parameters_count || 0}
        loading={isLoading}
        error={error instanceof Error ? error.message : null}
        canEdit={isDraft}
        canApprove={isDraft} // In production: check QA_MANAGER role
        canDelete={isDraft}
        approving={approveMutation.isPending}
        cloning={cloneMutation.isPending}
        completingReview={reviewMutation.isPending}
        deleting={deleteMutation.isPending}
        onApprove={handleApprove}
        onClone={handleClone}
        onCompleteReview={isActive ? handleCompleteReview : undefined}
        onDelete={handleDelete}
      />
    </div>
  )
}
