/**
 * Planning Settings Page
 * Story 3.5: Configurable PO Statuses
 * Story 3.22: Planning Settings Extended - TO/WO settings
 *
 * Tabs: [PO Settings] [TO Settings] [WO Settings]
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  ShoppingCart,
  Truck,
  Factory,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  Save,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface POStatus {
  code: string
  label: string
  color: string
  is_default: boolean
  sequence: number
}

interface PlanningSettings {
  id: string
  org_id: string
  po_statuses: POStatus[]
  po_default_status: string
  po_require_approval: boolean
  po_approval_threshold: number | null
  po_payment_terms_visible: boolean
  po_shipping_method_visible: boolean
  po_notes_visible: boolean
  // TO Settings (to be added in migration)
  to_statuses?: POStatus[]
  to_allow_partial?: boolean
  to_require_lp_selection?: boolean
  // WO Settings (to be added in migration)
  wo_statuses?: POStatus[]
  wo_status_expiry?: number
  wo_source_of_demand?: string
  wo_material_check?: boolean
  wo_copy_routing?: boolean
}

const COLORS = [
  { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-800' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-800' },
  { value: 'green', label: 'Green', class: 'bg-green-100 text-green-800' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-800' },
  { value: 'red', label: 'Red', class: 'bg-red-100 text-red-800' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-800' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-800' },
]

export default function PlanningSettingsPage() {
  const [settings, setSettings] = useState<PlanningSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<POStatus | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingStatus, setDeletingStatus] = useState<POStatus | null>(null)
  const [statusForm, setStatusForm] = useState({
    code: '',
    label: '',
    color: 'gray',
    is_default: false,
  })
  const { toast } = useToast()

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/planning/settings')

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load planning settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Save settings
  const saveSettings = async (updatedSettings: Partial<PlanningSettings>) => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/planning/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          ...updatedSettings,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      const data = await response.json()
      setSettings(data.settings)

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle approval toggle
  const handleApprovalToggle = (checked: boolean) => {
    if (!settings) return
    saveSettings({ po_require_approval: checked })
  }

  // Handle approval threshold change
  const handleThresholdChange = (value: string) => {
    if (!settings) return
    const threshold = parseFloat(value)
    if (!isNaN(threshold) && threshold > 0) {
      saveSettings({ po_approval_threshold: threshold })
    }
  }

  // Open add status modal
  const openAddStatusModal = () => {
    setEditingStatus(null)
    setStatusForm({
      code: '',
      label: '',
      color: 'gray',
      is_default: false,
    })
    setStatusModalOpen(true)
  }

  // Open edit status modal
  const openEditStatusModal = (status: POStatus) => {
    setEditingStatus(status)
    setStatusForm({
      code: status.code,
      label: status.label,
      color: status.color,
      is_default: status.is_default,
    })
    setStatusModalOpen(true)
  }

  // Handle status form submit
  const handleStatusSubmit = async () => {
    if (!settings) return

    const code = statusForm.code.toLowerCase().replace(/[^a-z0-9_-]/g, '_')

    if (!code || !statusForm.label) {
      toast({
        title: 'Error',
        description: 'Code and label are required',
        variant: 'destructive',
      })
      return
    }

    let newStatuses = [...settings.po_statuses]

    if (editingStatus) {
      // Update existing status
      const index = newStatuses.findIndex((s) => s.code === editingStatus.code)
      if (index !== -1) {
        newStatuses[index] = {
          ...newStatuses[index],
          label: statusForm.label,
          color: statusForm.color,
          is_default: statusForm.is_default,
        }
      }
    } else {
      // Check for duplicate code
      if (newStatuses.some((s) => s.code === code)) {
        toast({
          title: 'Error',
          description: 'Status code already exists',
          variant: 'destructive',
        })
        return
      }

      // Add new status
      const maxSequence = Math.max(...newStatuses.map((s) => s.sequence), 0)
      newStatuses.push({
        code,
        label: statusForm.label,
        color: statusForm.color,
        is_default: statusForm.is_default,
        sequence: maxSequence + 1,
      })
    }

    // Handle default status
    if (statusForm.is_default) {
      newStatuses = newStatuses.map((s) => ({
        ...s,
        is_default: s.code === code || (editingStatus && s.code === editingStatus.code),
      }))
    }

    // Ensure at least one default
    if (!newStatuses.some((s) => s.is_default)) {
      newStatuses[0].is_default = true
    }

    const defaultStatus = newStatuses.find((s) => s.is_default)?.code || newStatuses[0]?.code

    await saveSettings({
      po_statuses: newStatuses,
      po_default_status: defaultStatus,
    })

    setStatusModalOpen(false)
  }

  // Open delete status dialog
  const openDeleteDialog = (status: POStatus) => {
    setDeletingStatus(status)
    setDeleteDialogOpen(true)
  }

  // Handle delete status
  const handleDeleteStatus = async () => {
    if (!settings || !deletingStatus) return

    // Don't allow deleting the last status
    if (settings.po_statuses.length <= 1) {
      toast({
        title: 'Error',
        description: 'Cannot delete the last status',
        variant: 'destructive',
      })
      setDeleteDialogOpen(false)
      return
    }

    let newStatuses = settings.po_statuses.filter((s) => s.code !== deletingStatus.code)

    // If we deleted the default, set first one as default
    if (deletingStatus.is_default && newStatuses.length > 0) {
      newStatuses[0].is_default = true
    }

    // Resequence
    newStatuses = newStatuses.map((s, i) => ({ ...s, sequence: i + 1 }))

    const defaultStatus = newStatuses.find((s) => s.is_default)?.code || newStatuses[0]?.code

    await saveSettings({
      po_statuses: newStatuses,
      po_default_status: defaultStatus,
    })

    setDeleteDialogOpen(false)
    setDeletingStatus(null)
  }

  // Handle set default status
  const handleSetDefault = async (status: POStatus) => {
    if (!settings) return

    const newStatuses = settings.po_statuses.map((s) => ({
      ...s,
      is_default: s.code === status.code,
    }))

    await saveSettings({
      po_statuses: newStatuses,
      po_default_status: status.code,
    })
  }

  // Get color badge class
  const getColorClass = (color: string) => {
    return COLORS.find((c) => c.value === color)?.class || COLORS[0].class
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-gray-500">Failed to load settings</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Planning Settings</h1>
        {saving && (
          <div className="flex items-center text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </div>
        )}
      </div>

      <Tabs defaultValue="po" className="space-y-6">
        <TabsList>
          <TabsTrigger value="po" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            PO Settings
          </TabsTrigger>
          <TabsTrigger value="to" className="gap-2">
            <Truck className="h-4 w-4" />
            TO Settings
          </TabsTrigger>
          <TabsTrigger value="wo" className="gap-2">
            <Factory className="h-4 w-4" />
            WO Settings
          </TabsTrigger>
        </TabsList>

        {/* PO Settings Tab */}
        <TabsContent value="po" className="space-y-6">
          {/* Approval Settings */}
          <div className="border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold">PO Approval</h2>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require-approval">Require Approval for POs</Label>
                <p className="text-sm text-gray-500">
                  POs exceeding the threshold will require manager approval
                </p>
              </div>
              <Switch
                id="require-approval"
                checked={settings.po_require_approval}
                onCheckedChange={handleApprovalToggle}
              />
            </div>

            {settings.po_require_approval && (
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <Label htmlFor="approval-threshold">Approval Threshold</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="approval-threshold"
                      type="number"
                      value={settings.po_approval_threshold || ''}
                      onChange={(e) => handleThresholdChange(e.target.value)}
                      placeholder="5000"
                      min="0"
                      step="100"
                    />
                    <span className="text-sm text-gray-500">PLN</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    POs with total above this amount will require approval
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* PO Statuses */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">PO Statuses</h2>
              <Button onClick={openAddStatusModal} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Status
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Seq</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.po_statuses
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((status) => (
                    <TableRow key={status.code}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{status.code}</TableCell>
                      <TableCell>{status.label}</TableCell>
                      <TableCell>
                        <Badge className={getColorClass(status.color)}>
                          {status.color}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {status.is_default ? (
                          <Badge variant="default">Default</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(status)}
                          >
                            Set Default
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{status.sequence}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditStatusModal(status)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(status)}
                            disabled={settings.po_statuses.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Field Visibility */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Field Visibility</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="payment-terms-visible">Payment Terms</Label>
                <Switch
                  id="payment-terms-visible"
                  checked={settings.po_payment_terms_visible}
                  onCheckedChange={(checked) =>
                    saveSettings({ po_payment_terms_visible: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="shipping-method-visible">Shipping Method</Label>
                <Switch
                  id="shipping-method-visible"
                  checked={settings.po_shipping_method_visible}
                  onCheckedChange={(checked) =>
                    saveSettings({ po_shipping_method_visible: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notes-visible">Notes</Label>
                <Switch
                  id="notes-visible"
                  checked={settings.po_notes_visible}
                  onCheckedChange={(checked) => saveSettings({ po_notes_visible: checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TO Settings Tab */}
        <TabsContent value="to" className="space-y-6">
          <div className="border rounded-lg p-6">
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Transfer Order Settings</h3>
              <p className="text-gray-500">
                Transfer Order settings will be available in a future update.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* WO Settings Tab */}
        <TabsContent value="wo" className="space-y-6">
          <div className="border rounded-lg p-6">
            <div className="text-center py-8">
              <Factory className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Work Order Settings</h3>
              <p className="text-gray-500">
                Work Order settings will be available in a future update.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Edit Status' : 'Add Status'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? 'Update the status configuration'
                : 'Create a new PO status'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-code">Code</Label>
              <Input
                id="status-code"
                value={statusForm.code}
                onChange={(e) =>
                  setStatusForm((prev) => ({
                    ...prev,
                    code: e.target.value.toLowerCase(),
                  }))
                }
                placeholder="e.g., approved"
                disabled={!!editingStatus}
              />
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, underscores, and hyphens only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-label">Label</Label>
              <Input
                id="status-label"
                value={statusForm.label}
                onChange={(e) =>
                  setStatusForm((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="e.g., Approved"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-color">Color</Label>
              <Select
                value={statusForm.color}
                onValueChange={(value) =>
                  setStatusForm((prev) => ({ ...prev, color: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={color.class}>{color.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="status-default">Set as Default</Label>
              <Switch
                id="status-default"
                checked={statusForm.is_default}
                onCheckedChange={(checked) =>
                  setStatusForm((prev) => ({ ...prev, is_default: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Status Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the status &quot;{deletingStatus?.label}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingStatus(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStatus}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
