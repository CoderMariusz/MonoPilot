'use client';

/**
 * WOConditionalMaterialsPanel Component
 * Epic: EPIC-001 BOM Complexity v2 - Phase 3 (Conditional Components)
 * 
 * Purpose: Display and preview conditional materials for a Work Order
 * Use case: Planner sees which materials will be used based on order flags
 * 
 * Features:
 * - Real-time material evaluation preview
 * - Visual indicators (included/excluded)
 * - Order flags editor
 * - Material comparison (with vs without flags)
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Eye, EyeOff, Edit3 } from 'lucide-react';
import { WorkOrdersAPI } from '../lib/api/workOrders';

interface Material {
  bom_item_id: number;
  material_id: number;
  quantity: number;
  uom: string;
  sequence: number;
  is_conditional: boolean;
  condition_met: boolean;
  condition: any;
  is_by_product: boolean;
  material_name?: string;
  material_code?: string;
}

interface WOConditionalMaterialsPanelProps {
  bomId: number;
  initialOrderFlags?: string[];
  initialCustomerId?: number;
  initialOrderType?: string;
  onFlagsChange?: (flags: string[]) => void;
}

export default function WOConditionalMaterialsPanel({
  bomId,
  initialOrderFlags = [],
  initialCustomerId,
  initialOrderType,
  onFlagsChange
}: WOConditionalMaterialsPanelProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orderFlags, setOrderFlags] = useState<string[]>(initialOrderFlags);
  const [customerId, setCustomerId] = useState<number | undefined>(initialCustomerId);
  const [orderType, setOrderType] = useState<string | undefined>(initialOrderType);
  const [loading, setLoading] = useState(false);
  const [showExcluded, setShowExcluded] = useState(true);
  const [editingFlags, setEditingFlags] = useState(false);
  const [newFlag, setNewFlag] = useState('');

  useEffect(() => {
    loadMaterials();
  }, [bomId, orderFlags, customerId, orderType]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const woContext = {
        order_flags: orderFlags,
        customer_id: customerId,
        order_type: orderType
      };

      const data = await WorkOrdersAPI.getAllMaterialsWithEvaluation(bomId, woContext);
      setMaterials(data as Material[]);
    } catch (error: any) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlag = () => {
    if (newFlag && !orderFlags.includes(newFlag)) {
      const updated = [...orderFlags, newFlag];
      setOrderFlags(updated);
      onFlagsChange?.(updated);
      setNewFlag('');
    }
  };

  const handleRemoveFlag = (flag: string) => {
    const updated = orderFlags.filter(f => f !== flag);
    setOrderFlags(updated);
    onFlagsChange?.(updated);
  };

  const includedMaterials = materials.filter(m => !m.is_by_product && m.condition_met);
  const excludedMaterials = materials.filter(m => !m.is_by_product && m.is_conditional && !m.condition_met);
  const byProducts = materials.filter(m => m.is_by_product);

  return (
    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-100 px-6 py-4 border-b border-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Conditional Materials Preview</h3>
            <p className="text-sm text-slate-600 mt-1">
              {includedMaterials.length} material{includedMaterials.length !== 1 ? 's' : ''} will be used
              {excludedMaterials.length > 0 && ` (${excludedMaterials.length} excluded)`}
            </p>
          </div>
          <button
            onClick={() => setShowExcluded(!showExcluded)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          >
            {showExcluded ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showExcluded ? 'Hide' : 'Show'} Excluded
          </button>
        </div>
      </div>

      {/* Order Flags Editor */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-slate-700">
            Order Flags
          </label>
          <button
            onClick={() => setEditingFlags(!editingFlags)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            {editingFlags ? 'Done' : 'Edit'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {orderFlags.length === 0 ? (
            <span className="text-sm text-slate-500 italic">No flags set (standard materials only)</span>
          ) : (
            orderFlags.map((flag) => (
              <span
                key={flag}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {flag}
                {editingFlags && (
                  <button
                    onClick={() => handleRemoveFlag(flag)}
                    className="hover:text-blue-900"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {editingFlags && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newFlag}
              onChange={(e) => setNewFlag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFlag()}
              placeholder="Type flag (e.g., organic)"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleAddFlag}
              disabled={!newFlag}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add
            </button>
          </div>
        )}

        <p className="text-xs text-slate-600 mt-2">
          Common flags: organic, gluten_free, vegan, kosher, halal, custom_packaging
        </p>
      </div>

      {/* Materials List */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Included Materials */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-slate-900">
                  Included Materials ({includedMaterials.length})
                </h4>
              </div>
              <div className="space-y-2">
                {includedMaterials.map((material) => (
                  <div
                    key={material.bom_item_id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        Material #{material.material_id}
                      </p>
                      <p className="text-xs text-slate-600">
                        {material.quantity} {material.uom}
                        {material.is_conditional && (
                          <span className="ml-2 text-green-600">• Conditional</span>
                        )}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ))}
                {includedMaterials.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No materials match current flags</p>
                )}
              </div>
            </div>

            {/* Excluded Materials */}
            {showExcluded && excludedMaterials.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-slate-900">
                    Excluded Materials ({excludedMaterials.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {excludedMaterials.map((material) => (
                    <div
                      key={material.bom_item_id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg opacity-60"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          Material #{material.material_id}
                        </p>
                        <p className="text-xs text-slate-600">
                          {material.quantity} {material.uom} • Condition not met
                        </p>
                        {material.condition && (
                          <p className="text-xs text-red-600 mt-1">
                            Requires: {JSON.stringify(material.condition.rules[0]?.value || 'condition')}
                          </p>
                        )}
                      </div>
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By-Products */}
            {byProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-slate-900">
                    By-Products ({byProducts.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {byProducts.map((material) => (
                    <div
                      key={material.bom_item_id}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          Material #{material.material_id}
                        </p>
                        <p className="text-xs text-slate-600">
                          Output: {material.quantity} {material.uom}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <AlertCircle className="w-4 h-4 text-slate-500" />
          <p>
            <strong>Tip:</strong> Materials will be automatically filtered when creating Work Orders based on these flags.
          </p>
        </div>
      </div>
    </div>
  );
}

