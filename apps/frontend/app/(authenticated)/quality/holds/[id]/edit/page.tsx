/**
 * Quality Hold Edit Page
 * Story: 06.2 - Quality Holds CRUD
 * AC-2.8 to AC-2.11: Hold detail view with editing capability
 *
 * Route: /quality/holds/[id]/edit
 *
 * Allows editing hold details:
 * - Reason
 * - Hold Type
 * - Priority
 */

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  HoldStatusBadge,
  HoldPriorityBadge,
  HoldTypeBadge,
} from '@/components/quality/holds'
import type {
  HoldStatus,
  Priority,
  HoldType,
} from '@/lib/validation/quality-hold-validation'

interface QualityHold {
  id: string
  org_id: string
  hold_number: string
  reason: string
  hold_type: HoldType
  status: HoldStatus
  priority: Priority
  held_by: { id: string; name: string; email: string }
  held_at: string
  created_at: string
  updated_at: string
}

const HOLD_TYPES: HoldType[] = ['qa_pending', 'investigation', 'recall', 'quarantine']
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical']

export default function HoldEditPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const holdId = params.id

  // Form state
  const [hold, setHold] = useState<QualityHold | null>(null)
  const [reason, setReason] = useState('')
  const [holdType, setHoldType] = useState<HoldType>('qa_pending')
  const [priority, setPriority] = useState<Priority>('medium')

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  // Fetch hold details
  useEffect(() => {
    const fetchHold = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/quality/holds/${holdId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch hold details')
        }

        const data = await response.json()
        setHold(data.hold)
        setReason(data.hold.reason)
        setHoldType(data.hold.hold_type)
        setPriority(data.hold.priority)
      } catch (err) {
        console.error('Error fetching hold:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hold')
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load hold details',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchHold()
  }, [holdId, toast])

  // Handle save
  const handleSave = async () => {
    if (!hold) return

    // Validation
    if (reason.length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Reason must be at least 10 characters',
        variant: 'destructive',
      })
      return
    }

    if (reason.length > 500) {
      toast({
        title: 'Validation Error',
        description: 'Reason must not exceed 500 characters',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/quality/holds/${holdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          hold_type: holdType,
          priority,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update hold')
      }

      toast({
        title: 'Success',
        description: `Hold ${hold.hold_number} updated successfully`,
      })

      router.push(`/quality/holds/${holdId}`)
    } catch (err) {
      console.error('Error updating hold:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update hold',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Error state
  if (error || !hold) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/quality/holds')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Holds
        </Button>
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-12">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-semibold text-red-800">Failed to Load Hold</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/quality/holds')}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Check if hold can be edited
  if (hold.status !== 'active') {
    return (
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/quality/holds/${holdId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center rounded-lg border border-yellow-200 bg-yellow-50 py-12">
          <AlertCircle className="h-12 w-12 text-yellow-400" />
          <h2 className="mt-4 text-lg font-semibold text-yellow-800">Hold Cannot Be Edited</h2>
          <p className="mt-2 text-sm text-yellow-600">
            Only active holds can be edited. Current status: {hold.status}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/quality/holds/${holdId}`)}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/quality/holds/${holdId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-yellow-600" />
          <h1 className="text-2xl font-bold font-mono">{hold.hold_number}</h1>
        </div>
        <HoldStatusBadge status={hold.status} />
      </div>

      {/* Edit Form */}
      <div className="max-w-2xl rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Hold Details</h2>
        </div>
        <Separator />

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason *</Label>
          <Textarea
            id="reason"
            placeholder="Enter the reason for this hold (min 10 characters)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{reason.length}/500 characters</span>
            {reason.length < 10 && <span className="text-red-600">Min 10 characters required</span>}
          </div>
        </div>

        {/* Hold Type */}
        <div className="space-y-2">
          <Label htmlFor="hold-type">Hold Type *</Label>
          <Select value={holdType} onValueChange={(value) => setHoldType(value as HoldType)}>
            <SelectTrigger id="hold-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOLD_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current values display */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
          <div>
            <p className="text-xs text-gray-600">Current Type</p>
            <p className="font-medium">
              <HoldTypeBadge holdType={hold.hold_type} />
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Current Priority</p>
            <p className="font-medium">
              <HoldPriorityBadge priority={hold.priority} />
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Status</p>
            <p className="font-medium">
              <HoldStatusBadge status={hold.status} />
            </p>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/quality/holds/${holdId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
