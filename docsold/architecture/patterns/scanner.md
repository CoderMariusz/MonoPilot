# Scanner/Mobile Architecture

## Overview

Progressive Web App (PWA) scanner interface for warehouse and production operations, designed for industrial handheld devices (Zebra) and consumer smartphones.

## Technology Stack

### MVP: Web Application
- Next.js App Router
- Responsive design for small screens
- Native browser camera API for barcode scanning
- Touch-optimized UI

### Phase 3: Native Option
- React Native for iOS/Android
- Native barcode scanning (better performance)
- Bluetooth printer support
- Better offline capabilities

## Application Structure

```
apps/frontend/app/(dashboard)/scanner/
├── page.tsx              # Scanner home/menu
├── layout.tsx            # Scanner-specific layout
├── receive/
│   └── page.tsx         # ASN/GRN receiving
├── move/
│   └── page.tsx         # Stock movement
├── split/
│   └── page.tsx         # LP split
├── merge/
│   └── page.tsx         # LP merge
├── consume/
│   └── page.tsx         # WO material consumption
├── output/
│   └── page.tsx         # Production output
├── pack/
│   └── page.tsx         # Packing/palletization
├── pick/
│   └── page.tsx         # Order picking
└── ship/
    └── page.tsx         # Shipping dispatch
```

## Step-Based Workflow Pattern

### Workflow State Machine
```typescript
// lib/scanner/workflow.ts
interface WorkflowStep {
  id: string
  title: string
  instruction: string
  inputType: 'scan' | 'number' | 'select' | 'confirm'
  validation?: (value: unknown) => boolean
  onComplete: (value: unknown) => void
}

interface WorkflowState {
  currentStep: number
  steps: WorkflowStep[]
  data: Record<string, unknown>
  errors: string[]
}

export function createWorkflow(steps: WorkflowStep[]): WorkflowState {
  return {
    currentStep: 0,
    steps,
    data: {},
    errors: [],
  }
}

export function nextStep(state: WorkflowState): WorkflowState {
  return {
    ...state,
    currentStep: Math.min(state.currentStep + 1, state.steps.length - 1),
  }
}

export function previousStep(state: WorkflowState): WorkflowState {
  return {
    ...state,
    currentStep: Math.max(state.currentStep - 1, 0),
  }
}
```

### Example: Stock Move Workflow
```typescript
// app/scanner/move/page.tsx
'use client'

const stockMoveSteps: WorkflowStep[] = [
  {
    id: 'scan_lp',
    title: 'Scan License Plate',
    instruction: 'Scan the LP barcode to move',
    inputType: 'scan',
    validation: (value) => isValidLPBarcode(value),
    onComplete: (value) => lookupLP(value),
  },
  {
    id: 'scan_destination',
    title: 'Scan Destination',
    instruction: 'Scan the destination location barcode',
    inputType: 'scan',
    validation: (value) => isValidLocationBarcode(value),
    onComplete: (value) => validateDestination(value),
  },
  {
    id: 'confirm',
    title: 'Confirm Move',
    instruction: 'Review and confirm the stock movement',
    inputType: 'confirm',
    onComplete: () => executeStockMove(),
  },
]

export default function StockMovePage() {
  const [workflow, dispatch] = useReducer(workflowReducer, createWorkflow(stockMoveSteps))

  return (
    <ScannerLayout>
      <WorkflowProgress steps={workflow.steps} current={workflow.currentStep} />
      <CurrentStepUI
        step={workflow.steps[workflow.currentStep]}
        data={workflow.data}
        onSubmit={(value) => dispatch({ type: 'SUBMIT', value })}
        onBack={() => dispatch({ type: 'BACK' })}
      />
    </ScannerLayout>
  )
}
```

## Barcode Scanning

### Browser Camera API
```typescript
// lib/scanner/barcode.ts
import { BarcodeDetector } from 'barcode-detector'

export async function initBarcodeScanner(
  videoElement: HTMLVideoElement,
  onDetect: (barcode: string) => void
) {
  // Check for native support
  if (!('BarcodeDetector' in window)) {
    // Fallback to library (zbar.wasm or quagga2)
    return initFallbackScanner(videoElement, onDetect)
  }

  const detector = new BarcodeDetector({
    formats: ['code_128', 'qr_code'], // Supported formats
  })

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment', // Back camera
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  })

  videoElement.srcObject = stream

  // Continuous scanning
  const scan = async () => {
    const barcodes = await detector.detect(videoElement)

    if (barcodes.length > 0) {
      const barcode = barcodes[0].rawValue
      onDetect(barcode)
      // Pause after successful scan
      return
    }

    requestAnimationFrame(scan)
  }

  videoElement.onloadedmetadata = () => {
    videoElement.play()
    scan()
  }

  return () => {
    stream.getTracks().forEach(track => track.stop())
  }
}
```

