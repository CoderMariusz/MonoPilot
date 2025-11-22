/**
 * User Sessions Page
 * Story: 1.4 Session Management
 * BATCH 1: UI Components
 * AC-003.1: User views active sessions
 * AC-003.2: Logout all devices
 * AC-003.3: Admin can terminate any user's sessions
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LogOut, Monitor, Smartphone, Tablet, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Session {
  id: string
  device_info: string
  ip_address: string
  location: string
  login_time: string
  last_activity: string
  is_active: boolean
  is_current: boolean
}

export default function UserSessionsPage() {
  const params = useParams()
  const userId = params?.id as string
  const router = useRouter()

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false)
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch sessions (AC-003.1)
  const fetchSessions = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/settings/users/${userId}/sessions`)

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchSessions()
    }
  }, [userId])

  // Logout all devices (AC-003.2)
  const handleLogoutAll = async () => {
    try {
      const response = await fetch(`/api/settings/users/${userId}/sessions/logout-all`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to logout all devices')
      }

      toast({
        title: 'Success',
        description: 'Logged out from all devices',
      })

      fetchSessions()
      setShowLogoutAllDialog(false)
    } catch (error) {
      console.error('Error logging out all devices:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to logout all devices',
        variant: 'destructive',
      })
    }
  }

  // Terminate individual session (AC-003.3, AC-003.8)
  const handleTerminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settings/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to terminate session')
      }

      toast({
        title: 'Success',
        description: 'Session terminated',
      })

      fetchSessions()
      setTerminatingSessionId(null)
    } catch (error) {
      console.error('Error terminating session:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to terminate session',
        variant: 'destructive',
      })
    }
  }

  // Get device icon
  const getDeviceIcon = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase()
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  // Get status badge
  const getStatusBadge = (session: Session) => {
    if (!session.is_active) {
      return <Badge variant="secondary">Expired</Badge>
    }
    if (session.is_current) {
      return <Badge variant="default" className="bg-green-500">Current</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          <p className="text-muted-foreground">
            View and manage active sessions for this user
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>
                Active sessions from different devices and browsers
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowLogoutAllDialog(true)}
              disabled={sessions.filter((s) => s.is_active).length === 0}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout All Devices
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Info</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading sessions...
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No active sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(session.device_info)}
                          <span>{session.device_info || 'Unknown Device'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {session.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell>{session.location || 'Unknown'}</TableCell>
                      <TableCell>
                        {new Date(session.login_time).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(session.last_activity).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(session)}</TableCell>
                      <TableCell className="text-right">
                        {session.is_active && !session.is_current ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTerminatingSessionId(session.id)}
                          >
                            <LogOut className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : session.is_current ? (
                          <span className="text-xs text-muted-foreground">Current Session</span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Session Management</p>
              <p className="text-blue-700 dark:text-blue-300">
                Sessions are automatically created when a user logs in. Terminated sessions will log the user out immediately across all devices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout All Confirmation (AC-003.2) */}
      <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout from all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log the user out from all devices except the current one. They will need to log in again on all other devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout All Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate Session Confirmation (AC-003.8) */}
      {terminatingSessionId && (
        <AlertDialog open={!!terminatingSessionId} onOpenChange={() => setTerminatingSessionId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terminate session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will log the user out from this specific device immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleTerminateSession(terminatingSessionId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Terminate Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
