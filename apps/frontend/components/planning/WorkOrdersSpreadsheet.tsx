/**
 * Work Orders Spreadsheet Mode Component
 * Story 3.27: Work Orders Table + Spreadsheet Mode
 *
 * Features:
 * - Inline editable cells
 * - Drag-drop priority ordering
 * - Paste from Excel
 * - Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
 * - Keyboard navigation
 * - Bulk operations
 */

'use client'

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Checkbox } from '@/components/ui/checkbox'
import { GripVertical, Save, Undo2, ClipboardPaste, Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getStatusColor } from '@/lib/constants/app-colors'

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface Machine {
  id: string
  code: string
  name: string
}

interface WorkOrder {
  id: string
  wo_number: string
  product_id: string
  planned_quantity: number
  produced_quantity: number
  uom: string
  status: string
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  production_line_id: string | null
  priority?: number
  products?: Product
  machines?: Machine
  created_at: string
}

interface SpreadsheetRow extends WorkOrder {
  isEdited?: boolean
  errors?: { [key: string]: string }
}

interface UndoState {
  rows: SpreadsheetRow[]
  selectedRows: Set<string>
}

// Bulk actions bar component
function BulkActionsBar({
  selectedCount,
  onStatusChange,
  onLineChange,
  onDelete,
  machines,
}: {
  selectedCount: number
  onStatusChange: (status: string) => void
  onLineChange: (lineId: string) => void
  onDelete: () => void
  machines: Machine[]
}) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-blue-800">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2">
        <Select onValueChange={onStatusChange}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Change Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={onLineChange}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Assign Line" />
          </SelectTrigger>
          <SelectContent>
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )
}

