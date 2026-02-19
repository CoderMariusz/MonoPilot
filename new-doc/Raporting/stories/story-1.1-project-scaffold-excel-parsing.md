> **Status:** ✅ IMPLEMENTED
> **Components:** Project scaffold, 4 parsers (line-yields, prod-pallets, shift-report, parse-utils), IndexedDB + pako compression, file upload UI with progress

# Story 1.1: Project Scaffold & Excel Parsing Infrastructure

## Story Overview
**Epic**: Infrastructure & Data Processing
**Priority**: Critical (Foundation for entire application)
**Estimated Effort**: 3-4 development sessions
**Dependencies**: None (first story)

### User Story
> As a **Developer**, I want to **set up the complete project scaffold with Excel parsing infrastructure** so that **all subsequent features have a solid foundation for data loading, caching, and visualization**.

---

## Acceptance Criteria

### AC 1.1.1: Folder Structure
- **Given** the project is initialized
- **When** the scaffold is complete
- **Then** the folder structure matches:
```
manufacturing-kpi-dashboard/
├── public/
│   └── index.html              # Entry point
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with sidebar
│   │   ├── page.tsx            # Home/Overview page
│   │   └── globals.css         # Global styles + Tailwind
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   │   ├── Header.tsx      # Top header bar
│   │   │   ├── MainContent.tsx # Content area wrapper
│   │   │   └── LoadingOverlay.tsx
│   │   ├── common/
│   │   │   ├── KPICard.tsx     # Reusable KPI card
│   │   │   ├── DataTable.tsx   # Sortable table component
│   │   │   ├── FilterBar.tsx   # Global filter bar
│   │   │   ├── DatePicker.tsx  # Week/period selector
│   │   │   └── Toast.tsx       # Notification toasts
│   │   ├── charts/
│   │   │   ├── LineChart.tsx   # D3 line chart wrapper
│   │   │   ├── BarChart.tsx    # D3 bar chart wrapper
│   │   │   ├── DonutChart.tsx  # D3 donut chart wrapper
│   │   │   └── Heatmap.tsx     # D3 heatmap wrapper
│   │   └── shift-report/       # Story 4.x components
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── data-loader.ts  # Main Excel loader
│   │   │   ├── line-yields-parser.ts
│   │   │   ├── prod-pallets-parser.ts
│   │   │   └── shift-report-parser.ts
│   │   ├── calendar/
│   │   │   └── fiscal-calendar.ts  # 4-4-5 calendar logic
│   │   ├── aggregation/
│   │   │   └── kpi-engine.ts   # Aggregation & calculations
│   │   └── utils/
│   │       ├── formatters.ts   # Number/date formatting
│   │       └── colors.ts       # Color constants & scales
│   ├── stores/
│   │   ├── data-store.ts       # IndexedDB operations
│   │   └── app-store.ts        # App state (selected week, filters)
│   ├── types/
│   │   ├── kpi.ts              # KPI data interfaces
│   │   ├── line-yields.ts      # Line yields interfaces
│   │   ├── prod-pallets.ts     # Prod Pallets interfaces
│   │   └── shift-report.ts     # Shift report interfaces
│   └── hooks/
│       ├── useData.ts          # Data loading hook
│       ├── useFilters.ts       # Filter state hook
│       └── useChart.ts         # D3 chart lifecycle hook
├── next.config.js              # Static export config
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
└── README.md                   # Setup instructions
```

### AC 1.1.2: Library Bundling (No CDN)
- **Given** the application must work on a network drive without internet
- **When** dependencies are installed
- **Then** all libraries are bundled locally:
  - `xlsx` (SheetJS) v0.20+ — Excel parsing
  - `d3` v7+ — Charts and visualizations
  - `idb-keyval` v6+ — IndexedDB wrapper
  - `next` v14+ — Framework
  - `tailwindcss` v3+ — Styling
  - `react` v18+ — UI framework
- **And** no CDN links exist in any HTML/JS files
- **And** `next.config.js` is configured for static export (`output: 'export'`)

