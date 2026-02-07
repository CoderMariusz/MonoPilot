/**
 * Create Work Order Page
 * Redirects to work orders list with create modal open
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateWorkOrderPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to work orders list page where user can create via modal
    router.replace('/planning/work-orders?action=create')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Work Orders...</p>
      </div>
    </div>
  )
}
