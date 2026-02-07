/**
 * Create NCR Page
 * Redirects to NCR list with create modal open
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateNCRPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to NCR list page where user can create via modal
    // If no NCR list exists yet, redirect to quality module
    router.replace('/quality/ncr?action=create')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to NCR management...</p>
      </div>
    </div>
  )
}
