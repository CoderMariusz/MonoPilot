"use client";
import { useEffect, useState } from 'react';
import { createComposite } from '@/lib/api/products.createComposite';
import type { ProductInsert, BomItemInput, ExpiryPolicy } from '@/lib/types';
import { supabase } from '@/lib/supabase/client-browser';
import { toast } from '@/lib/toast';
import ProductSelect from '@/components/ProductSelect';
import AllergenChips from '@/components/AllergenChips';

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
  const [routings, setRoutings] = useState<Array<{ id: number; name: string }>>([]);
  const [allergens, setAllergens] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const [{ data: rData }, { data: aData }] = await Promise.all([
        supabase.from('routings').select('id,name').order('name'),
        supabase.from('allergens').select('id,code,name').order('code'),
      ]);
      setRoutings(rData || []);
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
  const handleSelectProduct = (idx: number, product: any) => {
    if (product) {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, material_id: product.id, uom: product.uom || it.uom } : it));
    }
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
        bom: { version: '1.0', status: 'active' as const, default_routing_id: (product as any).default_routing_id ?? null },
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Add Composite Product</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Default Routing</label>
            <select
              value={(product as any).default_routing_id ?? ''}
              onChange={e => setProduct(p => ({ ...p, default_routing_id: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {routings.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Shelf Life (days)</label>
            <input
              type="number"
              value={product.shelf_life_days ?? ''}
              onChange={e => setProduct(p => ({ ...p, shelf_life_days: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Allergens</label>
              <AllergenChips
                allergens={allergens}
                selectedIds={selectedAllergens}
                onToggle={(id) => setSelectedAllergens(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
              />
            </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900">BOM Items</h3>
                <button 
                  onClick={handleAddItem} 
                  className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Add Item
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="text-sm">No BOM items added yet</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Item" to start building your BOM</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 grid grid-cols-10 gap-2 p-3 text-xs font-medium text-slate-600 border-b">
                      <div className="col-span-2">Product</div>
                      <div>Qty</div>
                      <div>UoM</div>
                      <div>Seq</div>
                      <div>Optional</div>
                      <div>Phantom</div>
                      <div>1:1</div>
                      <div>Actions</div>
                    </div>
                    {items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-10 gap-2 p-3 border-b border-slate-100 items-center hover:bg-slate-50">
                <div className="col-span-2">
                  <ProductSelect
                    value={it.material_id || null}
                    onChange={(product) => handleSelectProduct(idx, product)}
                    placeholder="Search product…"
                    allowedGroups={['MEAT', 'DRYGOODS', 'COMPOSITE']}
                  />
                </div>
                        <input 
                          type="number" 
                          className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={it.quantity}
                          onChange={e => handleChangeItem(idx, 'quantity', Number(e.target.value))} 
                          placeholder="Qty" 
                        />
                        <input 
                          className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={it.uom}
                          onChange={e => handleChangeItem(idx, 'uom', e.target.value)} 
                          placeholder="UoM" 
                        />
                        <input 
                          type="number" 
                          className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={it.sequence ?? idx + 1}
                          onChange={e => handleChangeItem(idx, 'sequence', Number(e.target.value))} 
                          placeholder="Seq" 
                        />
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={it.is_optional || false} 
                            onChange={e => handleChangeItem(idx, 'is_optional', e.target.checked)} 
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                        </div>
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={it.is_phantom || false} 
                            onChange={e => handleChangeItem(idx, 'is_phantom', e.target.checked)} 
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                        </div>
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={it.one_to_one || false} 
                            onChange={e => handleChangeItem(idx, 'one_to_one', e.target.checked)} 
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(idx)} 
                          className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
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


