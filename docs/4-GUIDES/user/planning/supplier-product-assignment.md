# Supplier-Product Assignment User Guide

Story: 03.2 - Supplier-Product Assignment

This guide explains how to manage which products your suppliers can provide, and configure negotiated pricing, lead times, and procurement terms for each supplier-product pair.

## Overview

The Supplier-Product Assignment feature enables you to:

- Link products to specific suppliers
- Set negotiated prices per supplier
- Override default lead times for specific suppliers
- Configure minimum order quantities (MOQ) per supplier
- Designate a default supplier for automatic purchase order population

## Getting Started

### Navigate to Supplier Detail

1. Go to **Planning > Suppliers**
2. Click on a supplier to view their detail page
3. You will see tabs including **Products**

### Access the Products Tab

In the supplier detail page:

1. Click the **Products** tab
2. If no products are assigned, you'll see an empty state with a call-to-action button

## Assigning a Product to a Supplier

### Step-by-Step

1. **Click Add Product Button**
   - Located at the top of the Products table or in the empty state
   - Opens the Assign Product modal

2. **Select a Product**
   - Click the dropdown to search by product code or name
   - Type to filter (example: type "flour" to find "Wheat Flour")
   - Click to select

3. **Enter Supplier-Specific SKU (Optional)**
   - In the "Supplier Product Code" field
   - This is the supplier's internal SKU (max 50 characters)
   - Example: "MILL-FLOUR-A" for your supplier's reference

4. **Set Negotiated Price (Optional)**
   - Enter the price per unit in the "Unit Price" field
   - Must be positive or zero
   - If not set, POs will not pre-fill a price

5. **Select Currency (Optional)**
   - Choose from: PLN, EUR, USD, GBP
   - If not set, the supplier's default currency is used

6. **Override Lead Time (Optional)**
   - Enter days in "Lead Time" field
   - Overrides the product's default lead time for this supplier
   - Leave blank to use product default
   - Example: "5" means 5-day delivery

7. **Set Minimum Order Quantity (Optional)**
   - Enter the smallest quantity you can order
   - Overrides product default
   - Example: "100" means you must order at least 100 units

8. **Set Order Multiple (Optional)**
   - You must order in multiples of this quantity
   - Example: If set to "50", you can order 100, 150, 200 but not 125
   - Blank means no restriction

9. **Add Notes (Optional)**
   - Any additional information (max 1000 characters)
   - Example: "Premium grade only", "Seasonal availability limits"

10. **Click Save**
    - Product is assigned and appears in the Products table

### Example Scenario

Assigning "Wheat Flour" to "Premium Flour Mill" supplier:

- **Product:** Wheat Flour
- **Supplier Code:** MILL-FLOUR-A
- **Price:** 10.50 PLN per kg
- **Lead Time:** 5 days (faster than product default of 7 days)
- **MOQ:** 100 kg
- **Order Multiple:** 50 kg
- **Notes:** "Premium quality, approved by quality team"

After saving, the product appears in the Products table with all configured values.

## Setting a Default Supplier

When a product has multiple suppliers assigned, you can designate one as the **default**. This supplier's information will auto-populate when creating purchase orders.

### How to Set Default

1. **In the Products Table:**
   - Look for the "Default" column
   - Check the checkbox next to the supplier you want as default

2. **When Assigning (First Assignment):**
   - Check the "Default" checkbox in the assignment modal
   - This supplier becomes the default for this product

### Default Supplier Behavior

- **Only one default per product** - If you mark a different supplier as default, the previous one is automatically unmarked
- **Used in PO Creation** - When you create a purchase order, the default supplier's details are pre-filled
- **Automatic** - You don't need to do anything; the system handles the toggle

### Example

You assign "Sugar" to three suppliers:

- Supplier A: 5.00 PLN (NOT default)
- Supplier B: 4.80 PLN (DEFAULT)
- Supplier C: 5.20 PLN (NOT default)

When creating a PO for Sugar, the system pre-fills Supplier B's pricing and lead time.

If you later decide Supplier A should be default:

1. Click the checkbox next to Supplier A
2. Supplier B's checkbox automatically unchecks
3. Future POs will use Supplier A's data

## Editing an Assignment

To update pricing, lead time, or other details:

1. **Find the product in the Products table**
2. **Click the Edit button** (pencil icon) on that row
3. **The assignment modal opens** with existing data pre-filled
4. **Update any fields** you want to change
5. **Click Save**

### Example: Price Update

Your supplier offers a discount:

1. Find the product in the table
2. Click Edit
3. Change "Unit Price" from 10.50 to 9.99 PLN
4. Click Save

The new price is now used for future purchase orders.

## Removing a Product Assignment

If a supplier can no longer provide a product:

1. **Find the product in the Products table**
2. **Click the Remove button** (trash icon) on that row
3. **Confirm the deletion**
4. Product disappears from the table

**Important:** This does not delete the product itself, only the supplier-product relationship.

