'use client';

import { useState, useMemo } from 'react';
import { Loader2, Eye, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { usePurchaseOrders, deletePurchaseOrder } from '@/lib/clientState';
import { PurchaseOrderDetailsModal } from '@/components/PurchaseOrderDetailsModal';
import { EditPurchaseOrderModal } from '@/components/EditPurchaseOrderModal';
import type { PurchaseOrder } from '@/lib/types';

export function PurchaseOrdersTable() {
  const purchaseOrders = usePurchaseOrders();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredPurchaseOrders = useMemo(() => {
    if (!searchQuery.trim()) return purchaseOrders;
    
    const query = searchQuery.toLowerCase();
    return purchaseOrders.filter(po => {
      const poNumber = po.po_number?.toLowerCase() || '';
      const supplier = po.supplier?.toLowerCase() || '';
      const itemCodes = po.purchase_order_items?.map(item => 
        item.product?.part_number?.toLowerCase() || ''
      ).join(' ') || '';
      
      return poNumber.includes(query) || 
             supplier.includes(query) || 
             itemCodes.includes(query);
    });
  }, [purchaseOrders, searchQuery]);

  const sortedPurchaseOrders = useMemo(() => {
    if (!sortColumn) return filteredPurchaseOrders;
    
    return [...filteredPurchaseOrders].sort((a, b) => {
      let aVal, bVal;
      
      switch(sortColumn) {
        case 'po_number':
          aVal = a.po_number;
          bVal = b.po_number;
          break;
        case 'supplier':
          aVal = a.supplier || '';
          bVal = b.supplier || '';
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'due_date':
          aVal = a.due_date ? new Date(a.due_date).getTime() : 0;
          bVal = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'items_count':
          aVal = a.purchase_order_items?.length || 0;
          bVal = b.purchase_order_items?.length || 0;
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
  }, [filteredPurchaseOrders, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (poId: number) => {
    setSelectedPOId(poId);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (poId: number) => {
    setSelectedPOId(poId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (poId: number) => {
    deletePurchaseOrder(poId);
    setDeleteConfirmId(null);
  };

  const handleEditSuccess = () => {
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
        Error loading purchase orders: {error}
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
            placeholder="Search by PO number, supplier, or item codes..."
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
                  onClick={() => handleSort('po_number')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  PO Number
                  {sortColumn === 'po_number' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('supplier')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Supplier
                  {sortColumn === 'supplier' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('due_date')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Date
                  {sortColumn === 'due_date' ? (
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
                  onClick={() => handleSort('items_count')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Total Items
                  {sortColumn === 'items_count' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPurchaseOrders.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No purchase orders found matching your search' : 'No purchase orders found'}
                </td>
              </tr>
            ) : (
              sortedPurchaseOrders.map(po => (
                <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{po.po_number}</td>
                  <td className="py-3 px-4 text-sm">{po.supplier}</td>
                  <td className="py-3 px-4 text-sm">
                    {po.due_date ? new Date(po.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      po.status === 'received' ? 'bg-green-100 text-green-800' :
                      po.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      po.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{po.purchase_order_items?.length || 0}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(po.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(po.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === po.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(po.id)}
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
                          onClick={() => setDeleteConfirmId(po.id)}
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
      <PurchaseOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        purchaseOrderId={selectedPOId}
      />
      <EditPurchaseOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        purchaseOrderId={selectedPOId}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
