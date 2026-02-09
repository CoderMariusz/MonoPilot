/**
 * Scanner Transfer Page (Fix for BUG-SC-001)
 * Purpose: Mobile-friendly page for LP transfer/movement via barcode scanning
 * Route: /scanner/transfer
 * Note: Transfer functionality is handled via the Move workflow
 */

import { ScannerMoveWizard } from '@/components/scanner/move'

export const metadata = {
  title: 'Transfer LP | Scanner',
  description: 'Transfer license plates between warehouse locations using barcode scanning',
}

export default function ScannerTransferPage() {
  return <ScannerMoveWizard />
}