export function WorkOrdersSpreadsheet() {
  const [rows, setRows] = useState<SpreadsheetRow[]>([])
  const [originalRows, setOriginalRows] = useState<SpreadsheetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [draggedRow, setDraggedRow] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<UndoState[]>([])
  const [redoStack, setRedoStack] = useState<UndoState[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const [pasteContent, setPasteContent] = useState('')
  const [machines, setMachines] = useState<Machine[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch work orders
  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/planning/work-orders?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      const workOrders = (data.work_orders || []).map((wo: WorkOrder, idx: number) => ({
        ...wo,
        priority: wo.priority ?? idx + 1,
        isEdited: false,
        errors: {},
      }))
      setRows(workOrders)
      setOriginalRows(JSON.parse(JSON.stringify(workOrders)))
    } catch (error) {
      console.error('Error:', error)
      toast({ title: 'Error', description: 'Failed to load work orders', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, toast])

  // Fetch machines and products for dropdowns
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [machinesRes, productsRes] = await Promise.all([
          fetch('/api/technical/machines'),
          fetch('/api/technical/products'),
        ])
        if (machinesRes.ok) {
          const data = await machinesRes.json()
          setMachines(data.machines || [])
        }
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching meta:', error)
      }
    }
    fetchMeta()
  }, [])

  useEffect(() => {
    fetchWorkOrders()
  }, [fetchWorkOrders])

  // Save undo state
  const saveUndoState = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-19), { rows: JSON.parse(JSON.stringify(rows)), selectedRows: new Set(selectedRows) }])
    setRedoStack([])
  }, [rows, selectedRows])

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return
    const lastState = undoStack[undoStack.length - 1]
    setRedoStack((prev) => [...prev, { rows: JSON.parse(JSON.stringify(rows)), selectedRows: new Set(selectedRows) }])
    setRows(lastState.rows)
    setSelectedRows(lastState.selectedRows)
    setUndoStack((prev) => prev.slice(0, -1))
  }, [undoStack, rows, selectedRows])

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return
    const lastState = redoStack[redoStack.length - 1]
    setUndoStack((prev) => [...prev, { rows: JSON.parse(JSON.stringify(rows)), selectedRows: new Set(selectedRows) }])
    setRows(lastState.rows)
    setSelectedRows(lastState.selectedRows)
    setRedoStack((prev) => prev.slice(0, -1))
  }, [redoStack, rows, selectedRows])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          redo()
        } else if (e.key === 's') {
          e.preventDefault()
          handleSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Update cell value
  const updateCell = (rowId: string, field: string, value: string | number) => {
    saveUndoState()
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, [field]: value, isEdited: true }
          : row
      )
    )
  }

  // Validate rows
  const validateRows = (): boolean => {
    let hasErrors = false
    const updatedRows = rows.map((row) => {
      const errors: { [key: string]: string } = {}

      if (!row.wo_number) errors.wo_number = 'Required'
      if (!row.product_id) errors.product_id = 'Required'
      if (row.planned_quantity <= 0) errors.planned_quantity = 'Must be > 0'
      if (!row.planned_start_date) errors.planned_start_date = 'Required'

      // Check for duplicate WO numbers
      const duplicates = rows.filter((r) => r.wo_number === row.wo_number && r.id !== row.id)
      if (duplicates.length > 0) errors.wo_number = 'Duplicate'

      if (Object.keys(errors).length > 0) hasErrors = true
      return { ...row, errors }
    })
    setRows(updatedRows)
    return !hasErrors
  }

  // Save changes
  const handleSave = async () => {
    if (!validateRows()) {
      toast({ title: 'Validation Error', description: 'Please fix errors before saving', variant: 'destructive' })
      return
    }

    const editedRows = rows.filter((r) => r.isEdited)
    if (editedRows.length === 0) {
      toast({ title: 'No Changes', description: 'No changes to save' })
      return
    }

    try {
      setSaving(true)

      // Save each edited row
      for (const row of editedRows) {
        const response = await fetch(`/api/planning/work-orders/${row.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: row.product_id,
            planned_quantity: row.planned_quantity,
            status: row.status,
            planned_start_date: row.planned_start_date,
            planned_end_date: row.planned_end_date,
            production_line_id: row.production_line_id,
            priority: row.priority,
          }),
        })
        if (!response.ok) throw new Error(`Failed to save ${row.wo_number}`)
      }

      toast({ title: 'Success', description: `Saved ${editedRows.length} work orders` })
      await fetchWorkOrders()
      setUndoStack([])
      setRedoStack([])
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, rowId: string) => {
    setDraggedRow(rowId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedRow || draggedRow === targetId) return

    saveUndoState()

    const draggedIndex = rows.findIndex((r) => r.id === draggedRow)
    const targetIndex = rows.findIndex((r) => r.id === targetId)

    const newRows = [...rows]
    const [removed] = newRows.splice(draggedIndex, 1)
    newRows.splice(targetIndex, 0, removed)

    // Update priorities
    const updatedRows = newRows.map((row, idx) => ({
      ...row,
      priority: idx + 1,
      isEdited: true,
    }))

    setRows(updatedRows)
    setDraggedRow(null)
  }

  // Row selection
  const toggleRowSelection = (rowId: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId)
    } else {
      newSelected.add(rowId)
    }
    setSelectedRows(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(rows.map((r) => r.id)))
    }
  }

  // Bulk operations
  const handleBulkStatusChange = (status: string) => {
    saveUndoState()
    setRows((prev) =>
      prev.map((row) =>
        selectedRows.has(row.id) ? { ...row, status, isEdited: true } : row
      )
    )
  }

  const handleBulkLineChange = (lineId: string) => {
    saveUndoState()
    setRows((prev) =>
      prev.map((row) =>
        selectedRows.has(row.id) ? { ...row, production_line_id: lineId, isEdited: true } : row
      )
    )
  }

  const handleBulkDelete = async () => {
    try {
      for (const rowId of selectedRows) {
        await fetch(`/api/planning/work-orders/${rowId}`, { method: 'DELETE' })
      }
      toast({ title: 'Success', description: `Deleted ${selectedRows.size} work orders` })
      setSelectedRows(new Set())
      await fetchWorkOrders()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete work orders', variant: 'destructive' })
    }
    setDeleteDialogOpen(false)
  }

  // Paste from Excel
  const handlePaste = () => {
    if (!pasteContent.trim()) return

    try {
      const lines = pasteContent.trim().split('\n')
      const newRows: Partial<SpreadsheetRow>[] = []

      for (const line of lines) {
        const cols = line.split('\t')
        if (cols.length >= 4) {
          // Expected format: WO#, Line, Product, Qty, Start Date
          const woNumber = cols[0]?.trim()
          const lineName = cols[1]?.trim()
          const productName = cols[2]?.trim()
          const qty = parseFloat(cols[3]) || 0
          const startDate = cols[4]?.trim() || new Date().toISOString().split('T')[0]

          const product = products.find((p) => p.name.toLowerCase() === productName.toLowerCase() || p.code.toLowerCase() === productName.toLowerCase())
          const machine = machines.find((m) => m.name.toLowerCase() === lineName.toLowerCase() || m.code.toLowerCase() === lineName.toLowerCase())

          if (product) {
            newRows.push({
              wo_number: woNumber,
              product_id: product.id,
              production_line_id: machine?.id || null,
              planned_quantity: qty,
              planned_start_date: startDate,
              status: 'draft',
              uom: product.uom,
            })
          }
        }
      }

      if (newRows.length > 0) {
        toast({ title: 'Parsed', description: `Found ${newRows.length} valid rows. Creating work orders...` })
        // TODO: Create work orders via API
      } else {
        toast({ title: 'No Data', description: 'Could not parse any valid rows', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to parse paste content', variant: 'destructive' })
    }

    setPasteDialogOpen(false)
    setPasteContent('')
  }

  // Cell keyboard navigation
  const handleCellKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowId: string, field: string) => {
    const rowIndex = rows.findIndex((r) => r.id === rowId)
    const fields = ['wo_number', 'production_line_id', 'product_id', 'planned_quantity', 'planned_start_date', 'status']
    const fieldIndex = fields.indexOf(field)

    if (e.key === 'Tab') {
      e.preventDefault()
      const nextFieldIndex = e.shiftKey ? fieldIndex - 1 : fieldIndex + 1
      if (nextFieldIndex >= 0 && nextFieldIndex < fields.length) {
        setEditingCell({ rowId, field: fields[nextFieldIndex] })
      } else if (nextFieldIndex >= fields.length && rowIndex < rows.length - 1) {
        setEditingCell({ rowId: rows[rowIndex + 1].id, field: fields[0] })
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (rowIndex < rows.length - 1) {
        setEditingCell({ rowId: rows[rowIndex + 1].id, field })
      } else {
        setEditingCell(null)
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const hasChanges = rows.some((r) => r.isEdited)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPasteDialogOpen(true)}
          >
            <ClipboardPaste className="h-4 w-4 mr-1" />
            Paste from Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={undoStack.length === 0}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedRows.size}
        onStatusChange={handleBulkStatusChange}
        onLineChange={handleBulkLineChange}
        onDelete={() => setDeleteDialogOpen(true)}
        machines={machines}
      />

      {/* Spreadsheet Grid */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-8 p-2">
                <Checkbox
                  checked={selectedRows.size === rows.length && rows.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
              </th>
              <th className="w-8 p-2"></th>
              <th className="p-2 text-left font-medium">WO #</th>
              <th className="p-2 text-left font-medium">Line</th>
              <th className="p-2 text-left font-medium">Product</th>
              <th className="p-2 text-left font-medium">Qty</th>
              <th className="p-2 text-left font-medium">Start Date</th>
              <th className="p-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  No work orders found
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, row.id)}
                  className={`border-b hover:bg-gray-50 ${
                    row.isEdited ? 'bg-yellow-50' : ''
                  } ${draggedRow === row.id ? 'opacity-50' : ''}`}
                >
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={selectedRows.has(row.id)}
                      onCheckedChange={() => toggleRowSelection(row.id)}
                    />
                  </td>
                  <td className="p-2 cursor-move">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </td>

                  {/* WO Number - Read Only */}
                  <td className="p-2">
                    <span className={`font-medium ${row.errors?.wo_number ? 'text-red-600' : ''}`}>
                      {row.wo_number}
                    </span>
                  </td>

                  {/* Production Line */}
                  <td className="p-2">
                    {editingCell?.rowId === row.id && editingCell.field === 'production_line_id' ? (
                      <Select
                        value={row.production_line_id || ''}
                        onValueChange={(val) => {
                          updateCell(row.id, 'production_line_id', val)
                          setEditingCell(null)
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {machines.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[28px]"
                        onClick={() => setEditingCell({ rowId: row.id, field: 'production_line_id' })}
                      >
                        {row.machines?.name || '-'}
                      </div>
                    )}
                  </td>

                  {/* Product */}
                  <td className="p-2">
                    <span className={row.errors?.product_id ? 'text-red-600' : ''}>
                      {row.products?.name || 'N/A'}
                    </span>
                  </td>

                  {/* Quantity */}
                  <td className="p-2">
                    {editingCell?.rowId === row.id && editingCell.field === 'planned_quantity' ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        value={row.planned_quantity}
                        onChange={(e) => updateCell(row.id, 'planned_quantity', parseFloat(e.target.value) || 0)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => handleCellKeyDown(e, row.id, 'planned_quantity')}
                        className="h-8 w-24"
                      />
                    ) : (
                      <div
                        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${
                          row.errors?.planned_quantity ? 'text-red-600' : ''
                        }`}
                        onClick={() => setEditingCell({ rowId: row.id, field: 'planned_quantity' })}
                      >
                        {row.planned_quantity} {row.uom}
                      </div>
                    )}
                  </td>

                  {/* Start Date */}
                  <td className="p-2">
                    {editingCell?.rowId === row.id && editingCell.field === 'planned_start_date' ? (
                      <Input
                        ref={inputRef}
                        type="date"
                        value={formatDate(row.planned_start_date)}
                        onChange={(e) => updateCell(row.id, 'planned_start_date', e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => handleCellKeyDown(e, row.id, 'planned_start_date')}
                        className="h-8"
                      />
                    ) : (
                      <div
                        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${
                          row.errors?.planned_start_date ? 'text-red-600' : ''
                        }`}
                        onClick={() => setEditingCell({ rowId: row.id, field: 'planned_start_date' })}
                      >
                        {formatDate(row.planned_start_date) || '-'}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-2">
                    {editingCell?.rowId === row.id && editingCell.field === 'status' ? (
                      <Select
                        value={row.status}
                        onValueChange={(val) => {
                          updateCell(row.id, 'status', val)
                          setEditingCell(null)
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="released">Released</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={() => setEditingCell({ rowId: row.id, field: 'status' })}
                      >
                        <Badge className={getStatusColor(row.status)}>
                          {row.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Keyboard hints */}
      <div className="text-xs text-gray-500 flex gap-4">
        <span>Tab: Next cell</span>
        <span>Enter: Next row</span>
        <span>Esc: Cancel edit</span>
        <span>Ctrl+Z: Undo</span>
        <span>Ctrl+S: Save</span>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.size} work order(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paste from Excel Dialog */}
      <AlertDialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Paste from Excel</AlertDialogTitle>
            <AlertDialogDescription>
              Paste rows from Excel. Expected format: WO#, Line, Product, Qty, Start Date (tab-separated)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            className="w-full h-48 p-3 border rounded-md font-mono text-sm"
            placeholder="Paste Excel content here..."
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePaste}>Parse & Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
