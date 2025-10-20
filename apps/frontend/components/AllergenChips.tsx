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
  onToggle: (id: number) => void;
}

export default function AllergenChips({ allergens, selectedIds, onToggle }: AllergenChipsProps) {
  const ids = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div className="flex flex-wrap gap-2">
      {allergens.map(a => {
        const active = ids.has(a.id);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onToggle(a.id)}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            style={{ transform: 'scale(0.7)', transformOrigin: 'left center' }}
            aria-pressed={active}
          >
            {a.code} — {a.name}
          </button>
        );
      })}
    </div>
  );
}