### AC 1.1.3: HTML Shell with Navigation
- **Given** the application loads
- **When** the main page renders
- **Then** the layout includes:
  - **Sidebar** (left, 240px wide, collapsible):
    - Logo/App name: "Manufacturing KPI Dashboard"
    - Navigation items with icons:
      - 📊 Overview (default active)
      - 📈 Yield by Line
      - 🔍 Yield by SKU
      - 📉 Giveaway Analysis
      - 👤 Line Leader Performance
      - 👥 Team Comparison
      - 📅 Period Reports
      - 📋 **Shift Report** (NEW)
    - File loader section at bottom
  - **Main Content Area** (right, flexible width)
  - **Loading Overlay** (full-screen, shown during data loading)

### AC 1.1.4: Dark/Light Theme CSS
- **Given** the design references (`dash 1.png`, `dash2.png`)
- **When** the theme is applied
- **Then** the default theme is **light** with:
  - Page background: `#F8F9FA`
  - Card background: `#FFFFFF`
  - Sidebar background: `#FFFFFF` with right border
  - Text: `#2D3436` primary, `#636E72` secondary
  - Accent: `#6C5CE7` (purple)
  - Success: `#00D2D3` (teal)
  - Warning: `#FECA57` (amber)
  - Danger: `#FF6B6B` (red)
- **And** smooth transitions on hover/focus states
- **And** responsive grid layouts using Tailwind CSS
- **And** consistent 8px spacing grid

### AC 1.1.5: File Input UI
- **Given** the sidebar file loader section
- **When** the user interacts with it
- **Then** three file inputs are available:
  1. **Line Yields** (.xlsb/.xlsx) — Historical yield data (52 weeks)
  2. **Prod Pallets** (.xlsx) — Daily production master file
  3. **Shift Report** (.xlsx) — Daily shift report
- **And** each input shows:
  - File name after selection
  - File size
  - Progress bar during parsing
  - Success/error status
  - Last loaded timestamp

### AC 1.1.6: data-loader.ts parseExcelFile()
- **Given** an Excel file is selected
- **When** `parseExcelFile()` is called
- **Then** it:
  1. Reads the file as ArrayBuffer
  2. Passes to SheetJS `XLSX.read()` with `{ type: 'array', cellDates: true }`
  3. Detects file type (Line Yields, Prod Pallets, Shift Report) from sheet names
  4. Routes to appropriate parser
  5. Returns structured data with progress callbacks
- **And** exports a clean API:
  ```typescript
  export async function parseExcelFile(
    file: File,
    onProgress: (status: ParseProgress) => void
  ): Promise<ParseResult>
  ```

### AC 1.1.7: Line Yields Column Mapping
- **Given** the Line Yields file is parsed
- **When** the KPI Yield Line sheet is processed
- **Then** columns are mapped:
  | Excel Column | JS Field | Type |
  |-------------|----------|------|
  | Date | `date` | Date |
  | KG Usage | `kgUsage` | number |
  | KG Output | `kgOutput` | number |
  | Yield % | `yieldPct` | number |
  | GA % | `gaPct` | number |
  | Efficiency % | `effPct` | number |
  | Line | `line` | string |
  | FG Code | `fgCode` | string |
  | Description | `description` | string |
  | Line Manager | `lineManager` | string |
  | Supervisor | `supervisor` | string |
  | Target Yield | `targetYield` | number |
  | Variance £ | `variancePounds` | number |

### AC 1.1.8: Prod Pallets Sheet Parsing
- **Given** the Prod Pallets file is parsed
- **When** sheets are processed
- **Then** the following key sheets are parsed:
  - **PROD**: Daily pallet production log (Line, Code, Description, Boxes, KG, Time, Pallet ID)
  - **TOT Prod**: Total production by product (Code, Description, Cases, KG, Packets)
  - **PlnSmy**: Plan summary with variances (Line, Line Leader, Avail Hrs, Earned @ Plan, Lost Hrs v Plan, Total Var £, Meat Var £, Lbr Var £, Repack %, Gway %, Effic %)
  - **Var£**: Line efficiency variances (Run Hrs, Avail Hrs, Cases, Packets, KG, Effic %, Labour Var £, Stop %, Repack %, Slow %)
  - **PrdEff**: Production efficiency by product (Line, Shift, Code, Description, Hours, Cases, KG, Packets, Efficiency %)
  - **SumEff**: Summary efficiency by line (Shift, Line, Hours, Cases, KG, Packets, Efficiency %)
  - **Mstr**: Product master data (Code, Description, Std Case/Pallet, Pkt/Case, KG/Case, STD Flow rates)
  - **Review**: Morning summary (Total Packed Cases/Units/KG, Efficiency, Changeovers)
  - **Yields**: Daily yield data (same column structure as LINE YIELDS KPI Yield Line sheet)

