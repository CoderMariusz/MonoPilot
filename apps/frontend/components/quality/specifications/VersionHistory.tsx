'use client'

/**
 * VersionHistory Component
 * Story: 06.3 - Product Specifications
 *
 * Displays version history for a specification.
 * Shows all versions with status, effective date, and approver.
 * Allows navigation to any version.
 */

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { History, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpecificationStatusBadge } from './SpecificationStatusBadge'
import type { VersionHistoryEntry } from '@/lib/types/quality'

export interface VersionHistoryProps {
  /** Current specification ID (to highlight) */
  currentId: string
  /** Version history entries */
  versions: VersionHistoryEntry[]
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string | null
  /** Additional CSS classes */
  className?: string
  /** Test ID for testing */
  testId?: string
}

export function VersionHistory({
  currentId,
  versions,
  loading = false,
  error = null,
  className,
  testId = 'version-history',
}: VersionHistoryProps) {
  const router = useRouter()

  // Loading state
  if (loading) {
    return (
      <Card className={className} data-testid={`${testId}-loading`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn(className, 'border-red-200')} data-testid={`${testId}-error`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-red-600">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!versions || versions.length === 0) {
    return (
      <Card className={className} data-testid={`${testId}-empty`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No version history available.</p>
        </CardContent>
      </Card>
    )
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  // Handle version click
  const handleVersionClick = (versionId: string) => {
    router.push(`/quality/specifications/${versionId}`)
  }

  // Sort versions by version number (descending)
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version)

  return (
    <Card className={className} data-testid={testId}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" />
          Version History
          <Badge variant="secondary" className="ml-auto">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedVersions.map((version) => {
            const isCurrent = version.id === currentId

            return (
              <div
                key={version.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-md border',
                  isCurrent
                    ? 'bg-primary/5 border-primary/20'
                    : 'hover:bg-muted/50 cursor-pointer'
                )}
                onClick={() => !isCurrent && handleVersionClick(version.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCurrent) {
                    handleVersionClick(version.id)
                  }
                }}
                tabIndex={isCurrent ? -1 : 0}
                role="button"
                aria-label={`View version ${version.version}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    v{version.version}
                  </Badge>
                  <SpecificationStatusBadge status={version.status} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(version.effective_date)}</span>
                  {version.approved_by_name && (
                    <span className="hidden sm:inline">by {version.approved_by_name}</span>
                  )}
                  {isCurrent ? (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  ) : (
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default VersionHistory
