'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMachines, useProducts, useTransferOrders } from '@/lib/clientState';
import { supabase } from '@/lib/supabase/client-browser';
import type { Product, WorkOrder } from '@/lib/types';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingWorkOrder?: WorkOrder | null;
}

export function CreateWorkOrderModal({ isOpen, onClose, onSuccess, editingWorkOrder }: CreateWorkOrderModalProps) {
  const machines = useMachines();
  const { products: allProducts } = useProducts();
  const products = allProducts?.filter(p => p.product_type === 'PR' || p.product_type === 'FG') || [];
  const transferOrders = useTransferOrders();
  const [loading, setLoading] = useState(false);
  const [loadingBoms, setLoadingBoms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableBoms, setAvailableBoms] = useState<Array<{id: number; version: string; status: string; line_id: number[] | null}>>([]);
  const [productionLines, setProductionLines] = useState<Array<{id: number; code: string; name: string}>>([]);
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    due_date: '',
    scheduled_start: '',
    scheduled_end: '',
    machine_id: '',
    line_id: '',  // NEW: Production line FK
    status: 'planned' as WorkOrder['status'],
    source_demand_type: 'Manual' as 'Manual' | 'TO' | 'PO' | 'SO',
    source_demand_id: '',
    bom_id: '',
  });

  const selectedProduct = products.find(p => p.id === Number(formData.product_id));

  // Load BOMs when product changes
  useEffect(() => {
    if (formData.product_id) {
      loadBoms(Number(formData.product_id));
    } else {
      setAvailableBoms([]);
      setFormData(prev => ({ ...prev, bom_id: '' }));
    }
  }, [formData.product_id]);

  // Load production lines on mount
  useEffect(() => {
    const loadProductionLines = async () => {
      try {
        const { data, error } = await supabase
          .from('production_lines')
          .select('id, code, name')
          .eq('is_active', true)
          .eq('status', 'active')
          .order('code');
        
        if (error) throw error;
        setProductionLines(data || []);
      } catch (err: any) {
        console.error('Error loading production lines:', err);
      }
    };
    
    if (isOpen) {
      loadProductionLines();
    }
  }, [isOpen]);

  const loadBoms = async (productId: number) => {
    setLoadingBoms(true);
    try {
      const { data, error } = await supabase
        .from('boms')
        .select('id, version, status, line_id')
        .eq('product_id', productId)
        .in('status', ['active', 'draft'])
        .order('version', { ascending: false });
      
      if (error) throw error;
      
      setAvailableBoms(data || []);
      
      // Auto-select latest active BOM if available
      const activeBom = data?.find(b => b.status === 'active');
      if (activeBom) {
        setFormData(prev => ({ ...prev, bom_id: activeBom.id.toString() }));
        
        // Auto-select first compatible line if BOM has restrictions
        if (activeBom.line_id && activeBom.line_id.length > 0) {
          setFormData(prev => ({ ...prev, line_id: activeBom.line_id![0].toString() }));
        }
      } else if (data && data.length > 0) {
        // Or select latest BOM if no active
        setFormData(prev => ({ ...prev, bom_id: data[0].id.toString() }));
        
        if (data[0].line_id && data[0].line_id.length > 0) {
          setFormData(prev => ({ ...prev, line_id: data[0].line_id![0].toString() }));
        }
      }
    } catch (err: any) {
      console.error('Error loading BOMs:', err);
      setAvailableBoms([]);
    } finally {
      setLoadingBoms(false);
    }
  };

  // Auto-fill quantity from TO if source is TO
  const selectedTO = formData.source_demand_type === 'TO' && formData.source_demand_id
    ? transferOrders.find(to => to.id === Number(formData.source_demand_id))
    : null;

  useEffect(() => {
    if (selectedTO && selectedTO.transfer_order_items && selectedTO.transfer_order_items.length > 0) {
      // Pre-fill quantity from first TO item (could be enhanced to match product)
      const firstItem = selectedTO.items?.[0];
      if (firstItem?.qty_planned && !formData.quantity) {
        setFormData(prev => ({ ...prev, quantity: firstItem.qty_planned.toString() }));
      }
    }
  }, [selectedTO]);

  const calculateAvailableLines = () => {
    const selectedBom = availableBoms.find(b => b.id === Number(formData.bom_id));
    
    // If BOM has line restrictions, only show those lines
    if (selectedBom && selectedBom.line_id && selectedBom.line_id.length > 0) {
      return productionLines.filter(line => selectedBom.line_id!.includes(line.id));
    }
    
    // Otherwise, show all active production lines
    return productionLines;
  };

  const availableLines = calculateAvailableLines();

  useEffect(() => {
    if (editingWorkOrder) {
      setFormData({
        product_id: editingWorkOrder.product_id?.toString() || '',
        quantity: editingWorkOrder.quantity?.toString() || '',
        due_date: editingWorkOrder.due_date || '',
        scheduled_start: editingWorkOrder.scheduled_start || '',
        scheduled_end: editingWorkOrder.scheduled_end || '',
        machine_id: editingWorkOrder.machine_id?.toString() || '',
        line_id: (editingWorkOrder as any).line_id?.toString() || '',
        status: editingWorkOrder.status || 'planned',
        source_demand_type: (editingWorkOrder.source_demand_type as 'Manual' | 'TO' | 'PO' | 'SO') || 'Manual',
        source_demand_id: editingWorkOrder.source_demand_id?.toString() || '',
        bom_id: editingWorkOrder.bom_id?.toString() || '',
      });
    } else {
      setFormData({
        product_id: '',
        quantity: '',
        due_date: '',
        scheduled_start: '',
        scheduled_end: '',
        machine_id: '',
        line_id: '',
        status: 'planned',
        source_demand_type: 'Manual',
        source_demand_id: '',
        bom_id: '',
      });
    }
  }, [editingWorkOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate line_id is provided
    if (!formData.line_id) {
      setError('Production Line is required');
      setLoading(false);
      return;
    }

    try {
      const product = products.find(p => p.id === Number(formData.product_id));
      const machine = machines.find(m => m.id === Number(formData.machine_id));

      if (editingWorkOrder) {
        const { updateWorkOrder } = await import('@/lib/clientState');
        updateWorkOrder(parseInt(editingWorkOrder.id), {
          product_id: formData.product_id,
          product,
          quantity: parseFloat(formData.quantity),
          status: formData.status,
          due_date: formData.due_date || null,
          scheduled_start: formData.scheduled_start || null,
          scheduled_end: formData.scheduled_end || null,
          machine_id: formData.machine_id || null,
          machine,
          line_id: Number(formData.line_id),  // NEW: Production line FK
        });
      } else {
        const { addWorkOrder } = await import('@/lib/clientState');
        const nextWoNumber = `WO-2024-${String(Date.now()).slice(-3).padStart(3, '0')}`;
        
        addWorkOrder({
          wo_number: nextWoNumber,
          product_id: formData.product_id,
          product,
          quantity: parseFloat(formData.quantity),
          status: formData.status,
          due_date: formData.due_date || null,
          scheduled_start: formData.scheduled_start || null,
          scheduled_end: formData.scheduled_end || null,
          machine_id: formData.machine_id || null,
          machine,
          line_id: Number(formData.line_id),  // NEW: Production line FK (required)
          source_demand_type: formData.source_demand_type === 'Manual' ? undefined : formData.source_demand_type,
          source_demand_id: formData.source_demand_id ? Number(formData.source_demand_id) : undefined,
          bom_id: formData.bom_id ? Number(formData.bom_id) : undefined,
        });
      }
      
      onSuccess();
      onClose();
      setFormData({
        product_id: '',
        quantity: '',
        due_date: '',
        scheduled_start: '',
        scheduled_end: '',
        machine_id: '',
        line_id: '',
        status: 'planned',
        source_demand_type: 'Manual',
        source_demand_id: '',
        bom_id: '',
      });
    } catch (err: any) {
      setError(err.message || `Failed to ${editingWorkOrder ? 'update' : 'create'} work order`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {editingWorkOrder ? 'Edit Work Order' : 'Create Work Order'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  product_id: e.target.value,
                  machine_id: ''
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.part_number} - {product.description}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.uom}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
                    readOnly
                  />
                </div>

                {/* BOM Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    BOM
                  </label>
                  {loadingBoms ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md bg-slate-50">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      <span className="text-sm text-slate-500">Loading BOMs...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.bom_id}
                      onChange={(e) => setFormData({ ...formData, bom_id: e.target.value, line_id: '' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    >
                      <option value="">Select BOM...</option>
                      {availableBoms.map((bom) => (
                        <option key={bom.id} value={bom.id}>
                          v{bom.version} - {bom.status} 
                          {bom.line_id && bom.line_id.length > 0 ? ` (Lines: ${bom.line_id.join(', ')})` : ' (All lines)'}
                        </option>
                      ))}
                    </select>
                  )}
                  {availableBoms.length === 0 && !loadingBoms && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ No active or draft BOMs found for this product</p>
                  )}
                </div>

                {/* Production Line Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Production Line <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.line_id}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      line_id: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select Production Line...</option>
                    {availableLines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.code} - {line.name}
                      </option>
                    ))}
                  </select>
                  {availableLines.length === 0 && formData.bom_id && (
                    <p className="text-xs text-red-600 mt-1">⚠️ No compatible production lines for selected BOM</p>
                  )}
                </div>
                
                {/* Machine Selection (optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Machine (Optional)
                  </label>
                  <select
                    value={formData.machine_id}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      machine_id: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">No specific machine</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scheduled Start
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_start}
                onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scheduled End
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_end}
                onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Source
              </label>
              <select
                value={formData.source_demand_type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  source_demand_type: e.target.value as 'Manual' | 'TO' | 'PO' | 'SO',
                  source_demand_id: '' // Reset when source changes
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="Manual">Manual</option>
                <option value="TO">From Transfer Order</option>
                <option value="PO">From Purchase Order</option>
                <option value="SO">From Sales Order</option>
              </select>
            </div>

            {formData.source_demand_type === 'TO' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Transfer Order
                </label>
                <select
                  value={formData.source_demand_id}
                  onChange={(e) => setFormData({ ...formData, source_demand_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">Select Transfer Order...</option>
                  {transferOrders
                    .filter(to => to.status !== 'cancelled')
                    .map((to) => (
                      <option key={to.id} value={to.id}>
                        {to.to_number} - {to.from_warehouse?.name} → {to.to_warehouse?.name}
                      </option>
                    ))}
                </select>
                {selectedTO && (
                  <p className="text-xs text-slate-500 mt-1">
                    Selected: {selectedTO.to_number} ({selectedTO.transfer_order_items?.length || 0} items)
                  </p>
                )}
              </div>
            )}

            {formData.product_id && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  BOM {loadingBoms && <span className="text-xs text-slate-500">(Loading...)</span>}
                </label>
                <select
                  value={formData.bom_id}
                  onChange={(e) => setFormData({ ...formData, bom_id: e.target.value })}
                  disabled={loadingBoms || availableBoms.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">{availableBoms.length === 0 ? 'No BOMs available' : 'Select BOM...'}</option>
                  {availableBoms.map((bom) => (
                    <option key={bom.id} value={bom.id}>
                      BOM v{bom.version} ({bom.status})
                    </option>
                  ))}
                </select>
                {availableBoms.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {availableBoms.find(b => b.status === 'active') 
                      ? 'Active BOM auto-selected' 
                      : 'Using latest BOM version'}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="planned">Planned</option>
                <option value="released">Released</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingWorkOrder ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}
