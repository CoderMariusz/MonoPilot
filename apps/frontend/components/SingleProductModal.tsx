"use client";
import { useState } from 'react';
import { createSingle } from '@/lib/api/products.createSingle';
import type { ProductInsert, ProductGroup, ProductType, DbType, ExpiryPolicy } from '@/lib/types';

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
      await createSingle({ product });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Add Single Product</h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900">×</button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Product Group</label>
            <select
              value={group}
              onChange={e => handleChange('product_group', e.target.value as ProductGroup)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="MEAT">MEAT</option>
              <option value="DRYGOODS">DRYGOODS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Product Type</label>
            <input
              value={form.product_type ?? ''}
              onChange={e => handleChange('product_type', e.target.value as ProductType)}
              placeholder={group === 'MEAT' ? 'RM_MEAT' : 'DG_ING'}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Part Number</label>
            <input
              value={form.part_number ?? ''}
              onChange={e => handleChange('part_number', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={form.description ?? ''}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">UoM</label>
            <input
              value={form.uom ?? ''}
              onChange={e => handleChange('uom', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Supplier</label>
            <input
              type="number"
              value={form.preferred_supplier_id ?? ''}
              onChange={e => handleChange('preferred_supplier_id', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tax Code</label>
            <input
              type="number"
              value={form.tax_code_id ?? ''}
              onChange={e => handleChange('tax_code_id', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lead Time (days)</label>
            <input
              type="number"
              value={form.lead_time_days ?? ''}
              onChange={e => handleChange('lead_time_days', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">MOQ</label>
            <input
              type="number"
              value={form.moq ?? ''}
              onChange={e => handleChange('moq', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiry Policy</label>
            <input
              value={(form.expiry_policy as string) ?? ''}
              onChange={e => handleChange('expiry_policy', e.target.value as any)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shelf Life (days)</label>
            <input
              type="number"
              value={form.shelf_life_days ?? ''}
              onChange={e => handleChange('shelf_life_days', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Std Price</label>
            <input
              type="number"
              value={form.std_price ?? ''}
              onChange={e => handleChange('std_price', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 text-sm border rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-3 py-1 text-sm bg-slate-900 text-white rounded disabled:opacity-50">
            {submitting ? 'Saving…' : `Save (${mappedType})`}
          </button>
        </div>
      </div>
    </div>
  );
}


