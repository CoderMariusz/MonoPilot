'use client';

import { useState, useMemo } from 'react';
import { Loader2, Eye, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSupabaseTransferOrders } from '@/lib/hooks/useSupabaseData';
import { deleteTransferOrder } from '@/lib/clientState';
import { TransferOrderDetailsModal } from '@/components/TransferOrderDetailsModal';
import { EditTransferOrderModal } from '@/components/EditTransferOrderModal';
import type { TransferOrder } from '@/lib/types';

export function TransferOrdersTable() {
  const { data: transferOrders, loading: loadingData, error: loadError } = useSupabaseTransferOrders();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedTOId, setSelectedTOId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredTransferOrders = useMemo(() => {
    if (!searchQuery.trim()) return transferOrders;
    
    const query = searchQuery.toLowerCase();
    return transferOrders.filter(to => {
      const toNumber = to.to_number?.toLowerCase() || '';
      const fromWarehouse = to.from_warehouse?.name?.toLowerCase() || '';
      const toWarehouse = to.to_warehouse?.name?.toLowerCase() || '';
      const itemCodes = to.transfer_order_items?.map(item => 
        item.product?.part_number?.toLowerCase() || ''
      ).join(' ') || '';
      
      return toNumber.includes(query) || 
             fromWarehouse.includes(query) || 
             toWarehouse.includes(query) || 
             itemCodes.includes(query);
    });
  }, [transferOrders, searchQuery]);

  const sortedTransferOrders = useMemo(() => {
    if (!sortColumn) return filteredTransferOrders;
    
    return [...filteredTransferOrders].sort((a, b) => {
      let aVal, bVal;
      
      switch(sortColumn) {
        case 'to_number':
          aVal = a.to_number;
          bVal = b.to_number;
          break;
        case 'from_warehouse':
        case 'from_location':
          aVal = a.from_warehouse?.name || '';
          bVal = b.from_warehouse?.name || '';
          break;
        case 'to_warehouse':
        case 'to_location':
          aVal = a.to_warehouse?.name || '';
          bVal = b.to_warehouse?.name || '';
          break;
        case 'planned_ship_date':
          aVal = a.planned_ship_date ? new Date(a.planned_ship_date).getTime() : 0;
          bVal = b.planned_ship_date ? new Date(b.planned_ship_date).getTime() : 0;
          break;
        case 'actual_ship_date':
          aVal = a.actual_ship_date ? new Date(a.actual_ship_date).getTime() : 0;
          bVal = b.actual_ship_date ? new Date(b.actual_ship_date).getTime() : 0;
          break;
        case 'planned_receive_date':
          aVal = a.planned_receive_date ? new Date(a.planned_receive_date).getTime() : 0;
          bVal = b.planned_receive_date ? new Date(b.planned_receive_date).getTime() : 0;
          break;
        case 'actual_receive_date':
          aVal = a.actual_receive_date ? new Date(a.actual_receive_date).getTime() : 0;
          bVal = b.actual_receive_date ? new Date(b.actual_receive_date).getTime() : 0;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'created_at':
          aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
          bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'items_count':
          aVal = a.transfer_order_items?.length || 0;
          bVal = b.transfer_order_items?.length || 0;
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
  }, [filteredTransferOrders, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (toId: number) => {
    setSelectedTOId(toId);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (toId: number) => {
    setSelectedTOId(toId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (toId: number) => {
    deleteTransferOrder(toId);
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
        Error loading transfer orders: {error}
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
            placeholder="Search by TO number, locations, or item codes..."
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
                  onClick={() => handleSort('to_number')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  TO Number
                  {sortColumn === 'to_number' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('from_warehouse')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  From Warehouse
                  {sortColumn === 'from_warehouse' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('to_warehouse')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  To Warehouse
                  {sortColumn === 'to_warehouse' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('planned_ship_date')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Planned Ship
                  {sortColumn === 'planned_ship_date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('actual_ship_date')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Actual Ship
                  {sortColumn === 'actual_ship_date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('planned_receive_date')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Planned Receive
                  {sortColumn === 'planned_receive_date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                <button 
                  onClick={() => handleSort('actual_receive_date')} 
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Actual Receive
                  {sortColumn === 'actual_receive_date' ? (
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
            {sortedTransferOrders.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={10} className="py-8 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No transfer orders found matching your search' : 'No transfer orders found'}
                </td>
              </tr>
            ) : (
              sortedTransferOrders.map(to => {
                const formatDate = (dateString?: string) => {
                  if (!dateString) return '–';
                  return new Date(dateString).toLocaleDateString();
                };
                
                return (
                <tr key={to.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{to.to_number}</td>
                  <td className="py-3 px-4 text-sm">{to.from_warehouse?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm">{to.to_warehouse?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm">{formatDate(to.planned_ship_date)}</td>
                  <td className={`py-3 px-4 text-sm ${to.actual_ship_date ? 'font-bold text-green-700' : ''}`}>
                    {formatDate(to.actual_ship_date)}
                  </td>
                  <td className="py-3 px-4 text-sm">{formatDate(to.planned_receive_date)}</td>
                  <td className={`py-3 px-4 text-sm ${to.actual_receive_date ? 'font-bold text-green-700' : ''}`}>
                    {formatDate(to.actual_receive_date)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      to.status === 'received' ? 'bg-green-100 text-green-800' :
                      to.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                      to.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      to.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {to.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{to.transfer_order_items?.length || 0}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(to.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(to.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === to.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(to.id)}
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
                          onClick={() => setDeleteConfirmId(to.id)}
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
      <TransferOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        transferOrderId={selectedTOId}
      />
      <EditTransferOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transferOrderId={selectedTOId}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
