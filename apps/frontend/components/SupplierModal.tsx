'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SuppliersAPI } from '@/lib/api/suppliers';
import { TaxCodesAPI } from '@/lib/api/taxCodes';
import type { Supplier, TaxCode } from '@/lib/types';
import { useToast } from '@/lib/toast';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSuccess: () => void;
}

export function SupplierModal({ isOpen, onClose, supplier, onSuccess }: SupplierModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    legal_name: '',
    vat_number: '',
    tax_number: '',
    country: '',
    currency: 'USD',
    payment_terms: '',
    email: '',
    phone: '',
    address_street: '',
    address_city: '',
    address_postal_code: '',
    address_country: '',
    default_tax_code_id: '',
    lead_time_days: '',
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadTaxCodes();
      if (supplier) {
        // Edit mode - populate form
        const address = supplier.address && typeof supplier.address === 'object' 
          ? supplier.address as any 
          : {};
        setFormData({
          code: supplier.code || '',
          name: supplier.name || '',
          legal_name: supplier.legal_name || '',
          vat_number: supplier.vat_number || '',
          tax_number: supplier.tax_number || '',
          country: supplier.country || '',
          currency: supplier.currency || 'USD',
          payment_terms: supplier.payment_terms || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address_street: address.street || address.address_line1 || '',
          address_city: address.city || '',
          address_postal_code: address.postal_code || address.zip_code || '',
          address_country: address.country || '',
          default_tax_code_id: supplier.default_tax_code_id?.toString() || '',
          lead_time_days: supplier.lead_time_days?.toString() || '',
          is_active: supplier.is_active ?? true,
        });
      } else {
        // Create mode - reset form
        setFormData({
          code: '',
          name: '',
          legal_name: '',
          vat_number: '',
          tax_number: '',
          country: '',
          currency: 'USD',
          payment_terms: '',
          email: '',
          phone: '',
          address_street: '',
          address_city: '',
          address_postal_code: '',
          address_country: '',
          default_tax_code_id: '',
          lead_time_days: '',
          is_active: true,
        });
      }
    }
  }, [isOpen, supplier]);

  const loadTaxCodes = async () => {
    try {
      const data = await TaxCodesAPI.getAll();
      setTaxCodes(data);
    } catch (error) {
      console.error('Error loading tax codes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      showToast('Code is required', 'error');
      return;
    }

    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      // Build address object
      const address: any = {};
      if (formData.address_street) address.street = formData.address_street;
      if (formData.address_city) address.city = formData.address_city;
      if (formData.address_postal_code) address.postal_code = formData.address_postal_code;
      if (formData.address_country) address.country = formData.address_country;

      const supplierData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        legal_name: formData.legal_name?.trim() || undefined,
        vat_number: formData.vat_number?.trim() || undefined,
        tax_number: formData.tax_number?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        currency: formData.currency || 'USD',
        payment_terms: formData.payment_terms?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: Object.keys(address).length > 0 ? address : undefined,
        default_tax_code_id: formData.default_tax_code_id ? parseInt(formData.default_tax_code_id) : undefined,
        lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : undefined,
        is_active: formData.is_active,
      };

      if (supplier) {
        await SuppliersAPI.update(supplier.id, supplierData);
        showToast('Supplier updated successfully', 'success');
      } else {
        await SuppliersAPI.create(supplierData);
        showToast('Supplier created successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      showToast(error?.message || 'Failed to save supplier', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {supplier ? 'Edit Supplier' : 'Add Supplier'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g., SUP001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Tax Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tax Number
                  </label>
                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Default Tax Code
                  </label>
                  <select
                    value={formData.default_tax_code_id}
                    onChange={(e) => setFormData({ ...formData, default_tax_code_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Select Tax Code</option>
                    {taxCodes
                      .filter(tc => tc.is_active)
                      .map(tc => (
                        <option key={tc.id} value={tc.id}>
                          {tc.code} - {tc.description || tc.code} ({(tc.rate * 100).toFixed(2)}%)
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Street
                  </label>
                  <input
                    type="text"
                    value={formData.address_street}
                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.address_city}
                    onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.address_postal_code}
                    onChange={(e) => setFormData({ ...formData, address_postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.address_country}
                    onChange={(e) => setFormData({ ...formData, address_country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Financial Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="PLN">PLN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="e.g., Net 30"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                    Active
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : supplier ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

