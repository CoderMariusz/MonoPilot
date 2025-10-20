"use client";
import { useState } from 'react';
import { createComposite } from '@/lib/api/products.createComposite';
import type { ProductInsert, BomItemInput } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompositeProductModal({ isOpen, onClose, onSuccess }: Props) {
  const [product, setProduct] = useState<Partial<ProductInsert>>({ product_group: 'COMPOSITE', uom: 'ea' });
  const [items, setItems] = useState<BomItemInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems(prev => [...prev, { material_id: 0, quantity: 1, uom: product.uom || 'ea', sequence: prev.length + 1 }]);
  };
  const handleChangeItem = (idx: number, field: keyof BomItemInput, value: any) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const handleRemoveItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sequence: i + 1 })));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (!product.part_number || !product.description || !product.uom) {
        setError('part_number, description and uom are required');
        setSubmitting(false);
        return;
      }
      if (!(product.product_type === 'PR' || product.product_type === 'FG')) {
        setError('product_type must be PR or FG');
        setSubmitting(false);
        return;
      }
      if (!items.length) {
        setError('At least one BOM item required');
        setSubmitting(false);
        return;
      }
      const payload = {
        product: {
          type: product.product_type as 'PR' | 'FG',
          part_number: product.part_number!,
          description: product.description!,
          uom: product.uom!,
          product_group: 'COMPOSITE',
          product_type: product.product_type,
          expiry_policy: product.expiry_policy ?? null,
          shelf_life_days: product.shelf_life_days ?? null,
          std_price: product.std_price ?? null,
          production_lines: product.production_lines ?? [],
          preferred_supplier_id: product.preferred_supplier_id ?? null,
          tax_code_id: product.tax_code_id ?? null,
          lead_time_days: product.lead_time_days ?? null,
          moq: product.moq ?? null,
        },
        bom: { version: '1.0', status: 'active' as const },
        items,
      };
      await createComposite(payload);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create composite');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Add Composite Product</h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900">×</button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Type</label>
            <select
              value={product.product_type ?? ''}
              onChange={e => setProduct(p => ({ ...p, product_type: e.target.value as any }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="">Select…</option>
              <option value="PR">PR</option>
              <option value="FG">FG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Part Number</label>
            <input
              value={product.part_number ?? ''}
              onChange={e => setProduct(p => ({ ...p, part_number: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={product.description ?? ''}
              onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">UoM</label>
            <input
              value={product.uom ?? ''}
              onChange={e => setProduct(p => ({ ...p, uom: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Std Price</label>
            <input
              type="number"
              value={product.std_price ?? ''}
              onChange={e => setProduct(p => ({ ...p, std_price: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">BOM Items</h3>
          <button onClick={handleAddItem} className="px-2 py-1 text-sm border rounded">Add Item</button>
        </div>

        <div className="max-h-64 overflow-y-auto border rounded">
          {items.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">No items yet</div>
          ) : (
            items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 p-2 border-b items-center">
                <input type="number" className="border rounded px-2 py-1 text-sm" value={it.material_id}
                  onChange={e => handleChangeItem(idx, 'material_id', Number(e.target.value))} placeholder="Material ID" />
                <input type="number" className="border rounded px-2 py-1 text-sm" value={it.quantity}
                  onChange={e => handleChangeItem(idx, 'quantity', Number(e.target.value))} placeholder="Qty" />
                <input className="border rounded px-2 py-1 text-sm" value={it.uom}
                  onChange={e => handleChangeItem(idx, 'uom', e.target.value)} placeholder="UoM" />
                <input type="number" className="border rounded px-2 py-1 text-sm" value={it.sequence ?? idx + 1}
                  onChange={e => handleChangeItem(idx, 'sequence', Number(e.target.value))} placeholder="Seq" />
                <input type="number" className="border rounded px-2 py-1 text-sm" value={it.priority ?? ''}
                  onChange={e => handleChangeItem(idx, 'priority', e.target.value ? Number(e.target.value) : null)} placeholder="Priority" />
                <button onClick={() => handleRemoveItem(idx)} className="px-2 py-1 text-xs border rounded">Remove</button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 text-sm border rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-3 py-1 text-sm bg-slate-900 text-white rounded disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save Composite'}
          </button>
        </div>
      </div>
    </div>
  );
}


