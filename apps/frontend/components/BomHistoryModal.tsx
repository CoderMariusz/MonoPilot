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
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900">
                        Version {entry.version}
                      </span>
                      {entry.status_from && entry.status_to && (
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                          {entry.status_from} → {entry.status_to}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-col items-end gap-1">
                      <div>{new Date(entry.changed_at).toLocaleString()}</div>
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
                  
                  {entry.description && (
                    <p className="text-sm text-slate-600 mb-2">{entry.description}</p>
                  )}

                  {selectedEntry?.id === entry.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="space-y-3">
                        {Object.keys(entry.changes.bom || {}).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">BOM Changes:</h4>
                            <div className="bg-slate-50 rounded p-3 space-y-1">
                              {Object.entries(entry.changes.bom || {}).map(([field, change]: [string, any]) => (
                                <div key={field} className="text-sm">
                                  <span className="font-medium">{field}:</span>{' '}
                                  <span className="text-red-600">{change.old ?? 'null'}</span>
                                  {' → '}
                                  <span className="text-green-600">{change.new ?? 'null'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {entry.changes.items && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">Items Changes:</h4>
                            <div className="space-y-2">
                              {entry.changes.items.added && entry.changes.items.added.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-green-700">Added ({entry.changes.items.added.length}):</span>
                                  <div className="bg-green-50 rounded p-2 mt-1">
                                    {entry.changes.items.added.map((item: any, idx: number) => (
                                      <div key={idx} className="text-xs text-slate-700">
                                        Material ID {item.material_id}: {item.quantity} {item.uom}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {entry.changes.items.removed && entry.changes.items.removed.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-red-700">Removed ({entry.changes.items.removed.length}):</span>
                                  <div className="bg-red-50 rounded p-2 mt-1">
                                    {entry.changes.items.removed.map((item: any, idx: number) => (
                                      <div key={idx} className="text-xs text-slate-700">
                                        Material ID {item.material_id}: {item.quantity}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {entry.changes.items.modified && entry.changes.items.modified.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-blue-700">Modified ({entry.changes.items.modified.length}):</span>
                                  <div className="bg-blue-50 rounded p-2 mt-1 space-y-2">
                                    {entry.changes.items.modified.map((item: any, idx: number) => (
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
              ))}
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