## Understanding the Products Table

### Column Definitions

| Column | Description |
|--------|-------------|
| **Product Code** | The internal product code (e.g., "FLOUR") |
| **Product Name** | Full product name (e.g., "Wheat Flour") |
| **Supplier Code** | Supplier's internal SKU (e.g., "MILL-FLOUR-A") |
| **Price** | Negotiated unit price with currency (e.g., "10.50 PLN") |
| **Lead Time** | Days to deliver if overridden (empty = use product default) |
| **MOQ** | Minimum order quantity if overridden (empty = use product default) |
| **Default** | Checkbox indicating if this is the default supplier |
| **Last Purchase** | Date of last purchase order confirmation |
| **Last Price** | Price from the last confirmed purchase order |

### Sorting and Filtering

**Search Box:**
- Type to filter by product code, product name, or supplier code
- Example: Type "flour" to show only flour-related assignments

**Sort Buttons:**
- Click column headers to sort ascending/descending
- Sortable columns: Product Code, Product Name, Unit Price, Default

## Common Workflows

### Workflow 1: Setup Supplier with Multiple Products

1. Navigate to supplier detail page
2. Click Products tab
3. Click "Add Product" for first product
   - Select Product A
   - Enter price, lead time, MOQ
   - Check "Default" if this is the primary supplier for Product A
   - Save
4. Click "Add Product" for second product
   - Select Product B
   - Enter product-specific pricing
   - Save
5. Repeat for each product the supplier provides
6. Products table now shows all assignments with one default marked

### Workflow 2: Multi-Supplier Product (Find Best Price)

You want to track three suppliers for "Sugar" and use the cheapest as default:

1. Assign "Sugar" to Supplier A at 5.00 PLN (NOT default)
2. Assign "Sugar" to Supplier B at 4.80 PLN (CHECK DEFAULT)
3. Assign "Sugar" to Supplier C at 5.20 PLN (NOT default)

When creating a PO:

- Default supplier (B) is pre-filled with 4.80 PLN price
- You can manually select A or C in the PO if you prefer

Later, if Supplier B raises prices to 5.10 PLN:

1. Click Edit on Sugar's row for Supplier B
2. Change price to 5.10
3. Save
4. POs now show the new price

### Workflow 3: Seasonal Supplier Setup

You use different suppliers based on season:

**Winter Setup:**
1. Assign "Fresh Vegetables" to Supplier A (local, shorter lead time: 2 days)
2. Set Supplier A as DEFAULT
3. Leave Supplier B (import) undefaulted

**Summer Setup:**
1. Assign "Fresh Vegetables" to Supplier B (import, 10-day lead time)
2. Update Supplier B as DEFAULT
3. Supplier A remains available but not default

Switch by simply toggling the Default checkbox.

## Pricing and Currency Management

### Pricing Fields

When assigning a product, you can specify:

- **Unit Price:** The per-unit cost (max 4 decimal places)
- **Currency:** PLN, EUR, USD, or GBP

### Currency Behavior

If you leave "Currency" blank:

- The system uses the supplier's default currency (set in Supplier settings)
- Example: If supplier defaults to PLN, and you don't set currency, price is in PLN

If you set a currency:

- This supplier-product pair uses that currency, even if it differs from supplier default
- Example: Supplier defaults to PLN, but you can order Sugar in EUR from them
- POs will show the currency you specified

### Multi-Currency Example

**Supplier "European Mills" (default currency: EUR)**

- Sugar: 4.80 EUR (inherit supplier default)
- Flour: 10.50 PLN (override to PLN, possibly a local warehouse)

When creating POs:
- Sugar POs show EUR pricing
- Flour POs show PLN pricing

## Lead Time and Procurement Terms

### Lead Time Handling

**Product Default (Set in Technical module):**
- "Wheat Flour" has 7-day default lead time

**Supplier Override:**
- "Premium Flour Mill" delivers in 5 days
- Assign with "Lead Time: 5"

**Resolution:**
- When creating a PO for "Premium Flour Mill", system uses 5 days
- When creating a PO for any other supplier of "Wheat Flour", system uses 7 days

### MOQ and Order Multiple

**Scenario:**

Your supplier has a minimum order of 100 kg and ships in cases of 50 kg:

- Set "MOQ: 100"
- Set "Order Multiple: 50"

