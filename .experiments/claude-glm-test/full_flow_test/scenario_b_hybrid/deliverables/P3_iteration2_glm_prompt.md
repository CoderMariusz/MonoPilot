# Task: Fix Critical Bugs in LabelPrintService (Iteration 2)

## Code Review Findings

Your previous implementation passed all tests BUT code review found **3 critical bugs** that will cause print failures:

### ❌ BUG 1: QR Code Position Hardcoded
```typescript
return `^FO600,50  // ← Always x=600 regardless of label size!
```

**Problem**:
- 4x3" label width = 812 dots → QR at x=600 might overflow
- 3x2" label width = 609 dots → QR at x=600 is OUTSIDE label!

**Fix**: Use dynamic positioning based on label size

### ❌ BUG 2: Barcode Position Hardcoded
```typescript
return `^FO50,500  // ← Always y=500!
```

**Problem**:
- 4x6" length = 1218 dots → OK
- 4x3" length = 609 dots → Barcode at y=500 OVERFLOWS!
- 3x2" length = 406 dots → Barcode at y=500 is WAY OUTSIDE!

**Fix**: Position barcode based on label dimensions

### ⚠️ BUG 3: Product Name in QR
You truncate product name in QR code, but QR can handle full name. Keep truncation only for display text.

---

## Required Changes

### 1. Add Label Size-Aware Positioning

```typescript
private static readonly QR_POSITIONS = {
  '4x6': { x: 600, y: 50 },
  '4x3': { x: 550, y: 50 },  // Moved left for smaller width
  '3x2': { x: 400, y: 50 },  // Much smaller position
};

private static readonly BARCODE_POSITIONS = {
  '4x6': { x: 50, y: 900 },   // Safe position for 6" length
  '4x3': { x: 50, y: 450 },   // Adjusted for 3" length
  '3x2': { x: 50, y: 280 },   // Adjusted for 2" length
};
```

### 2. Update generateQRCode to Accept Label Size
```typescript
private static generateQRCode(qrData: string | null, size: LabelSize): string {
  if (!qrData) return '';

  const pos = this.QR_POSITIONS[size];
  return `^FO${pos.x},${pos.y}
^BQN,2,6
^FD${qrData}^FS`;
}
```

### 3. Update generateBarcode Similarly
```typescript
private static generateBarcode(lpNumber: string, size: LabelSize): string {
  const pos = this.BARCODE_POSITIONS[size];
  return `^FO${pos.x},${pos.y}
^BCN,100,Y,N,N
^FD${lpNumber}^FS`;
}
```

### 4. Pass Label Size Through Method Chain
```typescript
static generateZPL(lp: LicensePlate, options: PrintLabelOptions): string {
  // ...
  return `^XA
${this.generateQRCode(qrData, options.size)}  // ← Pass size!
${this.generateBarcode(lp.lp_number, options.size)}  // ← Pass size!
${this.generateTextFields(lp)}
^XZ`;
}
```

### 5. Keep Full Product Name in QR
```typescript
private static generateQRData(lp: LicensePlate): string {
  return JSON.stringify({
    // ...
    product_name: lp.product.name,  // ← Full name, no truncation
    // ...
  });
}
```

---

## Success Criteria

1. ✅ All 25 tests still pass
2. ✅ QR code positioned within label bounds for ALL sizes
3. ✅ Barcode positioned within label bounds for ALL sizes
4. ✅ Full product name in QR code JSON
5. ✅ Product name truncated to 40 chars ONLY in display text

---

## Output

Provide the COMPLETE fixed `LabelPrintService` class with all bugs resolved.