### AC 1.1.9: Targets Sheet Parsing
- **Given** the Line Yields file contains a TGTs sheet
- **When** the targets sheet is parsed
- **Then** target values are extracted for:
  - Yield % targets by line/product
  - GA % targets by line/product
  - Efficiency % targets
- **And** targets are stored in IndexedDB for comparison calculations

### AC 1.1.10: Progress UI
- **Given** a file is being parsed
- **When** parsing is in progress
- **Then** the UI shows:
  - Current sheet being parsed
  - Row count progress (e.g., "Row 5,000 of 50,000")
  - Percentage complete
  - Elapsed time
  - Estimated time remaining
- **And** the UI remains responsive (no freezing)

### AC 1.1.11: IndexedDB Storage
- **Given** data has been parsed
- **When** storage is triggered
- **Then** IndexedDB stores:
  ```
  lineYields/data          → Parsed line yields array
  lineYields/lastModified  → File modification timestamp
  lineYields/rowCount      → Total row count
  lineYields/validManagers → Distinct line manager names
  prodPallets/production   → PROD sheet data
  prodPallets/totals       → TOT Prod data
  prodPallets/planSummary  → PlnSmy data
  prodPallets/variances    → Var£ data
  prodPallets/prodEfficiency → PrdEff data
  prodPallets/summaryEfficiency → SumEff data
  prodPallets/productMaster → Mstr data
  prodPallets/review       → Review data
  prodPallets/yields       → Yields data
  prodPallets/lastModified → File modification timestamp
  targets/data             → Target values
  shiftReports/...         → Shift report data (Story 4.1)
  ```

### AC 1.1.12: Incremental Loading
- **Given** a Line Yields file was previously loaded
- **When** the same file is loaded again (with new data)
- **Then** only new rows are parsed and appended
- **And** detection is based on:
  - Last row date in IndexedDB vs new file
  - Row count comparison
- **And** the user sees "X new rows added" message

### AC 1.1.13: Valid Line Managers Refresh
- **Given** LINE YIELDS data is loaded
- **When** the data is processed
- **Then** valid line managers are extracted as distinct values from the lineManager field in LINE YIELDS data
- **And** the list is refreshed on every LINE YIELDS file load
- **And** the updated list is used for all filter dropdowns

---

## Technical Implementation Plan

### Technology Stack Details

| Technology | Version | Purpose | Bundle Size |
|-----------|---------|---------|-------------|
| Next.js | 14.x | Framework, static export | ~85KB gzipped |
| React | 18.x | UI components | ~40KB gzipped |
| Tailwind CSS | 3.x | Utility-first styling | ~10KB (purged) |
| SheetJS (xlsx) | 0.20.x | Excel parsing (.xlsx, .xlsb) | ~350KB |
| D3.js | 7.x | Charts & visualizations | ~250KB (tree-shaken) |
| idb-keyval | 6.x | IndexedDB wrapper | ~1KB |
| TypeScript | 5.x | Type safety | Dev only |