**Valid Orders:** 100, 150, 200, 250 kg (multiples of 50, at least 100)
**Invalid Orders:** 75, 125, 180 kg (don't meet criteria)

When creating a PO:
- System validates your quantity against these rules
- Warns if quantity is invalid

## Last Purchase Tracking

### Automatic Updates

When a purchase order is confirmed:

- **Last Purchase Date** updates to today
- **Last Purchase Price** updates to the price paid

### Using This Information

In the Products table, you can see:

- When you last ordered from each supplier
- What you paid (useful for price comparison)
- Identify if supplier hasn't been used recently

Example:
- "Sugar from Supplier A: Last purchased 2025-11-15 at 4.80 PLN"
- "Sugar from Supplier B: Last purchased 2025-09-20 at 5.00 PLN"

This helps you identify if supplier A is more current/reliable.

## Troubleshooting

### "This product is already assigned to this supplier"

**Problem:** You see this error when trying to assign a product

**Cause:** The product is already linked to this supplier

**Solution:**
- Use Edit instead of Add to update the existing assignment
- To create a different assignment, use a different supplier

### "Supplier not found"

**Problem:** Error when accessing the Products tab

**Cause:** The supplier was deleted or you don't have access

**Solution:**
- Navigate back to Suppliers list
- Verify the supplier exists
- Check that you're in the correct organization

### "Product not found"

**Problem:** Error when trying to assign a product

**Cause:** The product doesn't exist or is in a different organization

**Solution:**
- Verify the product exists in the Technical module
- Check the product isn't archived

### Empty Products Table

**Problem:** Supplier shows no products assigned

**Cause:** No assignments have been created yet

**Solution:**
- Click "Add Product" to assign the first product
- This is the normal state for new suppliers

### Default Supplier Not Changing

**Problem:** You toggled the Default checkbox but it seems to not have changed

**Cause:** The page may not have refreshed

**Solution:**
- Look for a success notification at top of page
- Refresh the page (F5 or Cmd+R)
- The Default column should now show the updated state

## Pricing Examples

### Example 1: Simple Single Supplier

Product: "Sugar"
- Supplier: "Local Distributor"
- Price: 4.80 PLN per kg
- Lead Time: 2 days (default is 5, override to 2)
- MOQ: 50 kg
- Default: Yes

When you create a PO for Sugar, you get 4.80 PLN pricing from Local Distributor automatically.

### Example 2: Multi-Supplier Product

Product: "Wheat Flour"
- Supplier A (DEFAULT): 10.50 PLN, 5-day lead time, MOQ 100
- Supplier B: 10.20 PLN, 10-day lead time, MOQ 200
- Supplier C: 11.00 PLN, 2-day lead time, MOQ 50

PO auto-fills with Supplier A (default) at 10.50 PLN and 5 days.

If you override to Supplier B in the PO form, it auto-updates to 10.20 PLN and 10 days.

### Example 3: Currency Mix

Supplier: "European Mills"
- Flour (EUR): 10.50 EUR, default lead time 5 days
- Sugar (USD): 4.80 USD, default lead time 7 days

POs can mix currencies in a single order.

## Best Practices

### 1. Keep Pricing Current

- Review supplier pricing quarterly
- Update assignments if discounts are offered
- Use Last Purchase Price to verify accuracy

### 2. Set Realistic Lead Times

- Consider:
  - Supplier's stated lead time
  - Shipping method (air, sea, truck)
  - Seasonal variations
  - Safety buffer for reliability
- Update if supplier consistently delivers faster/slower

### 3. One Default per Product

- Choose the supplier you most commonly use
- Use Edit to change defaults, don't unassign
- This ensures consistent auto-fill in POs

### 4. Document Special Terms in Notes

- Mark if supplier has minimum order seasons
- Note if pricing changes by season
- Flag if supplier requires advance notice
- Include contact escalation details

### 5. Regular MOQ Review

- Ensure MOQ aligns with demand
- Adjust if your order volumes change
- Consider: Can you meet the MOQ? Is it economical?

### 6. Use Supplier Product Code Consistently

- Match supplier's invoice/catalog
- Makes supplier communication easier
- Useful when exporting POs to suppliers

## Tips and Tricks

### Bulk Operations (Future Feature)

In upcoming releases:
- Upload supplier-product assignments via CSV
- Import price lists from supplier catalogs
- Multi-supplier comparison reports

For now, use Add/Edit to manage assignments.

### Price Comparison

To compare prices across suppliers for a product:

1. Go to supplier A's detail page
2. Find the product in the Products table, note the price
3. Go to supplier B's detail page
4. Find the same product, note the price
5. Compare

Future releases will include a side-by-side comparison tool.

### Seasonal Setup

If you use different suppliers by season:

1. Keep all assignments in the system (don't delete)
2. Just toggle the Default checkbox each season
3. Or create seasonal notes: "Summer only" or "Winter only"

### Supplier Scoring

Track supplier performance by noting in the Products table:

- "Consistent lead time"
- "Occasionally late - add 2 days buffer"
- "Reliable pricing, no surprises"

## Support and Questions

For questions about:

- **Product setup:** See Technical module documentation
- **Supplier management:** See Suppliers documentation
- **Purchase orders:** See PO Creation documentation
- **General help:** Contact your MonoPilot administrator

---

## Version

- Current Version: 1.0
- Last Updated: 2025-12-16
- Story: 03.2 - Supplier-Product Assignment

For updates, see the User Guide changelog.
