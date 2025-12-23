/**
 * Invitations Tab Component
 * Story: 1.3 User Invitations
 * BATCH 1: UI Components
 * AC-003.1: Admin views pending invitations
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, RefreshCw, X } from 'lucide-react'
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

interface Invitation {
  id: string
  email: string
  role: string
  invited_by_name?: string
  sent_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}

export function InvitationsTab() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/settings/invitations?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load invitations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvitations()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Resend invitation (AC-003.2)
  const handleResend = async (invitation: Invitation) => {
    try {
      setResendingId(invitation.id)

      const response = await fetch(`/api/settings/invitations/${invitation.id}/resend`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to resend invitation')
      }

      toast({
        title: 'Success',
        description: `Invitation resent to ${invitation.email}`,
      })

      fetchInvitations()
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend invitation',
        variant: 'destructive',
      })
    } finally {
      setResendingId(null)
    }
  }

  // Cancel invitation (AC-003.3)
  const handleCancel = async (invitation: Invitation) => {
    try {
      const response = await fetch(`/api/settings/invitations/${invitation.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel invitation')
      }

      toast({
        title: 'Success',
        description: 'Invitation cancelled',
      })

      fetchInvitations()
      setCancellingId(null)
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel invitation',
        variant: 'destructive',
      })
    }
  }

  // Get status badge (AC-003.1, AC-003.4)
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string }> = {
      pending: { variant: 'default', text: 'Pending' },
      accepted: { variant: 'default', text: 'Accepted' },
      expired: { variant: 'destructive', text: 'Expired' },
      cancelled: { variant: 'secondary', text: 'Cancelled' },
    }

    const config = variants[status] || { variant: 'default', text: status }

    return (
      <Badge
        variant={config.variant}
        className={status === 'pending' ? 'bg-blue-500' : status === 'accepted' ? 'bg-green-500' : ''}
      >
        {config.text}
      </Badge>
    )
  }

  // Check if invitation is expired (AC-003.4)
  const isExpired = (invitation: Invitation) => {
    return new Date(invitation.expires_at) < new Date()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invitations Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading invitations...
                </TableCell>
              </TableRow>
            ) : invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No invitations found
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell className="capitalize">{invitation.role}</TableCell>
                  <TableCell>{invitation.invited_by_name || 'Unknown'}</TableCell>
                  <TableCell>
                    {new Date(invitation.sent_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {isExpired(invitation) ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : (
                      new Date(invitation.expires_at).toLocaleDateString()
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Resend button - enabled for expired invitations (AC-003.4) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(invitation)}
                        disabled={
                          invitation.status === 'accepted' ||
                          invitation.status === 'cancelled' ||
                          resendingId === invitation.id
                        }
                        title="Resend invitation"
                      >
                        <RefreshCw className={`h-4 w-4 ${resendingId === invitation.id ? 'animate-spin' : ''}`} />
                      </Button>

                      {/* Cancel button - disabled for expired (AC-003.4) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancellingId(invitation.id)}
                        disabled={
                          invitation.status === 'expired' ||
                          invitation.status === 'cancelled' ||
                          invitation.status === 'accepted'
                        }
                        title="Cancel invitation"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Confirmation Dialog (AC-003.3) */}
      {cancellingId && (
        <AlertDialog open={!!cancellingId} onOpenChange={() => setCancellingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this invitation? The user will not be able to sign up with this link.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const invitation = invitations.find((inv) => inv.id === cancellingId)
                  if (invitation) handleCancel(invitation)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cancel Invitation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
