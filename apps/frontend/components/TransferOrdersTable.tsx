'use client';

import { useState, useMemo } from 'react';
import { Loader2, Eye, Edit, Trash2, Search } from 'lucide-react';
import { useTransferOrders, deleteTransferOrder } from '@/lib/clientState';
import { TransferOrderDetailsModal } from '@/components/TransferOrderDetailsModal';
import { EditTransferOrderModal } from '@/components/EditTransferOrderModal';
import type { TransferOrder } from '@/lib/types';

export function TransferOrdersTable() {
  const transferOrders = useTransferOrders();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedTOId, setSelectedTOId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransferOrders = useMemo(() => {
    if (!searchQuery.trim()) return transferOrders;
    
    const query = searchQuery.toLowerCase();
    return transferOrders.filter(to => {
      const toNumber = to.to_number?.toLowerCase() || '';
      const fromLocation = to.from_location?.name?.toLowerCase() || '';
      const toLocation = to.to_location?.name?.toLowerCase() || '';
      const itemCodes = to.transfer_order_items?.map(item => 
        item.product?.part_number?.toLowerCase() || ''
      ).join(' ') || '';
      
      return toNumber.includes(query) || 
             fromLocation.includes(query) || 
             toLocation.includes(query) || 
             itemCodes.includes(query);
    });
  }, [transferOrders, searchQuery]);

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
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">TO Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">From Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">To Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Total Items</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransferOrders.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No transfer orders found matching your search' : 'No transfer orders found'}
                </td>
              </tr>
            ) : (
              filteredTransferOrders.map(to => (
                <tr key={to.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{to.to_number}</td>
                  <td className="py-3 px-4 text-sm">{to.from_location?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm">{to.to_location?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm">
                    {to.created_at ? new Date(to.created_at).toLocaleDateString() : '-'}
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
