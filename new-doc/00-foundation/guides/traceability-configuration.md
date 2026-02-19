# Traceability Configuration Guide

## Overview

Traceability configuration lets you define how your products are tracked through production and distribution. You can configure lot number formats, batch sizes, expiry date calculation methods, and GS1 barcode standards for each product.

This guide walks you through setting up product traceability in MonoPilot.

---

## Why Configure Traceability?

Proper traceability configuration ensures:
- **Accurate tracking**: Know exactly which batches/lots contain which ingredients
- **Regulatory compliance**: Meet food safety requirements (GS1 standards, lot traceability)
- **Quick recalls**: Rapidly identify affected products if a safety issue arises
- **Production efficiency**: Automated lot number generation saves time
- **Scanner integration**: Generated barcodes work with standard barcode scanners

---

## Getting Started

### Step 1: Navigate to Product Settings

1. Go to **Technical Module** > **Products**
2. Find the product you want to configure
3. Click **Edit** or **Settings**

### Step 2: Find Traceability Section

Scroll to the **Traceability Configuration** section in the product form. It shows:
- Current lot format (if configured)
- Traceability tracking level
- GS1 encoding status

Click **Configure** to open the configuration modal.

---

## Configure Lot Number Format

Lot numbers uniquely identify production batches. MonoPilot generates them automatically using a configurable format pattern.

### What is a Lot Number?

A lot number identifies a specific batch of product made together. Examples:
- `LOT-2025-000001` (simple sequential)
- `BRD-250115-0001` (product code + date + sequence)
- `L01-20250115-000001` (line code + date + sequence)

### Setting Your Format

**Common Pattern**: `LOT-{YYYY}-{SEQ:6}`

This creates lot numbers like:
- `LOT-2025-000001` (January 2025)
- `LOT-2025-000002` (January 2025)
- `LOT-2025-000003` (etc.)

### Available Placeholders

| Placeholder | Meaning | Example |
|------------|---------|---------|
| {YYYY} | 4-digit year | 2025 |
| {YY} | 2-digit year | 25 |
| {MM} | Month (01-12) | 01, 06, 12 |
| {DD} | Day of month (01-31) | 01, 15, 31 |
| {YYMMDD} | Year + month + day | 250615 |
| {JULIAN} | Julian day (001-366) | 001, 015, 366 |
| {SEQ:N} | Sequence number | {SEQ:6} = 000001 |
| {PROD} | Product code | BRD, CHK |
| {LINE} | Production line | L01, L02 |

### Example Formats

**Format 1: Simple with Year and Sequence**
```
LOT-{YYYY}-{SEQ:6}
```
Result: `LOT-2025-000001`, `LOT-2025-000002`, etc.

**Format 2: Product-based**
```
{PROD}-{YYMMDD}-{SEQ:4}
```
Result: `BRD-250115-0001`, `BRD-250115-0002`, etc.

**Format 3: Line + Date + Sequence**
```
L{LINE}-{YYYY}{MM}{DD}-{SEQ:4}
```
Result: `L01-20250115-0001`, `L02-20250115-0001`, etc.

**Format 4: Julian Day Based**
```
{JULIAN}{YY}-{SEQ:5}
```
Result: `01525-00001`, `01525-00002`, etc.

### How to Choose Your Format

1. **Start simple** if you're new to lot tracking
2. **Include date** information (e.g., {YYYY}) for traceability
3. **Add sequence** (e.g., {SEQ:6}) for unique identification
4. **Consider scanner needs** - keep under 20 characters if using barcodes

### Validating Your Format

MonoPilot checks that:
- Format contains at least one placeholder
- All placeholders are valid (see table above)
- No invalid placeholders like {INVALID}

❌ Invalid: `LOT-PLAIN-TEXT` (no placeholders)
❌ Invalid: `LOT-{INVALID}-001` (unknown placeholder)
✓ Valid: `LOT-{YYYY}-{SEQ:6}` (recognized placeholders)

### Live Preview

As you edit your lot format, you'll see a preview:
```
Format: LOT-{YYYY}-{SEQ:6}
Preview: LOT-2025-000001
```

The preview uses the current date and sample sequence number.

---

## Set Traceability Level

Choose how precisely you want to track your products.

### Lot Level (Recommended)
- Multiple units grouped together
- Most common in food manufacturing
- Examples: "1 lot = 100 units" or "1 lot = 1 pallet"

**Use when**: You make multiple units together and want to track them as one batch

### Batch Level
- Production run-based tracking
- Tied to a specific work order
- One work order = one batch

**Use when**: You want exact work order-to-batch mapping

### Serial Level
- Unit-by-unit tracking
- Highest granularity (1 unit = 1 serial number)
- Typically used for high-value items

