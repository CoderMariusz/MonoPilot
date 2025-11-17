'use client';

import React from 'react';
import { AuditLog } from '../lib/api/audit';

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AuditLogDetailModal Component
 * Displays detailed information about a selected audit log entry
 * Includes before/after data comparison and SQL statement details
 */
export function AuditLogDetailModal({
  log,
  isOpen,
  onClose,
}: AuditLogDetailModalProps) {
  if (!isOpen || !log) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  const formatJSON = (data: any) => {
    if (!data) return null;
    return JSON.stringify(data, null, 2);
  };

  const getDiff = (before: any, after: any) => {
    if (!before || !after) return null;

    const changes: { field: string; before: any; after: any }[] = [];

    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    allKeys.forEach((key) => {
      const beforeValue = before[key];
      const afterValue = after[key];

      // Skip if values are the same
      if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
        return;
      }

      changes.push({
        field: key,
        before: beforeValue,
        after: afterValue,
      });
    });

    return changes;
  };

  const changes = log.before_data && log.after_data ? getDiff(log.before_data, log.after_data) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Audit Log Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Metadata Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Metadata</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatTimestamp(log.timestamp)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Source</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.source === 'app'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {log.source === 'app' ? 'Application' : 'Database'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">User</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {log.user_email || log.user_id || 'System'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Object/Table</dt>
                <dd className="mt-1 text-sm text-gray-900">{log.object_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Command/Action</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.command.toLowerCase().includes('create') ||
                      log.command.toLowerCase().includes('insert')
                        ? 'bg-green-100 text-green-800'
                        : log.command.toLowerCase().includes('update')
                        ? 'bg-yellow-100 text-yellow-800'
                        : log.command.toLowerCase().includes('delete')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {log.command}
                  </span>
                </dd>
              </div>
              {log.org_id && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{log.org_id}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Application-Level Changes */}
          {log.source === 'app' && (
            <>
              {changes && changes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Changes</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Field
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Before
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            After
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {changes.map((change, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {change.field}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              <code className="bg-red-50 px-2 py-1 rounded text-xs">
                                {change.before === null || change.before === undefined
                                  ? 'null'
                                  : typeof change.before === 'object'
                                  ? JSON.stringify(change.before)
                                  : String(change.before)}
                              </code>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              <code className="bg-green-50 px-2 py-1 rounded text-xs">
                                {change.after === null || change.after === undefined
                                  ? 'null'
                                  : typeof change.after === 'object'
                                  ? JSON.stringify(change.after)
                                  : String(change.after)}
                              </code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {log.before_data && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Before Data</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs font-mono text-gray-800">
                    {formatJSON(log.before_data)}
                  </pre>
                </div>
              )}

              {log.after_data && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">After Data</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs font-mono text-gray-800">
                    {formatJSON(log.after_data)}
                  </pre>
                </div>
              )}
            </>
          )}

          {/* Database-Level Details */}
          {log.source === 'db' && log.statement && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">SQL Statement</h3>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                {log.statement}
              </pre>
            </div>
          )}

          {/* FDA 21 CFR Part 11 Compliance Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  FDA 21 CFR Part 11 Compliant Audit Trail
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This audit log entry is immutable and cryptographically verifiable. It
                    captures the what, when, who, and why of this action in accordance with
                    FDA 21 CFR Part 11 electronic records requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
