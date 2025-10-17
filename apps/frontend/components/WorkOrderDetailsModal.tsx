'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { useWorkOrders, getFilteredBomForWorkOrder, getWoProductionStats } from '@/lib/clientState';
import { WorkOrdersAPI } from '@/lib/api';
import { toast } from '@/lib/toast';

interface BomComponent {
  material_id: number;
  part_number: string;
  description: string;
  uom: string;
  qty_per_unit: number;
  total_qty_needed: number;
  stock_on_hand: number;
  qty_completed: number;
  production_line_restrictions?: string[];
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
  const workOrders = useWorkOrders();
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
      const workOrder = workOrders.find(wo => wo.id === workOrderId.toString());
      if (!workOrder || !workOrder.product) {
        throw new Error('Work order not found');
      }

      const bomItems = getFilteredBomForWorkOrder(workOrder);
      
      const woQuantity = typeof workOrder.quantity === 'string' ? parseFloat(workOrder.quantity) : workOrder.quantity;
      
      const data = {
        work_order: {
          id: parseInt(workOrder.id),
          wo_number: workOrder.wo_number,
          product_id: parseInt(workOrder.product_id),
          product_name: workOrder.product?.description || '',
          product_part_number: workOrder.product?.part_number || '',
          quantity: woQuantity || 0,
          uom: workOrder.product?.uom || '',
          status: workOrder.status,
          due_date: workOrder.due_date,
          machine_id: parseInt(workOrder.machine_id || '0'),
          machine_name: workOrder.machine?.name || null,
        },
        bom_components: bomItems.map(bomItem => {
          const bomQty = typeof bomItem.quantity === 'string' ? parseFloat(bomItem.quantity) : bomItem.quantity;
          return {
            material_id: parseInt(bomItem.material_id.toString()),
            part_number: bomItem.material?.part_number || '',
            description: bomItem.material?.description || '',
            uom: bomItem.uom,
            qty_per_unit: bomQty,
            total_qty_needed: bomQty * (woQuantity || 0),
            stock_on_hand: 0,
            qty_completed: 0,
          };
        })
      };
      
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

  // KPI calculation functions
  const calculateShortages = () => {
    if (!details?.bom_components) return 0;
    return details.bom_components.filter(component => 
      component.total_qty_needed > (component.stock_on_hand || 0)
    ).length;
  };

  const calculateProgress = () => {
    if (!details?.work_order) return 'Pending';
    const { work_order } = details;
    
    if (work_order.status === 'completed') return '100%';
    if (work_order.status === 'in_progress') {
      // For now, return placeholder - will be calculated from actual data later
      return '50%';
    }
    return '0%';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '–';
    return new Date(dateString).toLocaleDateString();
  };

  const canCancel = () => {
    if (!details?.work_order) return false;
    return !['in_progress', 'completed', 'cancelled'].includes(details.work_order.status);
  };

  const canEditQuantityOnly = () => {
    if (!details?.work_order) return false;
    return ['in_progress', 'completed', 'cancelled'].includes(details.work_order.status);
  };

  const handleCancel = async () => {
    if (!details?.work_order) return;
    
    if (!confirm('Are you sure you want to cancel this work order?')) return;
    
    const reason = prompt('Cancellation reason (optional):');
    
    const result = await WorkOrdersAPI.cancel(details.work_order.id, reason);
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
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
            {/* KPI Tiles */}
            <div className="p-6 border-b border-slate-200">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* KPI 1: Shortages */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div className="text-sm text-red-600 font-medium">Shortages</div>
                  </div>
                  <div className="text-2xl font-bold text-red-900">{calculateShortages()}</div>
                  <div className="text-xs text-red-500">BOM items short</div>
                </div>
                
                {/* KPI 2: Plan vs Real */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div className="text-sm text-blue-600 font-medium">Plan vs Real</div>
                  </div>
                  <div className="text-sm text-blue-900">
                    <div className="font-medium">Scheduled:</div>
                    <div className="text-xs">
                      {details.work_order.due_date ? formatDate(details.work_order.due_date) : 'Not set'}
                    </div>
                    {/* TODO: Add actual start/end when available */}
                    <div className="text-xs text-blue-500 mt-1">Actual: Not started</div>
                  </div>
                </div>
                
                {/* KPI 3: Progress/Yield */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div className="text-sm text-green-600 font-medium">Progress/Yield</div>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{calculateProgress()}</div>
                  <div className="text-xs text-green-500">Completion</div>
                </div>
              </div>
              
              {/* Additional KPI Row for Made and Progress */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* KPI 4: Made */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div className="text-sm text-blue-600 font-medium">Made / Planned</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {(() => {
                      const stats = getWoProductionStats(details.work_order.id);
                      return `${stats.madeQty.toFixed(2)} / ${stats.plannedQty.toFixed(2)} ${details.work_order.uom}`;
                    })()}
                  </div>
                  <div className="text-xs text-blue-500">Production Progress</div>
                </div>
                
                {/* KPI 5: Progress Bar */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div className="text-sm text-purple-600 font-medium">Progress</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {(() => {
                      const stats = getWoProductionStats(details.work_order.id);
                      return `${stats.progressPct}%`;
                    })()}
                  </div>
                  <div className="text-xs text-purple-500">Completion Rate</div>
                </div>
              </div>
            </div>

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
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Line</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">UoM</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty per Unit</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total Qty Needed</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Stock on Hand</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Reserved</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Shortage</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.bom_components.map((component) => {
                        const shortage = Math.max(component.total_qty_needed - (component.stock_on_hand || 0), 0);
                        const hasShortage = shortage > 0;
                        
                        return (
                          <tr 
                            key={component.material_id} 
                            className={`border-b border-slate-100 hover:bg-slate-50 ${hasShortage ? 'bg-red-50' : ''}`}
                          >
                            <td className="py-3 px-4 text-sm">
                              <div className="font-medium text-slate-900">{component.part_number}</div>
                              <div className="text-slate-600 text-xs">{component.description}</div>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-700">
                              {component.production_line_restrictions?.join(', ') || details.work_order.machine_name || '-'}
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
                              0
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              {hasShortage ? (
                                <span className="text-red-600 font-medium">
                                  {shortage.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-500">–</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-700">
                              {component.qty_completed.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="p-6 border-t border-slate-200 flex justify-between items-center">
          <div>
            {canCancel() && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mr-3"
              >
                Cancel WO
              </button>
            )}
          </div>
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
