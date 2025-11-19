'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BomHistoryAPI } from '@/lib/api/bomHistory';
import type { BomHistory } from '@/lib/types';

interface BomHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bomId: number;
}

export function BomHistoryModal({ isOpen, onClose, bomId }: BomHistoryModalProps) {
  const [history, setHistory] = useState<BomHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BomHistory | null>(null);

  useEffect(() => {
    if (isOpen && bomId) {
      loadHistory();
    }
  }, [isOpen, bomId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await BomHistoryAPI.getByBomId(bomId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load BOM history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">BOM History</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No history entries found for this BOM.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => {
                // Parse values from JSONB fields
                const version = entry.new_values?.version || entry.old_values?.version || 'N/A';
                const statusFrom = entry.old_values?.status || '';
                const statusTo = entry.new_values?.status || '';
                const description = entry.new_values?.description || '';
                const changes = entry.new_values?.changes || {};
                const timestamp = entry.created_at; // NOT changed_at

                return (
                <div
                  key={entry.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900">
                        Version {version}
                      </span>
                      {statusFrom && statusTo && (
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                          {statusFrom} → {statusTo}
                        </span>
                      )}
                      {!statusFrom && !statusTo && entry.change_type && (
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                          {entry.change_type}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-col items-end gap-1">
                      <div>{new Date(timestamp).toLocaleString()}</div>
                      {entry.changed_by_user?.email && (
                        <div className="text-slate-600">
                          by {entry.changed_by_user.email}
                        </div>
                      )}
                      {!entry.changed_by_user && entry.changed_by && (
                        <div className="text-slate-400 italic">by user {entry.changed_by}</div>
                      )}
                      {!entry.changed_by_user && !entry.changed_by && (
                        <div className="text-slate-400 italic">by Unknown user</div>
                      )}
                    </div>
                  </div>

                  {description && (
                    <p className="text-sm text-slate-600 mb-2">{description}</p>
                  )}

                  {selectedEntry?.id === entry.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="space-y-3">
                        {changes.bom && Object.keys(changes.bom || {}).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">BOM Header Changes:</h4>
                            <div className="bg-slate-50 rounded p-3 space-y-2">
                              {Object.entries(changes.bom || {}).map(([field, change]: [string, any]) => {
                                // Format field name for display
                                let fieldDisplay = field;
                                if (field === 'status') fieldDisplay = 'Status';
                                else if (field === 'version') fieldDisplay = 'Version';
                                else if (field === 'default_routing_id') fieldDisplay = 'Default Routing';
                                else if (field === 'line_id') fieldDisplay = 'Production Lines';
                                else if (field === 'notes') fieldDisplay = 'Notes';
                                else if (field === 'effective_from') fieldDisplay = 'Effective From';
                                else if (field === 'effective_to') fieldDisplay = 'Effective To';
                                
                                // Format values for display
                                let oldValDisplay = change.old;
                                let newValDisplay = change.new;
                                
                                // Handle arrays (like line_id)
                                if (Array.isArray(oldValDisplay)) {
                                  oldValDisplay = oldValDisplay.length > 0 ? oldValDisplay.join(', ') : 'none';
                                }
                                if (Array.isArray(newValDisplay)) {
                                  newValDisplay = newValDisplay.length > 0 ? newValDisplay.join(', ') : 'none';
                                }
                                
                                // Handle null/undefined
                                if (oldValDisplay === null || oldValDisplay === undefined) oldValDisplay = 'none';
                                if (newValDisplay === null || newValDisplay === undefined) newValDisplay = 'none';
                                
                                return (
                                  <div key={field} className="text-sm">
                                    <span className="font-medium text-slate-900">{fieldDisplay}:</span>{' '}
                                    <span className="text-red-600">{String(oldValDisplay)}</span>
                                    {' → '}
                                    <span className="text-green-600">{String(newValDisplay)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {changes.product && Object.keys(changes.product || {}).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">Product Changes:</h4>
                            <div className="bg-slate-50 rounded p-3 space-y-2">
                              {Object.entries(changes.product || {}).map(([field, change]: [string, any]) => {
                                let fieldDisplay = field;
                                if (field === 'description') fieldDisplay = 'Description';
                                else if (field === 'std_price') fieldDisplay = 'Std Price';
                                else if (field === 'expiry_policy') fieldDisplay = 'Expiry Policy';
                                else if (field === 'shelf_life_days') fieldDisplay = 'Shelf Life (days)';
                                else if (field === 'packs_per_box') fieldDisplay = 'Packs per Box';
                                else if (field === 'boxes_per_pallet') fieldDisplay = 'Boxes per Pallet';
                                else if (field === 'default_routing_id') fieldDisplay = 'Default Routing';
                                else if (field === 'uom') fieldDisplay = 'UoM';
                                else if (field === 'lead_time_days') fieldDisplay = 'Lead Time (days)';
                                else if (field === 'moq') fieldDisplay = 'MOQ';

                                let oldValDisplay = change.old;
                                let newValDisplay = change.new;

                                if (oldValDisplay === null || oldValDisplay === undefined || oldValDisplay === '') oldValDisplay = 'none';
                                if (newValDisplay === null || newValDisplay === undefined || newValDisplay === '') newValDisplay = 'none';

                                return (
                                  <div key={field} className="text-sm">
                                    <span className="font-medium text-slate-900">{fieldDisplay}:</span>{' '}
                                    <span className="text-red-600">{String(oldValDisplay)}</span>
                                    {' → '}
                                    <span className="text-green-600">{String(newValDisplay)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {changes.items && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">Items Changes:</h4>
                            <div className="space-y-2">
                              {changes.items.added && changes.items.added.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-green-700">Added ({changes.items.added.length}):</span>
                                  <div className="bg-green-50 rounded p-2 mt-1">
                                    {changes.items.added.map((item: any, idx: number) => (
                                      <div key={idx} className="text-xs text-slate-700">
                                        Material ID {item.material_id}: {item.quantity} {item.uom}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {changes.items.removed && changes.items.removed.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-red-700">Removed ({changes.items.removed.length}):</span>
                                  <div className="bg-red-50 rounded p-2 mt-1">
                                    {changes.items.removed.map((item: any, idx: number) => (
                                      <div key={idx} className="text-xs text-slate-700">
                                        Material ID {item.material_id}: {item.quantity}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {changes.items.modified && changes.items.modified.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-blue-700">Modified ({changes.items.modified.length}):</span>
                                  <div className="bg-blue-50 rounded p-2 mt-1 space-y-2">
                                    {changes.items.modified.map((item: any, idx: number) => (
                                      <div key={idx} className="text-xs">
                                        <div className="font-medium text-slate-900">Material ID {item.material_id}:</div>
                                        {Object.entries(item.changes || {}).map(([field, change]: [string, any]) => (
                                          <div key={field} className="ml-2">
                                            <span className="font-medium">{field}:</span>{' '}
                                            <span className="text-red-600">{JSON.stringify(change.old)}</span>
                                            {' → '}
                                            <span className="text-green-600">{JSON.stringify(change.new)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


