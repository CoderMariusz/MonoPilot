// Allergen Matrix Page (Story 2.24)
'use client'

import { useEffect, useState } from 'react'
import type { AllergenMatrixResponse, AllergenMatrixRow } from '@/lib/types/dashboard'

interface AllergenInfo {
  id: string
  name: string
  code: string
}

export default function AllergenMatrixPage() {
  const [data, setData] = useState<AllergenMatrixResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/technical/dashboard/allergen-matrix')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading allergen matrix...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Allergen Matrix</h1>
        <p className="text-gray-600">Product Allergen Overview</p>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-sm font-semibold">
                Product Code
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Product Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
              {data?.allergens.map((allergen: AllergenInfo) => (
                <th key={allergen.id} className="px-2 py-3 text-center text-xs">
                  <div className="transform -rotate-45 origin-left">{allergen.name}</div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.matrix.map((row: AllergenMatrixRow) => (
              <tr key={row.product_id} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium">
                  {row.product_code}
                </td>
                <td className="px-4 py-3 text-sm">{row.product_name}</td>
                <td className="px-4 py-3 text-sm">{row.product_type}</td>
                {data.allergens.map((allergen: AllergenInfo) => (
                  <td key={allergen.id} className="px-2 py-3 text-center">
                    <AllergenCell status={row.allergens[allergen.id]} />
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-semibold">{row.allergen_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AllergenCell({ status }: { status: 'contains' | 'may_contain' | 'none' }) {
  const colors = {
    contains: 'bg-red-100 text-red-800',
    may_contain: 'bg-yellow-100 text-yellow-800',
    none: 'bg-green-50 text-green-600'
  }

  const symbols = {
    contains: '✓',
    may_contain: '⚠',
    none: '-'
  }

  return (
    <span className={`inline-block w-8 h-8 rounded ${colors[status]} flex items-center justify-center text-sm`}>
      {symbols[status]}
    </span>
  )
}
