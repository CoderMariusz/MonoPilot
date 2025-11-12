'use client';

/**
 * BOMVersionTimeline Component
 * Epic: EPIC-001 BOM Complexity v2 - Phase 2 (Multi-Version BOM)
 * 
 * Purpose: Visual timeline showing all BOM versions for a product
 * Use case: Product Manager views and manages multiple BOM versions
 * 
 * Features:
 * - Timeline view of all BOM versions
 * - Status badges (Current, Future, Expired)
 * - Effective date ranges
 * - Quick actions (View, Edit, Clone, Archive)
 * - Visual indicators for date overlaps
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Archive, Copy, Eye, Edit } from 'lucide-react';
import { BomsAPI } from '../lib/api/boms';

interface BOMVersion {
  bom_id: number;
  bom_version: string;
  effective_from: string;
  effective_to: string | null;
  status: 'draft' | 'active' | 'archived';
  is_current: boolean;
  is_future: boolean;
  is_expired: boolean;
  items_count: number;
}

interface BOMVersionTimelineProps {
  productId: number;
  onVersionSelect?: (bomId: number) => void;
  onCreateNewVersion?: () => void;
}

export default function BOMVersionTimeline({
  productId,
  onVersionSelect,
  onCreateNewVersion,
}: BOMVersionTimelineProps) {
  const [versions, setVersions] = useState<BOMVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [productId]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BomsAPI.getAllVersions(productId);
      setVersions(data);
    } catch (err: any) {
      console.error('Error loading BOM versions:', err);
      setError(err.message || 'Failed to load BOM versions');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (version: BOMVersion) => {
    if (version.is_current) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3 h-3" />
          Current
        </span>
      );
    }
    if (version.is_future) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          <Clock className="w-3 h-3" />
          Future
        </span>
      );
    }
    if (version.is_expired) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
          <Archive className="w-3 h-3" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
        <AlertCircle className="w-3 h-3" />
        {version.status}
      </span>
    );
  };

  const getTimelineColor = (version: BOMVersion) => {
    if (version.is_current) return 'bg-green-500';
    if (version.is_future) return 'bg-blue-500';
    if (version.is_expired) return 'bg-gray-400';
    return 'bg-amber-500';
  };

  if (isLoading) {
    return (
      <div className="border border-slate-300 rounded-lg p-6 bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 rounded-lg p-6 bg-red-50">
        <div className="flex items-center gap-3 text-red-800">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Error loading BOM versions</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="border border-slate-300 rounded-lg p-6 bg-white">
        <div className="text-center py-8 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">No BOM versions found</p>
          <p className="text-sm mt-1">Create your first BOM for this product</p>
          {onCreateNewVersion && (
            <button
              onClick={onCreateNewVersion}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Create First BOM
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-100 px-6 py-4 border-b border-slate-300 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">BOM Version Timeline</h3>
          <p className="text-sm text-slate-600 mt-1">
            {versions.length} version{versions.length !== 1 ? 's' : ''} • {versions.filter(v => v.is_current).length} current
          </p>
        </div>
        {onCreateNewVersion && (
          <button
            onClick={onCreateNewVersion}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Create New Version
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div key={version.bom_id} className="relative">
              {/* Timeline Line */}
              {index < versions.length - 1 && (
                <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-slate-200" />
              )}

              <div className="flex gap-4">
                {/* Timeline Dot */}
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${getTimelineColor(version)} flex items-center justify-center`}>
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Version Card */}
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-slate-400 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Version Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-slate-900">
                          Version {version.bom_version}
                        </h4>
                        {getStatusBadge(version)}
                      </div>

                      {/* Date Range */}
                      <div className="flex items-center gap-2 text-sm text-slate-700 mb-3">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">
                          {formatDate(version.effective_from)}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className={version.effective_to ? 'font-medium' : 'text-slate-500 italic'}>
                          {version.effective_to ? formatDate(version.effective_to) : 'No expiry'}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>{version.items_count} items</span>
                        <span>•</span>
                        <span>Status: {version.status}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onVersionSelect?.(version.bom_id)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {version.status !== 'archived' && (
                        <button
                          onClick={() => onVersionSelect?.(version.bom_id)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date Range Visual */}
                  {version.is_current && (
                    <div className="mt-3 pt-3 border-t border-slate-300">
                      <div className="flex items-center gap-2 text-xs text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        <span className="font-medium">This BOM is currently active</span>
                      </div>
                    </div>
                  )}

                  {version.is_future && (
                    <div className="mt-3 pt-3 border-t border-slate-300">
                      <div className="flex items-center gap-2 text-xs text-blue-700">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">
                          Will become active on {formatDate(version.effective_from)}
                        </span>
                      </div>
                    </div>
                  )}

                  {version.is_expired && (
                    <div className="mt-3 pt-3 border-t border-slate-300">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Archive className="w-3 h-3" />
                        <span className="font-medium">
                          Expired on {version.effective_to && formatDate(version.effective_to)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <AlertCircle className="w-4 h-4 text-slate-500" />
          <p>
            <strong>Tip:</strong> Create future BOM versions to plan recipe changes in advance. The system will automatically use the correct version based on Work Order schedule date.
          </p>
        </div>
      </div>
    </div>
  );
}
