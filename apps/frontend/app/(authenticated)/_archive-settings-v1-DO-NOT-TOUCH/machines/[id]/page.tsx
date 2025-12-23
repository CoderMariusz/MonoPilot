/**
 * Machine Detail Page
 * Story: 1.14 (AC-2.4) Machine Detail Page
 *
 * Displays detailed information about a specific machine including:
 * - Basic info (code, name, status, capacity)
 * - Assigned production lines
 * - Machine metadata (created, updated)
 * - Future: Active WOs (Epic 4 integration)
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Machine } from '@/lib/types/machine'

export default function MachineDetailPage() {
  const router = useRouter()
  const params = useParams()
  const machineId = params.id as string

  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/settings/machines/${machineId}`)

        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: 'Error',
              description: 'Machine not found',
              variant: 'destructive',
            })
            router.push('/settings/machines')
            return
          }
          throw new Error('Failed to fetch machine')
        }

        const data = await response.json()
        setMachine(data)
      } catch (error) {
        console.error('Error fetching machine:', error)
        toast({
          title: 'Error',
          description: 'Failed to load machine details',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (machineId) {
      fetchMachine()
    }
  }, [machineId, router, toast])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      down: 'destructive',
      maintenance: 'secondary',
      retired: 'outline',
    }

    const labels: Record<string, string> = {
      active: 'Active',
      down: 'Down',
      maintenance: 'Maintenance',
      retired: 'Retired',
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Machine not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/settings/machines')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Machines
          </Button>
          <h1 className="text-2xl font-bold">{machine.code}</h1>
        </div>

        <Button
          onClick={() => router.push(`/settings/machines?edit=${machineId}`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Machine
        </Button>
      </div>

      {/* Machine Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Machine Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="text-sm font-medium text-gray-500">Code</label>
              <p className="text-lg font-mono">{machine.code}</p>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{machine.name}</p>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(machine.status)}</div>
            </div>

            {/* Capacity */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Capacity per Hour
              </label>
              <p className="text-lg">
                {machine.units_per_hour
                  ? `${machine.units_per_hour.toLocaleString()} units/hour`
                  : 'Not specified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Production Lines Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assigned Production Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Production line assignments will be available in Story 01.11</p>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-sm">
                {new Date(machine.created_at).toLocaleString('pl-PL', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-sm">
                {new Date(machine.updated_at).toLocaleString('pl-PL', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future: Active Work Orders Card (Epic 4 integration) */}
      {/* <Card className="mt-6">
        <CardHeader>
          <CardTitle>Active Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Work order tracking will be available in Epic 4
          </p>
        </CardContent>
      </Card> */}
    </div>
  )
}
