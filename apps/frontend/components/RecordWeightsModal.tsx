'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle } from 'lucide-react';

interface RecordWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  woId: number;
  operationSeq: number;
  operation: any;
  onSubmit: (weights: any) => void;
}

interface StagedLP {
  id: number;
  lp_number: string;
  quantity: number;
  qa_status: string;
  stage_suffix?: string;
}

export function RecordWeightsModal({ 
  isOpen, 
  onClose, 
  woId, 
  operationSeq, 
  operation, 
  onSubmit 
}: RecordWeightsModalProps) {
  const [weights, setWeights] = useState({
    in_kg: 0,
    out_kg: 0,
    cooking_loss_weight: 0,
    trim_loss_weight: 0,
    marinade_gain_weight: 0
  });

  const [loading, setLoading] = useState(false);
  const [stagedLPs, setStagedLPs] = useState<StagedLP[]>([]);
  const [stagedTotal, setStagedTotal] = useState(0);
  const [yieldWarning, setYieldWarning] = useState<string | null>(null);
  const [scrapBreakdown, setScrapBreakdown] = useState<any[]>([]);
  const [oneToOneValidation, setOneToOneValidation] = useState<boolean>(false);

  // Fetch staged LPs when modal opens
  useEffect(() => {
    if (isOpen && woId && operationSeq) {
      fetchStagedLPs();
    }
  }, [isOpen, woId, operationSeq]);

  // Calculate yield warning when weights change
  useEffect(() => {
    if (weights.in_kg > 0 && weights.out_kg > 0) {
      const yieldPercentage = (weights.out_kg / weights.in_kg) * 100;
      
      if (yieldPercentage < 70) {
        setYieldWarning('Very low yield - please verify weights');
      } else if (yieldPercentage > 110) {
        setYieldWarning('Unusually high yield - please verify weights');
      } else {
        setYieldWarning(null);
      }
    }

    // Check 1:1 validation
    if (oneToOneValidation && stagedLPs.length > 0) {
      const totalStaged = stagedLPs.reduce((sum, lp) => sum + lp.quantity, 0);
      if (Math.abs(weights.in_kg - totalStaged) > 0.01) {
        setYieldWarning('1:1 validation failed: Input weight must match staged quantity exactly');
      }
    }
  }, [weights.in_kg, weights.out_kg, oneToOneValidation, stagedLPs]);

  const fetchStagedLPs = async () => {
    try {
      const response = await fetch(`/api/scanner/wo/${woId}/stage-status?operation_seq=${operationSeq}`);
      if (response.ok) {
        const data = await response.json();
        const allStagedLPs: StagedLP[] = [];
        let total = 0;
        
        data.stage_board.components.forEach((component: any) => {
          component.staged_lps.forEach((lp: StagedLP) => {
            allStagedLPs.push(lp);
            total += lp.quantity;
          });
        });
        
        setStagedLPs(allStagedLPs);
        setStagedTotal(total);
        setWeights(prev => ({ ...prev, in_kg: total }));
      }
    } catch (error) {
      console.error('Failed to fetch staged LPs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate weights
    if (weights.in_kg <= 0 || weights.out_kg <= 0) {
      alert('Input and output weights must be positive');
      return;
    }

    if (Math.abs(weights.in_kg - stagedTotal) > 0.01) {
      alert(`Input weight (${weights.in_kg}kg) does not match staged quantity (${stagedTotal}kg)`);
      return;
    }

    setLoading(true);
    
    try {
      const submitData = {
        ...weights,
        scrap_breakdown: scrapBreakdown,
        one_to_one_validation: oneToOneValidation
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Failed to submit weights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setWeights(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Record Weights - {operation?.operation_name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Staged LPs Summary */}
          {stagedLPs.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Staged Materials</h3>
              <div className="space-y-1">
                {stagedLPs.map((lp) => (
                  <div key={lp.id} className="flex items-center justify-between text-sm">
                    <span className="text-blue-800">{lp.lp_number}</span>
                    <span className="text-blue-700 font-medium">
                      {lp.quantity} kg
                      {lp.stage_suffix && (
                        <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                          {lp.stage_suffix}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-blue-900">Total Staged:</span>
                    <span className="text-blue-900">{stagedTotal.toFixed(2)} kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weight Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Input Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={weights.in_kg}
                onChange={(e) => handleInputChange('in_kg', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Staged: {stagedTotal.toFixed(2)} kg
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Output Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={weights.out_kg}
                onChange={(e) => handleInputChange('out_kg', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cooking Loss (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={weights.cooking_loss_weight}
                onChange={(e) => handleInputChange('cooking_loss_weight', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trim Loss (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={weights.trim_loss_weight}
                onChange={(e) => handleInputChange('trim_loss_weight', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Marinade Gain (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={weights.marinade_gain_weight}
                onChange={(e) => handleInputChange('marinade_gain_weight', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* 1:1 Validation */}
          {stagedLPs.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="oneToOneValidation"
                  checked={oneToOneValidation}
                  onChange={(e) => setOneToOneValidation(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="oneToOneValidation" className="text-sm font-medium text-yellow-900">
                  Enforce 1:1 Component Rule
                </label>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                When enabled, input weight must exactly match staged quantity for one-to-one components
              </p>
            </div>
          )}

          {/* Scrap Breakdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Scrap Breakdown (JSON)
            </label>
            <textarea
              value={JSON.stringify(scrapBreakdown, null, 2)}
              onChange={(e) => {
                try {
                  setScrapBreakdown(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, keep current value
                }
              }}
              placeholder='[{"type": "fat", "weight": 2.5}, {"type": "bone", "weight": 1.2}]'
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm font-mono"
              rows={4}
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter scrap breakdown as JSON array with type and weight fields
            </p>
          </div>

          {/* Calculated Yield */}
          {weights.in_kg > 0 && weights.out_kg > 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700">Calculated Yield</h3>
                {yieldWarning && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Warning</span>
                  </div>
                )}
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {((weights.out_kg / weights.in_kg) * 100).toFixed(1)}%
              </div>
              {yieldWarning && (
                <p className="text-sm text-amber-700 mt-1">{yieldWarning}</p>
              )}
              
              {/* Loss Summary */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Cook Loss: {weights.cook_loss.toFixed(2)} kg</div>
                  <div>Trim Loss: {weights.trim_loss.toFixed(2)} kg</div>
                  <div>Marinade Gain: +{weights.marinade_gain.toFixed(2)} kg</div>
                  <div className="font-medium">
                    Net Loss: {(weights.cook_loss + weights.trim_loss - weights.marinade_gain).toFixed(2)} kg
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Weights'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
