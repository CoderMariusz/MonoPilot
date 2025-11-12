'use client';

import React, { useState } from 'react';
import type { BomItemCondition, ConditionRule, ConditionOperator } from '@/lib/types';

/**
 * EPIC-001 Phase 4: UI Components
 * BOM Condition Editor Component
 *
 * Simple editor for creating/editing BOM item conditions
 * Allows adding rules with field/operator/value
 */

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In List' },
];

const COMMON_FIELDS = [
  { value: 'order_flags', label: 'Order Flags' },
  { value: 'customer_id', label: 'Customer ID' },
  { value: 'order_type', label: 'Order Type' },
  { value: 'region', label: 'Region' },
  { value: 'priority', label: 'Priority' },
];

interface BOMConditionEditorProps {
  condition: BomItemCondition | null;
  onChange: (condition: BomItemCondition | null) => void;
  disabled?: boolean;
}

export default function BOMConditionEditor({
  condition,
  onChange,
  disabled = false,
}: BOMConditionEditorProps) {
  const [isEnabled, setIsEnabled] = useState(condition !== null);

  const handleEnableToggle = () => {
    if (disabled) return;

    if (isEnabled) {
      // Disable conditions
      setIsEnabled(false);
      onChange(null);
    } else {
      // Enable with default condition
      setIsEnabled(true);
      onChange({
        type: 'OR',
        rules: [
          {
            field: 'order_flags',
            operator: 'contains',
            value: '',
          },
        ],
      });
    }
  };

  const handleTypeChange = (type: 'AND' | 'OR') => {
    if (!condition || disabled) return;
    onChange({ ...condition, type });
  };

  const handleAddRule = () => {
    if (!condition || disabled) return;
    onChange({
      ...condition,
      rules: [
        ...condition.rules,
        {
          field: 'order_flags',
          operator: 'contains',
          value: '',
        },
      ],
    });
  };

  const handleRemoveRule = (index: number) => {
    if (!condition || disabled) return;
    const newRules = condition.rules.filter((_, i) => i !== index);
    if (newRules.length === 0) {
      // If no rules left, disable condition
      setIsEnabled(false);
      onChange(null);
    } else {
      onChange({ ...condition, rules: newRules });
    }
  };

  const handleRuleChange = (
    index: number,
    field: keyof ConditionRule,
    value: any
  ) => {
    if (!condition || disabled) return;
    const newRules = [...condition.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onChange({ ...condition, rules: newRules });
  };

  return (
    <div className="space-y-3 border border-gray-300 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleEnableToggle}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Make this material conditional
          </span>
        </label>
      </div>

      {isEnabled && condition && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {/* Condition Type Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Condition Type
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleTypeChange('OR')}
                disabled={disabled}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md
                  ${
                    condition.type === 'OR'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                  disabled:opacity-50
                `}
              >
                OR (Any rule matches)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('AND')}
                disabled={disabled}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md
                  ${
                    condition.type === 'AND'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                  disabled:opacity-50
                `}
              >
                AND (All rules must match)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {condition.type === 'OR'
                ? 'Material is included if ANY rule matches'
                : 'Material is included only if ALL rules match'}
            </p>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Rules ({condition.rules.length})
            </label>

            {condition.rules.map((rule, index) => (
              <div
                key={index}
                className="flex items-end space-x-2 p-3 bg-gray-50 rounded-md"
              >
                {/* Field */}
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Field
                  </label>
                  <select
                    value={rule.field}
                    onChange={(e) =>
                      handleRuleChange(index, 'field', e.target.value)
                    }
                    disabled={disabled}
                    className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {COMMON_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Operator
                  </label>
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      handleRuleChange(
                        index,
                        'operator',
                        e.target.value as ConditionOperator
                      )
                    }
                    disabled={disabled}
                    className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={String(rule.value)}
                    onChange={(e) =>
                      handleRuleChange(index, 'value', e.target.value)
                    }
                    disabled={disabled}
                    placeholder="e.g., organic"
                    className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveRule(index)}
                  disabled={disabled}
                  className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                  title="Remove rule"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddRule}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50"
            >
              + Add Rule
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800">
              <strong>Example:</strong> To make this material available only for
              organic orders, add a rule:{' '}
              <code className="bg-blue-100 px-1 rounded">
                order_flags contains organic
              </code>
            </p>
          </div>
        </div>
      )}

      {!isEnabled && (
        <p className="text-xs text-gray-500 italic">
          This material will always be included (unconditional)
        </p>
      )}
    </div>
  );
}
