# Scanner Module - UX Design Specification

**Date:** 2025-11-15
**Designer:** Mary (Business Analyst / UX Designer)
**Status:** Phase 1 - Wireframes & Component Library
**Priority:** P0 (Foundation for all operator workflows)

---

## Executive Summary

Scanner Module is the **most critical UX** for MonoPilot success. Operators will use it **50-100 times per day** in challenging environments (rękawice, cold storage, słaby Wi-Fi, outdoor lighting). This specification defines a **hybrid approach** starting with **Variant B (Single-Screen Scanner)** as MVP, with **Variant D (Bulk Mode)** as advanced toggle.

**Key Metrics:**
- **Current Speed:** 4-5 items/min (Card Wizard)
- **Target Speed:** 8-10 items/min (Variant B), 12-15 items/min (Variant D)
- **Tap Target Minimum:** 56px (gloves-friendly)
- **Contrast Ratio:** WCAG AAA (7:1) for outdoor visibility
- **Offline-First:** 100% functionality without internet

---

## 1. Project & Users Context

### Target Users (Scanner Focus)

**Primary Persona: Warehouse Operator (Mobile-First)**
- **Age:** 30-40, warehouse worker
- **Platform:** Mobile PWA (BYOD - own smartphone/tablet)
- **Use Cases:** ASN receiving, LP creation, pallet management, stock moves
- **Needs:** Offline mode, large buttons (gloves), fast scanning
- **Pain Points:** Clunky Zebra scanners ($2K each, Windows CE UX)
- **Daily Transactions:** 50-100 scans per shift

**Secondary Persona: Production Operator (Mobile Scanner)**
- **Age:** 25-35, line operator
- **Platform:** Mobile PWA (tablet on production line)
- **Use Cases:** Material consumption, output registration, QA status
- **Needs:** Real-time tracking, <200ms response, minimal data entry
- **Pain Points:** Paper-based tracking, manual errors, no visibility
- **Daily Transactions:** 30-50 scans per shift

### Operator Environments - Requirements Matrix

| Environment | Constraints | UX Requirements |
|-------------|-------------|-----------------|
| **Warehouse (Cold Storage)** | Rękawice, -5°C to +5°C, słaby Wi-Fi | • Tap targets ≥56px (gloves)<br>• Offline-first design<br>• High contrast (visibility)<br>• Minimal text input |
| **Production Floor** | Hałas, rękawice, szybkie tempo | • Visual feedback (nie audio)<br>• <3 taps per action<br>• Large scan button<br>• Error prevention |
| **Outdoor/Loading Dock** | Bright sunlight, varying light | • Dark mode + Light mode<br>• High contrast text (WCAG AAA 7:1)<br>• Anti-glare optimized |
| **Mobile Devices** | Small screens (4.7"-6.5"), varying quality | • Responsive 320px-768px<br>• Single-hand friendly<br>• Bottom navigation (thumb zone) |

---

## 2. Current State Analysis

### Existing Implementation (Code Review)

**Scanner Hub:** `/scanner/page.tsx` - 4 workflows
1. **Receive** (`/scanner/receive`) - ASN receiving, GRN creation, LP creation
2. **Process** (`/scanner/process`) - WO execution, material consumption, staging
3. **Pack** (`/scanner/pack`) - Finish goods creation
4. **Pallet** (`/scanner/pallet`) - Pallet management, shipping

**Current Pattern:** 3-step wizard (Select → Scan → Confirm)

**✅ What Works Well:**
- Auto-focus on scanner input after each action
- Progress indicators (step 1/3, 2/3, etc.)
- Toast notifications for feedback
- Prefill from ASN (batch, expiry) - reduces typing
- Responsive layout (grid-cols-1 sm:grid-cols-2)

**⚠️ UX Problems for Operators:**

| Problem | Impact | Evidence (Code) | Priority |
|---------|--------|----------------|----------|
| **Small tap targets** | Rękawice - trudne kliknięcie | Standard buttons, brak 56px minimum | 🔴 P0 |
| **Zbyt dużo text input** | Powolne wpisywanie na mobile | LP number, qty, batch, expiry - 4 fields per item | 🔴 P0 |
| **Nested modals** | Gubienie się w UI | ManualConsumeModal, QAOverrideModal, StageBoard - 3 layers | 🟡 P1 |
| **Brak offline indicator** | Nie wiadomo czy działa bez Wi-Fi | PWA capable ale brak UI feedback | 🟡 P1 |
| **Complex Process flow** | 10+ state variables | selectedLine, selectedWOId, stagedLPs, currentScannedLP | 🟡 P1 |
| **Outdoor lighting** | Trudny odczyt ekranu | Brak high-contrast mode, no dark mode toggle | 🟢 P2 |

### Current User Journey: Receive ASN (Before)

```
Steps: 10 total
1. Tap "Receive" card (from Scanner hub)
2. Wait for ASN list to load
3. Scroll to find ASN-12345
4. Tap ASN-12345 row
5. Wait for ASN details to load (step 2/3)
6. Read first item: "Chicken Breast - 100kg"
7. Type LP number: "LP-20251115-001" (19 characters!)
8. Type received qty: "95" (variance from expected 100)
9. Type batch: "BATCH-2025-320"
10. Type expiry: "2025-12-31" (or use date picker - 3 taps)
11. Tap "Next Item" button
12. Repeat steps 6-11 for items 2, 3, 4, 5
13. Tap "Confirm" (step 3/3)
14. Wait for GRN creation
15. Success toast: "GRN-12345 created"

Total Time: ~10-15 seconds per item × 5 items = 50-75 seconds
Total Taps: ~40-50
Total Typing: ~100 characters
```

**Pain Points:**
- **Too much typing** - 19 chars for LP, 14 for batch, 10 for expiry = 43 chars per item
- **Small targets** - ASN rows ~40px height, buttons ~36px
- **Slow feedback** - 2 loading states (ASN list, ASN details)
- **No bulk actions** - can't scan all 5 items then bulk-apply batch/expiry

---

## 3. Design Variants - 4 Approaches

### Variant A: "Card-Based Wizard" (Current Enhanced)

**Concept:** Evolution of current 3-step wizard with mobile-first optimizations.

**Key Features:**
- Large card-based steps (80px+ height)
- Bottom navigation (thumb-friendly, 60px height)
- Inline camera scanning (no external app)
- High-contrast color scheme (WCAG AAA)
- 56px tap targets minimum
- Progress bar always visible

