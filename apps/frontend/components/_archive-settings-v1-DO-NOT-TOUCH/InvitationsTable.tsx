/**
 * Invitations Table Component
 * Story: 1.14 (Batch 2) - AC-1.1: Invitations Tab UI
 *
 * Features:
 * - Display invitations with filtering and search
 * - Status badges (Pending, Accepted, Expired, Cancelled)
 * - Resend and Cancel actions
 * - Real-time refresh after mutations
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
import { Search, Mail, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Invitation {
  id: string
  email: string
  role: string
  invited_by: string
  invited_by_name?: string
  sent_at: string
  expires_at: string
  accepted_at?: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  is_expired?: boolean
}

export function InvitationsTable() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const { toast } = useToast()

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      setLoading(true)

      // Build query parameters
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

  // Resend invitation
  const handleResend = async (invitation: Invitation) => {
    try {
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

      fetchInvitations() // Refresh list
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend invitation',
        variant: 'destructive',
      })
    }
  }

  // Cancel invitation
  const handleCancel = async () => {
    if (!selectedInvitation) return

    try {
      const response = await fetch(`/api/settings/invitations/${selectedInvitation.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel invitation')
      }

      toast({
        title: 'Success',
        description: `Invitation to ${selectedInvitation.email} has been cancelled`,
      })

      fetchInvitations() // Refresh list
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel invitation',
        variant: 'destructive',
      })
    } finally {
      setCancelDialogOpen(false)
      setSelectedInvitation(null)
    }
  }

  const getStatusBadge = (invitation: Invitation) => {
    // Check if expired based on expiry date
    const isExpired = invitation.is_expired || new Date(invitation.expires_at) < new Date()

    if (isExpired && invitation.status === 'pending') {
      return <Badge variant="destructive">Expired</Badge>
    }

    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'default',
      accepted: 'secondary',
      expired: 'destructive',
      cancelled: 'outline',
    }

    const labels: Record<string, string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      expired: 'Expired',
      cancelled: 'Cancelled',
    }

    return (
      <Badge variant={variants[invitation.status] || 'default'}>
        {labels[invitation.status] || invitation.status}
      </Badge>
    )
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      manager: 'Manager',
      operator: 'Operator',
      viewer: 'Viewer',
      planner: 'Planner',
      technical: 'Technical',
      purchasing: 'Purchasing',
      warehouse: 'Warehouse',
      qc: 'QC',
      finance: 'Finance',
    }
    return labels[role] || role
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (invitation: Invitation) => {
    return invitation.is_expired || new Date(invitation.expires_at) < new Date()
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
                  <TableCell>{getRoleLabel(invitation.role)}</TableCell>
                  <TableCell>{invitation.invited_by_name || 'Unknown'}</TableCell>
                  <TableCell>{formatDate(invitation.sent_at)}</TableCell>
                  <TableCell>
                    {isExpired(invitation) ? (
                      <span className="text-red-600 font-medium">Expired</span>
                    ) : (
                      formatDate(invitation.expires_at)
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(invitation)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Resend button - enabled for pending/expired invitations */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(invitation)}
                        disabled={invitation.status === 'accepted' || invitation.status === 'cancelled'}
                        title="Resend invitation email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>

                      {/* Cancel button - disabled for expired invitations */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInvitation(invitation)
                          setCancelDialogOpen(true)
                        }}
                        disabled={
                          isExpired(invitation) ||
                          invitation.status === 'cancelled' ||
                          invitation.status === 'accepted'
                        }
                        title="Cancel invitation"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to{' '}
              <strong>{selectedInvitation?.email}</strong>?
              <br />
              <br />
              This action cannot be undone. The invitation link will no longer be valid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedInvitation(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
