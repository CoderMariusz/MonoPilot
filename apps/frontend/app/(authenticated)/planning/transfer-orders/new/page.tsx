/**
 * Create Transfer Order Page
 * Redirects to transfer orders list with create modal open
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateTransferOrderPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to transfer orders list page where user can create via modal
    router.replace('/planning/transfer-orders?action=create')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Transfer Orders...</p>
      </div>
    </div>
  )
}