### Next.js Static Export Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Ensure all assets are relative for network drive deployment
  assetPrefix: './',
  basePath: '',
};
module.exports = nextConfig;
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6C5CE7', light: '#A29BFE', dark: '#5A4BD1' },
        success: { DEFAULT: '#00D2D3', light: '#55EFC4' },
        warning: { DEFAULT: '#FECA57', light: '#FFF3BF' },
        danger: { DEFAULT: '#FF6B6B', light: '#FFE0E0' },
        surface: { DEFAULT: '#FFFFFF', page: '#F8F9FA' },
        text: { DEFAULT: '#2D3436', secondary: '#636E72', muted: '#B2BEC3' },
        border: { DEFAULT: '#E9ECEF' },
      },
      borderRadius: {
        card: '12px',
        badge: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### SheetJS Parsing Strategy for Large Files

```typescript
// lib/parsers/data-loader.ts
import * as XLSX from 'xlsx';

interface ParseProgress {
  phase: 'reading' | 'parsing' | 'storing';
  sheet?: string;
  currentRow?: number;
  totalRows?: number;
  percentComplete: number;
  message: string;
}

interface ParseResult {
  type: 'lineYields' | 'prodPallets' | 'shiftReport';
  data: any;
  stats: {
    sheetsProcessed: number;
    totalRows: number;
    parseTimeMs: number;
    errors: string[];
    warnings: string[];
  };
}

export async function parseExcelFile(
  file: File,
  onProgress: (progress: ParseProgress) => void
): Promise<ParseResult> {
  const startTime = performance.now();

  // Phase 1: Read file
  onProgress({ phase: 'reading', percentComplete: 0, message: 'Reading file...' });
  const buffer = await file.arrayBuffer();

  // Phase 2: Parse workbook
  onProgress({ phase: 'parsing', percentComplete: 10, message: 'Parsing workbook...' });
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: true,    // Number formats
    cellStyles: false // Skip styles for performance
  });

  // Detect file type from sheet names
  const sheetNames = workbook.SheetNames;
  const fileType = detectFileType(sheetNames);

  // Route to appropriate parser
  switch (fileType) {
    case 'lineYields':
      return parseLineYields(workbook, onProgress, startTime);
    case 'prodPallets':
      return parseProdPallets(workbook, onProgress, startTime);
    case 'shiftReport':
      return parseShiftReport(workbook, onProgress, startTime);
    default:
      throw new Error('Unrecognized file format');
  }
}

function detectFileType(sheetNames: string[]): string {
  if (sheetNames.includes('REPORT Daily') || sheetNames.includes('SORT DAILY')) {
    return 'shiftReport';
  }
  if (sheetNames.includes('KPI Yield Line') || sheetNames.includes('SUMMARY YIELD')) {
    return 'lineYields';
  }
  if (sheetNames.includes('PROD') || sheetNames.includes('TOT Prod') ||
      sheetNames.includes('PlnSmy') || sheetNames.includes('Mstr')) {
    return 'prodPallets';
  }
  throw new Error('Cannot determine file type from sheet names');
}
```

### Chunked Processing for 80MB Files

```typescript
// For large files, process rows in chunks to keep UI responsive
async function parseSheetChunked<T>(
  sheet: XLSX.WorkSheet,
  mapper: (row: any[], rowIndex: number) => T | null,
  onProgress: (current: number, total: number) => void,
  chunkSize: number = 1000
): Promise<T[]> {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const totalRows = range.e.r - range.s.r;
  const results: T[] = [];

  for (let startRow = range.s.r + 1; startRow <= range.e.r; startRow += chunkSize) {
    const endRow = Math.min(startRow + chunkSize - 1, range.e.r);

    // Process chunk
    for (let r = startRow; r <= endRow; r++) {
      const row: any[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[cellRef];
        row.push(cell ? cell.v : null);
      }

      const mapped = mapper(row, r);
      if (mapped) results.push(mapped);
    }

    // Yield to UI thread
    onProgress(startRow - range.s.r, totalRows);
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
```

### IndexedDB Store Implementation

```typescript
// stores/data-store.ts
import { set, get, del, keys } from 'idb-keyval';

export const DataStore = {
  // Line Yields
  async storeLineYields(data: LineYieldRow[]): Promise<void> {
    await set('lineYields/data', data);
    await set('lineYields/lastModified', new Date().toISOString());
    await set('lineYields/rowCount', data.length);
    // Extract and store distinct line managers from LINE YIELDS data
    const managers = [...new Set(data.map(row => row.lineManager).filter(Boolean))].sort();
    await set('lineYields/validManagers', managers);
  },

  async getLineYields(): Promise<LineYieldRow[] | undefined> {
    return get('lineYields/data');
  },

  async getLastRowDate(): Promise<Date | null> {
    const data = await get<LineYieldRow[]>('lineYields/data');
    if (!data || data.length === 0) return null;
    return new Date(data[data.length - 1].date);
  },

  // Incremental append
  async appendLineYields(newRows: LineYieldRow[]): Promise<number> {
    const existing = await get<LineYieldRow[]>('lineYields/data') || [];
    const combined = [...existing, ...newRows];
    await set('lineYields/data', combined);
    await set('lineYields/rowCount', combined.length);
    // Refresh valid managers from combined data
    const managers = [...new Set(combined.map(row => row.lineManager).filter(Boolean))].sort();
    await set('lineYields/validManagers', managers);
    return newRows.length;
  },

  // Valid Line Managers (extracted from LINE YIELDS data)
  async getValidManagers(): Promise<string[]> {
    return (await get('lineYields/validManagers')) || [];
  },

  // Prod Pallets
  async storeProdPallets(data: {
    production: any[];
    totals: any[];
    planSummary: any[];
    variances: any[];
    prodEfficiency: any[];
    summaryEfficiency: any[];
    productMaster: any[];
    review: any[];
    yields: any[];
  }): Promise<void> {
    await set('prodPallets/production', data.production);
    await set('prodPallets/totals', data.totals);
    await set('prodPallets/planSummary', data.planSummary);
    await set('prodPallets/variances', data.variances);
    await set('prodPallets/prodEfficiency', data.prodEfficiency);
    await set('prodPallets/summaryEfficiency', data.summaryEfficiency);
    await set('prodPallets/productMaster', data.productMaster);
    await set('prodPallets/review', data.review);
    await set('prodPallets/yields', data.yields);
    await set('prodPallets/lastModified', new Date().toISOString());
  },

  async getProdPallets(sheet: string): Promise<any[] | undefined> {
    return get(`prodPallets/${sheet}`);
  },

  // Clear all data
  async clearAll(): Promise<void> {
    const allKeys = await keys();
    await Promise.all(allKeys.map(key => del(key)));
  },
};
```

---

## UX Design Specification

### Sidebar Navigation
```
┌──────────────────────┐
│  🏭 Manufacturing    │
│     KPI Dashboard    │
│                      │
│  ─── DASHBOARDS ──── │
│  📊 Overview         │ ← Active: bg-primary/10, text-primary, left border
│  📈 Yield by Line    │
│  🔍 Yield by SKU     │
│  📉 Giveaway         │
│  👤 Line Leaders     │
│  👥 Team Comparison  │
│  📅 Period Reports   │
│  📋 Shift Report     │ ← NEW
│                      │
│  ─── DATA ────────── │
│  📁 Line Yields      │
│     ✅ 50,234 rows   │
│  📁 Prod Pallets     │
│     ✅ Loaded         │
│  📁 Shift Report     │ ← NEW
│     📅 10/02/2026    │
│                      │
│  [Load Files...]     │
│                      │
│  ─── v1.0.0 ──────── │
└──────────────────────┘
```

### Loading Overlay
```
┌─────────────────────────────────────────┐
│                                         │
│           ┌──────────────┐              │
│           │  🔄 Loading  │              │
│           │              │              │
│           │  Parsing:    │              │
│           │  KPI Yield   │              │
│           │  Line        │              │
│           │              │              │
│           │  ████████░░  │              │
│           │  Row 25,000  │              │
│           │  of 50,234   │              │
│           │              │              │
│           │  ~15s remain │              │
│           └──────────────┘              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests
- File type detection from sheet names
- Column mapping for each sheet type
- Incremental loading detection logic
- IndexedDB store/retrieve operations
- Number/date parsing edge cases

### Integration Tests
- Full file load → parse → store → retrieve cycle
- Incremental loading with existing data
- Valid managers refresh on every LINE YIELDS load
- Progress callback accuracy

### Performance Tests
- Parse 80MB file within 60 seconds
- UI remains responsive during parsing
- IndexedDB storage completes without errors
- Memory usage stays within browser limits

---

## Definition of Done
- [ ] All 13 acceptance criteria pass
- [ ] Folder structure created with all placeholder files
- [ ] All libraries installed and bundled locally
- [ ] HTML shell renders with sidebar and main content
- [ ] Theme CSS matches design references
- [ ] File input UI works for all 3 file types
- [ ] Line Yields parser works with correct column mapping
- [ ] Prod Pallets parser works for key sheets (PROD, PlnSmy, Var£, PrdEff, SumEff, Mstr, Review, Yields)
- [ ] Shift Report parser integrated (Story 4.1)
- [ ] IndexedDB storage working
- [ ] Incremental loading working
- [ ] Progress UI accurate and responsive
- [ ] Static export builds successfully
- [ ] README with setup instructions
