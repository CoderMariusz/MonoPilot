/**
 * Scanner Receive Page (Story 05.19)
 * Route: /scanner/receive
 * Purpose: Mobile-optimized scanner receiving workflow
 */

import { ScannerReceiveWizard } from '@/components/scanner/receive/ScannerReceiveWizard'

export const metadata = {
  title: 'Receive Goods | Scanner',
  description: 'Receive goods using barcode scanner',
}

export default function ScannerReceivePage() {
  return <ScannerReceiveWizard />
}
