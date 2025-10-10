'use client';

import { useState, useMemo } from 'react';
import { Loader2, Eye, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useWorkOrders, deleteWorkOrder } from '@/lib/clientState';
import { WorkOrderDetailsModal } from '@/components/WorkOrderDetailsModal';
import { CreateWorkOrderModal } from '@/components/CreateWorkOrderModal';
import { toast } from '@/lib/toast';
import type { WorkOrder } from '@/lib/types';

export function WorkOrdersTable() {
  const workOrders = useWorkOrders();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const sortedWorkOrders = useMemo(() => {
    if (!sortColumn) return filteredWorkOrders;
    
    return [...filteredWorkOrders].sort((a, b) => {
      let aVal, bVal;
      
      switch(sortColumn) {
        case 'wo_number':
          aVal = a.wo_number;
          bVal = b.wo_number;
          break;
        case 'product':
          aVal = a.product?.description || '';
          bVal = b.product?.description || '';
          break;
        case 'quantity':
          aVal = parseFloat(a.quantity) || 0;
          bVal = parseFloat(b.quantity) || 0;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'line':
          aVal = a.machine?.name || '';
          bVal = b.machine?.name || '';
          break;
        case 'due_date':
          aVal = a.due_date ? new Date(a.due_date).getTime() : 0;
          bVal = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  }, [filteredWorkOrders, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (workOrderId: number) => {
    setSelectedWorkOrderId(workOrderId);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
  };

  const handleEditSuccess = () => {
    setEditingWorkOrder(null);
    toast.success('Work order updated successfully');
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('wo_number')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  WO Number
                  {sortColumn === 'wo_number' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('product')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Product
                  {sortColumn === 'product' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Item Code</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('quantity')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Quantity
                  {sortColumn === 'quantity' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('status')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Status
                  {sortColumn === 'status' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Allergens</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('line')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Line Number
                  {sortColumn === 'line' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('due_date')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Due Date
                  {sortColumn === 'due_date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Scheduled</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Material Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedWorkOrders.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={11} className="py-8 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No work orders found matching your search' : 'No work orders found'}
                </td>
              </tr>
            ) : (
              sortedWorkOrders.map(wo => (
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
                  <td className="py-3 px-4 text-sm">{wo.machine?.name || '-'}</td>
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
                      <button
                        onClick={() => handleEdit(wo)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
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
      <CreateWorkOrderModal
        isOpen={editingWorkOrder !== null}
        onClose={() => setEditingWorkOrder(null)}
        onSuccess={handleEditSuccess}
        editingWorkOrder={editingWorkOrder}
      />
    </>
  );
}
