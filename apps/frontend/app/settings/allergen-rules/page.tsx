'use client';

import { useState, useEffect } from 'react';
import type { ProductionLine } from '@/lib/types';

// Mock data - in production, fetch from API
const MOCK_PRODUCTION_LINES: ProductionLine[] = [
  {
    id: 1,
    code: 'LINE-A',
    name: 'Line A',
    status: 'active',
    warehouse_id: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 2,
    code: 'LINE-B',
    name: 'Line B',
    status: 'active',
    warehouse_id: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 3,
    code: 'LINE-C',
    name: 'Line C',
    status: 'active',
    warehouse_id: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 4,
    code: 'LINE-D',
    name: 'Line D',
    status: 'active',
    warehouse_id: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

// 14 EU Allergens
const EU_ALLERGENS = [
  { id: 'gluten', name: 'Gluten' },
  { id: 'crustaceans', name: 'Crustaceans' },
  { id: 'eggs', name: 'Eggs' },
  { id: 'fish', name: 'Fish' },
  { id: 'peanuts', name: 'Peanuts' },
  { id: 'soybeans', name: 'Soybeans' },
  { id: 'milk', name: 'Milk (Lactose)' },
  { id: 'nuts', name: 'Nuts' },
  { id: 'celery', name: 'Celery' },
  { id: 'mustard', name: 'Mustard' },
  { id: 'sesame', name: 'Sesame' },
  { id: 'sulphites', name: 'Sulphur dioxide/sulphites' },
  { id: 'lupin', name: 'Lupin' },
  { id: 'molluscs', name: 'Molluscs' },
];

interface AllergenRule {
  lineId: number;
  ruleType: 'free-from' | 'allowed-only';
  allergens: string[];
}

export default function AllergenRulesPage() {
  const [productionLines, setProductionLines] = useState<ProductionLine[]>(MOCK_PRODUCTION_LINES);
  const [rules, setRules] = useState<AllergenRule[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock initial rules
  useEffect(() => {
    setRules([
      { lineId: 2, ruleType: 'free-from', allergens: ['gluten'] },
      { lineId: 4, ruleType: 'free-from', allergens: ['nuts', 'peanuts'] },
    ]);
  }, []);

  const getLineRule = (lineId: number): AllergenRule | undefined => {
    return rules.find((r) => r.lineId === lineId);
  };

  const handleSaveRule = (lineId: number, ruleType: 'free-from' | 'allowed-only', allergens: string[]) => {
    setRules((prev) => {
      const existing = prev.findIndex((r) => r.lineId === lineId);
      if (existing >= 0) {
        const updated = [...prev];
        if (allergens.length === 0) {
          // Remove rule if no allergens selected
          updated.splice(existing, 1);
        } else {
          updated[existing] = { lineId, ruleType, allergens };
        }
        return updated;
      } else if (allergens.length > 0) {
        return [...prev, { lineId, ruleType, allergens }];
      }
      return prev;
    });
    setEditMode(false);
    setSelectedLine(null);
  };

  const handleDeleteRule = (lineId: number) => {
    if (confirm('Are you sure you want to remove this allergen rule?')) {
      setRules((prev) => prev.filter((r) => r.lineId !== lineId));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Allergen Rules by Production Line</h1>
        <p className="text-slate-600 mt-2">
          Define allergen restrictions per production line to prevent cross-contamination and enforce allergen-free
          zones
        </p>
      </div>

      {/* Instructions */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-blue-900 mb-2">How Allergen Rules Work:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            <strong>"Free-From" Rules:</strong> Block products containing specified allergens from being scheduled on
            this line
          </li>
          <li>
            <strong>"Allowed-Only" Rules:</strong> Only allow products containing specified allergens (e.g., dedicated
            nut line)
          </li>
          <li>
            <strong>Work Order Validation:</strong> Rules are enforced during WO creation - violations will be rejected
          </li>
          <li>
            <strong>Override Permission:</strong> Admin/Manager can override with electronic signature (Story 1.2
            integration)
          </li>
        </ul>
      </div>

      {/* Production Lines Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Production Line</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Allergen Rule</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Allergens</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {productionLines.map((line) => {
              const rule = getLineRule(line.id);
              const isEditing = selectedLine === line.id && editMode;

              return (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{line.name}</div>
                    <div className="text-xs text-slate-500">{line.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <EditRuleForm
                        line={line}
                        existingRule={rule}
                        allergens={EU_ALLERGENS}
                        onSave={handleSaveRule}
                        onCancel={() => {
                          setEditMode(false);
                          setSelectedLine(null);
                        }}
                      />
                    ) : rule ? (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          rule.ruleType === 'free-from'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {rule.ruleType === 'free-from' ? 'Free-From' : 'Allowed-Only'}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">No rule</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!isEditing &&
                      rule &&
                      (rule.allergens.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rule.allergens.map((allergenId) => {
                            const allergen = EU_ALLERGENS.find((a) => a.id === allergenId);
                            return (
                              <span
                                key={allergenId}
                                className="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded"
                              >
                                {allergen?.name || allergenId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      ))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isEditing && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLine(line.id);
                            setEditMode(true);
                          }}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          {rule ? 'Edit' : 'Add Rule'}
                        </button>
                        {rule && (
                          <button
                            onClick={() => handleDeleteRule(line.id)}
                            className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save Notice */}
      {rules.length > 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-green-900">Rules Active</h3>
              <p className="text-sm text-green-700 mt-1">
                {rules.length} allergen rule{rules.length !== 1 ? 's' : ''} configured. Work Order validation is
                enabled.
              </p>
            </div>
            <button
              onClick={() => alert('Rules saved successfully! (In production: API call to save to database)')}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Save All Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Rule Form Component
interface EditRuleFormProps {
  line: ProductionLine;
  existingRule?: AllergenRule;
  allergens: Array<{ id: string; name: string }>;
  onSave: (lineId: number, ruleType: 'free-from' | 'allowed-only', allergens: string[]) => void;
  onCancel: () => void;
}

function EditRuleForm({ line, existingRule, allergens, onSave, onCancel }: EditRuleFormProps) {
  const [ruleType, setRuleType] = useState<'free-from' | 'allowed-only'>(existingRule?.ruleType || 'free-from');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(existingRule?.allergens || []);

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergenId) ? prev.filter((id) => id !== allergenId) : [...prev, allergenId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {existingRule ? 'Edit' : 'Add'} Allergen Rule - {line.name}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Rule Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Rule Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={ruleType === 'free-from'}
                  onChange={() => setRuleType('free-from')}
                  className="mr-2"
                />
                <span className="text-sm">Free-From (Block allergen-containing products)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={ruleType === 'allowed-only'}
                  onChange={() => setRuleType('allowed-only')}
                  className="mr-2"
                />
                <span className="text-sm">Allowed-Only (Dedicated allergen line)</span>
              </label>
            </div>
          </div>

          {/* Allergen Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Allergens {ruleType === 'free-from' ? '(to block)' : '(to allow)'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allergens.map((allergen) => {
                const isSelected = selectedAllergens.includes(allergen.id);
                return (
                  <label
                    key={allergen.id}
                    className={`flex items-center px-3 py-2 border rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAllergen(allergen.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">{allergen.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Example */}
          {selectedAllergens.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-bold text-yellow-900 mb-1">Rule Effect:</h4>
              <p className="text-sm text-yellow-800">
                {ruleType === 'free-from'
                  ? `Work Orders for products containing ${selectedAllergens.map((id) => allergens.find((a) => a.id === id)?.name).join(', ')} will be BLOCKED on ${line.name}.`
                  : `Only Work Orders for products containing ${selectedAllergens.map((id) => allergens.find((a) => a.id === id)?.name).join(', ')} will be ALLOWED on ${line.name}.`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(line.id, ruleType, selectedAllergens)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}
