"use client";
import { useMemo } from 'react';

interface Chip {
  id: number;
  code: string;
  name: string;
}

interface AllergenChipsProps {
  allergens: Chip[];
  selectedIds: number[];
  inheritedIds?: number[];  // NEW: allergens inherited from BOM components
  onToggle: (id: number) => void;
}

export default function AllergenChips({ allergens, selectedIds, inheritedIds = [], onToggle }: AllergenChipsProps) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const inheritedSet = useMemo(() => new Set(inheritedIds), [inheritedIds]);

  return (
    <div className="flex flex-wrap gap-2">
      {allergens.map(a => {
        const isSelected = selectedSet.has(a.id);
        const isInherited = inheritedSet.has(a.id);
        const isInheritedOnly = isInherited && !isSelected;
        
        // Determine styling based on state
        let buttonClass = '';
        let label = `${a.code} — ${a.name}`;
        
        if (isInheritedOnly) {
          // Inherited but not directly selected - grey
          buttonClass = 'bg-gray-200 text-gray-600 border-gray-300 cursor-default';
          label += ' (inherited)';
        } else if (isSelected) {
          // Directly selected - colored (blue)
          buttonClass = 'bg-blue-500 text-white border-blue-500';
          if (isInherited) {
            label += ' (direct + inherited)';
          }
        } else {
          // Not selected - default
          buttonClass = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
        }
        
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => !isInheritedOnly && onToggle(a.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${buttonClass}`}
            aria-pressed={isSelected}
            title={isInheritedOnly ? 'Inherited from BOM components (cannot be removed)' : 'Click to toggle'}
            disabled={isInheritedOnly}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}


