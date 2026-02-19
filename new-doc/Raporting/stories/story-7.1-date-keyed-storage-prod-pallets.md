> **Status:** PENDING
> **Components:** `src/stores/data-store.ts`, `src/types/prod-pallets.ts`, `src/lib/parsers/data-loader.ts`
> **Features:** Date-keyed IndexedDB snapshots for Prod Pallets, automatic migration from flat keys, 365-day retention policy, backward-compatible getProdPallets()

# Story 7.1: Date-Keyed Storage Architecture for Prod Pallets

## Story Overview
**Epic**: Data Architecture & Performance
**Priority**: High (Foundation for historical Prod Pallets access)
**Estimated Effort**: 1-2 development sessions
**Dependencies**: Story 1.1 (IndexedDB storage, compression utilities, Prod Pallets parsing)

### User Story
> As a **Developer**, I want to **store each Prod Pallets upload as a date-keyed snapshot in IndexedDB** so that **historical daily data is preserved across multiple uploads, enabling trend analysis and day-over-day comparisons**.

### Problem Statement
Currently, Prod Pallets data is stored as a single snapshot in IndexedDB using 11 flat keys (e.g., `prodPallets/production`, `prodPallets/planSummary`). Each new file upload calls `DataStore.storeProdPallets(data)` which **replaces ALL previous data**. This means only the most recently uploaded day exists in storage. There is no way to view yesterday's production data or compare across days.

### Solution
Change storage from flat keys (`prodPallets/production`, `prodPallets/planSummary`, etc.) to **date-keyed compressed snapshots** (`prodPallets/daily/{YYYY-MM-DD}`) with a date index (`prodPallets/dates`) and a latest-date pointer (`prodPallets/latest`). Each snapshot stores the entire `ProdPalletsData` object as a single compressed `Uint8Array`. A retention policy automatically removes snapshots older than 365 days.

---

## Acceptance Criteria

### AC 7.1.1: Add `ProdPalletsDateIndex` Type to `src/types/prod-pallets.ts`

- **Given** the file `src/types/prod-pallets.ts` exists and already contains `ProdPalletsData`, `ProdPalletsMetadata`, `ProdRow`, and other interfaces
- **When** the developer adds the new type
- **Then** a new exported interface named `ProdPalletsDateIndex` is added at the **end of the file** (after the existing `ProdPalletsMetadata` interface), with these exact fields:

```typescript
/** Index of all stored Prod Pallets daily snapshots */
export interface ProdPalletsDateIndex {
    /** Sorted ascending array of date strings in YYYY-MM-DD format.
     *  Example: ['2026-01-13', '2026-01-14', '2026-01-15'] */
    dates: string[];

    /** The most recent date string in YYYY-MM-DD format.
     *  Example: '2026-01-15' */
    latestDate: string;
}
```

- **And** no existing interfaces or types in the file are modified
- **And** no new imports are needed for this change

**File to modify:** `manufacturing-kpi-dashboard/src/types/prod-pallets.ts`
**Location:** After the closing `}` of the `ProdPalletsMetadata` interface (currently line 332)
**What to add:** The `ProdPalletsDateIndex` interface shown above

---

### AC 7.1.2: Add `extractUploadDate(data)` Helper Function

- **Given** the file `src/stores/data-store.ts` exists
- **When** the developer adds the helper function
- **Then** a new **module-level function** (NOT a method on the `DataStore` object) named `extractUploadDate` is added **above** the `DataStore` object declaration. This function is NOT exported. It is a private helper used only inside `data-store.ts`.

**Function signature:**
```typescript
function extractUploadDate(data: ProdPalletsData): string
```

**Parameters:**
- `data` — a `ProdPalletsData` object (the full container with all 12 arrays)

**Return value:**
- A string in `YYYY-MM-DD` format (e.g., `'2026-01-15'`)

**Step-by-step logic:**

1. Read the `data.production` array. This is a `ProdRow[]`. Each `ProdRow` has a `date: string` field in ISO format (e.g., `'2026-01-15'`).
2. Create a `Map<string, number>` called `dateCounts` to count how many times each date value appears.
3. Loop through every element `row` of `data.production`:
   a. Read `row.date`. If `row.date` is falsy (undefined, null, or empty string), skip this row (use `continue`).
   b. Extract just the date portion: `const dateKey = row.date.slice(0, 10);`
   c. Increment the count: `dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1);`
4. After the loop, find the date with the highest count:
   a. Declare `let bestDate = '';` and `let bestCount = 0;`.
   b. Loop through `dateCounts.entries()`. For each `[dateKey, count]`:
      - If `count > bestCount`, set `bestDate = dateKey` and `bestCount = count`.
5. If `bestDate` is still an empty string (meaning `data.production` was empty or all dates were falsy), use today's date as fallback:
   `bestDate = new Date().toISOString().slice(0, 10);`
6. Log to console: `console.log('[DataStore] Extracted upload date:', bestDate, 'from', data.production.length, 'production rows');`
7. Return `bestDate`.

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** After the `safeDbOp` function (currently ending at line 68) and before the `export const DataStore = {` line (currently line 71).
**Imports needed:** The `ProdPalletsData` type is already imported on line 34-49.

---

### AC 7.1.3: Add `storeProdPalletsForDate(date, data)` Method to DataStore

- **Given** the `DataStore` object in `src/stores/data-store.ts` exists
- **When** the developer adds the new method
- **Then** a new method named `storeProdPalletsForDate` is added inside the `DataStore` object, in the `// Prod Pallets` section (after the existing `storeProdPallets` method).

**Method signature:**
```typescript
async storeProdPalletsForDate(date: string, data: ProdPalletsData): Promise<void>
```

**Parameters:**
- `date` — a string in `YYYY-MM-DD` format (e.g., `'2026-01-15'`). This is the date key for this snapshot.
- `data` — a `ProdPalletsData` object containing all 12 arrays.

