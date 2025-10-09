'use client';

import { useState, useMemo } from 'react';
import { Loader2, Eye, Trash2, Search } from 'lucide-react';
import { useWorkOrders, deleteWorkOrder } from '@/lib/clientState';
import { WorkOrderDetailsModal } from '@/components/WorkOrderDetailsModal';
import { toast } from '@/lib/toast';
import type { WorkOrder } from '@/lib/types';

export function WorkOrdersTable() {
  const workOrders = useWorkOrders();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkOrders = useMemo(() => {
    if (!searchQuery.trim()) return workOrders;
    
    const query = searchQuery.toLowerCase();
    return workOrders.filter(wo => {
      const woNumber = wo.wo_number?.toLowerCase() || '';
      const productName = wo.product?.description?.toLowerCase() || '';
      const itemCode = wo.product?.part_number?.toLowerCase() || '';
      
      return woNumber.includes(query) || 
             productName.includes(query) || 
             itemCode.includes(query);
    });
  }, [workOrders, searchQuery]);

  const handleViewDetails = (workOrderId: number) => {
    setSelectedWorkOrderId(workOrderId);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = (woId: number) => {
    const success = deleteWorkOrder(woId);
    if (success) {
      toast.success('Work order deleted successfully');
    } else {
      toast.error('Failed to delete work order');
    }
    setDeleteConfirmId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-6 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
        Error loading work orders: {error}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by WO number, product name, or item code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">WO Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Item Code</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Allergens</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Line Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Due Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Scheduled</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Material Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkOrders.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={11} className="py-8 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No work orders found matching your search' : 'No work orders found'}
                </td>
              </tr>
            ) : (
              filteredWorkOrders.map(wo => (
                <tr key={wo.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{wo.wo_number}</td>
                  <td className="py-3 px-4 text-sm">{wo.product?.description || '-'}</td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-600">{wo.product?.part_number || '-'}</td>
                  <td className="py-3 px-4 text-sm">{wo.quantity}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      wo.status === 'completed' ? 'bg-green-100 text-green-800' :
                      wo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      wo.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {wo.product?.allergens && wo.product.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {wo.product.allergens.map(allergen => (
                          <span
                            key={allergen.id}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500 text-white"
                          >
                            {allergen.code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">{wo.line_number || '-'}</td>
                  <td className="py-3 px-4 text-sm">
                    {wo.due_date ? new Date(wo.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {wo.scheduled_start && wo.scheduled_end ? (
                      <div className="text-xs">
                        <div>{new Date(wo.scheduled_start).toLocaleString()}</div>
                        <div className="text-slate-500">to {new Date(wo.scheduled_end).toLocaleString()}</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(wo.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === wo.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(wo.id)}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-slate-600 hover:text-slate-800 text-xs px-2 py-1 border border-slate-300 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(wo.id)}
                          className="text-slate-600 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <WorkOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        workOrderId={selectedWorkOrderId}
      />
    </>
  );
}
