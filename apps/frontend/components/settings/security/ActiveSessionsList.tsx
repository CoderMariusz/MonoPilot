/**
 * Active Sessions List Component
 * Story: 01.15 - Session & Password Management
 *
 * Displays list of active user sessions with ability to terminate them
 *
 * States:
 * - Loading: Skeleton while fetching sessions
 * - Error: Error message with retry option
 * - Empty: No active sessions message
 * - Success: List of sessions with terminate actions
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  MapPin,
  Clock,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SessionBadge } from './SessionBadge'
import type { Session } from '@/lib/types/session'

interface ActiveSessionsListProps {
  initialSessions?: Session[]
}

export function ActiveSessionsList({ initialSessions = [] }: ActiveSessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [loading, setLoading] = useState(initialSessions.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)
  const { toast } = useToast()

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/settings/sessions')

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to load active sessions. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialSessions.length === 0) {
      fetchSessions()
    }
  }, [fetchSessions, initialSessions.length])

  const terminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId)

    try {
      const response = await fetch(`/api/v1/settings/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to terminate session')
      }

      toast({
        title: 'Session Terminated',
        description: 'The session has been terminated successfully.',
      })

      // Remove from local state
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err) {
      console.error('Error terminating session:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to terminate session',
        variant: 'destructive',
      })
    } finally {
      setTerminatingId(null)
    }
  }

  const terminateAllSessions = async () => {
    setTerminatingAll(true)

    try {
      const response = await fetch('/api/v1/settings/sessions', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to terminate sessions')
      }

      const data = await response.json()

      toast({
        title: 'Sessions Terminated',
        description: `${data.terminated_count} session(s) have been terminated.`,
      })

      // Refresh the list
      await fetchSessions()
    } catch (err) {
      console.error('Error terminating all sessions:', err)
      toast({
        title: 'Error',
        description: 'Failed to terminate sessions',
        variant: 'destructive',
      })
    } finally {
      setTerminatingAll(false)
    }
  }

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      case 'tablet':
        return <Tablet className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      case 'desktop':
        return <Laptop className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      default:
        return <Monitor className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
    }
  }

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

    return date.toLocaleDateString()
  }

  // Loading State
  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading sessions">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
        <span className="sr-only">Loading active sessions...</span>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty State
  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <div
          className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
          role="status"
          aria-label="No active sessions"
        >
          <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" aria-hidden="true" />
          <p className="font-medium">No Active Sessions</p>
          <p className="text-sm mt-1">You don&apos;t have any active sessions at the moment.</p>
          <Button variant="outline" size="sm" onClick={fetchSessions} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
            Refresh Sessions
          </Button>
        </div>
      </div>
    )
  }

  // Success State
  const otherSessions = sessions.filter((s) => !s.is_current)

  return (
    <div className="space-y-4">
      {/* Terminate All Button (if more than one non-current session) */}
      {otherSessions.length > 0 && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={terminatingAll}
              >
                {terminatingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />
                    Terminating...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-1" aria-hidden="true" />
                    Terminate All Other Sessions
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Terminate All Other Sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will log you out from all devices except this one.
                  You will need to log in again on those devices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={terminateAllSessions}>
                  Terminate All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Sessions List */}
      <ul className="space-y-3" role="list" aria-label="Active sessions">
        {sessions.map((session) => (
          <li
            key={session.id}
            className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
              session.is_current ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
            }`}
          >
            {/* Device Icon */}
            <div className="flex-shrink-0">
              {getDeviceIcon(session.device_type)}
            </div>

            {/* Session Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">
                  {session.device_name || session.browser || 'Unknown Device'}
                </span>
                <SessionBadge deviceType={session.device_type} isCurrent={session.is_current} />
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                {/* Browser/OS */}
                {(session.browser || session.os) && (
                  <span className="flex items-center gap-1">
                    {[session.browser, session.os].filter(Boolean).join(' on ')}
                  </span>
                )}

                {/* IP Address */}
                {session.ip_address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {session.ip_address}
                  </span>
                )}

                {/* Last Activity */}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {session.is_current ? 'Active now' : formatLastActivity(session.last_activity_at)}
                </span>
              </div>
            </div>

            {/* Actions */}
            {!session.is_current && (
              <div className="flex-shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={terminatingId === session.id}
                      aria-label={`Terminate session on ${session.device_name || 'device'}`}
                    >
                      {terminatingId === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <LogOut className="h-4 w-4 text-red-500" aria-hidden="true" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Terminate This Session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will log out the device &quot;{session.device_name || session.browser || 'Unknown'}&quot;.
                        They will need to log in again to access the application.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => terminateSession(session.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Terminate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Refresh Button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh Sessions
        </Button>
      </div>
    </div>
  )
}
