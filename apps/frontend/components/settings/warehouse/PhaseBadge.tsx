/**
 * Phase Badge Component
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Displays phase indicator badges for warehouse settings sections
 */

import { Badge } from '@/components/ui/badge';

interface PhaseBadgeProps {
  phase: 0 | 1 | 2 | 3;
  showLabel?: boolean;
}

const phaseConfig = {
  0: {
    className: 'bg-red-100 text-red-800 border-red-200',
    label: 'Phase 0',
    short: 'P0',
  },
  1: {
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Phase 1',
    short: 'P1',
  },
  2: {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Phase 2',
    short: 'P2',
  },
  3: {
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Phase 3',
    short: 'P3',
  },
};

export function PhaseBadge({ phase, showLabel = false }: PhaseBadgeProps) {
  const config = phaseConfig[phase];

  return (
    <Badge variant="outline" className={config.className}>
      {showLabel ? config.label : config.short}
    </Badge>
  );
}
