'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { MachinesAPI } from '@/lib/api/machines';
import type { Machine } from '@/lib/types';
import { useToast } from '@/lib/toast';
import { useAuthAwareEffect } from '@/lib/hooks/useAuthAwareEffect';

export function MachinesTable() {
  const { showToast } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch data after auth is ready
  useAuthAwareEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await MachinesAPI.getAll();
        setMachines(data);
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
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    is_active: true,
  });

  const handleAdd = () => {
    setEditingMachine(null);
    setFormData({
      code: '',
      name: '',
      type: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      code: machine.code,
      name: machine.name,
      type: machine.type,
      is_active: machine.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this machine?')) {
      try {
        await MachinesAPI.delete(id);
        setMachines(prev => prev.filter(item => item.id !== id));
        showToast('Machine deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting machine:', error);
        showToast('Failed to delete machine', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const machineData = {
      code: formData.code,
      name: formData.name,
      type: formData.type,
      is_active: formData.is_active,
    };

    try {
      if (editingMachine) {
        const updatedItem = await MachinesAPI.update(editingMachine.id, machineData);
        setMachines(prev => prev.map(item => item.id === editingMachine.id ? updatedItem : item));
        showToast('Machine updated successfully', 'success');
      } else {
        const newItem = await MachinesAPI.create(machineData);
        setMachines(prev => [...prev, newItem]);
        showToast('Machine added successfully', 'success');
      }
      
      setIsModalOpen(false);
      setFormData({
        code: '',
        name: '',
        type: '',
        is_active: true,
      });
    } catch (error) {
      console.error('Error saving machine:', error);
      showToast('Failed to save machine', 'error');
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Machine
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {machines.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  No machines configured yet
                </td>
              </tr>
            ) : (
              machines.map((machine) => (
                <tr key={machine.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{machine.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{machine.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{machine.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      machine.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {machine.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(machine)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(machine.id)}
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
              {editingMachine ? 'Edit Machine' : 'Add Machine'}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
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
                  {editingMachine ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