### Scanner Component
```typescript
// components/scanner/BarcodeScanner.tsx
'use client'

export function BarcodeScanner({
  onScan,
  onError,
  formats = ['code_128', 'qr_code'],
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!videoRef.current) return

    let cleanup: () => void

    initBarcodeScanner(
      videoRef.current,
      (barcode) => {
        // Haptic feedback
        navigator.vibrate?.(100)
        // Audio feedback
        playBeep()
        onScan(barcode)
      }
    )
      .then((fn) => { cleanup = fn })
      .catch(onError)

    return () => cleanup?.()
  }, [onScan, onError])

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      <div className="absolute inset-0 border-2 border-primary/50 m-8 rounded">
        {/* Scan target overlay */}
      </div>
    </div>
  )
}
```

### Barcode Formats
| Format | Use Case |
|--------|----------|
| Code 128 | License Plates, Locations |
| QR Code | Product info, batch details |

## UI Design

### Touch-Optimized Layout
```typescript
// components/scanner/ScannerLayout.tsx
export function ScannerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Fixed header */}
      <header className="sticky top-0 z-50 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <BackButton />
          <Title />
          <MenuButton />
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>

      {/* Fixed bottom actions */}
      <footer className="sticky bottom-0 bg-background border-t p-4 safe-area-inset-bottom">
        <ActionButtons />
      </footer>
    </div>
  )
}
```

### Large Touch Targets
```typescript
// Minimum 48x48px touch targets (WCAG)
const buttonStyles = cn(
  'min-h-[48px] min-w-[48px]',
  'px-6 py-3',
  'text-lg font-medium',
  'rounded-lg',
  'active:scale-95 transition-transform'
)

// Scanner-specific buttons
export function ScannerButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(buttonStyles, 'w-full')}
      {...props}
    >
      {children}
    </Button>
  )
}
```

### Screen Size Support
```css
/* Minimum: Zebra TC21 (4.3" / 800x480) */
@media (min-width: 320px) {
  .scanner-container {
    font-size: 16px;
  }
}

/* Standard smartphone */
@media (min-width: 375px) {
  .scanner-container {
    font-size: 18px;
  }
}
```

## Offline Support

### PWA Configuration
```typescript
// public/manifest.json
{
  "name": "MonoPilot Scanner",
  "short_name": "Scanner",
  "start_url": "/scanner",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/scanner-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/scanner-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Offline Data Storage
```typescript
// lib/scanner/offlineStorage.ts
import { openDB } from 'idb'

const DB_NAME = 'monopilot-scanner'
const DB_VERSION = 1

export async function initOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Cached reference data
      db.createObjectStore('products', { keyPath: 'id' })
      db.createObjectStore('locations', { keyPath: 'id' })

      // Offline operation queue
      db.createObjectStore('pendingOperations', {
        keyPath: 'id',
        autoIncrement: true,
      })
    },
  })
}

// Cache products for offline lookup
export async function cacheProducts(products: Product[]) {
  const db = await initOfflineDB()
  const tx = db.transaction('products', 'readwrite')

  for (const product of products) {
    await tx.store.put(product)
  }

  await tx.done
}

// Get product offline
export async function getProductOffline(id: string): Promise<Product | undefined> {
  const db = await initOfflineDB()
  return db.get('products', id)
}
```

### Operation Queue
```typescript
// lib/scanner/syncQueue.ts
interface PendingOperation {
  id?: number
  type: 'stock_move' | 'consume' | 'output' | 'receive'
  payload: unknown
  createdAt: number
  retries: number
}

export async function queueOperation(op: Omit<PendingOperation, 'id' | 'createdAt' | 'retries'>) {
  const db = await initOfflineDB()

  await db.add('pendingOperations', {
    ...op,
    createdAt: Date.now(),
    retries: 0,
  })

  // Register for background sync
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register('sync-operations')
  }
}

export async function syncPendingOperations() {
  const db = await initOfflineDB()
  const operations = await db.getAll('pendingOperations')

  for (const op of operations) {
    try {
      await executeOperation(op)
      await db.delete('pendingOperations', op.id)
    } catch (error) {
      // Increment retry count
      await db.put('pendingOperations', {
        ...op,
        retries: op.retries + 1,
      })

      if (op.retries >= 3) {
        // Notify user of failed operation
        showSyncError(op)
      }
    }
  }
}

