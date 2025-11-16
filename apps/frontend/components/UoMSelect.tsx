/**
 * UoM Select Component
 * Story 0.5: Fix LP UoM Constraint
 * 
 * Reusable dropdown for selecting Units of Measure.
 * Fetches valid UoMs from uom_master table via API.
 * 
 * @component
 */

'use client';

import React, { useEffect, useState } from 'react';
import { LicensePlatesAPI } from '../lib/api/licensePlates';
import type { UoM } from '../lib/types';

interface UoMSelectProps {
  value: UoM | string;
  onChange: (uom: UoM) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showDisplayNames?: boolean;
}

interface UoMOption {
  code: string;
  display_name: string;
  category: string;
}

export default function UoMSelect({
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  showDisplayNames = true
}: UoMSelectProps) {
  const [uoms, setUoms] = useState<UoMOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUoMs();
  }, []);

  const loadUoMs = async () => {
    try {
      setLoading(true);
      const data = await LicensePlatesAPI.getValidUoMs();
      setUoms(data);
      setError(null);
    } catch (err) {
      console.error('Error loading UoMs:', err);
      setError('Failed to load units of measure');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as UoM);
  };

  const getDisplayLabel = (uom: UoMOption): string => {
    if (showDisplayNames) {
      return `${uom.code} - ${uom.display_name}`;
    }
    return uom.code;
  };

  // Group UoMs by category for better UX
  const groupedUoMs = uoms.reduce((acc, uom) => {
    if (!acc[uom.category]) {
      acc[uom.category] = [];
    }
    acc[uom.category].push(uom);
    return acc;
  }, {} as Record<string, UoMOption[]>);

  const categoryOrder = ['weight', 'volume', 'length', 'count', 'container'];

  if (loading) {
    return (
      <select 
        disabled 
        className={`w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 ${className}`}
      >
        <option>Loading...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="flex gap-2">
        <select 
          disabled 
          className={`flex-1 px-3 py-2 border border-red-300 rounded-md bg-red-50 ${className}`}
        >
          <option>Error loading UoMs</option>
        </select>
        <button
          type="button"
          onClick={loadUoMs}
          className="px-3 py-2 text-sm bg-slate-600 text-white rounded hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      className={`w-full px-3 py-2 border border-slate-300 rounded-md disabled:bg-slate-100 disabled:cursor-not-allowed ${className}`}
    >
      <option value="">Select unit...</option>
      {categoryOrder.map(category => {
        const categoryUoms = groupedUoMs[category];
        if (!categoryUoms || categoryUoms.length === 0) return null;
        
        return (
          <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
            {categoryUoms.map(uom => (
              <option key={uom.code} value={uom.code}>
                {getDisplayLabel(uom)}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
