/**
 * Scanner Layout
 * Story 5.23-5.27: Scanner Guided Workflows
 * Mobile-first layout with bottom nav and session timeout
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const SESSION_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes (Story 5.27)
const WARNING_BEFORE_MS = 60 * 1000 // 1 minute warning

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  const isHome = pathname === '/scanner'

  // Reset activity timer
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now())
    setShowTimeoutWarning(false)
  }, [])

  // Session timeout handler (Story 5.27)
  useEffect(() => {
    const checkTimeout = setInterval(() => {
      const elapsed = Date.now() - lastActivity

      if (elapsed >= SESSION_TIMEOUT_MS) {
        toast({
          title: 'Session Timeout',
          description: 'Returning to scanner home...',
          variant: 'destructive',
        })
        router.push('/scanner')
        resetActivity()
      } else if (elapsed >= SESSION_TIMEOUT_MS - WARNING_BEFORE_MS && !showTimeoutWarning) {
        setShowTimeoutWarning(true)
        toast({
          title: 'Session Warning',
          description: 'Session will timeout in 1 minute',
          variant: 'default',
        })
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(checkTimeout)
  }, [lastActivity, showTimeoutWarning, router, toast, resetActivity])

  // Track user activity
  useEffect(() => {
    const handleActivity = () => resetActivity()

    window.addEventListener('click', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    return () => {
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [resetActivity])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - Mobile optimized */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-area-top">
        <div className="flex items-center h-14 px-3 gap-2">
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 flex items-center gap-2">
            <h1 className="text-lg font-semibold truncate">
              {isHome ? 'Scanner Terminal' : 'Scanner Operation'}
            </h1>
          </div>
          {showTimeoutWarning && (
            <div className="flex items-center gap-1 text-orange-600 text-sm">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timeout soon</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Touch-optimized scrolling */}
      <main className="flex-1 overflow-y-auto pb-safe">
        {children}
      </main>

      {/* Bottom Navigation - Always visible (Story 5.26) */}
      <nav className="bg-white border-t border-gray-200 sticky bottom-0 safe-area-bottom">
        <div className="flex items-center justify-center h-16 px-4">
          <Button
            variant={isHome ? 'default' : 'outline'}
            size="lg"
            onClick={() => router.push('/scanner')}
            className="w-full max-w-xs h-12"
          >
            <Home className="h-5 w-5 mr-2" />
            Scanner Home
          </Button>
        </div>
      </nav>
    </div>
  )
}
