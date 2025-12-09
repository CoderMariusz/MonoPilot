'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id: string
  code: string
  name: string
  warehouse?: {
    id: string
    code: string
    name: string
  }
}

interface StartCountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (count: any) => void
}

type CountReason = 'cycle_count' | 'audit' | 'recount' | ''

export function StartCountDialog({ open, onOpenChange, onSuccess }: StartCountDialogProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [reason, setReason] = useState<CountReason>('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadLocations()
    }
  }, [open])

  async function loadLocations() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id, code, name,
          warehouse:warehouses (id, code, name)
        `)
        .eq('is_active', true)
        .in('type', ['storage', 'receiving', 'shipping', 'production'])
        .order('code')

      if (error) throw error
      // Map warehouse array to single object (Supabase returns array for single relation)
      const mappedData = (data || []).map((loc: any) => ({
        ...loc,
        warehouse: Array.isArray(loc.warehouse) ? loc.warehouse[0] : loc.warehouse,
      }))
      setLocations(mappedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!selectedLocation) {
      setError('Please select a location')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/warehouse/inventory-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: selectedLocation,
          reason: reason || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start count')
      }

      onSuccess(result.data)
      onOpenChange(false)
      setSelectedLocation('')
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start count')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Inventory Count</DialogTitle>
          <DialogDescription>
            Select a location to begin physical inventory count.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading locations...
              </div>
            ) : (
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                      {loc.warehouse && ` (${loc.warehouse.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as CountReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cycle_count">Cycle Count</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="recount">Recount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedLocation}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Count
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
