'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { AllergensAPI } from '@/lib/api/allergens';
import type { Allergen } from '@/lib/types';
import { useToast } from '@/lib/toast';
import { useAuthAwareEffect } from '@/lib/hooks/useAuthAwareEffect';

export function AllergensTable() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // Fetch data after auth is ready
  useAuthAwareEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await AllergensAPI.getAll();
        setAllergens(data);
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
  const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  const handleAdd = () => {
    setEditingAllergen(null);
    setFormData({
      code: '',
      name: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (allergen: Allergen) => {
    setEditingAllergen(allergen);
    setFormData({
      code: allergen.code,
      name: allergen.name,
      description: allergen.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this allergen?')) return;
    try {
      await AllergensAPI.delete(id);
      setAllergens(prev => prev.filter(item => item.id !== id));
      showToast('Allergen deleted successfully', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete allergen', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allergenData = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      is_active: true,
    };

    try {
      if (editingAllergen) {
        const updatedItem = await AllergensAPI.update(editingAllergen.id as any, allergenData as any);
        setAllergens(prev => prev.map(item => item.id === editingAllergen.id ? (updatedItem as Allergen) : item));
        showToast('Allergen updated successfully', 'success');
      } else {
        const newItem = await AllergensAPI.create(allergenData as any);
        setAllergens(prev => [...prev, newItem as Allergen]);
        showToast('Allergen added successfully', 'success');
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to save allergen', 'error');
      return;
    }
    
    setIsModalOpen(false);
    setFormData({
      code: '',
      name: '',
      description: '',
    });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Allergen
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {allergens.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                  No allergens configured yet
                </td>
              </tr>
            ) : (
              allergens.map((allergen) => (
                <tr key={allergen.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{allergen.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{allergen.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{allergen.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(allergen)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(allergen.id)}
                        className="text-red-600 hover:text-red-900"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingAllergen ? 'Edit Allergen' : 'Add Allergen'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingAllergen ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
