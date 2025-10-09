'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { mockWorkOrderDetails } from '@/lib/mockData';

interface BomComponent {
  material_id: number;
  part_number: string;
  description: string;
  uom: string;
  qty_per_unit: number;
  total_qty_needed: number;
  stock_on_hand: number;
  qty_completed: number;
}

interface WorkOrderDetails {
  work_order: {
    id: number;
    wo_number: string;
    product_id: number;
    product_name: string;
    product_part_number: string;
    quantity: number;
    uom: string;
    status: string;
    due_date: string | null;
    machine_id: number | null;
    machine_name: string | null;
  };
  bom_components: BomComponent[];
}

interface WorkOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: number | null;
}

export function WorkOrderDetailsModal({ isOpen, onClose, workOrderId }: WorkOrderDetailsModalProps) {
  const [details, setDetails] = useState<WorkOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workOrderId) {
      loadDetails();
    }
  }, [isOpen, workOrderId]);

  const loadDetails = async () => {
    if (!workOrderId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = mockWorkOrderDetails(workOrderId);
      if (!data) {
        throw new Error('Work order not found');
      }
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load work order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'released':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Work Order Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          </div>
        ) : details ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-600 mb-1">WO Number</div>
                  <div className="text-lg font-semibold text-slate-900">{details.work_order.wo_number}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Status</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(details.work_order.status)}`}>
                    {details.work_order.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Product</div>
                  <div className="text-base font-medium text-slate-900">
                    {details.work_order.product_part_number} - {details.work_order.product_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Total Quantity</div>
                  <div className="text-base font-medium text-slate-900">
                    {details.work_order.quantity} {details.work_order.uom}
                  </div>
                </div>
                {details.work_order.due_date && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Due Date</div>
                    <div className="text-base font-medium text-slate-900">
                      {new Date(details.work_order.due_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {details.work_order.machine_name && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Machine</div>
                    <div className="text-base font-medium text-slate-900">
                      {details.work_order.machine_name}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">BOM Components</h3>
              
              {details.bom_components.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No BOM components found for this product
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Component</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">UoM</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty per Unit</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total Qty Needed</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Stock on Hand</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.bom_components.map((component) => (
                        <tr key={component.material_id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm">
                            <div className="font-medium text-slate-900">{component.part_number}</div>
                            <div className="text-slate-600 text-xs">{component.description}</div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">{component.uom}</td>
                          <td className="py-3 px-4 text-sm text-right text-slate-700">
                            {component.qty_per_unit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">
                            {component.total_qty_needed.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            <span className={`${
                              component.stock_on_hand >= component.total_qty_needed
                                ? 'text-green-700 font-medium'
                                : 'text-red-700 font-medium'
                            }`}>
                              {component.stock_on_hand.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-700">
                            {component.qty_completed.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
