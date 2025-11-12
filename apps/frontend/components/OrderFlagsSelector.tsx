'use client';

import React from 'react';

/**
 * EPIC-001 Phase 4: UI Components
 * Order Flags Selector for Work Order Creation
 *
 * Allows selecting multiple order flags (organic, gluten-free, vegan, etc.)
 * Used in CreateWorkOrderModal to specify order requirements
 */

export interface OrderFlag {
  value: string;
  label: string;
  description?: string;
}

// Predefined order flags (can be extended)
export const AVAILABLE_ORDER_FLAGS: OrderFlag[] = [
  {
    value: 'organic',
    label: 'Organic',
    description: 'Uses organic ingredients',
  },
  {
    value: 'gluten_free',
    label: 'Gluten-Free',
    description: 'No gluten-containing ingredients',
  },
  {
    value: 'vegan',
    label: 'Vegan',
    description: 'No animal-derived ingredients',
  },
  {
    value: 'vegetarian',
    label: 'Vegetarian',
    description: 'No meat ingredients',
  },
  {
    value: 'kosher',
    label: 'Kosher',
    description: 'Kosher certified ingredients',
  },
  {
    value: 'halal',
    label: 'Halal',
    description: 'Halal certified ingredients',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Premium quality ingredients',
  },
  {
    value: 'custom_packaging',
    label: 'Custom Packaging',
    description: 'Special packaging requirements',
  },
  {
    value: 'allergen_free',
    label: 'Allergen-Free',
    description: 'Free from common allergens',
  },
  {
    value: 'lactose_free',
    label: 'Lactose-Free',
    description: 'No lactose-containing ingredients',
  },
];

interface OrderFlagsSelectorProps {
  selectedFlags: string[];
  onChange: (flags: string[]) => void;
  disabled?: boolean;
  showDescriptions?: boolean;
  availableFlags?: OrderFlag[];
}

export default function OrderFlagsSelector({
  selectedFlags,
  onChange,
  disabled = false,
  showDescriptions = true,
  availableFlags = AVAILABLE_ORDER_FLAGS,
}: OrderFlagsSelectorProps) {
  const handleToggle = (flagValue: string) => {
    if (disabled) return;

    if (selectedFlags.includes(flagValue)) {
      // Remove flag
      onChange(selectedFlags.filter((f) => f !== flagValue));
    } else {
      // Add flag
      onChange([...selectedFlags, flagValue]);
    }
  };

  const handleClearAll = () => {
    if (!disabled) {
      onChange([]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Order Flags
          {selectedFlags.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              ({selectedFlags.length} selected)
            </span>
          )}
        </label>
        {selectedFlags.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {availableFlags.map((flag) => {
          const isSelected = selectedFlags.includes(flag.value);

          return (
            <label
              key={flag.value}
              className={`
                relative flex items-start p-3 border rounded-lg cursor-pointer
                transition-colors duration-150
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(flag.value)}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 flex-1">
                <span className="block text-sm font-medium text-gray-900">
                  {flag.label}
                </span>
                {showDescriptions && flag.description && (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {flag.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {selectedFlags.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          No order flags selected. All unconditional materials will be used.
        </p>
      )}

      {selectedFlags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFlags.map((flagValue) => {
            const flag = availableFlags.find((f) => f.value === flagValue);
            return (
              <span
                key={flagValue}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {flag?.label || flagValue}
                <button
                  type="button"
                  onClick={() => handleToggle(flagValue)}
                  disabled={disabled}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 disabled:hover:bg-blue-100"
                >
                  <span className="sr-only">Remove {flag?.label}</span>
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
