# ADR-006: Scanner-First Mobile UX

## Status: ACCEPTED

**Date**: 2025-12-10
**Decision Makers**: Architecture Team, UX Team
**Related PRDs**: Warehouse (Epic 5), Production (Epic 4), Quality (Epic 6)

---

## Context

Warehouse and production floor operators need mobile access to MonoPilot for:
1. Receiving incoming materials (scan LP, verify quantity)
2. Production consumption (scan materials consumed)
3. Output registration (scan produced items)
4. Inventory moves (scan source, scan destination)
5. Shipping picks (scan items for shipment)

Mobile UX approaches:
- **Responsive Desktop**: Same app, smaller screen
- **Progressive Web App (PWA)**: Desktop app optimized for mobile
- **Native Mobile App**: Separate iOS/Android apps
- **Scanner-Dedicated Pages**: Separate workflows optimized for scanning

Key constraints:
- Operators wear gloves (touch precision limited)
- Scanning is primary input method (keyboard secondary)
- Speed is critical (seconds per operation)
- Environment: warehouse lighting, noise, movement
- Device: industrial mobile computers (Zebra, Honeywell) or consumer phones

---

## Decision

**Build dedicated scanner pages with workflows optimized for barcode-driven input, not responsive desktop pages.**

Scanner pages are:
- Separate routes under `/scanner/*`
- Large touch targets (minimum 48px)
- Scan-first input (keyboard fallback)
- Linear task flows (not dashboard navigation)
- Minimal decisions per screen
- Works offline with sync

Desktop and scanner are separate experiences, not responsive variants.

---

## Implementation

### Route Structure

```
apps/frontend/app/(authenticated)/
  scanner/                     # Scanner-optimized pages
    layout.tsx                 # Scanner shell (no sidebar)
    page.tsx                   # Scanner home/task selection
    receiving/
      page.tsx                 # GRN receiving workflow
      [grnId]/page.tsx         # Specific GRN receiving
    production/
      page.tsx                 # Production task selection
      consumption/[woId]/page.tsx
      output/[woId]/page.tsx
    inventory/
      move/page.tsx            # Inventory move
      count/page.tsx           # Cycle count
    shipping/
      pick/[soId]/page.tsx     # Order picking
```

### Scanner Layout

```tsx
// scanner/layout.tsx
export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="scanner-shell min-h-screen bg-slate-900 text-white">
      {/* Minimal header */}
      <header className="h-14 flex items-center justify-between px-4 bg-slate-800">
        <BackButton />
        <UserBadge />
        <SyncStatus />
      </header>

      {/* Full-height content */}
      <main className="flex-1 p-4">
        {children}
      </main>

      {/* Fixed bottom action bar */}
      <ScannerActionBar />
    </div>
  )
}
```

### Scan Input Component

```tsx
// components/scanner/ScanInput.tsx
interface ScanInputProps {
  onScan: (barcode: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export function ScanInput({ onScan, placeholder, autoFocus = true }: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus for hardware scanner input
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  // Handle hardware scanner (sends keystrokes ending in Enter)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = inputRef.current?.value.trim()
      if (value) {
        onScan(value)
        inputRef.current!.value = ''
      }
    }
  }

  return (
    <div className="scan-input-container">
      <input
        ref={inputRef}
        type="text"
        inputMode="none"  // Hide soft keyboard for hardware scanners
        className="w-full h-16 text-2xl bg-slate-700 text-white px-4 rounded-lg"
        placeholder={placeholder || "Scan barcode..."}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {/* Manual entry toggle */}
      <button
        onClick={() => inputRef.current?.focus()}
        className="mt-2 text-slate-400"
      >
        Tap to type manually
      </button>
    </div>
  )
}
```

### Workflow Pattern

```tsx
// Scanner workflow: linear steps, scan-driven
function ConsumptionWorkflow({ woId }: { woId: string }) {
  const [step, setStep] = useState<'scan_material' | 'confirm_qty' | 'complete'>('scan_material')
  const [scannedLP, setScannedLP] = useState<LicensePlate | null>(null)

  // Step 1: Scan material LP
  if (step === 'scan_material') {
    return (
      <ScannerScreen title="Scan Material">
        <ExpectedMaterials woId={woId} />
        <ScanInput
          onScan={async (barcode) => {
            const lp = await lookupLP(barcode)
            if (lp) {
              setScannedLP(lp)
              setStep('confirm_qty')
            }
          }}
        />
      </ScannerScreen>
    )
  }

  // Step 2: Confirm quantity
  if (step === 'confirm_qty' && scannedLP) {
    return (
      <ScannerScreen title="Confirm Quantity">
        <LPDetails lp={scannedLP} />
        <QuantityInput
          defaultValue={scannedLP.current_qty}
          onConfirm={async (qty) => {
            await recordConsumption(woId, scannedLP.id, qty)
            setStep('complete')
          }}
        />
      </ScannerScreen>
    )
  }

  // Step 3: Success, ready for next
  return (
    <ScannerScreen title="Recorded">
      <SuccessIndicator />
      <BigButton onClick={() => setStep('scan_material')}>
        Scan Next Material
      </BigButton>
    </ScannerScreen>
  )
}
```

### Touch Target Sizes

