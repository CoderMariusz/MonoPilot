// Product Traceability Page (Stories 2.18, 2.19, 2.20, 2.21)
'use client'

import { useState } from 'react'
import type { TraceResult, RecallSimulationResult, LocationAnalysis, CustomerImpact } from '@/lib/types/traceability'
import { GenealogyTree } from '@/components/technical/GenealogyTree'

type TabType = 'forward' | 'backward' | 'recall'
type ViewMode = 'list' | 'tree'

export default function TracingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('forward')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [lpId, setLpId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [result, setResult] = useState<TraceResult | null>(null)
  const [recallResult, setRecallResult] = useState<RecallSimulationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTrace = async () => {
    setLoading(true)
    setResult(null)
    setRecallResult(null)

    try {
      const endpoint = `/api/technical/tracing/${activeTab}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: lpId || undefined,
          batch_number: batchNumber || undefined,
          max_depth: 20,
          include_shipped: true,
          include_notifications: true
        })
      })
      const data = await res.json()

      if (activeTab === 'recall') {
        setRecallResult(data)
      } else {
        setResult(data)
      }
    } catch (error) {
      console.error('Trace failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Traceability</h1>
        <p className="text-gray-600">Forward, Backward, and Recall Simulation</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {(['forward', 'backward', 'recall'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'forward' && 'Forward Trace'}
              {tab === 'backward' && 'Backward Trace'}
              {tab === 'recall' && 'Recall Simulation'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {activeTab === 'forward' && 'Trace Forward: Where was this material used?'}
          {activeTab === 'backward' && 'Trace Backward: What went into this product?'}
          {activeTab === 'recall' && 'Simulate Recall: Assess full impact'}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">LP ID</label>
            <input
              type="text"
              value={lpId}
              onChange={e => setLpId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., LP-2024-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">OR Batch Number</label>
            <input
              type="text"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., BATCH-2024-11-001"
            />
          </div>
        </div>

        <button
          onClick={handleTrace}
          disabled={loading || (!lpId && !batchNumber)}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Tracing...' : `Run ${activeTab} Trace`}
        </button>
      </div>

      {/* Regular Trace Results (Forward/Backward) */}
      {result && activeTab !== 'recall' && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Trace Results</h2>

            {/* View Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              {viewMode === 'list' ? (
                <>
                  <span>🌳</span>
                  <span>Switch to Tree View</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Switch to List View</span>
                </>
              )}
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Root LP</div>
                <div className="font-semibold">{result.root_lp?.lp_number || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">
                  {activeTab === 'forward' ? 'Descendants' : 'Ancestors'}
                </div>
                <div className="font-semibold">
                  {result.summary?.total_descendants || result.summary?.total_ancestors || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Max Depth</div>
                <div className="font-semibold">{result.summary?.max_depth || 0}</div>
              </div>
            </div>
          </div>

          {/* Tree View or List View */}
          <div className="border-t pt-4">
            {viewMode === 'tree' ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Interactive genealogy tree - Pan with mouse, zoom with scroll wheel
                </p>
                <GenealogyTree
                  traceTree={result.trace_tree}
                  direction={activeTab as 'forward' | 'backward'}
                  onNodeClick={(nodeId) => console.log('Node clicked:', nodeId)}
                />
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">List View</p>
                <pre className="p-4 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(result.trace_tree, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recall Simulation Results */}
      {recallResult && activeTab === 'recall' && (
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center justify-between">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>This is a simulation.</strong> No inventory will be affected. Use this data for planning purposes only.
                  </p>
                </div>
              </div>

              {/* View Toggle for Recall */}
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 ml-4"
              >
                {viewMode === 'list' ? (
                  <>
                    <span>🌳</span>
                    <span>View Tree</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>View Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tree View (Combined Forward + Backward) */}
          {viewMode === 'tree' && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Combined Genealogy Tree</h2>
              <p className="text-sm text-gray-600 mb-4">
                Shows both upstream sources (left) and downstream products (right)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2 text-sm">Backward (Sources)</h3>
                  <GenealogyTree
                    traceTree={recallResult.backward_trace}
                    direction="backward"
                    onNodeClick={(nodeId) => console.log('Backward node:', nodeId)}
                  />
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-sm">Forward (Products)</h3>
                  <GenealogyTree
                    traceTree={recallResult.forward_trace}
                    direction="forward"
                    onNodeClick={(nodeId) => console.log('Forward node:', nodeId)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary View (existing sections) */}
          {viewMode === 'list' && (
            <>

          {/* Section 1: Affected Inventory */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Section 1: Affected Inventory</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Total Affected LPs" value={recallResult.summary.total_affected_lps} />
              <StatBox label="Total Quantity" value={recallResult.summary.total_quantity.toFixed(2)} />
              <StatBox label="Estimated Value" value={`$${recallResult.summary.total_estimated_value.toFixed(2)}`} />
              <StatBox label="Affected Warehouses" value={recallResult.summary.affected_warehouses} />
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-3">Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatusBox label="Available" value={recallResult.summary.status_breakdown.available} color="green" />
                <StatusBox label="In Production" value={recallResult.summary.status_breakdown.in_production} color="orange" />
                <StatusBox label="Shipped" value={recallResult.summary.status_breakdown.shipped} color="red" />
                <StatusBox label="Consumed" value={recallResult.summary.status_breakdown.consumed} color="gray" />
                <StatusBox label="Quarantine" value={recallResult.summary.status_breakdown.quarantine} color="yellow" />
              </div>
            </div>
          </div>

          {/* Section 2: Location Analysis */}
          {recallResult.locations.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Section 2: Location Analysis</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Warehouse</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Affected LPs</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Total Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recallResult.locations.map((loc: LocationAnalysis, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{loc.warehouse_name}</td>
                        <td className="px-4 py-3 text-sm">{loc.affected_lps}</td>
                        <td className="px-4 py-3 text-sm">{loc.total_quantity.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 3: Customer Impact */}
          {recallResult.customers.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Section 3: Customer Impact</h2>
              <div className="mb-4">
                <StatBox label="Customers Affected" value={recallResult.customers.length} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Shipped Qty</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Ship Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recallResult.customers.map((customer: CustomerImpact, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{customer.customer_name}</td>
                        <td className="px-4 py-3 text-sm">{customer.contact_email}</td>
                        <td className="px-4 py-3 text-sm">{customer.shipped_quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">{new Date(customer.ship_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">{customer.notification_status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Financial Impact */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Section 4: Financial Impact</h2>
            <div className="space-y-3">
              <FinancialRow label="Product Value" value={recallResult.financial.product_value} />
              <FinancialRow label="Retrieval Cost" value={recallResult.financial.retrieval_cost} />
              <FinancialRow label="Disposal Cost" value={recallResult.financial.disposal_cost} />
              <FinancialRow label="Lost Revenue" value={recallResult.financial.lost_revenue} />
              <div className="border-t pt-3 mt-3">
                <FinancialRow
                  label="Total Estimated Cost"
                  value={recallResult.financial.total_estimated_cost}
                  highlight
                />
                <p className="text-xs text-gray-500 mt-2">
                  Confidence Interval: {recallResult.financial.confidence_interval}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Regulatory Compliance */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Section 5: Regulatory Compliance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Reportable to FDA</div>
                <div className={`font-semibold ${recallResult.regulatory.reportable_to_fda ? 'text-red-600' : 'text-green-600'}`}>
                  {recallResult.regulatory.reportable_to_fda ? 'YES' : 'NO'}
                </div>
              </div>
              {recallResult.regulatory.report_due_date && (
                <div>
                  <div className="text-sm text-gray-600">Report Due Date</div>
                  <div className="font-semibold">
                    {new Date(recallResult.regulatory.report_due_date).toLocaleDateString()}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600">Report Status</div>
                <div className="font-semibold capitalize">{recallResult.regulatory.report_status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Affected Product Types</div>
                <div className="font-semibold">{recallResult.regulatory.affected_product_types.join(', ')}</div>
              </div>
            </div>

            <div className="mt-6">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-3">
                Export FDA JSON
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-3">
                Export FDA XML
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Export PDF Report
              </button>
            </div>
          </div>

          {/* Execution Time */}
          <div className="text-sm text-gray-500 text-right">
            Simulation completed in {recallResult.execution_time_ms}ms
          </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Helper Components
function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 p-4 rounded">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

function StatusBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700'
  }

  return (
    <div className={`border p-3 rounded ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-xs">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  )
}

function FinancialRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex justify-between ${highlight ? 'text-lg font-bold' : ''}`}>
      <span className="text-gray-700">{label}</span>
      <span className={highlight ? 'text-red-600' : 'text-gray-900'}>${value.toFixed(2)}</span>
    </div>
  )
}
