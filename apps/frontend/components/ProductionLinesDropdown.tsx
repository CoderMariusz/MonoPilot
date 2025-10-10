'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Machine {
  id: number;
  name: string;
}

interface ProductionLinesDropdownProps {
  selectedLines: string[];
  onChange: (lines: string[]) => void;
  machines: Machine[];
  disabled?: boolean;
}

export default function ProductionLinesDropdown({
  selectedLines,
  onChange,
  machines,
  disabled = false
}: ProductionLinesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Display text logic
  const getDisplayText = () => {
    if (!selectedLines || selectedLines.length === 0) {
      return 'Select lines...';
    }
    if (selectedLines.includes('ALL')) {
      return 'All lines';
    }
    if (selectedLines.length === 1) {
      const machine = machines.find(m => String(m.id) === selectedLines[0]);
      return machine ? machine.name : '1 line selected';
    }
    return `${selectedLines.length} lines selected`;
  };

  const handleToggle = (value: string) => {
    if (value === 'ALL') {
      // Toggle ALL on/off
      if (selectedLines?.includes('ALL')) {
        onChange([]);
      } else {
        onChange(['ALL']);
      }
    } else {
      const currentLines = selectedLines.filter(l => l !== 'ALL');
      if (currentLines.includes(value)) {
        const newLines = currentLines.filter(l => l !== value);
        onChange(newLines.length === 0 ? [] : newLines);
      } else {
        onChange([...currentLines, value]);
      }
    }
  };

  const isChecked = (value: string) => {
    if (value === 'ALL') {
      return selectedLines?.includes('ALL') || false;
    }
    return selectedLines && selectedLines.includes(value) && !selectedLines.includes('ALL');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white ${
          disabled ? 'bg-slate-100 cursor-not-allowed' : 'hover:bg-slate-50'
        } border-slate-300`}
      >
        <span className="text-slate-700">{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <label className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked('ALL')}
              onChange={() => handleToggle('ALL')}
              className="mr-2 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-sm text-slate-700">ALL (Any Line)</span>
          </label>
          {machines.map(machine => (
            <label key={machine.id} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked(String(machine.id))}
                onChange={() => handleToggle(String(machine.id))}
                disabled={selectedLines?.includes('ALL')}
                className="mr-2 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 disabled:opacity-50"
              />
              <span className={`text-sm ${selectedLines?.includes('ALL') ? 'text-slate-400' : 'text-slate-700'}`}>
                {machine.name}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
