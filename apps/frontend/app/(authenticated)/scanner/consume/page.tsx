/**
 * Scanner Consume Page (Story 04.6b)
 * Route: /scanner/consume
 * Purpose: Mobile-optimized material consumption workflow
 */

import { ScannerConsumeWizard } from '@/components/scanner/consume/ScannerConsumeWizard'

export const metadata = {
  title: 'Consume Material | Scanner',
  description: 'Record material consumption using barcode scanner',
}

export default function ScannerConsumePage() {
  return <ScannerConsumeWizard />
}