**Step-by-step logic:**

1. Wrap the entire body in `safeDbOp('storeProdPalletsForDate', async () => { ... })`.
2. Inside the callback:
   a. Log to console: `console.log('[DataStore] Storing Prod Pallets snapshot for date:', date);`
   b. Compress the entire `data` object into a single `Uint8Array`:
      ```typescript
      const compressed = compressData(data);
      ```
      The `compressData` function is already imported from `@/lib/compression`.
   c. Store the compressed snapshot:
      ```typescript
      await set('prodPallets/daily/' + date, compressed);
      ```
   d. Store the latest date pointer:
      ```typescript
      await set('prodPallets/latest', date);
      ```
   e. Update the dates index:
      - Read the current dates array: `const existingDates = (await get<string[]>('prodPallets/dates')) || [];`
      - Check if `date` is already in the array: `if (!existingDates.includes(date)) {`
        - If not, push it: `existingDates.push(date);`
        - Sort ascending: `existingDates.sort();`
      - `}`
      - Save the updated dates array: `await set('prodPallets/dates', existingDates);`
   f. Call the retention enforcement function (AC 7.1.8):
      ```typescript
      await enforceProdPalletsRetention();
      ```
   g. Log completion: `console.log('[DataStore] Stored Prod Pallets snapshot for', date, '- compressed size:', compressed.byteLength, 'bytes');`

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** Inside the `DataStore` object, in the `// Prod Pallets` section, after the existing `storeProdPallets` method.

---

### AC 7.1.4: Add `storeProdPalletsMetadataForDate(date, metadata)` Method

- **Given** the `DataStore` object in `src/stores/data-store.ts` exists
- **When** the developer adds the new method
- **Then** a new method named `storeProdPalletsMetadataForDate` is added inside the `DataStore` object, immediately after the `storeProdPalletsForDate` method.

**Method signature:**
```typescript
async storeProdPalletsMetadataForDate(date: string, metadata: ProdPalletsMetadata): Promise<void>
```

**Parameters:**
- `date` — a string in `YYYY-MM-DD` format.
- `metadata` — a `ProdPalletsMetadata` object.

**Step-by-step logic:**

1. Wrap the entire body in `safeDbOp('storeProdPalletsMetadataForDate', async () => { ... })`.
2. Inside the callback:
   a. Store the metadata at the date-keyed path:
      ```typescript
      await set('prodPallets/metadata/' + date, metadata);
      ```
   b. Log: `console.log('[DataStore] Stored Prod Pallets metadata for date:', date);`

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** Inside the `DataStore` object, after the `storeProdPalletsForDate` method.

---

### AC 7.1.5: Add `getProdPalletsForDate(date)` Method to DataStore

- **Given** the `DataStore` object in `src/stores/data-store.ts` exists
- **When** the developer adds the new method
- **Then** a new method named `getProdPalletsForDate` is added inside the `DataStore` object, after the `storeProdPalletsMetadataForDate` method.

**Method signature:**
```typescript
async getProdPalletsForDate(date: string): Promise<ProdPalletsData | undefined>
```

**Parameters:**
- `date` — a string in `YYYY-MM-DD` format (e.g., `'2026-01-15'`).

**Return value:**
- A `ProdPalletsData` object if the snapshot exists and can be decompressed, or `undefined` if no snapshot exists for that date.

**Step-by-step logic:**

1. Wrap the entire body in `safeDbOp('getProdPalletsForDate', async () => { ... })`.
2. Inside the callback:
   a. Log: `console.log('[DataStore] Loading Prod Pallets snapshot for date:', date);`
   b. Read the compressed snapshot from IndexedDB:
      ```typescript
      const compressed = await get<Uint8Array>('prodPallets/daily/' + date);
      ```
   c. If `compressed` is falsy (undefined or null):
      - Log: `console.warn('[DataStore] No Prod Pallets snapshot found for date:', date);`
      - Return `undefined`.
   d. Decompress the data using `smartDecompress` (which handles both compressed `Uint8Array` and raw objects for backward compatibility):
      ```typescript
      const data = smartDecompress(compressed) as ProdPalletsData;
      ```
      The `smartDecompress` function is already imported from `@/lib/compression`.
   e. Log: `console.log('[DataStore] Loaded Prod Pallets snapshot for', date, '- production rows:', data.production?.length || 0);`
   f. Return `data`.

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** Inside the `DataStore` object, after `storeProdPalletsMetadataForDate`.

---

### AC 7.1.6: Add `getProdPalletsMetadataForDate(date)` Method

- **Given** the `DataStore` object in `src/stores/data-store.ts` exists
- **When** the developer adds the new method
- **Then** a new method named `getProdPalletsMetadataForDate` is added inside the `DataStore` object, after `getProdPalletsForDate`.

**Method signature:**
```typescript
async getProdPalletsMetadataForDate(date: string): Promise<ProdPalletsMetadata | undefined>
```

**Parameters:**
- `date` — a string in `YYYY-MM-DD` format.

**Step-by-step logic:**

1. Return `safeDbOp('getProdPalletsMetadataForDate', () => get<ProdPalletsMetadata>('prodPallets/metadata/' + date));`

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`

---

### AC 7.1.7: Add `getProdPalletsDates()` Method to DataStore

- **Given** the `DataStore` object in `src/stores/data-store.ts` exists
- **When** the developer adds the new method
- **Then** a new method named `getProdPalletsDates` is added inside the `DataStore` object, after `getProdPalletsMetadataForDate`.

**Method signature:**
```typescript
async getProdPalletsDates(): Promise<string[]>
```

**Return value:**
- A `string[]` of date strings in `YYYY-MM-DD` format, sorted ascending. Returns an empty array `[]` if no dates are stored.

**Step-by-step logic:**

1. Wrap the entire body in `safeDbOp('getProdPalletsDates', async () => { ... })`.
2. Inside the callback:
   a. Read the dates array: `const dates = await get<string[]>('prodPallets/dates');`
   b. If `dates` is falsy, return `[]`.
   c. Return `dates` (it is already sorted ascending by AC 7.1.3).

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`

