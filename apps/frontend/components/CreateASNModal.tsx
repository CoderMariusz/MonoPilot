/**
 * Create ASN Modal Component
 * EPIC-002 Scanner & Warehouse v2 - Phase 1
 * 
 * Modal for creating new Advanced Shipping Notices:
 * - Auto-generate ASN number
 * - Link to PO (optional)
 * - Select supplier
 * - Add multiple items with batch/expiry
 * - Validate and save
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ASNsAPI } from '../lib/api/asns';
import { SuppliersAPI } from '../lib/api/suppliers';
import { ProductsAPI } from '../lib/api/products';
import { PurchaseOrdersAPI } from '../lib/api/purchaseOrders';
import type { CreateASNData, CreateASNItemData, Supplier, Product, PurchaseOrder } from '../lib/types';

interface CreateASNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (asnId: number) => void;
  prefilledPOId?: number; // Optional: prefill from PO
}

export default function CreateASNModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledPOId,
}: CreateASNModalProps) {
  const [asnNumber, setAsnNumber] = useState('');
  const [poId, setPoId] = useState<number | null>(prefilledPOId || null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [expectedArrival, setExpectedArrival] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreateASNItemData[]>([]);

  // Lookups
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lookups
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [suppliersData, productsData, posData, generatedNumber] = await Promise.all([
        SuppliersAPI.getAll(),
        ProductsAPI.getAll(),
        PurchaseOrdersAPI.getAll(),
        ASNsAPI.generateASNNumber(),
      ]);

      setSuppliers(suppliersData.filter(s => s.is_active));
      setProducts(productsData.filter(p => p.is_active));
      setPurchaseOrders(posData.filter(po => po.status === 'confirmed'));
      setAsnNumber(generatedNumber);

      // If PO prefilled, set supplier
      if (prefilledPOId) {
        const po = posData.find(p => p.id === prefilledPOId);
        if (po) {
          setSupplierId(po.supplier_id);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load form data');
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: 0,
        quantity: 0,
        uom: 'kg',
        batch: '',
        expiry_date: '',
        notes: '',
      },
    ]);
  };

  const updateItem = (index: number, field: keyof CreateASNItemData, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }

    if (!expectedArrival) {
      setError('Please set expected arrival date');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id || item.product_id === 0) {
        setError(`Item ${i + 1}: Please select a product`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        setError(`Item ${i + 1}: Quantity must be greater than 0`);
        return;
      }
    }

    try {
      setLoading(true);

      const data: CreateASNData = {
        asn_number: asnNumber,
        po_id: poId,
        supplier_id: supplierId,
        expected_arrival: expectedArrival,
        status: 'draft',
        notes: notes || null,
        asn_items: items.map(item => ({
          ...item,
          batch: item.batch || null,
          expiry_date: item.expiry_date || null,
          lp_number: item.lp_number || null,
          notes: item.notes || null,
        })),
      };

      const created = await ASNsAPI.create(data);
      
      if (onSuccess) {
        onSuccess(created.id);
      }
      
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error creating ASN:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ASN');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAsnNumber('');
    setPoId(null);
    setSupplierId(null);
    setExpectedArrival('');
    setNotes('');
    setItems([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Create Advanced Shipping Notice</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* ASN Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ASN Number *
              </label>
              <input
                type="text"
                value={asnNumber}
                onChange={(e) => setAsnNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
                required
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Purchase Order (Optional)
              </label>
              <select
                value={poId || ''}
                onChange={(e) => {
                  const selectedPoId = e.target.value ? Number(e.target.value) : null;
                  setPoId(selectedPoId);
                  // Auto-fill supplier from PO
                  if (selectedPoId) {
                    const po = purchaseOrders.find(p => p.id === selectedPoId);
                    if (po) {
                      setSupplierId(po.supplier_id);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">No PO</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.number} - {po.supplier?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supplier *
              </label>
              <select
                value={supplierId || ''}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                required
                disabled={!!poId} // Disabled if PO selected
              >
                <option value="">Select supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expected Arrival *
              </label>
              <input
                type="datetime-local"
                value={expectedArrival}
                onChange={(e) => setExpectedArrival(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Items */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-700"
              >
                + Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-center text-slate-600">
                No items added. Click "Add Item" to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border border-slate-200 rounded-md p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Product *
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          required
                        >
                          <option value={0}>Select product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.part_number} - {product.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          UOM
                        </label>
                        <input
                          type="text"
                          value={item.uom}
                          onChange={(e) => updateItem(index, 'uom', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Batch (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.batch || ''}
                          onChange={(e) => updateItem(index, 'batch', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          placeholder="LOT-2025-A"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Expiry Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={item.expiry_date || ''}
                          onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:bg-slate-400"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create ASN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

