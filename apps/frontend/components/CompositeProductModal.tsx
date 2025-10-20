"use client";
import { useEffect, useState } from 'react';
import { createComposite } from '@/lib/api/products.createComposite';
import type { ProductInsert, BomItemInput, ExpiryPolicy } from '@/lib/types';
import { supabase } from '@/lib/supabase/client-browser';
import { toast } from '@/lib/toast';

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
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [taxCodes, setTaxCodes] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [allergens, setAllergens] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const [{ data: sData }, { data: tData }, { data: aData }] = await Promise.all([
        supabase.from('suppliers').select('id,name').order('name'),
        supabase.from('settings_tax_codes').select('id,code,name').order('code'),
        supabase.from('allergens').select('id,code,name').order('code'),
      ]);
      setSuppliers(sData || []);
      setTaxCodes(tData || []);
      setAllergens(aData || []);
    })();
  }, [isOpen]);

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
      const result = await createComposite(payload);
      // Save allergens selections for composite product
      if (selectedAllergens.length > 0 && result?.product_id) {
        const rows = selectedAllergens.map((allergen_id) => ({ product_id: result.product_id, allergen_id, contains: true }));
        const { error: paErr } = await supabase.from('product_allergens').insert(rows);
        if (paErr) console.warn('Failed to save allergens', paErr);
      }
      toast.success('Composite product created successfully');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create composite');
      toast.error(e?.message || 'Failed to create composite');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Add Composite Product</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">×</button>
        </div>

        {error && <div className="px-6 pt-4 text-sm text-red-600">{error}</div>}

        <div className="p-6 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
            <select
              value={product.product_type ?? ''}
              onChange={e => setProduct(p => ({ ...p, product_type: e.target.value as any }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              <option value="PR">PR</option>
              <option value="FG">FG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Part Number</label>
            <input
              value={product.part_number ?? ''}
              onChange={e => setProduct(p => ({ ...p, part_number: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              value={product.description ?? ''}
              onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">UoM</label>
            <input
              value={product.uom ?? ''}
              onChange={e => setProduct(p => ({ ...p, uom: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Std Price</label>
            <input
              type="number"
              value={product.std_price ?? ''}
              onChange={e => setProduct(p => ({ ...p, std_price: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Supplier</label>
            <select
              value={product.preferred_supplier_id ?? ''}
              onChange={e => setProduct(p => ({ ...p, preferred_supplier_id: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tax Code</label>
            <select
              value={product.tax_code_id ?? ''}
              onChange={e => setProduct(p => ({ ...p, tax_code_id: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {taxCodes.map(t => (
                <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Policy</label>
            <select
              value={(product.expiry_policy as string) ?? ''}
              onChange={e => setProduct(p => ({ ...p, expiry_policy: e.target.value as ExpiryPolicy }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {(['DAYS_STATIC','FROM_MFG_DATE','FROM_DELIVERY_DATE','FROM_CREATION_DATE'] as ExpiryPolicy[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Allergens</label>
            <div className="flex flex-wrap gap-2">
              {allergens.map(a => {
                const checked = selectedAllergens.includes(a.id);
                return (
                  <label key={a.id} className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelectedAllergens(prev => checked ? prev.filter(id => id !== a.id) : [...prev, a.id])}
                    />
                    <span>{a.code} — {a.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 mb-2 flex items-center justify-between">
          <h3 className="font-medium">BOM Items</h3>
          <button onClick={handleAddItem} className="px-2 py-1 text-sm border rounded">Add Item</button>
        </div>

        <div className="mx-6 max-h-64 overflow-y-auto border rounded">
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

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-6 py-3 border border-slate-300 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save Composite'}
          </button>
        </div>
      </div>
    </div>
  );
}


