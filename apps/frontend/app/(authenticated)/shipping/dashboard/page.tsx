/**
 * Shipping Dashboard Page
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Main entry point for the shipping dashboard
 */

import { Metadata } from 'next'
import ShippingDashboard from '@/components/shipping/dashboard/ShippingDashboard'

export const metadata: Metadata = {
  title: 'Shipping Dashboard | MonoPilot',
  description: 'View shipping KPIs, alerts, and recent activity',
}

export default function ShippingDashboardPage() {
  return <ShippingDashboard />
}
