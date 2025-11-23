// Examples of ComingSoonModal usage
// This file shows different ways to use the ComingSoonModal component

import { ComingSoonModal, ComingSoonButton } from './coming-soon-modal'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

// ============================================================================
// Example 1: Basic Usage (Bulk PO Import - Story 3.3)
// ============================================================================
export function BulkPOImportButton() {
  return (
    <ComingSoonModal
      featureName="Bulk PO Import"
      description="Upload Excel/CSV files to create multiple purchase orders at once. This feature will support batch processing, validation, and error reporting."
      plannedRelease="Phase 2 (Q2 2025)"
      triggerLabel="Bulk Import"
      triggerVariant="outline"
    />
  )
}

// ============================================================================
// Example 2: Custom Trigger (icon button)
// ============================================================================
export function BulkPOImportIconButton() {
  return (
    <ComingSoonModal
      featureName="Bulk PO Import"
      description="Upload Excel/CSV files to create multiple purchase orders at once."
      plannedRelease="Phase 2"
      customTrigger={
        <Button variant="ghost" size="icon" title="Bulk Import (Coming Soon)">
          <Upload className="h-4 w-4" />
        </Button>
      }
    />
  )
}

// ============================================================================
// Example 3: Simple Button (no description)
// ============================================================================
export function AdvancedReportsButton() {
  return (
    <ComingSoonButton
      featureName="Advanced Reports"
      plannedRelease="Phase 3"
      triggerLabel="Advanced Reports"
      triggerVariant="secondary"
    />
  )
}

// ============================================================================
// Example 4: With Analytics Tracking
// ============================================================================
export function MLForecastingButton() {
  return (
    <ComingSoonModal
      featureName="ML-Powered Demand Forecasting"
      description="Leverage machine learning to predict demand and optimize inventory levels based on historical data and trends."
      plannedRelease="Phase 4 (2026)"
      triggerLabel="Enable Forecasting"
      onOpen={() => {
        // Track when users are interested in this feature
        console.log('User opened ML Forecasting coming soon modal')
        // Example: analytics.track('coming_soon_clicked', { feature: 'ml_forecasting' })
      }}
    />
  )
}

// ============================================================================
// Example 5: In a Feature List/Grid
// ============================================================================
export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Bulk Import</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create multiple POs from Excel/CSV
        </p>
        <BulkPOImportButton />
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Advanced Analytics</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Deep insights and custom dashboards
        </p>
        <AdvancedReportsButton />
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">AI Forecasting</h3>
        <p className="text-sm text-muted-foreground mb-4">
          ML-powered demand prediction
        </p>
        <MLForecastingButton />
      </div>
    </div>
  )
}

// ============================================================================
// Example 6: Usage in Purchase Orders List Page
// ============================================================================
export function PurchaseOrdersToolbar() {
  return (
    <div className="flex items-center gap-2">
      {/* Regular working button */}
      <Button>Create PO</Button>

      {/* Coming soon feature */}
      <ComingSoonModal
        featureName="Bulk PO Import"
        description="Import multiple purchase orders from Excel or CSV files. Supports validation, error handling, and batch processing."
        plannedRelease="Phase 2"
        triggerLabel="Bulk Import"
        triggerVariant="outline"
        triggerSize="default"
      />
    </div>
  )
}
