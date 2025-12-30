'use client'

/**
 * Cost History Page (Story 02.15)
 * Page for viewing cost history and trends for a product
 * Path: /technical/costing/products/:id/history
 */

import { use } from 'react'
import { CostHistoryPage } from '@/components/technical/costing'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CostHistoryPageRoute({ params }: PageProps) {
  const { id } = use(params)

  return <CostHistoryPage productId={id} />
}
