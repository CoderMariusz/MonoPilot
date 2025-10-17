'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { WorkOrdersAPI } from '@/lib/api/workOrders';

interface WOOperation {
  id: number;
  wo_id: number;
  seq_no: number;
  operation_name: string;
  status: string;
  started_at: string;
  finished_at: string;
  operator_id: number;
  planned_input_weight: number;
  planned_output_weight: number;
  actual_input_weight: number;
  actual_output_weight: number;
  cooking_loss_weight: number;
  trim_loss_weight: number;
  marinade_gain_weight: number;
  scrap_breakdown: any;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  product: {
    description: string;
    part_number: string;
  };
  line_number: string;
  status: string;
  kpi_scope: 'PR' | 'FG';
  current_operation_seq: number;
  wo_operations: WOOperation[];
}

export function OperationsTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showRecordWeights, setShowRecordWeights] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<WOOperation | null>(null);

  const loadWorkOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await WorkOrdersAPI.getAll({
        status: 'in_progress'
      });
      setWorkOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const calculateYield = (input: number, output: number) => {
    if (input <= 0) return 0;
    return (output / input) * 100;
  };

  const getYieldColor = (yieldPercent: number) => {
    if (yieldPercent >= 95) return 'text-green-600';
    if (yieldPercent >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getYieldIcon = (yieldPercent: number) => {
    if (yieldPercent >= 95) return <TrendingUp className="w-4 h-4" />;
    if (yieldPercent >= 90) return <AlertTriangle className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRecordWeights = (operation: WOOperation) => {
    setSelectedOperation(operation);
    setShowRecordWeights(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Work Orders List */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Active Work Orders</h3>
        </div>
        
        <div className="divide-y divide-slate-200">
          {workOrders.map((wo) => (
            <div key={wo.id} className="p-4 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium text-slate-900">{wo.wo_number}</h4>
                      <p className="text-sm text-slate-600">{wo.product.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wo.status)}`}>
                        {wo.status}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {wo.kpi_scope}
                      </span>
                      <span className="text-sm text-slate-600">
                        Line: {wo.line_number}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWO(selectedWO?.id === wo.id ? null : wo)}
                  className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
                >
                  {selectedWO?.id === wo.id ? 'Hide' : 'Show'} Operations
                </button>
              </div>

              {/* Operations Details */}
              {selectedWO?.id === wo.id && (
                <div className="mt-4 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Seq</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Operation</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Planned IN (kg)</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Planned OUT (kg)</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Actual IN (kg)</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Actual OUT (kg)</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Yield %</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Losses (kg)</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Status</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {wo.wo_operations.map((op) => {
                          const yieldPercent = calculateYield(op.actual_input_weight, op.actual_output_weight);
                          const totalLoss = (op.cooking_loss_weight || 0) + (op.trim_loss_weight || 0) - (op.marinade_gain_weight || 0);
                          
                          return (
                            <tr key={op.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-sm text-slate-900">
                                {op.seq_no}
                              </td>
                              <td className="px-3 py-2 text-sm font-medium text-slate-900">
                                {op.operation_name}
                              </td>
                              <td className="px-3 py-2 text-sm text-slate-900 text-right">
                                {op.planned_input_weight ? op.planned_input_weight.toFixed(2) : '–'}
                              </td>
                              <td className="px-3 py-2 text-sm text-slate-900 text-right">
                                {op.planned_output_weight ? op.planned_output_weight.toFixed(2) : '–'}
                              </td>
                              <td className="px-3 py-2 text-sm text-slate-900 text-right">
                                {op.actual_input_weight ? op.actual_input_weight.toFixed(2) : '–'}
                              </td>
                              <td className="px-3 py-2 text-sm text-slate-900 text-right">
                                {op.actual_output_weight ? op.actual_output_weight.toFixed(2) : '–'}
                              </td>
                              <td className={`px-3 py-2 text-sm text-right font-medium ${getYieldColor(yieldPercent)}`}>
                                {yieldPercent > 0 ? `${yieldPercent.toFixed(1)}%` : '–'}
                              </td>
                              <td className="px-3 py-2 text-sm text-slate-900 text-right">
                                {totalLoss > 0 ? totalLoss.toFixed(2) : '–'}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(op.status)}`}>
                                  {op.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {op.status !== 'completed' && (
                                  <button
                                    onClick={() => handleRecordWeights(op)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                                  >
                                    <Calculator className="w-3 h-3" />
                                    Record
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Loss Breakdown */}
                  {wo.wo_operations.some(op => op.cooking_loss_weight || op.trim_loss_weight || op.marinade_gain_weight) && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-md">
                      <h5 className="text-sm font-medium text-slate-900 mb-2">Loss Breakdown</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {wo.wo_operations.map((op) => {
                          if (!op.cooking_loss_weight && !op.trim_loss_weight && !op.marinade_gain_weight) return null;
                          
                          return (
                            <div key={op.id} className="bg-white p-2 rounded border">
                              <div className="font-medium text-slate-900">{op.operation_name}</div>
                              <div className="space-y-1 text-slate-600">
                                {op.cooking_loss_weight > 0 && (
                                  <div>Cooking Loss: {op.cooking_loss_weight.toFixed(2)} kg</div>
                                )}
                                {op.trim_loss_weight > 0 && (
                                  <div>Trim Loss: {op.trim_loss_weight.toFixed(2)} kg</div>
                                )}
                                {op.marinade_gain_weight > 0 && (
                                  <div>Marinade Gain: +{op.marinade_gain_weight.toFixed(2)} kg</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Record Weights Modal Placeholder */}
      {showRecordWeights && selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Record Weights - {selectedOperation.operation_name}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              This would open the Record Weights modal for operation {selectedOperation.seq_no}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRecordWeights(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRecordWeights(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Record Weights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

