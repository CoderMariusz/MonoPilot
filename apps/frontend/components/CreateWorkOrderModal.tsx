'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMachines, useProducts } from '@/lib/clientState';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    due_date: '',
    scheduled_start: '',
    scheduled_end: '',
    machine_id: '',
    status: 'planned' as WorkOrder['status'],
  });

  const selectedProduct = products.find(p => p.id === Number(formData.product_id));

  const calculateAvailableLines = () => {
    if (!selectedProduct) {
      return machines;
    }

    const productLines = selectedProduct.production_lines;
    
    // If product has no lines defined or includes ALL, show all machines
    if (!productLines || productLines.length === 0 || productLines.includes('ALL')) {
      return machines;
    }

    // Filter machines to only those in product's production_lines
    return machines.filter(m => productLines.includes(String(m.id)));
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
        status: editingWorkOrder.status || 'planned',
      });
    } else {
      setFormData({
        product_id: '',
        quantity: '',
        due_date: '',
        scheduled_start: '',
        scheduled_end: '',
        machine_id: '',
        status: 'planned',
      });
    }
  }, [editingWorkOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          line_number: null,
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
        status: 'planned',
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Line
                  </label>
                  <select
                    value={formData.machine_id}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      machine_id: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Select Line</option>
                    {availableLines.map((machine) => (
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
