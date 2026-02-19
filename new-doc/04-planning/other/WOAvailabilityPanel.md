# WOAvailabilityPanel

**Component Path:** `components/planning/work-orders/availability/WOAvailabilityPanel`

Displays a comprehensive overview of material availability for a specific Work Order. It features a collapsible interface, summary statistics, filtering, and a responsive layout (Table for desktop, Cards for mobile).

## Component API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `woId` | `string` | *Required* | The UUID of the Work Order to check. |
| `defaultCollapsed` | `boolean` | `false` | If `true`, the panel starts in a collapsed state. |
| `showInModal` | `boolean` | `false` | Removes borders and shadows for modal rendering. |
| `className` | `string` | `undefined` | Additional CSS classes to apply to the root container. |

### States

The component handles and renders specific UI for the following data states:

1.  **Loading:** Displays skeleton loaders while fetching data.
2.  **Empty:** Shows a "No Materials to Check" message if the WO has no BOM items.
3.  **Error:** Displays an error message with a "Retry" button if the fetch fails.
4.  **Disabled:** Shows an informational message if the availability check setting is disabled in Planning Settings.
5.  **Success:** Renders the summary card and list of materials.

## Usage Examples

### Basic Usage

```tsx
import { WOAvailabilityPanel } from '@/components/planning/work-orders/availability/WOAvailabilityPanel'

export default function WorkOrderPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Work Order Details</h1>

      {/* Availability Panel */}
      <WOAvailabilityPanel woId={params.id} />
    </div>
  )
}
```

### Collapsed by Default

Useful for pages where space is limited, allowing the user to expand the panel only when needed.

```tsx
<WOAvailabilityPanel
  woId={workOrderId}
  defaultCollapsed={true}
/>
```

### Inside a Modal

When rendering inside a dialog or modal, use `showInModal` to remove the card border for a cleaner look.

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Work Order Availability</DialogTitle>
    </DialogHeader>

    <WOAvailabilityPanel
      woId={workOrderId}
      showInModal={true}
    />
  </DialogContent>
</Dialog>
```

## Features

### Auto-Refresh

The panel utilizes the `useRefreshAvailability` hook to automatically update data, ensuring the user sees near real-time inventory status.

### Filtering & Search

Users can filter materials by status (`All`, `Sufficient`, `Low Stock`, `Shortage`, `No Stock`) and search by Product Code or Name using the built-in input controls.

### Responsive Design

*   **Desktop:** Materials are displayed in a sorted table.
*   **Mobile:** Materials are displayed as individual cards for better touch interaction.
