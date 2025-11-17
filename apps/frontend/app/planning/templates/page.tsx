'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WOTemplatesAPI, type WOTemplate } from '@/lib/api/woTemplates';

type SortField = 'template_name' | 'usage_count' | 'last_used_at' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function TemplatesPage() {
  const router = useRouter();

  // Data state
  const [templates, setTemplates] = useState<WOTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState<number | ''>('');
  const [filterCreatedBy, setFilterCreatedBy] = useState<number | ''>('');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('usage_count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{ id: number; name: string } | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WOTemplatesAPI.getAll();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  // Get unique products and creators for filters
  const uniqueProducts = useMemo(() => {
    const products = templates
      .filter((t) => t.product)
      .map((t) => ({ id: t.product!.id, name: t.product!.part_number }));
    return Array.from(new Map(products.map((p) => [p.id, p])).values());
  }, [templates]);

  const uniqueCreators = useMemo(() => {
    const creators = templates
      .filter((t) => t.created_by_user)
      .map((t) => ({ id: t.created_by_user!.id, name: t.created_by_user!.name }));
    return Array.from(new Map(creators.map((c) => [c.id, c])).values());
  }, [templates]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.template_name.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.product?.part_number.toLowerCase().includes(term)
      );
    }

    // Product filter
    if (filterProduct !== '') {
      filtered = filtered.filter((t) => t.product_id === filterProduct);
    }

    // Created by filter
    if (filterCreatedBy !== '') {
      filtered = filtered.filter((t) => t.created_by === filterCreatedBy);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'template_name') {
        aValue = a.template_name.toLowerCase();
        bValue = b.template_name.toLowerCase();
      } else if (sortField === 'usage_count') {
        aValue = a.usage_count;
        bValue = b.usage_count;
      } else if (sortField === 'last_used_at') {
        aValue = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
        bValue = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
      } else if (sortField === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [templates, searchTerm, filterProduct, filterCreatedBy, sortField, sortDirection]);

  // Action handlers
  const handleUseTemplate = async (templateId: number) => {
    try {
      const validation = await WOTemplatesAPI.validateTemplate(templateId);
      if (!validation.valid) {
        alert(`Template validation failed:\n${validation.errors.join('\n')}`);
        return;
      }

      // Navigate to WO creation with template ID
      router.push(`/planning/work-orders/new?template=${templateId}`);
    } catch (err) {
      alert('Failed to validate template');
    }
  };

  const handleEdit = (templateId: number) => {
    router.push(`/planning/templates/${templateId}/edit`);
  };

  const handleDelete = async (templateId: number) => {
    try {
      await WOTemplatesAPI.delete(templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));
      setDeleteConfirm(null);
      alert('Template deleted successfully');
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateModal || !duplicateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const newTemplate = await WOTemplatesAPI.duplicate(duplicateModal.id, duplicateName.trim());
      setTemplates([...templates, newTemplate]);
      setDuplicateModal(null);
      setDuplicateName('');
      alert(`Template duplicated as "${duplicateName}"`);
    } catch (err) {
      alert('Failed to duplicate template');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading templates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadTemplates}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Production Templates</h1>
        <p className="text-sm text-slate-600 mt-1">
          Save and reuse Work Order configurations for faster production planning
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Template name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Product</label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Products</option>
              {uniqueProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Created By Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Created By</label>
            <select
              value={filterCreatedBy}
              onChange={(e) => setFilterCreatedBy(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {uniqueCreators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-slate-600">
              Showing <span className="font-medium">{filteredTemplates.length}</span> of{' '}
              <span className="font-medium">{templates.length}</span> templates
            </div>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('template_name')}
                >
                  <div className="flex items-center gap-1">
                    Template Name
                    {sortField === 'template_name' && (
                      <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Description
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('usage_count')}
                >
                  <div className="flex items-center gap-1">
                    Usage Count
                    {sortField === 'usage_count' && (
                      <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('last_used_at')}
                >
                  <div className="flex items-center gap-1">
                    Last Used
                    {sortField === 'last_used_at' && (
                      <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm || filterProduct !== '' || filterCreatedBy !== ''
                      ? 'No templates match your filters'
                      : 'No templates yet. Create a Work Order and save it as a template.'}
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{template.template_name}</span>
                        {template.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {template.product?.part_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {template.description ? (
                        <span className="line-clamp-1">{template.description}</span>
                      ) : (
                        <span className="text-slate-400 italic">No description</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{template.usage_count}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatDate(template.last_used_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {template.created_by_user?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUseTemplate(template.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          Use Template
                        </button>
                        <button
                          onClick={() => handleEdit(template.id)}
                          className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            setDuplicateModal({ id: template.id, name: template.template_name })
                          }
                          className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(template.id)}
                          className="px-3 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50"
                        >
                          Delete
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Template</h2>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Modal */}
      {duplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Duplicate Template</h2>
            <p className="text-sm text-slate-600 mb-4">
              Create a copy of "{duplicateModal.name}"
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Template Name
              </label>
              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder={`${duplicateModal.name} (Copy)`}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDuplicateModal(null);
                  setDuplicateName('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
