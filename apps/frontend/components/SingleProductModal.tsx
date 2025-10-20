"use client";
import { useEffect, useMemo, useState } from 'react';
import { createSingle } from '@/lib/api/products.createSingle';
import { toast } from '@/lib/toast';
import { supabase } from '@/lib/supabase/client-browser';
import type { ProductInsert, ProductGroup, ProductType, DbType, ExpiryPolicy } from '@/lib/types';
import AllergenChips from '@/components/AllergenChips';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SingleProductModal({ isOpen, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<Partial<ProductInsert>>({
    product_group: 'MEAT',
    product_type: 'RM_MEAT',
    uom: 'kg',
  });
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

  const group = form.product_group ?? 'MEAT';
  const mappedType: DbType = group === 'MEAT' ? 'RM' : 'DG';

  const handleChange = (field: keyof ProductInsert, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (!form.part_number || !form.description || !form.uom) {
        setError('part_number, description and uom are required');
        setSubmitting(false);
        return;
      }
      const product: ProductInsert = {
        type: mappedType,
        part_number: form.part_number!,
        description: form.description!,
        uom: form.uom!,
        product_group: group,
        product_type: form.product_type,
        preferred_supplier_id: form.preferred_supplier_id ?? null,
        tax_code_id: form.tax_code_id ?? null,
        lead_time_days: form.lead_time_days ?? null,
        moq: form.moq ?? null,
        expiry_policy: (form.expiry_policy as ExpiryPolicy | null) ?? null,
        shelf_life_days: form.shelf_life_days ?? null,
        std_price: form.std_price ?? null,
        production_lines: form.production_lines ?? [],
      };
      const created = await createSingle({ product });
      if (selectedAllergens.length > 0 && created?.id) {
        const rows = selectedAllergens.map((allergen_id) => ({ product_id: created.id, allergen_id, contains: true }));
        const { error: paErr } = await supabase.from('product_allergens').insert(rows);
        if (paErr) console.warn('Failed to save allergens', paErr);
      }
      toast.success('Product created successfully');
      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.message || 'Failed to create product';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Add Single Product</h2>
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
          <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Group</label>
            <select
              value={group}
              onChange={e => handleChange('product_group', e.target.value as ProductGroup)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="MEAT">MEAT</option>
              <option value="DRYGOODS">DRYGOODS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
            <select
              value={form.product_type ?? ''}
              onChange={e => handleChange('product_type', e.target.value as ProductType)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {(form.product_group === 'DRYGOODS' ? ['DG_ING','DG_LABEL','DG_WEB','DG_BOX','DG_SAUCE'] : ['RM_MEAT']).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Part Number</label>
            <input
              value={form.part_number ?? ''}
              onChange={e => handleChange('part_number', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              value={form.description ?? ''}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">UoM</label>
            <input
              value={form.uom ?? ''}
              onChange={e => handleChange('uom', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Supplier</label>
            <select
              value={form.preferred_supplier_id ?? ''}
              onChange={e => handleChange('preferred_supplier_id', e.target.value ? Number(e.target.value) : null)}
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
              value={form.tax_code_id ?? ''}
              onChange={e => handleChange('tax_code_id', e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {taxCodes.map(t => (
                <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (days)</label>
            <input
              type="number"
              value={form.lead_time_days ?? ''}
              onChange={e => handleChange('lead_time_days', e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">MOQ</label>
            <input
              type="number"
              value={form.moq ?? ''}
              onChange={e => handleChange('moq', e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Policy</label>
            <select
              value={(form.expiry_policy as string) ?? ''}
              onChange={e => handleChange('expiry_policy', e.target.value as any)}
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
              value={form.shelf_life_days ?? ''}
              onChange={e => handleChange('shelf_life_days', e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Std Price</label>
            <input
              type="number"
              value={form.std_price ?? ''}
              onChange={e => handleChange('std_price', e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Allergens</label>
            <AllergenChips
              allergens={allergens}
              selectedIds={selectedAllergens}
              onToggle={(id) => setSelectedAllergens(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            />
          </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-6 py-3 border border-slate-300 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {submitting ? 'Saving…' : `Save (${mappedType})`}
          </button>
        </div>
      </div>
    </div>
  );
}


