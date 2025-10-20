"use client";
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client-browser';

interface ProductOption {
  id: number;
  part_number: string;
  description: string;
  uom?: string;
  product_group?: string;
  product_type?: string;
}

interface ProductSelectProps {
  value?: number | null;
  onChange: (product: ProductOption | null) => void;
  placeholder?: string;
  allowedGroups?: Array<'MEAT' | 'DRYGOODS' | 'COMPOSITE'>; // default RM/DG/PR allowed
}

export default function ProductSelect({ value, onChange, placeholder = 'Search product…', allowedGroups }: ProductSelectProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);

  const groups = useMemo(() => allowedGroups ?? ['MEAT', 'DRYGOODS', 'COMPOSITE'], [allowedGroups]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const like = `%${query}%`;
      const { data, error } = await supabase
        .from('products')
        .select('id, part_number, description, uom, product_group, product_type')
        .ilike('part_number', like)
        .in('product_group', groups)
        .limit(20);
      if (!active) return;
      if (error) {
        setOptions([]);
      } else {
        setOptions(data as ProductOption[]);
      }
      setLoading(false);
    };
    const t = setTimeout(run, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, groups]);

  return (
    <div className="relative">
      <input
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && (
        <div className="absolute right-2 top-2 text-slate-400 text-xs">…</div>
      )}
      {query && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border border-slate-200 rounded-md shadow">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No results</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setQuery(`${opt.part_number} — ${opt.description}`);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                <div className="font-medium text-slate-900">{opt.part_number}</div>
                <div className="text-slate-600">{opt.description}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}


