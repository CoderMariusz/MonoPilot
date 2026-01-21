/**
 * Scanner Move Page (Story 05.20)
 * Purpose: Mobile-friendly page for LP movement via barcode scanning
 * Route: /scanner/move
 */

import { ScannerMoveWizard } from '@/components/scanner/move'

export const metadata = {
  title: 'Move LP | Scanner',
  description: 'Move license plates between warehouse locations using barcode scanning',
}

export default function ScannerMovePage() {
  return <ScannerMoveWizard />
}
