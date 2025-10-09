'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useLocations, addLocation, updateLocation, deleteLocation } from '@/lib/clientState';
import type { Location } from '@/lib/types';
import { useToast } from '@/lib/toast';

export function LocationsTable() {
  const locations = useLocations();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    zone: '',
    is_active: true,
  });

  const handleAdd = () => {
    setEditingLocation(null);
    setFormData({
      code: '',
      name: '',
      zone: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      code: location.code,
      name: location.name,
      zone: location.zone || '',
      is_active: location.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this location?')) {
      const success = deleteLocation(id);
      if (success) {
        showToast('Location deleted successfully', 'success');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const locationData = {
      code: formData.code,
      name: formData.name,
      zone: formData.zone || null,
      is_active: formData.is_active,
    };

    if (editingLocation) {
      updateLocation(editingLocation.id, locationData);
      showToast('Location updated successfully', 'success');
    } else {
      addLocation(locationData);
      showToast('Location added successfully', 'success');
    }
    
    setIsModalOpen(false);
    setFormData({
      code: '',
      name: '',
      zone: '',
      is_active: true,
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
          Add Location
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {locations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  No locations configured yet
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <tr key={location.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{location.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{location.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{location.zone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      location.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {location.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(location)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
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
              {editingLocation ? 'Edit Location' : 'Add Location'}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zone</label>
                  <input
                    type="text"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-slate-700">Active</label>
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
                  {editingLocation ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