**Use when**: You need to track every single unit individually

---

## Configure Batch Sizes

Set default batch size limits. This helps during production planning.

### What Are Batch Sizes?

Batch size is the quantity produced in one production run. MonoPilot can enforce minimum and maximum batch sizes.

### Setting Batch Size Constraints

**Standard Batch Size**: The default quantity for new production
- Example: 1000 units

**Minimum Batch Size**: Smallest allowed batch
- Example: 500 units
- You cannot produce less than this

**Maximum Batch Size**: Largest allowed batch
- Example: 2000 units
- You cannot produce more than this

### Validation Rules

Your batch sizes must follow this rule:
```
Minimum <= Standard <= Maximum
```

✓ Valid: min=500, standard=1000, max=2000
❌ Invalid: min=500, standard=600, max=400 (max is too small)

### Why Use Batch Sizes?

- **Prevent errors**: Catches if someone enters 10,000 units when max is 2000
- **Planning**: Helps production team know typical batch size
- **Costs**: Affects material ordering and pricing
- **Quality**: Consistent batch sizes improve quality control

### Optional Settings

All batch size fields are optional. You don't have to set them.

---

## Configure Expiry Date Calculation

Choose how product expiry dates are calculated.

### Fixed Days Method
**How it works**: Expiry = Manufacturing Date + Shelf Life Days

**Example**:
- Shelf life: 180 days
- Manufacturing date: January 1, 2025
- Expiry date: June 30, 2025

**Use when**: Shelf life is the same regardless of ingredients

### Rolling Method
**How it works**: Expiry = Earliest Ingredient Expiry - Buffer Days

**Example**:
- Ingredients expire: April 15, 2025
- Buffer: 5 days
- Expiry date: April 10, 2025

**Processing Buffer**: Extra days before ingredient expiry
- Protects against ingredient being used near expiry
- Example: 5-day buffer prevents using ingredients within last 5 days of life

**Use when**: Your product contains ingredients with varying expiry dates

### Manual Method
**How it works**: Expiry is entered manually for each batch

**Use when**: Expiry depends on factors that can't be automated

### How to Choose

| Method | When to Use |
|--------|------------|
| **Fixed Days** | All production uses fresh ingredients made same day |
| **Rolling** | Using stored ingredients with varying expiry dates |
| **Manual** | Complex rules or special products |

---

## Enable GS1 Barcode Standards

GS1 standards allow barcode scanners to automatically read lot numbers, expiry dates, and shipping codes.

### What is GS1?

GS1 is an international standard for barcodes. It includes codes for:
- **GTIN-14**: Product identification (14-digit code)
- **Lot Number (AI 10)**: Batch identification
- **Expiry Date (AI 17)**: When product expires
- **SSCC-18**: Pallet/shipping container tracking

### GS1-128 Lot Encoding

**What it does**: Encodes lot number in scanner-readable format
- Format: `(10)LOT-2025-000001`
- Scanners can read and extract the lot number automatically

**Enable when**: Using barcode scanners for inventory

### GS1-128 Expiry Encoding

**What it does**: Encodes expiry date in standardized format
- Format: `(17)250630` (June 30, 2025)
- Scanners automatically detect expiry date

**Enable when**: Scanners need to read expiry dates

### SSCC-18 for Pallets

**What it does**: Identifies shipping pallets and containers
- 18-digit code for each pallet
- Tracks pallet through warehouse and distribution

**Enable when**: You use pallets for shipping and want to track them

### Do You Need GS1?

✓ Enable if:
- You use barcode scanners for receiving/shipping
- You send products to distributors/retailers
- You need scanner integration

✗ Skip if:
- You manually enter lot numbers
- You're just getting started with traceability
- You don't use barcode scanners yet

---

## Example Configurations

### Example 1: Small Bakery (Starting Out)

**Lot Number**: `LOT-{YYYY}-{SEQ:6}`
- Generates: LOT-2025-000001

**Traceability Level**: Lot
**Batch Size**: 500-2000 units (bread loaves)
**Expiry**: Fixed 7 days
**GS1**: Disabled (using manual tracking)

### Example 2: Mid-Size Manufacturer

**Lot Number**: `{PROD}-{YYMMDD}-{SEQ:4}`
- Generates: BRD-250115-0001 (for product "BRD")

**Traceability Level**: Batch
**Batch Size**: 1000-5000 units
**Expiry**: Rolling (from ingredients, -3 day buffer)
**GS1**: Lot and Expiry enabled (scanner labels)

### Example 3: Large Facility (High Compliance)

**Lot Number**: `L{LINE}-{YYMMDD}-{SEQ:6}`
- Generates: L01-250115-000001 (line 1)

