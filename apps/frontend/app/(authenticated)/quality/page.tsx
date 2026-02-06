/**
 * Quality Module Root Page
 *
 * Redirects to the quality holds page as the default view
 * Route: /quality
 */

import { redirect } from 'next/navigation'

export default function QualityPage() {
  redirect('/quality/holds')
}