---

### AC 7.1.8: Add `getLatestProdPalletsDate()` Method to DataStore

- **Given** the `DataStore` object in `src/stores/data-store.ts` exists
- **When** the developer adds the new method
- **Then** a new method named `getLatestProdPalletsDate` is added inside the `DataStore` object, after `getProdPalletsDates`.

**Method signature:**
```typescript
async getLatestProdPalletsDate(): Promise<string | undefined>
```

**Return value:**
- A string in `YYYY-MM-DD` format representing the most recently stored date, or `undefined` if no data exists.

**Step-by-step logic:**

1. Wrap the entire body in `safeDbOp('getLatestProdPalletsDate', async () => { ... })`.
2. Inside the callback:
   a. Read the latest pointer: `const latest = await get<string>('prodPallets/latest');`
   b. Return `latest || undefined` (converts null/empty to undefined).

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`

---

### AC 7.1.9: Modify `getProdPallets()` to Return Latest Date Snapshot

- **Given** the existing `getProdPallets()` method in the `DataStore` object currently reads 12 separate flat keys and assembles a `ProdPalletsData` object
- **When** the developer modifies it for backward compatibility
- **Then** the method is updated to:
  1. First, try the new date-keyed storage.
  2. If no new-style data exists, fall back to the old flat-key storage (for pre-migration compatibility).

**Updated method signature** (unchanged):
```typescript
async getProdPallets(): Promise<ProdPalletsData | undefined>
```

**New step-by-step logic:**

1. Wrap the entire body in `safeDbOp('getProdPallets', async () => { ... })`.
2. Inside the callback:
   a. Try the new date-keyed path first:
      ```typescript
      const latestDate = await get<string>('prodPallets/latest');
      if (latestDate) {
          const compressed = await get<Uint8Array>('prodPallets/daily/' + latestDate);
          if (compressed) {
              console.log('[DataStore] getProdPallets() returning snapshot for', latestDate);
              return smartDecompress(compressed) as ProdPalletsData;
          }
      }
      ```
   b. Fall back to old flat-key storage (the current implementation). This entire block is kept as-is:
      ```typescript
      console.log('[DataStore] getProdPallets() falling back to legacy flat keys');
      const production = await get<ProdRow[]>('prodPallets/production');
      if (!production) return undefined;

      return {
          production,
          shiftReportData: (await get<ShiftReportDataRow[]>('prodPallets/shiftReportData')) || [],
          planSummary: (await get<PlanSummaryRow[]>('prodPallets/planSummary')) || [],
          productMaster: (await get<ProductMasterRow[]>('prodPallets/productMaster')) || [],
          schedule: (await get<SchedRow[]>('prodPallets/schedule')) || [],
          totals: (await get<TotProdRow[]>('prodPallets/totals')) || [],
          variances: (await get<VarianceRow[]>('prodPallets/variances')) || [],
          prodEfficiency: (await get<ProdEfficiencyRow[]>('prodPallets/prodEfficiency')) || [],
          summaryEfficiency: (await get<SummaryEfficiencyRow[]>('prodPallets/summaryEfficiency')) || [],
          detail: (await get<DetailRow[]>('prodPallets/detail')) || [],
          review: (await get<ReviewRow[]>('prodPallets/review')) || [],
          yields: (await get<YieldsRow[]>('prodPallets/yields')) || [],
      };
      ```

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** Replace the existing `getProdPallets()` method body (currently lines 348-370).
**Important:** The old flat-key fallback MUST remain until migration has been confirmed to work. Components that call `getProdPallets()` will continue to work without any changes.

---

### AC 7.1.10: Add `migrateProdPalletsToDateKeyed()` Private Function

- **Given** the file `src/stores/data-store.ts` exists
- **When** the developer adds the migration function
- **Then** a new **module-level function** (NOT a method on DataStore) named `migrateProdPalletsToDateKeyed` is added. This function is NOT exported. It is placed after the `extractUploadDate` function and before the `DataStore` object.

**Function signature:**
```typescript
async function migrateProdPalletsToDateKeyed(): Promise<boolean>
```

**Return value:**
- `true` if migration was performed, `false` if already migrated or no old data exists.

**Step-by-step logic:**

1. Log: `console.log('[DataStore] Checking if Prod Pallets migration needed...');`
2. Check if old-style data exists:
   ```typescript
   const oldProduction = await get<ProdRow[]>('prodPallets/production');
   ```
3. If `oldProduction` is falsy or has length 0:
   a. Log: `console.log('[DataStore] No legacy Prod Pallets data found, skipping migration');`
   b. Return `false`.
4. Check if already migrated (new-style data exists):
   ```typescript
   const existingDates = await get<string[]>('prodPallets/dates');
   ```
5. If `existingDates` is truthy and `existingDates.length > 0`:
   a. Log: `console.log('[DataStore] Prod Pallets already migrated, found', existingDates.length, 'dates');`
   b. Return `false`.
6. Log: `console.log('[DataStore] Migrating legacy Prod Pallets to date-keyed storage...');`
7. Reconstruct the full `ProdPalletsData` object from the 12 old flat keys:
   ```typescript
   const data: ProdPalletsData = {
       production: oldProduction,
       shiftReportData: (await get<ShiftReportDataRow[]>('prodPallets/shiftReportData')) || [],
       planSummary: (await get<PlanSummaryRow[]>('prodPallets/planSummary')) || [],
       productMaster: (await get<ProductMasterRow[]>('prodPallets/productMaster')) || [],
       schedule: (await get<SchedRow[]>('prodPallets/schedule')) || [],
       totals: (await get<TotProdRow[]>('prodPallets/totals')) || [],
       variances: (await get<VarianceRow[]>('prodPallets/variances')) || [],
       prodEfficiency: (await get<ProdEfficiencyRow[]>('prodPallets/prodEfficiency')) || [],
       summaryEfficiency: (await get<SummaryEfficiencyRow[]>('prodPallets/summaryEfficiency')) || [],
       detail: (await get<DetailRow[]>('prodPallets/detail')) || [],
       review: (await get<ReviewRow[]>('prodPallets/review')) || [],
       yields: (await get<YieldsRow[]>('prodPallets/yields')) || [],
   };
   ```
8. Extract the upload date from the reconstructed data:
   ```typescript
   const date = extractUploadDate(data);
   ```
9. Compress and store as a new date-keyed snapshot:
   ```typescript
   const compressed = compressData(data);
   await set('prodPallets/daily/' + date, compressed);
   ```
10. Create the dates index:
    ```typescript
    await set('prodPallets/dates', [date]);
    ```
11. Set the latest pointer:
    ```typescript
    await set('prodPallets/latest', date);
    ```
12. Migrate existing metadata (if any):
    ```typescript
    const oldMetadata = await get<ProdPalletsMetadata>('prodPallets/metadata');
    if (oldMetadata) {
        await set('prodPallets/metadata/' + date, oldMetadata);
    }
    ```
13. Delete all old flat keys:
    ```typescript
    const oldKeys = [
        'prodPallets/production',
        'prodPallets/shiftReportData',
        'prodPallets/planSummary',
        'prodPallets/productMaster',
        'prodPallets/schedule',
        'prodPallets/totals',
        'prodPallets/variances',
        'prodPallets/prodEfficiency',
        'prodPallets/summaryEfficiency',
        'prodPallets/detail',
        'prodPallets/review',
        'prodPallets/yields',
        'prodPallets/lastModified',
        'prodPallets/metadata',
    ];
    for (const key of oldKeys) {
        await del(key);
    }
    ```
14. Log: `console.log('[DataStore] Migration complete. Migrated legacy data to date:', date, '- compressed size:', compressed.byteLength, 'bytes');`
15. Return `true`.

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** After the `extractUploadDate` function, before the `export const DataStore = {` line.
**Error handling:** If any step throws, the error will propagate up. The caller (AC 7.1.13) will catch it and log a warning. This is intentional -- a failed migration should not crash the app; the old flat-key fallback in `getProdPallets()` (AC 7.1.9) will still work.

---

### AC 7.1.11: Add `enforceProdPalletsRetention()` Private Function

- **Given** the file `src/stores/data-store.ts` exists
- **When** the developer adds the retention function
- **Then** a new **module-level function** (NOT a method on DataStore) named `enforceProdPalletsRetention` is added. This function is NOT exported. It is placed after `migrateProdPalletsToDateKeyed` and before the `DataStore` object.

**Function signature:**
```typescript
async function enforceProdPalletsRetention(): Promise<void>
```

**Step-by-step logic:**

1. Read the current dates array:
   ```typescript
   const dates = await get<string[]>('prodPallets/dates');
   ```
2. If `dates` is falsy or has length 0, return immediately (nothing to clean).
3. Calculate the cutoff date (365 days ago from today):
   ```typescript
   const now = new Date();
   const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365);
   const cutoffStr = cutoffDate.toISOString().slice(0, 10);
   ```
4. Filter the dates array to find dates to remove:
   ```typescript
   const datesToRemove = dates.filter(d => d < cutoffStr);
   ```
5. If `datesToRemove.length === 0`, return immediately (nothing expired).
6. Log: `console.log('[DataStore] Retention: removing', datesToRemove.length, 'expired Prod Pallets snapshots older than', cutoffStr);`
7. For each date in `datesToRemove`:
   ```typescript
   for (const oldDate of datesToRemove) {
       await del('prodPallets/daily/' + oldDate);
       await del('prodPallets/metadata/' + oldDate);
   }
   ```
8. Filter the dates array to keep only non-expired dates:
   ```typescript
   const remainingDates = dates.filter(d => d >= cutoffStr);
   ```
9. Save the updated dates array:
   ```typescript
   await set('prodPallets/dates', remainingDates);
   ```
10. If the latest pointer is in the removed set, update it:
    ```typescript
    const latest = await get<string>('prodPallets/latest');
    if (latest && latest < cutoffStr) {
        const newLatest = remainingDates.length > 0 ? remainingDates[remainingDates.length - 1] : undefined;
        if (newLatest) {
            await set('prodPallets/latest', newLatest);
        } else {
            await del('prodPallets/latest');
        }
    }
    ```
11. Log: `console.log('[DataStore] Retention complete. Remaining snapshots:', remainingDates.length);`

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** After `migrateProdPalletsToDateKeyed`, before `export const DataStore = {`.

---

### AC 7.1.12: Add `initProdPalletsStorage()` Public Method to DataStore

- **Given** the `DataStore` object in `src/stores/data-store.ts` exists
- **When** the developer adds the initialization method
- **Then** a new method named `initProdPalletsStorage` is added inside the `DataStore` object, at the **top** of the `// Prod Pallets` section (before `storeProdPallets`).

**Method signature:**
```typescript
async initProdPalletsStorage(): Promise<void>
```

**Step-by-step logic:**

1. Wrap in `safeDbOp('initProdPalletsStorage', async () => { ... })`.
2. Inside the callback:
   a. Try/catch the migration call:
      ```typescript
      try {
          const migrated = await migrateProdPalletsToDateKeyed();
          if (migrated) {
              console.log('[DataStore] Prod Pallets storage initialized (migration performed)');
          } else {
              console.log('[DataStore] Prod Pallets storage initialized (no migration needed)');
          }
      } catch (err) {
          console.error('[DataStore] Prod Pallets migration failed, falling back to legacy storage:', err);
          // Do NOT re-throw. The app can still work with old flat keys via getProdPallets() fallback.
      }
      ```

**When to call this method:**
- This method should be called once on app startup, before any Prod Pallets data is accessed.
- The recommended call site is in the main `page.tsx` or wherever the app initializes IndexedDB data. However, this story does NOT modify `page.tsx`. The caller integration will be added in a follow-up story or can be done by the developer at their discretion.
- For now, it is also safe to call lazily (e.g., the first time `getProdPallets()` is called), but this is optional.

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** Inside the `DataStore` object, at the top of the `// Prod Pallets` section.

---

### AC 7.1.13: Modify `data-loader.ts` to Use `storeProdPalletsForDate()`

- **Given** the file `src/lib/parsers/data-loader.ts` contains the `processProdPallets()` function (currently lines 241-307)
- **When** the developer modifies it to use date-keyed storage
- **Then** the `processProdPallets()` function is updated as follows:

**Current code to replace** (lines 256-284 approximately):
```typescript
// Phase 3: Store all data
onProgress({
    phase: 'storing',
    percentComplete: 85,
    message: 'Storing Prod Pallets data...',
});

await DataStore.storeProdPallets(data);

// Store metadata
await DataStore.storeProdPalletsMetadata({
    lastModified: new Date().toISOString(),
    fileName: file.name,
    fileSize: file.size,
    loadedAt: new Date().toISOString(),
    sheetCounts: {
        production: data.production.length,
        shiftReportData: data.shiftReportData.length,
        planSummary: data.planSummary.length,
        productMaster: data.productMaster.length,
        schedule: data.schedule.length,
        totals: data.totals.length,
        variances: data.variances.length,
        prodEfficiency: data.prodEfficiency.length,
        summaryEfficiency: data.summaryEfficiency.length,
        detail: data.detail.length,
        review: data.review.length,
        yields: data.yields.length,
    },
});
```

**New replacement code:**
```typescript
// Phase 3: Extract date and store as date-keyed snapshot
onProgress({
    phase: 'storing',
    percentComplete: 85,
    message: 'Storing Prod Pallets data...',
});

// Extract the upload date from production rows
const uploadDate = DataStore.extractUploadDatePublic(data);

onProgress({
    phase: 'storing',
    percentComplete: 88,
    message: `Storing Prod Pallets snapshot for ${uploadDate}...`,
});

await DataStore.storeProdPalletsForDate(uploadDate, data);

// Store metadata at the date key
await DataStore.storeProdPalletsMetadataForDate(uploadDate, {
    lastModified: new Date().toISOString(),
    fileName: file.name,
    fileSize: file.size,
    loadedAt: new Date().toISOString(),
    sheetCounts: {
        production: data.production.length,
        shiftReportData: data.shiftReportData.length,
        planSummary: data.planSummary.length,
        productMaster: data.productMaster.length,
        schedule: data.schedule.length,
        totals: data.totals.length,
        variances: data.variances.length,
        prodEfficiency: data.prodEfficiency.length,
        summaryEfficiency: data.summaryEfficiency.length,
        detail: data.detail.length,
        review: data.review.length,
        yields: data.yields.length,
    },
});
```

**Additional change required:** Since `extractUploadDate` is a private module-level function in `data-store.ts`, the data-loader cannot call it directly. There are two options:

**Option A (preferred):** Add a thin public wrapper method to `DataStore`:
```typescript
/** Public wrapper for extractUploadDate — used by data-loader.ts */
extractUploadDatePublic(data: ProdPalletsData): string {
    return extractUploadDate(data);
}
```
Add this method inside the `DataStore` object, right after `initProdPalletsStorage`. Note: this is NOT async; it returns a plain string. Then `data-loader.ts` calls `DataStore.extractUploadDatePublic(data)`.

**Option B (alternative):** Export the `extractUploadDate` function and import it in `data-loader.ts`. This is simpler but mixes concerns.

**This AC uses Option A.**

**File to modify:** `manufacturing-kpi-dashboard/src/lib/parsers/data-loader.ts`
**Lines to modify:** Inside the `processProdPallets()` function, replace the storage section (approximately lines 255-284).
**No new imports needed:** `DataStore` is already imported from `@/stores/data-store`.

---

### AC 7.1.14: Deprecate Old `storeProdPallets()` Method

- **Given** the `DataStore` object has the old `storeProdPallets(data)` method
- **When** the developer deprecates it
- **Then** the method is **NOT removed** (to avoid breaking anything during transition). Instead:

1. Add a JSDoc `@deprecated` tag to the method:
   ```typescript
   /**
    * @deprecated Use `storeProdPalletsForDate(date, data)` instead.
    * This method stores data under flat keys and will be removed in a future version.
    * Kept for backward compatibility during migration period.
    */
   ```
2. Add a console warning at the top of the method body (inside the `safeDbOp` callback):
   ```typescript
   console.warn('[DataStore] storeProdPallets() is deprecated. Use storeProdPalletsForDate() instead.');
   ```
3. The rest of the method body remains unchanged.

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** The existing `storeProdPallets` method (currently lines 320-338).

---

### AC 7.1.15: Console Logging for All Storage Operations

- **Given** all new methods from AC 7.1.2 through AC 7.1.12 have been added
- **When** any storage operation is performed
- **Then** every method logs its entry and completion using `console.log` with the `[DataStore]` prefix.

**Logging format:**
- Entry: `console.log('[DataStore] <methodName>: <action description>', <key params>);`
- Completion: `console.log('[DataStore] <methodName>: done', <result summary>);`
- Warnings: `console.warn('[DataStore] <methodName>: <warning message>');`
- Errors: `console.error('[DataStore] <methodName>: <error message>', err);`

**Specific logs already defined in previous ACs:**
- AC 7.1.2: `extractUploadDate` logs the extracted date and production row count
- AC 7.1.3: `storeProdPalletsForDate` logs the date and compressed size
- AC 7.1.5: `getProdPalletsForDate` logs the date and production row count
- AC 7.1.9: `getProdPallets` logs which path was taken (new vs legacy)
- AC 7.1.10: `migrateProdPalletsToDateKeyed` logs migration start, skip, and completion
- AC 7.1.11: `enforceProdPalletsRetention` logs dates removed and remaining count
- AC 7.1.12: `initProdPalletsStorage` logs initialization result

**No additional changes needed.** This AC is a verification AC -- it confirms that all previous ACs include proper logging. The reviewer should check that every new function/method includes at least one `console.log` or `console.warn` call.

---

### AC 7.1.16: Error Handling for Corrupted/Missing Snapshots

- **Given** a date-keyed snapshot may be corrupted (bad compression), missing (deleted externally), or have an invalid format
- **When** `getProdPalletsForDate(date)` or `getProdPallets()` encounters such data
- **Then** errors are handled gracefully:

1. **In `getProdPalletsForDate(date)`** (AC 7.1.5):
   - The `safeDbOp` wrapper already catches and re-throws with a descriptive message.
   - Inside the callback, if `smartDecompress(compressed)` throws (e.g., bad gzip data), the error propagates to `safeDbOp` which wraps it as `IndexedDB getProdPalletsForDate failed: <message>`.
   - **No additional code needed** -- the existing `safeDbOp` pattern handles this.

2. **In `getProdPallets()`** (AC 7.1.9):
   - Wrap the new date-keyed path in a try-catch:
     ```typescript
     try {
         const latestDate = await get<string>('prodPallets/latest');
         if (latestDate) {
             const compressed = await get<Uint8Array>('prodPallets/daily/' + latestDate);
             if (compressed) {
                 console.log('[DataStore] getProdPallets() returning snapshot for', latestDate);
                 return smartDecompress(compressed) as ProdPalletsData;
             }
         }
     } catch (err) {
         console.error('[DataStore] getProdPallets() failed to load date-keyed snapshot, falling back to legacy:', err);
     }
     ```
   - If the try-catch catches an error, execution falls through to the legacy flat-key path. This ensures the app does not crash if a snapshot is corrupted.

3. **In `migrateProdPalletsToDateKeyed()`** (AC 7.1.10):
   - Errors propagate up to `initProdPalletsStorage()` (AC 7.1.12), which catches them and logs a warning.
   - The app continues to work with old flat keys.

4. **In `enforceProdPalletsRetention()`** (AC 7.1.11):
   - If deleting an individual expired snapshot fails, it should NOT stop the retention process.
   - Wrap the deletion loop in individual try-catches:
     ```typescript
     for (const oldDate of datesToRemove) {
         try {
             await del('prodPallets/daily/' + oldDate);
             await del('prodPallets/metadata/' + oldDate);
         } catch (err) {
             console.error('[DataStore] Retention: failed to delete snapshot for', oldDate, err);
         }
     }
     ```

**File to modify:** `manufacturing-kpi-dashboard/src/stores/data-store.ts`
**Location:** Various methods as described above.

---

### AC 7.1.17: Update `clearAll()` to Clean Date-Keyed Data

- **Given** the `clearAll()` method on `DataStore` currently deletes all IndexedDB keys
- **When** the developer verifies it
- **Then** no changes are needed. The existing implementation already works correctly:
  ```typescript
  async clearAll(): Promise<void> {
      await safeDbOp('clearAll', async () => {
          const allKeys = await keys();
          await Promise.all(allKeys.map((key) => del(key)));
      });
  }
  ```
  This deletes ALL keys, including `prodPallets/daily/...`, `prodPallets/dates`, `prodPallets/latest`, and `prodPallets/metadata/...`. No changes needed.

**This is a verification AC.** The reviewer should confirm that `clearAll()` does not need any updates.

---

## Technical Implementation Plan

### Step-by-Step Implementation Order

The implementation MUST follow this exact order due to dependencies:

| Step | AC | File | What |
|------|-----|------|------|
| 1 | 7.1.1 | `src/types/prod-pallets.ts` | Add `ProdPalletsDateIndex` type |
| 2 | 7.1.2 | `src/stores/data-store.ts` | Add `extractUploadDate()` helper |
| 3 | 7.1.11 | `src/stores/data-store.ts` | Add `enforceProdPalletsRetention()` function |
| 4 | 7.1.10 | `src/stores/data-store.ts` | Add `migrateProdPalletsToDateKeyed()` function |
| 5 | 7.1.3 | `src/stores/data-store.ts` | Add `storeProdPalletsForDate()` method |
| 6 | 7.1.4 | `src/stores/data-store.ts` | Add `storeProdPalletsMetadataForDate()` method |
| 7 | 7.1.5 | `src/stores/data-store.ts` | Add `getProdPalletsForDate()` method |
| 8 | 7.1.6 | `src/stores/data-store.ts` | Add `getProdPalletsMetadataForDate()` method |
| 9 | 7.1.7 | `src/stores/data-store.ts` | Add `getProdPalletsDates()` method |
| 10 | 7.1.8 | `src/stores/data-store.ts` | Add `getLatestProdPalletsDate()` method |
| 11 | 7.1.12 | `src/stores/data-store.ts` | Add `initProdPalletsStorage()` method + `extractUploadDatePublic()` |
| 12 | 7.1.9 | `src/stores/data-store.ts` | Modify `getProdPallets()` for new + legacy |
| 13 | 7.1.14 | `src/stores/data-store.ts` | Deprecate old `storeProdPallets()` |
| 14 | 7.1.13 | `src/lib/parsers/data-loader.ts` | Modify `processProdPallets()` to use new storage |
| 15 | 7.1.15 | `src/stores/data-store.ts` | Verify all logging |
| 16 | 7.1.16 | `src/stores/data-store.ts` | Verify all error handling |
| 17 | 7.1.17 | `src/stores/data-store.ts` | Verify `clearAll()` still works |

### Why This Order

- Steps 2-4 add module-level helper functions that the DataStore methods depend on. They MUST come first.
- `enforceProdPalletsRetention` (step 3) is called by `storeProdPalletsForDate` (step 5), so it must exist first.
- `migrateProdPalletsToDateKeyed` (step 4) uses `extractUploadDate` (step 2) and `compressData`, so step 2 must come first.
- `initProdPalletsStorage` (step 11) calls `migrateProdPalletsToDateKeyed` (step 4).
- `getProdPallets()` modification (step 12) depends on the new methods being available.
- `data-loader.ts` modification (step 14) depends on `storeProdPalletsForDate`, `storeProdPalletsMetadataForDate`, and `extractUploadDatePublic` existing.

---

## Data Flow Diagram

### New Upload Flow (after implementation)
```
User uploads Prod Pallets .xlsx file
        │
        ▼
data-loader.ts: parseExcelFile()
        │
        ▼
data-loader.ts: processProdPallets()
        │
        ├─► parseProdPallets(workbook) → ProdPalletsData
        │
        ├─► DataStore.extractUploadDatePublic(data) → '2026-01-15'
        │
        ├─► DataStore.storeProdPalletsForDate('2026-01-15', data)
        │       │
        │       ├─► compressData(data) → Uint8Array
        │       ├─► set('prodPallets/daily/2026-01-15', compressed)
        │       ├─► set('prodPallets/latest', '2026-01-15')
        │       ├─► get('prodPallets/dates') → ['2026-01-13', '2026-01-14']
        │       ├─► set('prodPallets/dates', ['2026-01-13', '2026-01-14', '2026-01-15'])
        │       └─► enforceProdPalletsRetention()
        │               │
        │               ├─► get('prodPallets/dates')
        │               ├─► filter dates older than 365 days
        │               ├─► del('prodPallets/daily/<expired>')
        │               ├─► del('prodPallets/metadata/<expired>')
        │               └─► set('prodPallets/dates', <remaining>)
        │
        └─► DataStore.storeProdPalletsMetadataForDate('2026-01-15', metadata)
                └─► set('prodPallets/metadata/2026-01-15', metadata)
```

### Data Retrieval Flow (components call getProdPallets)
```
Component calls DataStore.getProdPallets()
        │
        ├─► Try new path:
        │       get('prodPallets/latest') → '2026-01-15'
        │       get('prodPallets/daily/2026-01-15') → Uint8Array
        │       smartDecompress(compressed) → ProdPalletsData
        │       Return data ✓
        │
        └─► If new path fails, fall back:
                get('prodPallets/production') → ProdRow[] (legacy flat key)
                ... read all 12 flat keys ...
                Return assembled ProdPalletsData ✓
```

### Migration Flow (on app startup)
```
App starts → DataStore.initProdPalletsStorage()
        │
        ▼
migrateProdPalletsToDateKeyed()
        │
        ├─► Check: get('prodPallets/production') exists?
        │       No  → return false (no legacy data)
        │       Yes → continue
        │
        ├─► Check: get('prodPallets/dates') exists with data?
        │       Yes → return false (already migrated)
        │       No  → continue
        │
        ├─► Reconstruct ProdPalletsData from 12 flat keys
        ├─► extractUploadDate(data) → '2026-01-14'
        ├─► compressData(data) → Uint8Array
        ├─► set('prodPallets/daily/2026-01-14', compressed)
        ├─► set('prodPallets/dates', ['2026-01-14'])
        ├─► set('prodPallets/latest', '2026-01-14')
        ├─► Migrate metadata if exists
        ├─► Delete all 14 old flat keys
        └─► return true
```

---

## New IndexedDB Key Structure

### After Migration / New Uploads
```
prodPallets/dates                    → string[] sorted ascending
                                       e.g., ['2026-01-13', '2026-01-14', '2026-01-15']

prodPallets/latest                   → string
                                       e.g., '2026-01-15'

prodPallets/daily/2026-01-13         → Uint8Array (compressed ProdPalletsData)
prodPallets/daily/2026-01-14         → Uint8Array (compressed ProdPalletsData)
prodPallets/daily/2026-01-15         → Uint8Array (compressed ProdPalletsData)

prodPallets/metadata/2026-01-13      → ProdPalletsMetadata object
prodPallets/metadata/2026-01-14      → ProdPalletsMetadata object
prodPallets/metadata/2026-01-15      → ProdPalletsMetadata object
```

### Old Keys (deleted after migration)
```
prodPallets/production               ← DELETED
prodPallets/shiftReportData          ← DELETED
prodPallets/planSummary              ← DELETED
prodPallets/productMaster            ← DELETED
prodPallets/schedule                 ← DELETED
prodPallets/totals                   ← DELETED
prodPallets/variances                ← DELETED
prodPallets/prodEfficiency           ← DELETED
prodPallets/summaryEfficiency        ← DELETED
prodPallets/detail                   ← DELETED
prodPallets/review                   ← DELETED
prodPallets/yields                   ← DELETED
prodPallets/lastModified             ← DELETED
prodPallets/metadata                 ← DELETED
```

---

## Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `src/types/prod-pallets.ts` | ADD | Add `ProdPalletsDateIndex` interface |
| `src/stores/data-store.ts` | ADD + MODIFY | Add `extractUploadDate()`, `migrateProdPalletsToDateKeyed()`, `enforceProdPalletsRetention()` module-level functions. Add `initProdPalletsStorage()`, `storeProdPalletsForDate()`, `storeProdPalletsMetadataForDate()`, `getProdPalletsForDate()`, `getProdPalletsMetadataForDate()`, `getProdPalletsDates()`, `getLatestProdPalletsDate()`, `extractUploadDatePublic()` methods to DataStore. Modify `getProdPallets()`. Deprecate `storeProdPallets()`. |
| `src/lib/parsers/data-loader.ts` | MODIFY | Update `processProdPallets()` to call `storeProdPalletsForDate()` and `storeProdPalletsMetadataForDate()` instead of `storeProdPallets()` and `storeProdPalletsMetadata()`. |

---

## Dependencies

### Internal Dependencies
- `idb-keyval` (already installed) — `set`, `get`, `del`, `keys` functions
- `@/lib/compression` (already exists) — `compressData`, `decompressData`, `smartDecompress` functions
- `@/types/prod-pallets` (already exists) — `ProdPalletsData`, `ProdPalletsMetadata`, `ProdRow`, and all other row types

### No New External Dependencies
This story does not require any new npm packages. All functionality is built using existing `idb-keyval` and `pako` (via `@/lib/compression`).

---

## Testing / Verification

### Manual Verification Steps

**Test 1: Fresh install (no existing data)**
1. Clear all IndexedDB data (browser DevTools > Application > IndexedDB > keyval-store > delete database).
2. Start the app.
3. Call `DataStore.initProdPalletsStorage()` from the browser console.
4. Verify console output: `[DataStore] No legacy Prod Pallets data found, skipping migration`.
5. Upload a Prod Pallets file.
6. Verify console output includes: `[DataStore] Extracted upload date: YYYY-MM-DD` and `[DataStore] Stored Prod Pallets snapshot for YYYY-MM-DD`.
7. Check IndexedDB keys in DevTools: should see `prodPallets/dates`, `prodPallets/latest`, `prodPallets/daily/YYYY-MM-DD`, `prodPallets/metadata/YYYY-MM-DD`.
8. Verify no old flat keys exist (`prodPallets/production`, etc.).

**Test 2: Migration from old data**
1. Load the app with OLD code (before this story) and upload a Prod Pallets file. This stores data under the old flat keys.
2. Deploy the NEW code (this story) and refresh the app.
3. Call `DataStore.initProdPalletsStorage()`.
4. Verify console output includes: `[DataStore] Migrating legacy Prod Pallets to date-keyed storage...` and `[DataStore] Migration complete`.
5. Check IndexedDB: old flat keys should be deleted; new date-keyed keys should exist.
6. Call `DataStore.getProdPallets()` from console. Verify it returns the same data as before migration.

**Test 3: Multiple uploads (different dates)**
1. Upload Prod Pallets file for day 1.
2. Upload Prod Pallets file for day 2.
3. Call `DataStore.getProdPalletsDates()` from console. Should return `['YYYY-MM-DD-1', 'YYYY-MM-DD-2']`.
4. Call `DataStore.getProdPallets()`. Should return day 2's data (latest).
5. Call `DataStore.getProdPalletsForDate('YYYY-MM-DD-1')`. Should return day 1's data.

**Test 4: Same date re-upload**
1. Upload a Prod Pallets file.
2. Upload the same file again (same date).
3. `getProdPalletsDates()` should return only one date (no duplicates).
4. The data should be the latest upload (overwritten).

**Test 5: Backward compatibility**
1. After migration, verify that ALL existing dashboard pages still work:
   - Overview Dashboard
   - Yield by Line
   - Yield by SKU
   - Giveaway Analysis
   - Line Leader Performance
   - Production (if it exists)
2. All these pages call `DataStore.getProdPallets()` which should return the latest snapshot transparently.

**Test 6: Error resilience**
1. Manually corrupt a `prodPallets/daily/YYYY-MM-DD` key in IndexedDB (set it to a random string).
2. Call `DataStore.getProdPallets()`. It should log an error and fall back to legacy flat keys (if they still exist) or return undefined.
3. The app should NOT crash.

### Console Commands for Verification
```javascript
// Check stored dates
await DataStore.getProdPalletsDates();

// Check latest date
await DataStore.getLatestProdPalletsDate();

// Get specific date's data
await DataStore.getProdPalletsForDate('2026-01-15');

// Get latest (backward-compatible)
await DataStore.getProdPallets();

// Check all IndexedDB keys
await DataStore.getAllKeys();

// Storage summary
await DataStore.getStorageSummary();
```

---

## Definition of Done
- [ ] `ProdPalletsDateIndex` type added to `src/types/prod-pallets.ts`
- [ ] `extractUploadDate()` function added to `data-store.ts` and correctly extracts the most common date from production rows
- [ ] `enforceProdPalletsRetention()` function added and removes snapshots older than 365 days
- [ ] `migrateProdPalletsToDateKeyed()` function added and correctly migrates old flat keys to date-keyed storage
- [ ] `storeProdPalletsForDate()` method stores compressed snapshot at `prodPallets/daily/{date}` and updates `prodPallets/dates` and `prodPallets/latest`
- [ ] `storeProdPalletsMetadataForDate()` method stores metadata at `prodPallets/metadata/{date}`
- [ ] `getProdPalletsForDate()` method retrieves and decompresses a specific date's snapshot
- [ ] `getProdPalletsMetadataForDate()` method retrieves a specific date's metadata
- [ ] `getProdPalletsDates()` method returns sorted ascending date list
- [ ] `getLatestProdPalletsDate()` method returns the most recent date string
- [ ] `initProdPalletsStorage()` method calls migration with proper error handling
- [ ] `extractUploadDatePublic()` wrapper method added to DataStore
- [ ] `getProdPallets()` modified to try new date-keyed path first, then fall back to legacy flat keys
- [ ] `storeProdPallets()` deprecated with JSDoc `@deprecated` tag and console warning
- [ ] `data-loader.ts` `processProdPallets()` updated to call `storeProdPalletsForDate()` and `storeProdPalletsMetadataForDate()`
- [ ] All new functions include `console.log` statements with `[DataStore]` prefix
- [ ] Error handling: corrupted snapshots fall back gracefully; retention deletion failures do not crash the app
- [ ] `clearAll()` confirmed to still delete all keys including new date-keyed ones
- [ ] All existing dashboard pages continue to work without modification (backward compatibility)
- [ ] No new npm dependencies introduced
