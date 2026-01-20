/**
 * Step 5: Confirm (Processing) (Story 04.6b)
 * Purpose: Processing state with spinner
 */

'use client'

import { LoadingOverlay } from '../shared/LoadingOverlay'

export function Step5Confirm() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <LoadingOverlay show message="Processing consumption..." />
    </div>
  )
}

export default Step5Confirm
