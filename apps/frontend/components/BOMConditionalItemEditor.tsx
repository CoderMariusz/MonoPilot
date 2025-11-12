'use client';

/**
 * BOMConditionalItemEditor Component
 * Epic: EPIC-001 BOM Complexity v2 - Phase 3 (Conditional Components)
 * 
 * Purpose: Edit conditional rules for BOM items
 * Use case: Product Manager defines when a material is required based on order flags
 * 
 * Features:
 * - Visual condition builder (AND/OR logic)
 * - Rule editor (field, operator, value)
 * - Validation and preview
 * - Common templates (organic, gluten-free, customer-specific)
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, Copy, AlertCircle, CheckCircle } from 'lucide-react';

interface ConditionRule {
  field: string;
  operator: string;
  value: string;
}

interface Condition {
  type: 'AND' | 'OR';
  rules: ConditionRule[];
}

interface BOMConditionalItemEditorProps {
  initialCondition?: Condition | null;
  onSave: (condition: Condition | null) => void;
  onCancel: () => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In List' },
];

const FIELDS = [
  { value: 'order_flags', label: 'Order Flags', type: 'array' },
  { value: 'customer_id', label: 'Customer ID', type: 'number' },
  { value: 'order_type', label: 'Order Type', type: 'string' },
  { value: 'order_quantity', label: 'Order Quantity', type: 'number' },
];

const TEMPLATES = [
  {
    name: 'Organic Only',
    condition: {
      type: 'OR' as 'OR',
      rules: [{ field: 'order_flags', operator: 'contains', value: 'organic' }]
    }
  },
  {
    name: 'Gluten-Free & Vegan',
    condition: {
      type: 'AND' as 'AND',
      rules: [
        { field: 'order_flags', operator: 'contains', value: 'gluten_free' },
        { field: 'order_flags', operator: 'contains', value: 'vegan' }
      ]
    }
  },
  {
    name: 'Non-Organic (Standard)',
    condition: {
      type: 'OR' as 'OR',
      rules: [{ field: 'order_flags', operator: 'not_contains', value: 'organic' }]
    }
  },
  {
    name: 'Customer Specific',
    condition: {
      type: 'AND' as 'AND',
      rules: [
        { field: 'customer_id', operator: 'equals', value: '123' },
        { field: 'order_flags', operator: 'contains', value: 'custom_packaging' }
      ]
    }
  }
];

export default function BOMConditionalItemEditor({
  initialCondition,
  onSave,
  onCancel
}: BOMConditionalItemEditorProps) {
  const [condition, setCondition] = useState<Condition>(
    initialCondition || { type: 'OR', rules: [{ field: 'order_flags', operator: 'contains', value: '' }] }
  );
  const [isUnconditional, setIsUnconditional] = useState(!initialCondition);

  const handleAddRule = () => {
    setCondition({
      ...condition,
      rules: [...condition.rules, { field: 'order_flags', operator: 'contains', value: '' }]
    });
  };

  const handleRemoveRule = (index: number) => {
    setCondition({
      ...condition,
      rules: condition.rules.filter((_, i) => i !== index)
    });
  };

  const handleRuleChange = (index: number, field: keyof ConditionRule, value: string) => {
    const newRules = [...condition.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setCondition({ ...condition, rules: newRules });
  };

  const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
    setCondition(template.condition);
    setIsUnconditional(false);
  };

  const handleSave = () => {
    if (isUnconditional) {
      onSave(null);
    } else {
      // Validate
      const hasEmptyValues = condition.rules.some(r => !r.value);
      if (hasEmptyValues) {
        alert('Please fill in all rule values');
        return;
      }
      onSave(condition);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Edit Conditional Rules</h2>
            <p className="text-sm text-slate-600 mt-1">
              Define when this material is required based on order properties
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Unconditional Toggle */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isUnconditional}
                onChange={(e) => setIsUnconditional(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-900">Always Required (Unconditional)</span>
                <p className="text-sm text-slate-600 mt-1">
                  This material will always be included regardless of order flags
                </p>
              </div>
            </label>
          </div>

          {!isUnconditional && (
            <>
              {/* Templates */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => handleApplyTemplate(template)}
                      className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors text-left"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logic Type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Logic Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="AND"
                      checked={condition.type === 'AND'}
                      onChange={(e) => setCondition({ ...condition, type: e.target.value as 'AND' | 'OR' })}
                      className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                    />
                    <span className="text-sm text-slate-700">
                      <strong>AND</strong> - All rules must match
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="OR"
                      checked={condition.type === 'OR'}
                      onChange={(e) => setCondition({ ...condition, type: e.target.value as 'AND' | 'OR' })}
                      className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                    />
                    <span className="text-sm text-slate-700">
                      <strong>OR</strong> - Any rule can match
                    </span>
                  </label>
                </div>
              </div>

              {/* Rules */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Rules
                  </label>
                  <button
                    onClick={handleAddRule}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </button>
                </div>

                <div className="space-y-3">
                  {condition.rules.map((rule, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        {/* Field */}
                        <select
                          value={rule.field}
                          onChange={(e) => handleRuleChange(index, 'field', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          {FIELDS.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>

                        {/* Operator */}
                        <select
                          value={rule.operator}
                          onChange={(e) => handleRuleChange(index, 'operator', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          {OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {/* Value */}
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveRule(index)}
                        disabled={condition.rules.length === 1}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mb-6 p-4 bg-slate-100 border border-slate-300 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-slate-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Condition Preview</p>
                    <p className="text-xs text-slate-600 mt-1">
                      This material will be required when:
                    </p>
                  </div>
                </div>
                <pre className="mt-2 p-3 bg-white border border-slate-200 rounded text-xs text-slate-700 overflow-x-auto">
                  {JSON.stringify(condition, null, 2)}
                </pre>
              </div>

              {/* Example */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Example Usage</p>
                    <p className="text-xs text-green-700 mt-1">
                      {condition.type === 'AND' 
                        ? 'Material will be included only if ALL rules match'
                        : 'Material will be included if ANY rule matches'}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      Example: Order with flags <code className="bg-green-100 px-1 rounded">["organic", "gluten_free"]</code>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-md hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Save Condition
          </button>
        </div>
      </div>
    </div>
  );
}

