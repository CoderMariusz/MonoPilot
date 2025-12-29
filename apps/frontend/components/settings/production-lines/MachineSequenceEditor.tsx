/**
 * Machine Sequence Editor Component
 * Story: 01.11 - Production Lines CRUD
 * Purpose: Drag-drop machine list with sequence ordering using dnd-kit
 */

'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { LineMachine } from '@/lib/types/production-line'
import type { MachineStatus } from '@/lib/types/machine'
import { MACHINE_STATUS_COLORS, MACHINE_STATUS_LABELS } from '@/lib/types/machine'

interface MachineForSelection {
  id: string
  code: string
  name: string
  status: MachineStatus
  units_per_hour: number | null
}

interface MachineSequenceEditorProps {
  machines: LineMachine[]
  availableMachines: MachineForSelection[]
  onChange: (machines: LineMachine[]) => void
  maxMachines?: number
}

interface SortableMachineItemProps {
  machine: LineMachine
  sequence: number
  onRemove: (id: string) => void
  isBottleneck?: boolean
}

function SortableMachineItem({
  machine,
  sequence,
  onRemove,
  isBottleneck,
}: SortableMachineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: machine.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const statusColors = MACHINE_STATUS_COLORS[machine.status]
  const statusLabel = MACHINE_STATUS_LABELS[machine.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-md ${isDragging ? 'opacity-50 shadow-lg' : ''
        } ${isBottleneck ? 'border-orange-500 border-2' : 'border-gray-200'}`}
      data-testid={machine.id}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label={`Drag to reorder ${machine.code}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Sequence Number */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold">
        {sequence}
      </div>

      {/* Machine Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{machine.code}</span>
          <Badge
            variant="outline"
            className={`${statusColors.bg} ${statusColors.text} border-0 text-xs`}
          >
            {statusLabel}
          </Badge>
          {isBottleneck && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-0 text-xs" title="Bottleneck">
              Bottleneck
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{machine.name}</p>
      </div>

      {/* Capacity */}
      <div className="text-sm text-muted-foreground whitespace-nowrap">
        {machine.units_per_hour !== null ? `${machine.units_per_hour} u/hr` : '--'}
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(machine.id)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        aria-label={`Remove ${machine.code}`}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function MachineSequenceEditor({
  machines,
  availableMachines,
  onChange,
  maxMachines = 20,
}: MachineSequenceEditorProps) {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('')

  // Configure sensors for drag-drop with keyboard support
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Calculate bottleneck machine
  const bottleneckMachineId =
    machines.length > 0
      ? machines
        .filter((m) => m.units_per_hour !== null)
        .reduce((min, m) =>
          !min || (m.units_per_hour! < min.units_per_hour!) ? m : min
          , machines[0] as LineMachine | undefined)?.id
      : undefined

  // Handle drag end - reorder and renumber
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = machines.findIndex((m) => m.id === active.id)
    const newIndex = machines.findIndex((m) => m.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Reorder array
    const reordered = [...machines]
    const [movedItem] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, movedItem)

    // Renumber sequences (1, 2, 3... no gaps)
    const renumbered = reordered.map((m, index) => ({
      ...m,
      sequence_order: index + 1,
    }))

    onChange(renumbered)
  }

  // Add machine to sequence
  const handleAddMachine = (machineId: string) => {
    if (!machineId) return

    const machineToAdd = availableMachines.find((m) => m.id === machineId)
    if (!machineToAdd) return

    // Check if already assigned
    if (machines.some((m) => m.id === machineId)) {
      return
    }

    // Check max machines
    if (machines.length >= maxMachines) {
      return
    }

    // Add to end of sequence
    const newMachine: LineMachine = {
      id: machineToAdd.id,
      code: machineToAdd.code,
      name: machineToAdd.name,
      status: machineToAdd.status,
      units_per_hour: machineToAdd.units_per_hour,
      sequence_order: machines.length + 1,
    }

    onChange([...machines, newMachine])
    setSelectedMachineId('')
  }

  // Remove machine from sequence
  const handleRemoveMachine = (machineId: string) => {
    const filtered = machines.filter((m) => m.id !== machineId)
    // Renumber after removal
    const renumbered = filtered.map((m, index) => ({
      ...m,
      sequence_order: index + 1,
    }))
    onChange(renumbered)
  }

  // Get machine IDs already assigned
  const assignedMachineIds = new Set(machines.map((m) => m.id))

  // Filter available machines (exclude already assigned + inactive)
  const selectableMachines = availableMachines.filter(
    (m) => !assignedMachineIds.has(m.id) && m.status !== 'OFFLINE'
  )

  const isMaxReached = machines.length >= maxMachines

  return (
    <div className="space-y-4">
      {/* Add Machine Dropdown */}
      <div className="flex gap-2">
        <Select
          value={selectedMachineId}
          onValueChange={handleAddMachine}
          disabled={isMaxReached}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={isMaxReached ? `Maximum ${maxMachines} machines allowed` : 'Add Machine'} />
          </SelectTrigger>
          <SelectContent>
            {selectableMachines.map((machine) => (
              <SelectItem key={machine.id} value={machine.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{machine.code}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{machine.name}</span>
                  {machine.units_per_hour && (
                    <span className="text-xs text-muted-foreground">
                      ({machine.units_per_hour}/hr)
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
            {selectableMachines.length === 0 && (
              <SelectItem value="__no_machines__" disabled>
                No machines available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Machine List - Empty State */}
      {machines.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No machines assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first machine to define the production flow
          </p>
        </div>
      )}

      {/* Machine List - Drag-Drop */}
      {machines.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={machines.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2" role="status" aria-live="polite">
              {machines.map((machine) => (
                <SortableMachineItem
                  key={machine.id}
                  machine={machine}
                  sequence={machine.sequence_order}
                  onRemove={handleRemoveMachine}
                  isBottleneck={machine.id === bottleneckMachineId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Info text */}
      {machines.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Drag machines to reorder the production sequence. Capacity is calculated from the bottleneck (slowest) machine.
        </p>
      )}
    </div>
  )
}
