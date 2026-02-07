/**
 * NCR List Page
 * Story 06.9: Basic NCR Creation
 * Displays list of Non-Conformance Reports with filters and creation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NCRListPage() {
  const router = useRouter()
  const [error] = useState<string | null>(null)

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Non-Conformance Reports (NCR)</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage quality non-conformances
            </p>
          </div>
          <Button onClick={() => router.push('/quality/ncr/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create NCR
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Placeholder Content */}
        <div className="border rounded-lg p-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🔍</div>
            <h3 className="text-xl font-semibold">NCR Management</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The NCR list view is under development. Use the Create NCR button above to
              create a new non-conformance report.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Button variant="outline" onClick={() => router.push('/quality')}>
                Back to Quality
              </Button>
              <Button onClick={() => router.push('/quality/ncr/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create NCR
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
