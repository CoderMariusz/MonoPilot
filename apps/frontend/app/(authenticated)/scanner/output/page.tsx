/**
 * Scanner Output Page (Story 04.7b)
 * Route: /scanner/output
 * Purpose: Mobile-optimized production output registration workflow
 */

import { ScannerOutputWizard } from '@/components/scanner/output/ScannerOutputWizard'

export const metadata = {
  title: 'Register Output | Scanner',
  description: 'Register production output using barcode scanner',
}

export default function ScannerOutputPage() {
  return <ScannerOutputWizard />
}
