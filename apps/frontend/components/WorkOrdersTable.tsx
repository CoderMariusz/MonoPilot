'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader2, Eye, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, X } from 'lucide-react';
import { useWorkOrders, deleteWorkOrder, cancelWorkOrder, getWoProductionStats } from '@/lib/clientState';
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
  const [actionsMenuOpen, setActionsMenuOpen] = useState<number | null>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuOpen !== null) {
        setActionsMenuOpen(null);
      }
    };

    if (actionsMenuOpen !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionsMenuOpen]);

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

  // Helper functions for new columns
  const calculateProgress = (workOrder: WorkOrder) => {
    // For now, return placeholder - will be calculated from actual data later
    if (workOrder.status === 'completed') return '100%';
    if (workOrder.status === 'in_progress') return '50%';
    return '0%';
  };

  const calculateShortages = (workOrder: WorkOrder) => {
    // For now, return placeholder - will be calculated from BOM data later
    return '–';
  };

  const canCancel = (status: string) => {
    return !['in_progress', 'completed', 'cancelled'].includes(status);
  };

  const canDelete = (status: string) => {
    return !['in_progress', 'completed', 'cancelled'].includes(status);
  };

  const canEditQuantityOnly = (status: string) => {
    return ['in_progress', 'completed', 'cancelled'].includes(status);
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'text-slate-500';
    if (priority >= 4) return 'text-red-600 font-medium';
    if (priority >= 3) return 'text-orange-600 font-medium';
    return 'text-green-600 font-medium';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '–';
    return new Date(dateString).toLocaleDateString();
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
                  WO #
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('quantity')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Qty + UoM
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('line')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Line/Machine
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
                  Dates
                  {sortColumn === 'due_date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Priority</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Made</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Progress %</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Shortages</th>
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
                  <td className="py-3 px-4 text-sm font-medium">{wo.wo_number}</td>
                  <td className="py-3 px-4 text-sm">
                    <div>
                      <div className="font-medium text-slate-900">{wo.product?.description || '-'}</div>
                      <div className="text-xs text-slate-500">{wo.product?.part_number || ''}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="font-medium">{wo.quantity}</div>
                    <div className="text-xs text-slate-500">{wo.product?.uom || ''}</div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      wo.status === 'completed' ? 'bg-green-100 text-green-800' :
                      wo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      wo.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      wo.status === 'released' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="text-sm">{wo.machine?.name || wo.line_number || '-'}</div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="text-sm">
                      {wo.due_date ? formatDate(wo.due_date) : 
                       wo.scheduled_start ? formatDate(wo.scheduled_start) : '–'}
                    </div>
                    {wo.scheduled_start && wo.scheduled_end && (
                      <div className="text-xs text-slate-500">
                        {formatDate(wo.scheduled_start)} - {formatDate(wo.scheduled_end)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`text-sm ${getPriorityColor(wo.priority)}`}>
                      {wo.priority ? `P${wo.priority}` : '–'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {(() => {
                      const stats = getWoProductionStats(wo.id);
                      return (
                        <div>
                          <div className="font-medium">{stats.madeQty.toFixed(2)} {wo.product?.uom || ''}</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {(() => {
                      const stats = getWoProductionStats(wo.id);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(stats.progressPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{stats.progressPct}%</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="text-sm text-slate-600">{calculateShortages(wo)}</span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="relative">
                      <button
                        onClick={() => setActionsMenuOpen(actionsMenuOpen === wo.id ? null : wo.id)}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>
                      
                      {actionsMenuOpen === wo.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                          <button
                            onClick={() => {
                              handleViewDetails(wo.id);
                              setActionsMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="w-4 h-4" />
                            View details
                          </button>
                          <button
                            onClick={() => {
                              handleEdit(wo);
                              setActionsMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (!canCancel(wo.status)) return;
                              
                              if (!confirm('Are you sure you want to cancel this work order?')) {
                                setActionsMenuOpen(null);
                                return;
                              }
                              
                              const reason = prompt('Cancellation reason (optional):');
                              const success = cancelWorkOrder(wo.id, reason);
                              
                              if (success) {
                                toast.success(`Work Order ${wo.wo_number} cancelled`);
                              } else {
                                toast.error('Failed to cancel work order');
                              }
                              
                              setActionsMenuOpen(null);
                            }}
                            disabled={!canCancel(wo.status)}
                            className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                              canCancel(wo.status) 
                                ? 'text-red-700 hover:bg-red-50' 
                                : 'text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          {canDelete(wo.status) && (
                            <button
                              onClick={() => {
                                setDeleteConfirmId(wo.id);
                                setActionsMenuOpen(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </div>
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
