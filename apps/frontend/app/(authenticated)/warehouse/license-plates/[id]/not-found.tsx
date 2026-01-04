/**
 * License Plate Detail Not Found Page
 * Story 05.6: LP Detail Page
 *
 * 404 page with helpful navigation options
 */

'use client'

import { useRouter } from 'next/navigation'
import { PackageX, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LicensePlateNotFound() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="lp-not-found">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/warehouse/license-plates')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to License Plates
        </Button>
      </div>

      {/* Not Found Message */}
      <div className="border rounded-lg p-12 text-center space-y-6">
        <div className="flex justify-center">
          <PackageX className="h-24 w-24 text-muted-foreground/50" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">License Plate Not Found</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The license plate you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to
            view it.
          </p>
        </div>

        <div className="max-w-sm mx-auto border rounded-lg p-4 space-y-2 text-sm">
          <div className="font-semibold">Possible Reasons:</div>
          <ul className="text-left space-y-1 text-muted-foreground">
            <li>• License plate number does not exist</li>
            <li>• License plate belongs to a different organization</li>
            <li>• You don&apos;t have warehouse module access</li>
            <li>• License plate was deleted</li>
          </ul>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            variant="default"
            onClick={() => router.push('/warehouse/license-plates')}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Browse License Plates
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>

      {/* Help Section */}
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">What can I do?</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Here are some suggestions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Double-check the license plate number</li>
            <li>Use the search feature on the license plates page</li>
            <li>Filter by warehouse or product to find what you&apos;re looking for</li>
            <li>Contact your system administrator for access issues</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