async function executeOperation(op: PendingOperation) {
  switch (op.type) {
    case 'stock_move':
      return StockMovesAPI.create(op.payload)
    case 'consume':
      return ConsumeAPI.consume(op.payload)
    case 'output':
      return ProductionOutputsAPI.create(op.payload)
    // ...
  }
}
```

### Sync Status Indicator
```typescript
// components/scanner/SyncStatus.tsx
export function SyncStatus() {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const isOnline = useOnlineStatus()

  useEffect(() => {
    const updateCount = async () => {
      const db = await initOfflineDB()
      const count = await db.count('pendingOperations')
      setPendingCount(count)
    }

    updateCount()
    const interval = setInterval(updateCount, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <WifiIcon className="text-green-500" />
      ) : (
        <WifiOffIcon className="text-yellow-500" />
      )}

      {pendingCount > 0 && (
        <Badge variant="secondary">
          {syncing ? 'Syncing...' : `${pendingCount} pending`}
        </Badge>
      )}
    </div>
  )
}
```

## Session Management

### Auto-Logout
```typescript
// lib/scanner/session.ts
const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export function useSessionTimeout(onTimeout: () => void) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(onTimeout, IDLE_TIMEOUT)
  }, [onTimeout])

  useEffect(() => {
    const events = ['touchstart', 'click', 'keydown', 'scroll']

    events.forEach(event => {
      window.addEventListener(event, resetTimeout)
    })

    resetTimeout()

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [resetTimeout])
}

// Usage
function ScannerApp() {
  const router = useRouter()

  useSessionTimeout(() => {
    router.push('/scanner/login')
  })

  return <ScannerRoutes />
}
```

### Quick Re-Auth
```typescript
// components/scanner/QuickLogin.tsx
export function QuickLogin() {
  const [pin, setPin] = useState('')

  const handlePinSubmit = async () => {
    const success = await verifyPIN(pin)
    if (success) {
      refreshSession()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-xl font-bold">Session Expired</h2>
      <p>Enter your PIN to continue</p>
      <PINInput value={pin} onChange={setPin} />
      <ScannerButton onClick={handlePinSubmit}>
        Unlock
      </ScannerButton>
    </div>
  )
}
```

## Hardware Integration

### Zebra Device Detection
```typescript
// lib/scanner/device.ts
export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent.toLowerCase()

  if (ua.includes('tc21') || ua.includes('tc26')) {
    return {
      type: 'zebra',
      model: 'TC2x',
      hasHardwareScanner: true,
      screenSize: 'small',
    }
  }

  if (ua.includes('tc51') || ua.includes('tc56')) {
    return {
      type: 'zebra',
      model: 'TC5x',
      hasHardwareScanner: true,
      screenSize: 'medium',
    }
  }

  return {
    type: 'generic',
    model: 'unknown',
    hasHardwareScanner: false,
    screenSize: 'medium',
  }
}
```

### Hardware Scanner Events
```typescript
// Zebra devices send scan data as keyboard input
export function useHardwareScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hardware scanners send data rapidly followed by Enter
      if (e.key === 'Enter') {
        if (bufferRef.current) {
          onScan(bufferRef.current)
          bufferRef.current = ''
        }
        return
      }

      // Accumulate characters
      bufferRef.current += e.key

      // Clear buffer if no input for 100ms (manual typing)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = ''
      }, 100)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onScan])
}
```

### Printer Support (Phase 3-4)
```typescript
// Bluetooth printer for labels
interface PrinterConfig {
  type: 'zebra' | 'brother' | 'generic'
  address: string
}

export async function printLabel(
  printer: PrinterConfig,
  labelData: LabelData
): Promise<void> {
  // Phase 3-4: Bluetooth Web API or native bridge
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['00001101-0000-1000-8000-00805f9b34fb'] }], // SPP
  })

  const server = await device.gatt.connect()
  // ... print ZPL/CPCL commands
}
```

## Performance

### Optimizations
```typescript
// Preload scanner module
<link rel="modulepreload" href="/scanner/_next/static/chunks/scanner.js" />

// Reduce bundle size
const BarcodeScanner = dynamic(
  () => import('@/components/scanner/BarcodeScanner'),
  { loading: () => <ScannerSkeleton /> }
)

// Minimize re-renders
const WorkflowStep = memo(function WorkflowStep({ step, onSubmit }) {
  // ...
})
```

### Response Time Targets
| Operation | Target | Notes |
|-----------|--------|-------|
| Barcode decode | <50ms | Camera frame processing |
| LP lookup | <100ms | Cached locally |
| Stock move | <300ms | With sync |
| UI interaction | <100ms | Touch feedback |

## Testing

### Scanner-Specific Tests
```typescript
// e2e/scanner/stock-move.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Stock Move', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scanner/move')
  })

  test('completes stock move workflow', async ({ page }) => {
    // Mock barcode scan
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcode-scan', {
        detail: { value: 'LP-001' }
      }))
    })

    await expect(page.getByText('LP-001')).toBeVisible()

    // Scan destination
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcode-scan', {
        detail: { value: 'LOC-A1' }
      }))
    })

    // Confirm
    await page.click('button:has-text("Confirm")')

    await expect(page.getByText('Move completed')).toBeVisible()
  })
})
```
