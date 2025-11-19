'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useUserProfile } from '../../../lib/hooks/useUserProfile';
import { AuditLogsAPI, AuditLog, AuditLogFilters } from '../../../lib/api/audit';
import { AuditLogTable } from '../../../components/AuditLogTable';
import { AuditLogDetailModal } from '../../../components/AuditLogDetailModal';

/**
 * Audit Logs Page
 * Displays comprehensive audit trail with filtering, pagination, and export
 * FDA 21 CFR Part 11 compliant audit trail viewer
 */
export default function AuditLogsPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { profile } = useUserProfile();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [stats, setStats] = useState<any>(null);

  // RBAC: Only Admin and Manager can access audit logs
  useEffect(() => {
    if (!authLoading && profile) {
      const allowedRoles = ['Admin', 'Manager'];
      if (!allowedRoles.includes(profile.role)) {
        router.push('/dashboard');
      }
    }
  }, [authLoading, profile, router]);

  // Filters state
  const [filters, setFilters] = useState<AuditLogFilters>({
    source: 'all',
  });
  const [filterInputs, setFilterInputs] = useState({
    user: '',
    table: '',
    operation: '',
    dateFrom: '',
    dateTo: '',
    source: 'all',
  });

  // Fetch audit logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuditLogsAPI.getAll(filters, {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });

      setLogs(response.data);
      setTotalCount(response.total);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await AuditLogsAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters, currentPage]);

  // Apply filters
  const handleApplyFilters = () => {
    const newFilters: AuditLogFilters = {
      source: filterInputs.source as 'app' | 'db' | 'all',
    };

    if (filterInputs.user.trim()) {
      newFilters.user = filterInputs.user.trim();
    }

    if (filterInputs.table.trim()) {
      newFilters.table = filterInputs.table.trim();
    }

    if (filterInputs.operation.trim()) {
      newFilters.operation = filterInputs.operation.trim();
    }

    if (filterInputs.dateFrom && filterInputs.dateTo) {
      newFilters.dateRange = [
        new Date(filterInputs.dateFrom),
        new Date(filterInputs.dateTo),
      ];
    }

    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilterInputs({
      user: '',
      table: '',
      operation: '',
      dateFrom: '',
      dateTo: '',
      source: 'all',
    });
    setFilters({ source: 'all' });
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      const csv = await AuditLogsAPI.exportToCSV(filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      setError('Failed to export audit logs');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-2 text-sm text-gray-600">
          Comprehensive audit trail for FDA 21 CFR Part 11 compliance
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Total Logs</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {stats.total_logs?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Last 24 Hours</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {stats.logs_last_24h?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Last 7 Days</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {stats.logs_last_7d?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Avg. Per Day</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {Math.round(stats.avg_logs_per_day || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              value={filterInputs.source}
              onChange={(e) =>
                setFilterInputs({ ...filterInputs, source: e.target.value })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="app">Application</option>
              <option value="db">Database</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="text"
              value={filterInputs.user}
              onChange={(e) =>
                setFilterInputs({ ...filterInputs, user: e.target.value })
              }
              placeholder="Search by user email..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Object/Table
            </label>
            <input
              type="text"
              value={filterInputs.table}
              onChange={(e) =>
                setFilterInputs({ ...filterInputs, table: e.target.value })
              }
              placeholder="Search by table name..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Command/Action
            </label>
            <input
              type="text"
              value={filterInputs.operation}
              onChange={(e) =>
                setFilterInputs({ ...filterInputs, operation: e.target.value })
              }
              placeholder="Search by command..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="datetime-local"
              value={filterInputs.dateFrom}
              onChange={(e) =>
                setFilterInputs({ ...filterInputs, dateFrom: e.target.value })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="datetime-local"
              value={filterInputs.dateTo}
              onChange={(e) =>
                setFilterInputs({ ...filterInputs, dateTo: e.target.value })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow">
        <AuditLogTable
          logs={logs}
          loading={loading}
          onRowClick={(log) => setSelectedLog(log)}
          showPagination={true}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Detail Modal */}
      <AuditLogDetailModal
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />

      {/* FDA Compliance Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
              FDA 21 CFR Part 11 Compliance
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This audit trail provides comprehensive logging for electronic records and
                signatures in accordance with FDA 21 CFR Part 11 requirements. All logs are
                immutable and include who, what, when, and why information. Logs are retained
                for 90 days by default and can be exported for regulatory submissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
