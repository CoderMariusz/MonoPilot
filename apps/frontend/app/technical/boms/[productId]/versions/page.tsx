'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { BomsAPI } from '@/lib/api/boms';
import { ProductsAPI } from '@/lib/api/products';
import { BOMTimeline } from '@/components/BOMTimeline';
import { BOMComparisonModal } from '@/components/BOMComparisonModal';
import type { Bom, Product } from '@/lib/types';

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default function BOMVersionsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.productId, 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [versions, setVersions] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productData, versionsData] = await Promise.all([
        ProductsAPI.getById(productId),
        BomsAPI.getByProduct(productId),
      ]);

      if (!productData) {
        setError('Product not found');
        return;
      }

      setProduct(productData);
      setVersions(versionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionUpdate = async (
    versionId: number,
    updates: { effective_from?: string; effective_to?: string | null }
  ) => {
    try {
      await BomsAPI.updateHeader(versionId, updates);
      await loadData(); // Reload to reflect changes
    } catch (err) {
      throw new Error('Failed to update version dates');
    }
  };

  const handleVersionSelect = (versionIds: number[]) => {
    setSelectedVersions(versionIds);
    setShowComparison(versionIds.length === 2);
  };

  const handleCreateNewVersion = () => {
    router.push(`/technical/boms/${productId}/new`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading BOM versions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            ← Back to BOMs
          </button>
          <h1 className="text-2xl font-bold text-slate-900">BOM Version Timeline</h1>
          {product && (
            <p className="text-sm text-slate-600 mt-1">
              Product: <span className="font-medium">{product.part_number}</span> - {product.description}
            </p>
          )}
        </div>
        <button
          onClick={handleCreateNewVersion}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create New Version
        </button>
      </div>

      {/* Instructions */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How to use the timeline:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            <strong>Drag edges</strong> of version bars to adjust <code>effective_from</code> and{' '}
            <code>effective_to</code> dates
          </li>
          <li>
            <strong>Hover over edges</strong> to reveal drag handles (blue highlights)
          </li>
          <li>
            <strong>Ctrl+Click</strong> to select two versions for side-by-side comparison
          </li>
          <li>
            <strong>Red outline</strong> indicates overlapping date ranges (data integrity issue)
          </li>
        </ul>
      </div>

      {/* Timeline */}
      <BOMTimeline
        productId={productId}
        versions={versions}
        onVersionUpdate={handleVersionUpdate}
        onVersionSelect={handleVersionSelect}
      />

      {/* Version List (below timeline) */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-3">All Versions</h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Version
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Effective From
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Effective To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No BOM versions found. Create your first version to get started.
                  </td>
                </tr>
              ) : (
                versions.map((version) => (
                  <tr key={version.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      v{version.version}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          version.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : version.status === 'draft'
                            ? 'bg-blue-100 text-blue-800'
                            : version.status === 'archived'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {version.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {version.effective_from ? new Date(version.effective_from).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {version.effective_to
                        ? new Date(version.effective_to).toLocaleDateString()
                        : 'Ongoing'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {version.notes || 'No notes'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => router.push(`/technical/boms/${version.id}`)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOM Comparison Modal */}
      {showComparison && selectedVersions.length === 2 && (
        <BOMComparisonModal
          isOpen={showComparison}
          onClose={() => {
            setShowComparison(false);
            setSelectedVersions([]);
          }}
          version1Id={selectedVersions[0]}
          version2Id={selectedVersions[1]}
        />
      )}
    </div>
  );
}
