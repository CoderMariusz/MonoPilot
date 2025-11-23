# Common Components

Reusable components used across the application.

## ComingSoonModal

A reusable modal component for features that are planned but not yet implemented (P2+, post-MVP).

### Features

- ✅ Beautiful, animated modal with Sparkles icon
- ✅ Customizable trigger button (label, variant, size)
- ✅ Support for custom trigger elements
- ✅ Optional detailed description
- ✅ Planned release information
- ✅ Analytics tracking via `onOpen` callback
- ✅ Fully accessible (uses Radix UI Dialog)

### Usage

#### Basic Example

```tsx
import { ComingSoonModal } from '@/components/common/coming-soon-modal'

export function MyFeature() {
  return (
    <ComingSoonModal
      featureName="Bulk PO Import"
      description="Upload Excel/CSV files to create multiple purchase orders at once."
      plannedRelease="Phase 2 (Q2 2025)"
      triggerLabel="Bulk Import"
      triggerVariant="outline"
    />
  )
}
```

#### With Custom Trigger

```tsx
import { ComingSoonModal } from '@/components/common/coming-soon-modal'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export function BulkImportIconButton() {
  return (
    <ComingSoonModal
      featureName="Bulk PO Import"
      plannedRelease="Phase 2"
      customTrigger={
        <Button variant="ghost" size="icon">
          <Upload className="h-4 w-4" />
        </Button>
      }
    />
  )
}
```

#### With Analytics

```tsx
<ComingSoonModal
  featureName="AI Forecasting"
  plannedRelease="Phase 4"
  onOpen={() => {
    analytics.track('coming_soon_clicked', {
      feature: 'ai_forecasting'
    })
  }}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `featureName` | `string` | *required* | Name of the feature (e.g., "Bulk PO Import") |
| `description` | `string` | `undefined` | Optional detailed description |
| `plannedRelease` | `string` | `"Phase 2"` | When the feature is planned (e.g., "Q2 2025") |
| `triggerLabel` | `string` | `featureName` | Button text |
| `triggerVariant` | `ButtonVariant` | `"outline"` | Button variant |
| `triggerSize` | `ButtonSize` | `"default"` | Button size |
| `customTrigger` | `ReactNode` | `undefined` | Custom trigger element |
| `onOpen` | `() => void` | `undefined` | Callback when modal opens (for analytics) |

### Examples

See `coming-soon-modal.examples.tsx` for more usage examples.

---

## Future Components

Add documentation for other common components here as they are created.