**Wireframe (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ← Progress: 40% (Step 2/3)
│  Receive ASN: ASN-12345             │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📦 Item 2 of 5             │   │
│  │                             │   │ ← Large card
│  │  Chicken Breast             │   │   100px height
│  │  Expected: 100 kg           │   │
│  │                             │   │
│  │  Received: ___              │   │ ← Input 56px height
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    📷  Scan Barcode         │   │ ← 60px height
│  │                             │   │   High contrast
│  └─────────────────────────────┘   │
│                                     │
│  OR Enter Manually:                 │
│                                     │
│  ┌───┬───┬───┬───┬───┐             │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │             │ ← Numeric keypad
│  ├───┼───┼───┼───┼───┤             │   48px per button
│  │ 6 │ 7 │ 8 │ 9 │ 0 │             │
│  ├───┼───┼───┼───┼───┤             │
│  │ ← │ . │ ✓ │   │   │             │
│  └───┴───┴───┴───┴───┘             │
│                                     │
├─────────────────────────────────────┤
│  [  ← Back  ]    [ Next Item →  ]  │ ← Bottom nav
│                                     │   60px height
└─────────────────────────────────────┘   Thumb zone
```

**Metrics:**
- **Speed:** 4-5 items/min (20% faster than current)
- **Taps:** ~25-30 per workflow (40% reduction)
- **Learning Curve:** ⭐⭐⭐⭐ Easy (familiar pattern)
- **Error Prevention:** ⭐⭐⭐ Good (validation per step)

**Pros:**
- Low risk - evolution, not revolution
- Easy to implement (adjust existing code)
- Familiar to current users
- Works offline (no camera dependency)

**Cons:**
- Still 3 steps (not fastest possible)
- Requires scrolling on small screens
- Not optimized for continuous scanning

**Use Cases:**
- Mixed operator skill levels
- Offline-first environments (weak Wi-Fi)
- Fallback when camera not available

---

### Variant B: "Single-Screen Scanner" (RECOMMENDED DEFAULT) 🏆

**Concept:** All-in-one scanner interface - scan, confirm, next. Zero navigation between steps.

**Key Features:**
- Camera viewfinder always visible (top 40% of screen)
- Scanned items list with status (middle 40%)
- Action buttons in thumb zone (bottom 20%)
- Haptic feedback on successful scan
- Auto-advance after scan (no "Next" button needed)
- Swipe-to-remove scanned items (error correction)
- Offline queue (scans saved locally, sync on reconnect)

**Wireframe (Mobile 375px):**
```
┌─────────────────────────────────────┐
│ ASN-12345  [⚙️]  [📶 Offline]       │ ← Header: ASN, settings, status
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │      📷 Camera Viewfinder       │ │ ← 40% screen
│ │                                 │ │   Always-on camera
│ │   [Point at barcode to scan]   │ │   Overlay guide
│ │                                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│  ✅ Scanned Items (3 of 5):         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✓ Chicken - 100kg           │×  │ ← 60px height
│  │   LP-001 • Batch: AUTO-123  │   │   Swipe to remove
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ✓ Beef - 50kg               │×  │
│  │   LP-002 • Batch: AUTO-124  │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ✓ Pork - 75kg               │×  │
│  │   LP-003 • Batch: AUTO-125  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Remaining: Lamb (25kg), Fish (30kg)│ ← What's left
│                                     │
├─────────────────────────────────────┤
│  [   🔄 Retry Last   ] [ ✓ Finish ] │ ← 60px height
│                                     │   Thumb zone
└─────────────────────────────────────┘
```

**Interaction Flow:**
```
1. Operator opens Receive screen
   → Camera viewfinder auto-starts

2. Operator points camera at ASN barcode
   → Haptic buzz, ASN loaded, items list appears

3. Operator points camera at product barcode (item 1: Chicken)
   → Auto-match to expected item
   → Haptic buzz, "Chicken - 100kg" added to list
   → Auto-generate LP number: LP-20251115-001
   → Auto-fill batch from ASN (if present) or AI prediction

4. If quantity differs from expected:
   → Quick popup: "Expected 100kg, scanned shows 95kg. Confirm?" [Yes] [No]
   → Tap "Yes" → item confirmed

5. Repeat step 3-4 for items 2, 3, 4, 5
   → No navigation, just continuous scanning

6. When all 5 items scanned:
   → "Finish" button highlights (green pulse animation)
   → Tap "Finish"
   → GRN created in background
   → Toast: "GRN-12345 created with 5 LPs"
   → Auto-return to Scanner hub

Total Time: ~2-3 seconds per item × 5 items = 10-15 seconds (5x faster!)
Total Taps: ~2 (Finish + maybe 1 confirmation) (20x fewer!)
Total Typing: 0 characters (100% reduction!)
```

**Metrics:**
- **Speed:** 8-10 items/min (100% faster than current)
- **Taps:** ~2-5 per workflow (90% reduction)
- **Learning Curve:** ⭐⭐⭐ Medium (new pattern, but intuitive)
- **Error Prevention:** ⭐⭐ Fair (fast = higher risk, but swipe-to-undo helps)

**Pros:**
- **Fastest workflow** for 90% of cases
- **Zero navigation** - single screen
- **Camera-first** - matches operator mental model
- **<2 seconds per item** (vs 10-15s current)
- **Haptic feedback** - works in noisy environments
- **Offline queue** - scans saved locally

**Cons:**
- Requires camera permissions (PWA)
- Limited space for detailed info (scrollable list)
- Harder to handle complex exceptions (missing batch, wrong qty)
- New UX pattern - requires brief training (1-2 minutes)

**Use Cases:**
- High-volume receiving (10+ items per ASN)
- Experienced operators (after 1-week onboarding)
- Good lighting environments
- Standard workflows (few exceptions)

**Error Handling:**
- **Wrong item scanned:** Red flash + haptic vibrate + toast "Item not in ASN"
- **Duplicate scan:** Yellow flash + toast "Item already scanned"
- **Low confidence barcode:** Popup "Could not read barcode, please try again or enter manually"
- **Camera permission denied:** Auto-fallback to Variant A (Card Wizard) with manual entry

---

### Variant C: "Guided Conversation" (Error Prevention)

**Concept:** Step-by-step prompts like a conversation. One question at a time. AI-guided flow.

**Key Features:**
- One question per screen (full focus)
- XXL inputs (80px+ height)
- Voice input support (hands-free)
- Smart prefill (AI predicts batch from history)
- Progressive disclosure (only ask what's needed)
- Undo last step (easy error correction)
- Celebration animations (gamification)

**Wireframe (Mobile 375px):**
```
┌─────────────────────────────────────┐
│  Step 2 of 4  ━━━━━━━━░░░░░░░░░░   │ ← Progress: 50%
├─────────────────────────────────────┤
│                                     │
│                                     │
│  What's the received                │ ← Large, clear
│  quantity for Chicken?              │   question
│                                     │   40px font
│  Expected: 100 kg                   │
│  (Supplier: ABC Meats)              │ ← Context
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │         95                  │   │ ← XXL input
│  │                             │   │   80px height
│  └─────────────────────────────┘   │   60px font
│                                     │
│  ┌───┬───┬───┬───┬───┐             │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │             │
│  ├───┼───┼───┼───┼───┤             │ ← Numeric pad
│  │ 6 │ 7 │ 8 │ 9 │ 0 │             │   56px buttons
│  ├───┼───┼───┼───┼───┤             │
│  │🎤 │ ← │ . │ ✓ │   │             │ ← Voice, Delete, OK
│  └───┴───┴───┴───┴───┘             │   (56px each)
│                                     │
│  💡 Tip: Say "ninety-five kilos"   │ ← Contextual help
│                                     │
├─────────────────────────────────────┤
│  [ ← Previous ]       [ Next → ]   │
└─────────────────────────────────────┘
```

**Interaction Flow:**
```
1. Screen 1: "Which ASN are you receiving?"
   → Operator taps ASN-12345 from list (or scans barcode)

2. Screen 2: "Scan the first item's barcode"
   → Camera opens, operator scans Chicken barcode
   → Auto-match to ASN item 1

3. Screen 3: "What's the received quantity for Chicken?"
   → Expected: 100 kg shown for reference
   → Operator types "95" or says "ninety-five kilos" 🎤
   → AI detects variance, asks: "95kg received vs 100kg expected. Reason?"
     → Quick options: [Short shipment] [Damaged] [Other]

4. Screen 4: "What's the batch number?"
   → AI prefills: "BATCH-2025-320" (predicted from history + supplier pattern)
   → Operator confirms or edits

5. Screen 5: "What's the expiry date?"
   → AI prefills: "2025-12-31" (predicted: today + 45 days avg shelf life)
   → Date picker or voice: "December thirty-first"

6. Screen 6: "✅ Item 1 confirmed! Chicken - 95kg"
   → Celebration animation (confetti burst)
   → Auto-advance to item 2 after 1 second

7. Repeat 2-6 for items 2, 3, 4, 5

8. Screen Final: "All items received! 🎉"
   → Summary: 5 items, 1 variance (short shipment)
   → Tap "Create GRN" → Done

Total Time: ~5-6 seconds per item × 5 items = 25-30 seconds
Total Taps: ~10-15 (1-2 per question × 4 questions × 5 items, but AI prefills help)
Total Typing: ~5-10 characters (only corrections, AI prefills rest)
```

**Metrics:**
- **Speed:** 3-4 items/min (slower than current, but higher quality)
- **Taps:** ~10-15 per workflow
- **Learning Curve:** ⭐⭐⭐⭐⭐ Easiest (hand-holding)
- **Error Prevention:** ⭐⭐⭐⭐⭐ Excellent (impossible to skip fields)

**Pros:**
- **Zero mistakes** - impossible to skip required fields
- **Voice input** - hands-free in some environments
- **AI predictions** - 80% of fields auto-filled correctly
- **Great onboarding** - new operators productive day 1
- **Contextual help** - tips for each step

**Cons:**
- **Slower for experts** (too much hand-holding)
- **More screens** (feels longer, even if safer)
- **Voice needs internet** (offline mode = typing only)
- **AI predictions wrong** 20% of time (must review)

**Use Cases:**
- Onboarding new operators (first 2 weeks)
- Error-sensitive workflows (pharmaceutical, high-value products)
- Voice-friendly environments (quiet warehouse)
- Complex receiving (many custom fields)

---

### Variant D: "Bulk Mode" (Pro Scanner - Advanced) ⚡

**Concept:** Rapid batch scanning for expert operators. Keyboard shortcuts, bulk actions, desktop-optimized.

**Key Features:**
- Scan 5-10 items continuously, then bulk edit
- Keyboard shortcuts (Enter = Next, Ctrl+Z = Undo, Esc = Cancel)
- Batch apply (same batch/expiry for all items)
- Expert mode toggle (show/hide advanced options)
- Desktop + Mobile optimized (responsive)
- Compact list view (more items visible)
- Inline editing (double-tap to edit any field)

**Wireframe (Desktop 1024px):**
```
┌─────────────────────────────────────────────────────────────────────┐
│  Scanner: Receive ASN-12345 (5 items)                    [⚙️ Expert] │ ← Toggle modes
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LP Scan: [________________________]  [Enter to add]                │ ← Auto-focus
│                                                                     │   Keyboard shortcut
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Scanned LPs (3 of 5):                                         │ │
│  │                                                               │ │
│  │ LP Number       Product          Qty    Batch        Expiry  │ │ ← Table header
│  │ ────────────────────────────────────────────────────────────  │ │
│  │ LP-001          Chicken Breast   100kg  AUTO-123     12/31   │✓│ ← Compact rows
│  │ LP-002          Beef Chuck       50kg   AUTO-124     12/31   │✓│   40px height
│  │ LP-003          Pork Loin        75kg   AUTO-125     12/31   │✓│   Double-tap edit
│  │                                                               │ │
│  │ [🎯 Auto-fill remaining 2 items from ASN]                     │ │ ← Bulk action
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Batch Apply (All Items):                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ Batch: AUTO-123  ▼  │  │ Expiry: 2025-12-31  │                │ ← Batch apply
│  └──────────────────────┘  └──────────────────────┘                │   Same for all
│  [Apply to all uncompleted items]                                  │
│                                                                     │
│  Keyboard Shortcuts:                                               │
│  • Enter = Next field  • Ctrl+Z = Undo  • Ctrl+S = Save  • Esc = Cancel │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  [Ctrl+Z Undo]  [Esc Cancel]  [Enter to Finish & Create GRN]       │
└─────────────────────────────────────────────────────────────────────┘
```

**Wireframe (Mobile 375px - Bulk Mode Compact):**
```
┌─────────────────────────────────────┐
│  ASN-12345  [⚙️ Expert]             │
├─────────────────────────────────────┤
│  LP: [__________]  [+ Add]          │ ← Compact input
├─────────────────────────────────────┤
│  Scanned (3/5):                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ LP-001 | 100kg | AUTO-123 ✓│   │ ← Compact 48px
│  └─────────────────────────────┘   │   Tap to edit
│  ┌─────────────────────────────┐   │
│  │ LP-002 | 50kg  | AUTO-124 ✓│   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ LP-003 | 75kg  | AUTO-125 ✓│   │
│  └─────────────────────────────┘   │
│                                     │
│  Batch: [AUTO-123  ▼]              │ ← Batch apply
│  Expiry: [2025-12-31]               │
│  [Apply to remaining 2]             │
│                                     │
├─────────────────────────────────────┤
│  [Undo]  [Cancel]  [✓ Finish]      │
└─────────────────────────────────────┘
```

**Interaction Flow:**
```
1. Expert operator opens Receive (Desktop with keyboard)
   → Bulk Mode auto-enabled (remembers preference)
   → LP input auto-focused

2. Operator scans LP-001 barcode (via USB barcode scanner or camera)
   → Auto-match to ASN item 1 (Chicken)
   → Row added to table
   → Auto-focus returns to LP input (ready for next scan)

3. Operator scans LP-002, LP-003, LP-004, LP-005 rapidly
   → Each scan = new row in table (< 1 second per scan)
   → No confirmations, no popups (trust expert)

4. After 5 scans, operator reviews table:
   → All items present? ✓
   → All batches correct? LP-004 has wrong batch "BATCH-OLD"
   → Double-tap LP-004 batch cell → edit inline → type "AUTO-126" → Enter

5. Operator sets batch apply:
   → Types "AUTO-123" in Batch Apply field
   → Types "2025-12-31" in Expiry Apply field
   → Clicks "Apply to all uncompleted items"
   → All 5 items now have consistent batch/expiry

6. Operator presses Enter (keyboard shortcut)
   → GRN created
   → Toast: "GRN-12345 created with 5 LPs in 8 seconds"
   → Return to Scanner hub

Total Time: ~1 second per scan × 5 scans + 3 seconds bulk edit = 8 seconds (9x faster!)
Total Taps: ~3-4 (Add items + Batch apply + Finish)
Total Keyboard Actions: ~10 (scans + Enter shortcuts)
```

**Metrics:**
- **Speed:** 12-15 items/min (200% faster than current, 50% faster than Variant B)
- **Taps:** ~3-5 per workflow (minimal)
- **Learning Curve:** ⭐⭐ Hard (requires training)
- **Error Prevention:** ⭐ Poor (no guardrails, fast = risky)

**Pros:**
- **Fastest possible** for expert operators (12-15 items/min)
- **Bulk actions** save massive time
- **Keyboard shortcuts** (desktop scanner stations)
- **Flexible** - works for simple + complex cases
- **Inline editing** - fix mistakes without modal hell

**Cons:**
- **Steeper learning curve** (not beginner-friendly)
- **Easy to make bulk mistakes** (no validation until final step)
- **Requires training** (1-2 hours onboarding)
- **Desktop-biased** (mobile version is compact but harder)

**Use Cases:**
- Expert operators (>3 months experience)
- Desktop scanner stations (dedicated workstations with USB scanners)
- High-volume receiving (20+ items per ASN)
- Time-sensitive workflows (end-of-shift rush)

**Safety Features:**
- **Undo stack** - Ctrl+Z undoes last 10 actions
- **Auto-save** - Progress saved every 5 seconds (offline resilient)
- **Final review screen** - Shows summary before GRN creation
- **Audit trail** - Every action logged (who, what, when)

---

## 4. Comparison Matrix

| Criterion | Variant A:<br>Card Wizard | Variant B:<br>Single-Screen 🏆 | Variant C:<br>Guided | Variant D:<br>Bulk Mode ⚡ |
|-----------|--------------------------|-------------------------------|---------------------|---------------------------|
| **Speed (items/min)** | 4-5 | **8-10** | 3-4 | **12-15** |
| **Learning Curve** | ⭐⭐⭐⭐ Easy | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ Easiest | ⭐⭐ Hard |
| **Error Prevention** | ⭐⭐⭐ Good | ⭐⭐ Fair | ⭐⭐⭐⭐⭐ Excellent | ⭐ Poor |
| **Gloves-Friendly** | ⭐⭐⭐⭐ Very | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good |
| **Offline-Capable** | ✅ Yes | ✅ Yes | ⚠️ Partial (voice needs internet) | ✅ Yes |
| **Mobile-First** | ✅ Yes | ✅✅ Highly | ✅ Yes | ⚠️ Desktop-biased |
| **Tap Target Size** | 56px | 56-60px | 56-80px | 40-48px (compact) |
| **Text Input Required** | Medium (2-3 fields) | Low (0-1 field) | Medium (1-2 fields) | Low (bulk apply) |
| **Implementation Effort** | ⭐⭐⭐⭐ Easy (evolution) | ⭐⭐⭐ Medium | ⭐⭐ Hard (AI logic) | ⭐⭐⭐ Medium |
| **Best For** | Fallback, offline-first | **Default (80% of users)** | Onboarding, compliance | **Expert toggle (20%)** |

---

## 5. Recommendation: HYBRID APPROACH 🎯

**Strategy:** Combine multiple variants with intelligent routing.

### Phase 1: MVP (Week 1-2) - Variant B as Default

**Implementation:**
- **Default Mode:** Variant B (Single-Screen Scanner) for all operators
- **Fallback:** Auto-switch to Variant A (Card Wizard) if:
  - Camera permission denied
  - Low-quality camera (<5MP)
  - Offline mode + barcode scanner unavailable
  - User manually toggles "Manual Entry Mode" in settings

**Rollout Plan:**
1. Week 1: Implement Variant B for Receive workflow
2. Week 2: Add Variant A fallback + settings toggle
3. Test with 2-3 pilot operators (warehouse team)
4. Gather feedback, iterate on tap targets + contrast

**Success Metrics:**
- Speed: ≥8 items/min (baseline: 4-5)
- Operator satisfaction: ≥4/5 stars
- Error rate: <5% (wrong LP/batch/qty)
- Camera scan success rate: ≥90%

---

### Phase 2: Pro Features (Week 3-4) - Add Variant D Toggle

**Implementation:**
- **Expert Mode Toggle:** Settings → Scanner → "Enable Bulk Mode"
- **Onboarding:** Requires completion of 5-min training tutorial
- **Restrictions:** Only available after 50+ successful scans (proficiency check)
- **Desktop Optimization:** Keyboard shortcuts, table view, batch apply

**Rollout Plan:**
1. Week 3: Implement Bulk Mode for desktop (1024px+)
2. Week 4: Add mobile compact version (375px)
3. Test with 1-2 expert operators (>3 months experience)
4. Measure speed improvement vs Variant B

**Success Metrics:**
- Expert speed: ≥12 items/min
- Adoption: ≥20% of operators enable Bulk Mode within 3 months
- Error rate: <10% (acceptable trade-off for speed)

---

### Phase 3: Accessibility (Week 5-6) - Add Variant C Elements

**Implementation:**
- **Guided Mode Toggle:** Settings → Scanner → "Enable Guided Mode"
- **Use Cases:**
  - Onboarding new operators (auto-enabled first 2 weeks)
  - Compliance-sensitive workflows (pharmaceutical receives)
  - Voice input for accessibility (hands-free)
- **AI Integration:**
  - Batch prediction from supplier history
  - Expiry prediction from product shelf life
  - Voice recognition (Google Speech API / Whisper)

**Rollout Plan:**
1. Week 5: Implement Guided Mode (without AI) - manual step-by-step
2. Week 6: Add AI prefill + voice input (Phase 3B)
3. Test with new hires (first-day operators)

**Success Metrics:**
- Onboarding time: <30 minutes to first successful receive (baseline: 2 hours)
- Error rate: <2% (highest quality)
- Voice input accuracy: ≥85%

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2) - PRIORITY P0 🔴

**Goal:** Ship Variant B (Single-Screen Scanner) as MVP for Receive workflow.

**Tasks:**
1. **Camera Integration** (2 days)
   - PWA camera API implementation
   - Barcode scanning library (ZXing or QuaggaJS)
   - Fallback to manual entry if camera fails

2. **Single-Screen UI** (3 days)
   - Camera viewfinder component (40% screen)
   - Scanned items list component (40% screen)
   - Bottom action buttons (20% screen, 60px height)
   - Swipe-to-remove gesture (error correction)

3. **Offline Queue** (2 days)
   - Service Worker for offline mode
   - Local storage for scanned items
   - Sync on reconnect (background sync API)

4. **UX Polish** (2 days)
   - High-contrast mode (WCAG AAA)
   - Haptic feedback (vibrate API)
   - Toast notifications (success/error)
   - Loading states (skeleton screens)

5. **Fallback to Variant A** (1 day)
   - Auto-detect camera issues
   - Settings toggle: "Manual Entry Mode"
   - Card Wizard UI (enhanced current design)

**Testing:**
- 2-3 pilot operators (warehouse)
- 20 ASN receives (100+ items total)
- Gather feedback on speed, errors, usability

**Deliverables:**
- ✅ Variant B functional for Receive workflow
- ✅ Variant A fallback working
- ✅ Offline mode tested
- ✅ Pilot feedback report

---

### Phase 2: Expert Mode (Week 3-4) - PRIORITY P1 🟡

**Goal:** Add Variant D (Bulk Mode) for expert operators.

**Tasks:**
1. **Bulk Scan UI** (2 days)
   - Desktop table view (compact rows)
   - Keyboard shortcuts (Enter, Ctrl+Z, Esc)
   - Inline editing (double-tap cells)

2. **Batch Apply** (1 day)
   - Batch/expiry apply to all items
   - Quick actions menu

3. **Mobile Compact View** (2 days)
   - Responsive layout (375px)
   - Touch-optimized (tap to edit)

4. **Settings & Onboarding** (2 days)
   - Expert Mode toggle (settings)
   - Training tutorial (5 min interactive)
   - Proficiency check (50+ scans required)

**Testing:**
- 1-2 expert operators (>3 months exp)
- Speed test: measure items/min vs Variant B
- Error rate: acceptable if <10%

**Deliverables:**
- ✅ Variant D (Bulk Mode) functional
- ✅ Desktop + Mobile versions
- ✅ Training tutorial complete
- ✅ Speed comparison report

---

### Phase 3: Accessibility (Week 5-6) - PRIORITY P2 🟢

**Goal:** Add Variant C elements (Guided Mode, Voice Input).

**Tasks:**
1. **Guided Mode UI** (2 days)
   - One question per screen
   - XXL inputs (80px height)
   - Progress indicator

2. **AI Prefill** (3 days)
   - Batch prediction (supplier history)
   - Expiry prediction (shelf life)
   - API integration (simple ML model)

3. **Voice Input** (2 days)
   - Google Speech API or Whisper
   - Voice button (56px)
   - Fallback to typing if fails

**Testing:**
- New hires (first-day operators)
- Onboarding time: measure vs current (2 hours)
- Voice accuracy: ≥85%

**Deliverables:**
- ✅ Variant C (Guided Mode) functional
- ✅ AI prefill working (batch/expiry)
- ✅ Voice input tested
- ✅ Onboarding time report

---

## 7. Technical Specifications

### Tech Stack

**Frontend:**
- **Framework:** React 19 (current Next.js 15 codebase)
- **Camera:** Browser Camera API + ZXing barcode library
- **Offline:** Service Workers + Local Storage / IndexedDB
- **Haptics:** Vibration API (`navigator.vibrate()`)
- **Voice:** Web Speech API or Whisper API (Phase 3)

**Component Library:**
- **UI Framework:** Tailwind CSS 3.4 (current)
- **Icons:** Lucide React (current)
- **Animations:** Framer Motion (for celebration animations)
- **Gestures:** React Swipeable (for swipe-to-remove)

**Accessibility:**
- **WCAG:** AAA compliance (7:1 contrast ratio)
- **ARIA:** Proper labels for screen readers
- **Keyboard:** Full keyboard navigation (desktop)
- **Touch:** 56px minimum tap targets (mobile)

### Component Architecture

**New Components (Variant B):**
```
ScannerCameraView.tsx
├── CameraViewfinder (40% screen, always-on camera)
├── BarcodeOverlay (guide box for barcode alignment)
├── ScannedItemsList (40% screen, scrollable)
│   ├── ScannedItemCard (60px height, swipeable)
│   └── RemainingItemsIndicator
└── ActionButtons (20% screen, thumb zone)
    ├── RetryButton (60px height)
    └── FinishButton (60px height, green)
```

**Enhanced Components (All Variants):**
```
ScannerInput.tsx (56px height, high contrast)
NumericKeypad.tsx (48px buttons, gloves-friendly)
ScannerButton.tsx (56-60px height, haptic feedback)
OfflineIndicator.tsx (status badge, always visible)
ScannerToast.tsx (large font, high contrast, auto-dismiss)
```

### State Management

**Current State (Process Terminal):**
- Too complex: 10+ state variables
- Nested modals: 3 layers deep
- Hard to debug

**Improved State (Variant B):**
```typescript
interface ScannerState {
  mode: 'select' | 'scan' | 'review';
  asn: ASN | null;
  scannedItems: ScannedItem[];
  offlineQueue: ScannedItem[];
  cameraActive: boolean;
  error: ScannerError | null;
}

// Single source of truth, flat structure
```

### Performance Targets

| Metric | Target | Current | Improvement |
|--------|--------|---------|-------------|
| **Scan to Feedback** | <500ms | N/A (manual) | N/A |
| **Camera Start** | <1s | N/A | N/A |
| **Offline Sync** | <2s (background) | N/A | N/A |
| **UI Response** | <200ms | ~300ms | 33% faster |
| **Items/Min** | 8-10 (Variant B) | 4-5 | 100% faster |
| **Items/Min** | 12-15 (Variant D) | 4-5 | 200% faster |

---

## 8. Design System - Component Library

### Color Palette (High Contrast)

**Light Mode (Default):**
```
Background: #F8FAFC (slate-50)
Surface: #FFFFFF (white)
Primary: #3B82F6 (blue-500) - Scanner buttons
Success: #10B981 (green-500) - Confirmation
Warning: #F59E0B (amber-500) - Variance alerts
Error: #EF4444 (red-500) - Errors
Text Primary: #0F172A (slate-900) - 16:1 contrast
Text Secondary: #475569 (slate-600) - 7:1 contrast
Border: #E2E8F0 (slate-200)
```

**Dark Mode (Outdoor/Low Light):**
```
Background: #0F172A (slate-900)
Surface: #1E293B (slate-800)
Primary: #60A5FA (blue-400)
Success: #34D399 (green-400)
Warning: #FBBF24 (amber-400)
Error: #F87171 (red-400)
Text Primary: #F8FAFC (slate-50) - 15:1 contrast
Text Secondary: #CBD5E1 (slate-300) - 7:1 contrast
Border: #334155 (slate-700)
```

### Typography (Gloves-Friendly)

**Font Sizes:**
- **XXL (Variant C inputs):** 60px (questions), 48px (inputs)
- **XL (Primary actions):** 20px (button text)
- **L (Body):** 16px (item names, quantities)
- **M (Secondary):** 14px (labels, hints)
- **S (Tertiary):** 12px (timestamps, metadata)

**Font Weights:**
- **Bold (700):** Headings, primary actions
- **Semibold (600):** Item names, key data
- **Medium (500):** Body text
- **Regular (400):** Secondary text

### Spacing (Touch-Friendly)

**Tap Targets:**
- **Minimum:** 56px × 56px (gloves-friendly)
- **Recommended:** 60px × 60px (primary actions)
- **Compact (Expert Mode):** 48px × 48px (trade-off for density)

**Padding:**
- **XL:** 32px (screen edges on desktop)
- **L:** 24px (card padding)
- **M:** 16px (button padding, list items)
- **S:** 12px (input padding)
- **XS:** 8px (tight spacing)

**Gaps:**
- **Between sections:** 24px
- **Between items:** 16px
- **Between buttons:** 12px

### Components Specifications

#### ScannerButton (Primary Action)

```tsx
<ScannerButton
  size="large"       // 60px height
  variant="primary"  // blue-500
  haptic={true}      // vibrate on tap
  fullWidth={true}   // 100% width (mobile)
>
  📷 Scan Barcode
</ScannerButton>
```

**Specs:**
- Height: 60px (large), 56px (medium), 48px (small)
- Border radius: 12px (rounded-xl)
- Font size: 20px (large), 16px (medium)
- Haptic feedback: 50ms vibrate on tap
- Disabled state: opacity 50%, cursor not-allowed
- Loading state: spinner + "Processing..."

#### ScannerInput (Keyboard Entry)

```tsx
<ScannerInput
  size="large"       // 56px height
  type="numeric"     // shows numeric keyboard (mobile)
  autoFocus={true}   // auto-focus on mount
  icon={<Scan />}    // left icon
  placeholder="Scan or type LP number"
/>
```

**Specs:**
- Height: 80px (XXL), 56px (large), 48px (medium)
- Font size: 24px (large), 16px (medium)
- Padding: 16px horizontal
- Border: 2px solid slate-200 (focus: blue-500)
- Clear button: X icon, right side (48px tap target)

#### ScannedItemCard (List Item)

```tsx
<ScannedItemCard
  item={scannedItem}
  onRemove={() => handleRemove(item.id)}
  swipeable={true}   // swipe-to-remove gesture
  height={60}        // 60px compact height
>
  ✓ Chicken Breast - 100kg
  LP-001 • Batch: AUTO-123
</ScannedItemCard>
```

**Specs:**
- Height: 60px (compact list)
- Background: white (light), slate-800 (dark)
- Border: 1px solid slate-200
- Swipe gesture: Swipe left → reveal remove button (red, 60px)
- Status icon: ✓ (green), ⚠️ (yellow), ✗ (red)
- Tap to expand: Shows full details (batch, expiry, qty)

#### CameraViewfinder (Always-On Scanner)

```tsx
<CameraViewfinder
  onScanSuccess={(barcode) => handleScan(barcode)}
  onScanError={(error) => handleError(error)}
  overlayGuide={true}  // shows barcode alignment box
  hapticFeedback={true}
/>
```

**Specs:**
- Height: 40% of screen (dynamic)
- Aspect ratio: 16:9 or 4:3 (camera native)
- Overlay: White box with corners (barcode guide)
- Scan feedback: Green flash + haptic buzz on success
- Error feedback: Red flash + toast on failure
- FPS: 30fps (balance performance + battery)

#### NumericKeypad (Manual Entry)

```tsx
<NumericKeypad
  value={quantity}
  onChange={(value) => setQuantity(value)}
  maxLength={6}      // max 6 digits
  decimalPlaces={2}  // allow 2 decimal places
/>
```

**Specs:**
- Button size: 56px × 56px (gloves-friendly)
- Grid: 3 columns × 4 rows (1-9, 0, ., ✓, ←)
- Font size: 24px (numbers)
- Haptic: 20ms vibrate on each tap
- Special keys:
  - ✓ (green): Confirm entry
  - ← (gray): Delete last digit
  - . (gray): Decimal point

#### OfflineIndicator (Status Badge)

```tsx
<OfflineIndicator
  status="offline"   // online | offline | syncing
  queueSize={3}      // 3 items in offline queue
/>
```

**Specs:**
- Position: Top-right corner (fixed)
- Size: 40px height, auto width
- Colors:
  - Online: green-500 (📶 Online)
  - Offline: amber-500 (📶 Offline)
  - Syncing: blue-500 (🔄 Syncing... 3 items)
- Tap to expand: Shows offline queue details

---

## 9. Workflows - Detailed Interactions

### Workflow 1: Receive ASN (Variant B - Single-Screen)

**User Story:**
> As a **Warehouse Operator**, I want to **receive an ASN by scanning barcodes continuously** so that I can **process 50+ items per shift without tedious typing**.

**Pre-conditions:**
- ASN-12345 submitted (status: submitted)
- Operator logged in (BYOD smartphone or tablet)
- Camera permission granted
- Internet connection (or offline mode)

**Steps:**

| Step | Screen | Actor Action | System Response | Duration |
|------|--------|--------------|-----------------|----------|
| 1 | Scanner Hub | Tap "Receive" card | Navigate to `/scanner/receive` | <1s |
| 2 | Receive - Select | Screen loads | Show list of ASNs (status: submitted) | <2s |
| 3 | Receive - Select | Tap ASN-12345 row OR scan ASN barcode | Load ASN details, navigate to Scan screen | <1s |
| 4 | Receive - Scan | Screen loads | Camera viewfinder starts (40% screen), scanned items list empty (40%), action buttons (20%) | <1s |
| 5 | Receive - Scan | Point camera at product barcode (item 1: Chicken) | • Barcode detected: "SKU-CHICKEN-001"<br>• Haptic buzz (50ms vibrate)<br>• Green flash overlay<br>• Auto-match to ASN item 1<br>• Add to scanned list: "✓ Chicken Breast - 100kg"<br>• Auto-generate LP: "LP-20251115-001"<br>• Auto-fill batch from ASN: "BATCH-2025-320"<br>• Camera refocuses (ready for next scan) | <2s |
| 6 | Receive - Scan | Point camera at product barcode (item 2: Beef) | Same as step 5, item 2 added | <2s |
| 7 | Receive - Scan | Point camera at product barcode (item 3: Pork) | Same as step 5, item 3 added | <2s |
| 8 | Receive - Scan | **Variance detected:** Item 4 (Lamb) expected 25kg, scanned shows 20kg | • Yellow flash overlay<br>• Popup: "Expected 25kg, scanned 20kg. Confirm?" [Yes] [No]<br>• Operator taps "Yes"<br>• Item 4 added with variance flag | <3s |
| 9 | Receive - Scan | Point camera at product barcode (item 5: Fish) | Same as step 5, item 5 added | <2s |
| 10 | Receive - Scan | All 5 items scanned | "Finish" button highlights (green pulse animation), "Remaining: None" | - |
| 11 | Receive - Scan | Tap "Finish" button (60px height) | • Show loading spinner<br>• Call API: `create_grn_from_asn(asn_id, received_by, scanned_items)`<br>• GRN created: GRN-12345<br>• 5 LPs created: LP-001 to LP-005<br>• Toast: "✅ GRN-12345 created with 5 LPs"<br>• Navigate back to Scanner Hub | <3s |

**Total Time:** ~15-20 seconds (vs 50-75s current)
**Total Taps:** 3 (Receive card → ASN row → Finish)
**Total Typing:** 0 characters (100% barcode scanning)

**Error Handling:**

| Error | Trigger | System Response | Operator Action |
|-------|---------|-----------------|----------------|
| **Wrong barcode** | Scanned product not in ASN | • Red flash overlay<br>• Haptic vibrate (100ms, 2 pulses)<br>• Toast: "❌ Item not found in ASN-12345"<br>• Camera refocuses | Scan correct barcode |
| **Duplicate scan** | Same product scanned twice | • Yellow flash overlay<br>• Toast: "⚠️ Chicken already scanned"<br>• Camera refocuses | Scan next item |
| **Low confidence** | Barcode blurry or damaged | • Popup: "Could not read barcode. Retry or enter manually?"<br>• [📷 Retry] [⌨️ Manual Entry] | Tap Retry or Manual |
| **Camera fails** | Permission denied or hardware error | • Auto-switch to Variant A (Card Wizard)<br>• Toast: "Camera unavailable, using manual entry"<br>• Show manual input form | Type LP/batch/qty |
| **Offline mode** | No internet connection | • Show offline indicator: "📶 Offline - 5 items queued"<br>• Scans saved to local storage<br>• Auto-sync when reconnected | Continue scanning |

**Post-conditions:**
- GRN-12345 created (status: completed)
- 5 LPs created with:
  - LP numbers: LP-20251115-001 to LP-20251115-005
  - Batch: BATCH-2025-320 (from ASN)
  - Expiry: 2025-12-31 (from ASN)
  - QA status: Pending (default)
  - Location: Default receiving location (from warehouse settings)
- ASN-12345 status updated: submitted → received
- Operator can view GRN details (toast tap → navigate to GRN screen)

---

### Workflow 2: Process WO (Variant B - Single-Screen)

**User Story:**
> As a **Production Operator**, I want to **consume materials by scanning LP barcodes** so that I can **execute work orders without manual data entry**.

**Pre-conditions:**
- WO-123 released (status: released)
- BOM snapshot captured (3 materials: Chicken 100kg, Salt 2kg, Spices 1kg)
- LPs available: LP-001 (Chicken, 100kg), LP-002 (Salt, 5kg), LP-003 (Spices, 2kg)
- Operator on production line (tablet mounted)

**Steps:**

| Step | Screen | Actor Action | System Response | Duration |
|------|--------|--------------|-----------------|----------|
| 1 | Scanner Hub | Tap "Process" card | Navigate to `/scanner/process` | <1s |
| 2 | Process - Select Line | Screen loads | Show list of production lines: Line 1, Line 2, Mixer A | <1s |
| 3 | Process - Select Line | Tap "Line 1" | Filter WOs by machine: Line 1, show available WOs | <1s |
| 4 | Process - Select WO | Tap WO-123 OR scan WO barcode | Load WO details, navigate to Scan screen | <1s |
| 5 | Process - Scan | Screen loads | • Camera viewfinder starts<br>• Show BOM materials needed:<br>  - Chicken: 100kg (0/100 staged)<br>  - Salt: 2kg (0/2 staged)<br>  - Spices: 1kg (0/1 staged)<br>• Action buttons: [Retry] [Create Output] (disabled) | <1s |
| 6 | Process - Scan | Scan LP-001 barcode (Chicken, 100kg) | • Haptic buzz<br>• Green flash<br>• Auto-match to BOM item 1 (Chicken)<br>• Popup: "Stage 100kg from LP-001?" [All] [Partial]<br>• Operator taps "All"<br>• Staged: Chicken 100/100 ✓<br>• Update BOM progress | <3s |
| 7 | Process - Scan | Scan LP-002 barcode (Salt, 5kg) | • Auto-match to BOM item 2 (Salt, need 2kg)<br>• Popup: "Stage 2kg from LP-002 (5kg available)?" [2kg] [Other]<br>• Operator taps "2kg"<br>• Staged: Salt 2/2 ✓ | <3s |
| 8 | Process - Scan | Scan LP-003 barcode (Spices, 2kg) | • Auto-match to BOM item 3 (Spices, need 1kg)<br>• Popup: "Stage 1kg from LP-003 (2kg available)?" [1kg] [Other]<br>• Operator taps "1kg"<br>• Staged: Spices 1/1 ✓<br>• All materials staged → "Create Output" button enabled (green pulse) | <3s |
| 9 | Process - Scan | Tap "Create Output" button | • Popup: "How many units to create?"<br>• Numeric keypad (56px buttons)<br>• Operator types "10"<br>• Tap ✓<br>• System consumes materials (FIFO):<br>  - LP-001: 100kg consumed → 0kg remaining<br>  - LP-002: 2kg consumed → 3kg remaining<br>  - LP-003: 1kg consumed → 1kg remaining<br>• Create 10 output LPs (PR):<br>  - LP-101 to LP-110 (10kg each)<br>• Update WO status: released → in_progress<br>• Toast: "✅ 10 units created (100kg total)" | <5s |
| 10 | Process - Scan | Tap "Finish WO" (after all operations complete) | • WO-123 status: in_progress → completed<br>• Navigate back to Scanner Hub | <2s |

**Total Time:** ~20-25 seconds (vs 60-90s current)
**Total Taps:** 8 (Process card → Line → WO → All → 2kg → 1kg → Create → Finish)
**Total Typing:** 2 characters ("10" for output qty)

**Error Handling:**

| Error | Trigger | System Response | Operator Action |
|-------|---------|-----------------|----------------|
| **Wrong material** | Scanned LP not in BOM | • Red flash<br>• Toast: "❌ LP-999 not needed for WO-123" | Scan correct LP |
| **Insufficient qty** | LP has <50% of needed qty | • Yellow flash<br>• Toast: "⚠️ LP-002 has 0.5kg, need 2kg. Stage partial?" | Scan additional LPs |
| **QA hold** | LP status: QA Hold or Quarantine | • Red flash<br>• Toast: "❌ LP-002 is on QA Hold, cannot use"<br>• Show QA override button (manager-only) | Contact supervisor |
| **1:1 violation** | BOM has `consume_whole_lp` flag, operator tries partial | • Red flash<br>• Toast: "❌ This material requires full LP consumption (allergen control)" | Use full LP or find smaller LP |

---

## 10. Next Steps: Replication for Other Modules

### UX Design Methodology (Template)

This Scanner deep dive establishes the **UX Design Methodology** for all MonoPilot modules. Use this template for:

- **Planning Module** (P0) - PO/TO/WO creation, scheduling
- **Technical Module** (P1) - Products, BOMs, routings management
- **QA Module** (P2) - Inspections, NCRs, CoAs, quarantine

**Methodology Steps:**

#### Step 1: Project & Users Confirmation
- Load PRD, product brief, brainstorming results
- Confirm project vision, target users, core features, platform
- Identify primary personas for this module (3-4 personas)
- Map user journeys specific to module workflows

#### Step 2: Current State Analysis
- Review existing implementation (code, UI, workflows)
- Identify what works well vs pain points
- Create "before" user journey (step-by-step with timings)
- List UX problems with priority (P0/P1/P2)

#### Step 3: Design Variants (3-4 Approaches)
- Create 3-4 design variants (e.g., Card Wizard, Single-Screen, Guided, Bulk)
- Wireframe each variant (ASCII or tool)
- Compare metrics: speed, learning curve, error prevention, device fit
- Recommend hybrid approach (default + expert toggle)

#### Step 4: Component Library Design
- Define color palette (high contrast, dark/light mode)
- Typography (gloves-friendly sizes)
- Spacing (touch-friendly tap targets 56px+)
- Component specs (buttons, inputs, cards, modals)

#### Step 5: Detailed Workflows
- Document key workflows with step-by-step tables
- Include timings, tap counts, typing counts
- Error handling for each step
- Pre/post-conditions

#### Step 6: Implementation Roadmap
- Phase 1: MVP (default variant)
- Phase 2: Pro features (expert variant)
- Phase 3: Accessibility (guided variant elements)
- Define success metrics per phase

#### Step 7: Save Design Specification
- Create `docs/ux-design-{module}-module.md`
- Include all sections (1-9 above)
- Reference in main UX design index

---

### Module Priority Order

| Module | Priority | Reason | Estimated Effort |
|--------|----------|--------|------------------|
| **Scanner** | P0 🔴 | Foundation for all operator workflows, highest daily usage | ✅ Complete |
| **Planning** | P0 🔴 | Desktop workflows (PO/TO/WO creation), critical for planners | 3-4 days |
| **Technical** | P1 🟡 | BOM management, product setup, moderately complex workflows | 2-3 days |
| **Production** | P1 🟡 | WO execution dashboard, yield tracking, real-time KPIs | 2-3 days |
| **QA** | P2 🟢 | Inspections, NCRs, CoAs, compliance workflows | 2-3 days |
| **Settings** | P2 🟢 | Admin workflows, user management, low daily usage | 1-2 days |

**Total Estimated Effort:** 11-16 days (2-3 weeks)

---

## 11. Appendix

### A. Glossary

- **ASN:** Advanced Shipping Notice - awizo dostawy
- **GRN:** Goods Receipt Note - dokument przyjęcia
- **LP:** License Plate - jednostka logistyczna (pallet, box, batch)
- **WO:** Work Order - zlecenie produkcyjne
- **BOM:** Bill of Materials - receptura, skład produktu
- **UoM:** Unit of Measure - jednostka miary (kg, L, pcs)
- **QA:** Quality Assurance - kontrola jakości
- **FIFO:** First In, First Out - zasada kolejności (najstarsze pierwsze)
- **PWA:** Progressive Web App - aplikacja webowa działająca offline
- **BYOD:** Bring Your Own Device - strategia własnych urządzeń
- **Haptic:** Wibracje dotykowe (feedback)
- **WCAG:** Web Content Accessibility Guidelines - standard dostępności
- **Tap Target:** Obszar kliknięcia (minimum 56px dla rękawic)

### B. References

- **PRD:** `docs/MonoPilot-PRD-2025-11-13.md`
- **Brainstorming:** `docs/brainstorming-session-results-2025-11-15.md`
- **Product Brief:** `docs/product-brief-MonoPilot-2025-11-15.md`
- **Architecture:** `docs/architecture.md`
- **Scanner Implementation:** `apps/frontend/app/scanner/` (page.tsx, receive/page.tsx, process/page.tsx)
- **Component Library:** `apps/frontend/components/scanner/` (StageBoard.tsx, StagedLPsList.tsx, QAOverrideModal.tsx)

### C. Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-15 | 1.0 | Initial UX Design Specification - Scanner Module deep dive | Mary (Business Analyst) |
| 2025-11-15 | 1.1 | Added detailed wireframes for Variants A, B, C, D | Mary |
| 2025-11-15 | 1.2 | Added workflows (Receive ASN, Process WO) with step-by-step tables | Mary |
| 2025-11-15 | 1.3 | Added component library specs and implementation roadmap | Mary |

---

**End of Scanner Module UX Design Specification**
