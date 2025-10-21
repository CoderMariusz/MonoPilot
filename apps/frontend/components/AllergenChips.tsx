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
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'}`}
            aria-pressed={active}
          >
            {a.code} — {a.name}
          </button>
        );
      })}
    </div>
  );
}


