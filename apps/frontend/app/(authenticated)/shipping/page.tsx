/**
 * Shipping Module Root Page
 *
 * Redirects to the shipping dashboard as the default view
 * Route: /shipping
 */

import { redirect } from 'next/navigation'

export default function ShippingPage() {
  redirect('/shipping/dashboard')
}
