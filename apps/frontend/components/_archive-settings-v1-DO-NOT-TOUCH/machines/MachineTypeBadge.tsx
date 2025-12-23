/**
 * MachineTypeBadge Component
 * Story: 01.10 - Machines CRUD
 *
 * Displays machine type badge with color coding
 * 9 types: MIXER=blue, OVEN=orange, FILLER=purple, PACKAGING=green,
 *          CONVEYOR=gray, BLENDER=cyan, CUTTER=red, LABELER=yellow, OTHER=slate
 */

'use client'

import { Badge } from '@/components/ui/badge'
import type { MachineType } from '@/lib/types/machine'
import { MACHINE_TYPE_LABELS, MACHINE_TYPE_COLORS } from '@/lib/types/machine'
import {
  Blend,
  Box,
  Flame,
  Scissors,
  Settings,
  Tag,
  Wind,
  Waves,
  Package,
} from 'lucide-react'

const MACHINE_TYPE_ICONS: Record<MachineType, typeof Settings> = {
  MIXER: Waves,
  OVEN: Flame,
  FILLER: Wind,
  PACKAGING: Package,
  CONVEYOR: Box,
  BLENDER: Blend,
  CUTTER: Scissors,
  LABELER: Tag,
  OTHER: Settings,
}

interface MachineTypeBadgeProps {
  type: MachineType
  showIcon?: boolean
}

export function MachineTypeBadge({ type, showIcon = true }: MachineTypeBadgeProps) {
  const Icon = MACHINE_TYPE_ICONS[type]
  const { bg, text } = MACHINE_TYPE_COLORS[type]
  const label = MACHINE_TYPE_LABELS[type]

  return (
    <Badge variant="secondary" className={`${bg} ${text} border-none font-medium`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  )
}