```css
/* Scanner-specific styles */
.scanner-shell {
  /* Minimum touch targets */
  --touch-target-min: 48px;

  /* Large text for readability */
  --text-primary: 1.5rem;    /* 24px */
  --text-secondary: 1.125rem; /* 18px */

  /* High contrast */
  --bg-primary: #0f172a;     /* slate-900 */
  --bg-secondary: #1e293b;   /* slate-800 */
  --text-color: #ffffff;
}

.scanner-button {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  font-size: var(--text-primary);
  padding: 1rem 2rem;
}

.scanner-list-item {
  min-height: 64px;
  padding: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
```

### Offline Support

```typescript
// Scanner offline queue
interface OfflineAction {
  id: string
  type: 'consumption' | 'output' | 'move'
  payload: Record<string, unknown>
  timestamp: Date
  synced: boolean
}

// Queue actions when offline
async function queueAction(action: Omit<OfflineAction, 'id' | 'synced'>): Promise<void> {
  const db = await openIndexedDB('scanner-queue')
  await db.add('actions', {
    ...action,
    id: crypto.randomUUID(),
    synced: false,
  })
}

// Sync when online
async function syncOfflineActions(): Promise<SyncResult> {
  const db = await openIndexedDB('scanner-queue')
  const pending = await db.getAll('actions', { synced: false })

  const results: SyncResult = { success: 0, failed: 0 }

  for (const action of pending) {
    try {
      await submitAction(action)
      await db.update('actions', action.id, { synced: true })
      results.success++
    } catch (error) {
      results.failed++
    }
  }

  return results
}

// Listen for online status
window.addEventListener('online', () => {
  syncOfflineActions()
})
```

---

## Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **Responsive Desktop** | Single codebase; consistent | Tiny touch targets; complex UI on small screen |
| **PWA of desktop** | Works on any device | Not optimized for scanning workflow |
| **Native mobile apps** | Best performance; native features | Two codebases; app store approval; updates |
| **Scanner pages (chosen)** | Optimized UX; single codebase; fast iteration | Two UI sets to maintain; feature parity effort |

---

## Consequences

### Positive

1. **Speed**: Workflows optimized for scanning, not navigation
2. **Accuracy**: Large targets reduce mis-taps with gloves
3. **Adoption**: Operators prefer dedicated scanner UI
4. **Offline**: Works in areas with poor connectivity
5. **Device Flexibility**: Works on industrial scanners and phones
6. **Iteration Speed**: Web-based, no app store delays

### Negative

1. **Dual Maintenance**: Scanner and desktop pages to maintain
2. **Feature Parity**: Must ensure same capabilities in both
3. **Testing Complexity**: Test on multiple device types
4. **Training**: Two interfaces to learn (though scanner is simpler)
5. **URL Structure**: Separate routes for scanner pages

### Mitigation

| Challenge | Mitigation |
|-----------|------------|
| Dual maintenance | Shared services and hooks; UI only differs |
| Feature parity | Feature matrix tracking; shared test cases |
| Testing complexity | Playwright device emulation; physical test devices |
| Training | Scanner UI is simpler; operators learn quickly |
| URL structure | Clear navigation; QR codes to scanner pages |

---

## Scanner vs Desktop Feature Matrix

| Feature | Desktop | Scanner |
|---------|---------|---------|
| Dashboard overview | Yes | No |
| Full CRUD operations | Yes | Limited (task-focused) |
| Barcode scanning | Yes (manual input) | Yes (optimized) |
| Receiving | Yes | Yes |
| Production consumption | Yes | Yes |
| Production output | Yes | Yes |
| Inventory move | Yes | Yes |
| Cycle count | Yes | Yes |
| Order picking | Yes | Yes |
| Reports | Yes | No (view on desktop) |
| User management | Yes | No |
| Configuration | Yes | No |

---

## Hardware Compatibility

```typescript
// Supported scanner devices
const supportedDevices = [
  // Industrial mobile computers
  'Zebra TC52/TC57',
  'Zebra MC3300',
  'Honeywell CT60',
  'Honeywell CK65',

  // Consumer devices with camera scanning
  'iPhone (Safari)',
  'Android phones (Chrome)',

  // Ring scanners (Bluetooth)
  'Zebra RS6000',
  'Honeywell 8675i',
]

// Scanner detection
function detectScannerType(): 'hardware' | 'camera' | 'manual' {
  // Check user agent for industrial devices
  if (/Zebra|Honeywell/i.test(navigator.userAgent)) {
    return 'hardware'
  }
  // Check for camera API
  if ('mediaDevices' in navigator) {
    return 'camera'
  }
  return 'manual'
}
```

---

## Validation

This decision was validated against:
- [x] Warehouse operator feedback (speed and ease)
- [x] Glove usability testing (48px+ touch targets)
- [x] Industrial scanner compatibility (Zebra, Honeywell)
- [x] Offline scenario testing (sync reliability)

---

## References

- Scanner Pages: `apps/frontend/app/(authenticated)/scanner/`
- Scanner Components: `apps/frontend/components/scanner/`
- Offline Service: `apps/frontend/lib/services/offline-service.ts`
- PRD Warehouse Module: `docs/1-BASELINE/product/modules/warehouse.md`