**Traceability Level**: Serial (track every unit)
**Batch Size**: 10000 units (exact manufacturing run)
**Expiry**: Rolling (complex ingredient rules)
**GS1**: All enabled (full compliance)

---

## Saving Your Configuration

### Step 1: Fill in All Sections
Complete each section of the configuration:
- Lot number format
- Traceability level
- Batch sizes (optional)
- Expiry method
- GS1 settings

### Step 2: Review Format Preview
Scroll to see the sample lot number preview:
```
Format: LOT-{YYYY}-{SEQ:6}
Sample: LOT-2025-000001
```

### Step 3: Click Save
Click the **Save** button to apply your configuration.

A confirmation message appears: "Traceability configuration saved"

### What Happens After Saving

- Configuration is immediately active
- New work orders will use the new lot format
- Existing lots are not affected (backwards compatible)
- Configuration applies to all users in your organization

---

## Troubleshooting

### "Invalid placeholder" Error

**Problem**: You see an error like "Invalid placeholder: {INVALID}"

**Solution**: Check your format for unrecognized placeholders
- ✓ Valid: {YYYY}, {MM}, {SEQ:6}, {JULIAN}, {PROD}, {LINE}
- ❌ Invalid: {YEAR}, {INVALID}, {SEQUENCE}

### "Minimum exceeds maximum" Error

**Problem**: You set min=2000, max=1000

**Solution**: Ensure min <= standard <= max
- Change max to 2000 or higher, OR
- Change min to 1000 or lower

### Lot Numbers Too Long for Barcode

**Problem**: Generated lot numbers are longer than 20 characters

**Solution**: Simplify your format
```
❌ Long: {PROD}-{YYMMDD}-{LINE}-{SEQ:6} = BRD-250115-L01-000001 (21 chars)
✓ Short: {PROD}-{YYMMDD}-{SEQ:4} = BRD-250115-0001 (15 chars)
```

**Note**: GS1-128 AI 10 limits lot numbers to 20 characters for barcode scanners

### Changes Not Applied

**Problem**: You saved changes but they're not appearing

**Solution**:
1. Refresh the page (Ctrl+R or Cmd+R)
2. Check if you have update permissions (Admin, Production Manager)
3. Verify configuration was actually saved (look for success message)

---

## Security & Multi-Tenant

Your traceability configuration is:
- **Private to your organization**: Only users in your org can see/edit
- **Immutable defaults**: Default lot format is set at organization level
- **Audit trail**: All changes are recorded with who made them and when

Each organization can have completely different:
- Lot number formats
- Traceability levels
- Batch size constraints
- GS1 settings

---

## Next Steps

After configuring traceability:

1. **Create Work Orders**: Production can now create work orders using your lot format
2. **Print Labels**: Labels will automatically generate lot numbers
3. **Scan Inventory**: If GS1 enabled, set up barcode scanners
4. **Monitor Shelf Life**: System will track expiry dates

---

## Need Help?

### Common Questions

**Q: Can I change the lot format after production starts?**
A: Yes! Changes apply to new lots only. Existing lots keep their original numbers.

**Q: Is GS1 required?**
A: No. GS1 is only needed if you use barcode scanners or ship to retailers.

**Q: Can different products have different traceability settings?**
A: Yes! Each product has its own configuration.

**Q: What happens to old lot numbers if I change the format?**
A: Old lot numbers stay unchanged. Only new lots use the new format.

### Support Resources

- See [Traceability Configuration API](/docs/3-ARCHITECTURE/api/technical/traceability-config.md) for technical details
- See [GS1 Barcode Encoding Guide](/docs/5-DEVELOPER-GUIDES/gs1-barcode-encoding.md) for scanner integration
- Contact support at help@monopilot.app

---

## Related Features (Coming Soon)

### Story 02.10b - Traceability Queries
Track products forward and backward through production:
- **Forward trace**: "Where did this ingredient go?"
- **Backward trace**: "What ingredients are in this product?"
- **Recall simulation**: "How many units affected by recall?"

This feature will become available in Epic 05 (Warehouse).

---

## Glossary

| Term | Definition |
|------|-----------|
| **Lot** | A group of units produced together with same lot number |
| **Batch** | A production run (usually one work order) |
| **Serial** | Individual unit identification (1:1 mapping) |
| **GS1** | Global barcode standard for product identification |
| **GTIN** | Global Trade Item Number (product code) |
| **AI** | Application Identifier (GS1 barcode field marker) |
| **SSCC** | Serial Shipping Container Code (pallet identifier) |
| **Traceability** | Ability to track product from raw materials to consumer |
| **Shelf Life** | How long a product stays fresh/safe to use |
| **Julian Day** | Day number in the year (001-366) |
