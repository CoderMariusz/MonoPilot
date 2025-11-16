'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { TaxCodesAPI } from '@/lib/api/taxCodes';
import type { TaxCode } from '@/lib/types';
import { useToast } from '@/lib/toast';
import { useAuthAwareEffect } from '@/lib/hooks/useAuthAwareEffect';

export function TaxCodesTable() {
  const { showToast } = useToast();
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch data after auth is ready
  useAuthAwareEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await TaxCodesAPI.getAll();
        setTaxCodes(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to fetch data', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [showToast]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxCode, setEditingTaxCode] = useState<TaxCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    rate: '',
    is_active: true,
  });

  const handleAdd = () => {
    setEditingTaxCode(null);
    setFormData({
      code: '',
      description: '',
      rate: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (taxCode: TaxCode) => {
    setEditingTaxCode(taxCode);
    setFormData({
      code: taxCode.code,
      description: taxCode.description || '',
      rate: taxCode.rate.toString(),
      is_active: taxCode.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this tax code?')) {
      try {
        await TaxCodesAPI.delete(id);
        setTaxCodes(prev => prev.filter(item => item.id !== id));
        showToast('Tax code deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting tax code:', error);
        showToast('Failed to delete tax code', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.rate.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const rate = parseFloat(formData.rate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      showToast('Rate must be a number between 0 and 1', 'error');
      return;
    }

    try {
      if (editingTaxCode) {
        const updatedItem = await TaxCodesAPI.update(editingTaxCode.id, {
          code: formData.code.trim(),
          description: formData.description.trim() || null,
          rate: rate,
          is_active: formData.is_active,
        });
        setTaxCodes(prev => prev.map(item => item.id === editingTaxCode.id ? updatedItem : item));
        showToast('Tax code updated successfully', 'success');
      } else {
        const newItem = await TaxCodesAPI.create({
          code: formData.code.trim(),
          description: formData.description.trim() || null,
          rate: rate,
          is_active: formData.is_active,
        });
        setTaxCodes(prev => [...prev, newItem]);
        showToast('Tax code created successfully', 'success');
      }
      
      setIsModalOpen(false);
      setFormData({
        code: '',
        description: '',
        rate: '',
        is_active: true,
      });
    } catch (error) {
      console.error('Error saving tax code:', error);
      showToast('Failed to save tax code', 'error');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTaxCode(null);
    setFormData({
      code: '',
      name: '',
      rate: '',
      is_active: true,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Tax Codes</h3>
          <p className="text-sm text-slate-600">Manage tax rates for products and suppliers</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tax Code
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {taxCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No tax codes found. Click "Add Tax Code" to create your first one.
                  </td>
                </tr>
              ) : (
                taxCodes.map((taxCode) => (
                  <tr key={taxCode.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{taxCode.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{taxCode.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {(taxCode.rate * 100).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        taxCode.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {taxCode.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(taxCode)}
                          className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(taxCode.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingTaxCode ? 'Edit Tax Code' : 'Add Tax Code'}
              </h3>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g., STD, RED, ZERO"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g., Standard Rate"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rate <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="0.20"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-slate-500 text-sm">(0-1)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter as decimal (0.20 = 20%)
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                >
                  {editingTaxCode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
