/**
 * MachineCapacityDisplay Component
 * Story: 01.10 - Machines CRUD
 *
 * Displays machine capacity information
 * Fields: units_per_hour, setup_time_minutes, max_batch_size
 */

'use client'

interface MachineCapacityDisplayProps {
  units_per_hour: number | null
  setup_time_minutes: number | null
  max_batch_size: number | null
}

export function MachineCapacityDisplay({
  units_per_hour,
  setup_time_minutes,
  max_batch_size,
}: MachineCapacityDisplayProps) {
  const items = []

  if (units_per_hour !== null) {
    items.push(`${units_per_hour} u/hr`)
  }

  if (setup_time_minutes !== null) {
    items.push(`${setup_time_minutes} min setup`)
  }

  if (max_batch_size !== null) {
    items.push(`Max: ${max_batch_size}`)
  }

  if (items.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>
  }

  return (
    <div className="text-sm text-muted-foreground">
      {items.join(' • ')}
    </div>
  )
}
