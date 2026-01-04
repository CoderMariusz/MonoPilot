# P1: UX Design - Print Label Modal
**Story**: 05.14 - LP Label Printing (ZPL)
**Agent**: UX-DESIGNER (Claude)
**Phase**: 1/7

---

## 🎨 Print Label Modal Design

### User Flow
```
LP Detail Page → Click "Print Label" → Modal Opens
  ↓
Configure print options:
  - Label size (4x6", 4x3", 3x2")
  - Number of copies (1-100)
  - Include QR code (Yes/No)
  ↓
Preview label → Click "Print" → ZPL generated → Download/Send to printer
```

### Modal Layout (Desktop)

```
+-------------------------------------------------------+
| Print Label - LP20251201-000123                       |
+-------------------------------------------------------+
| Product: Flour Type 00 | Batch: BCH-456               |
| Quantity: 500.0 kg     | Expiry: 2025-06-15           |
+-------------------------------------------------------+
|                                                       |
| Label Size:     ( ) 4x6"  (•) 4x3"  ( ) 3x2"        |
|                                                       |
| Copies:         [  3  ]  (1-100)                      |
|                                                       |
| Options:        [✓] Include QR Code                   |
|                 [✓] Include Barcode (LP Number)       |
|                                                       |
| Preview:                                              |
| +-------------------+                                 |
| | [QR]  FLOUR TYPE  |  ← Mock label preview          |
| |       BCH-456     |                                 |
| | |||||| 500.0 kg   |                                 |
| +-------------------+                                 |
|                                                       |
|              [Cancel]  [Download ZPL]  [Print]        |
+-------------------------------------------------------+
```

### Component Structure

```tsx
<PrintLabelModal>
  <LabelConfigForm>
    - LabelSizeSelector
    - CopiesInput
    - OptionsCheckboxes
  </LabelConfigForm>

  <LabelPreview>
    - SVG mock of label
    - Updates in real-time
  </LabelPreview>

  <ActionButtons>
    - Cancel
    - Download ZPL (fallback)
    - Print (primary action)
  </ActionButtons>
</PrintLabelModal>
```

### Key UX Decisions

1. **Default label size: 4x3"** (most common for LP labels)
2. **Default copies: 1** (user can increase)
3. **QR code always enabled** (critical for scanning)
4. **Preview updates on config change** (immediate feedback)
5. **Download ZPL option** (for manual printing without printer configured)

### States

- **Loading**: Generating ZPL template
- **Preview**: Show mock label with current config
- **Printing**: Sending to printer
- **Success**: "Label printed successfully"
- **Error**: Show error message with retry option

### Validation

- Copies: min 1, max 100
- Label size: required selection
- LP must exist and be accessible

---

## ✅ Deliverables

- Modal wireframe specification
- Component hierarchy
- User flow diagram
- State management plan
- Validation rules

**Status**: ✓ UX Design Complete
