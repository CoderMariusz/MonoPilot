# BOM Architecture

## Categorization
- MEAT (RM)
- DRYGOODS (DG)
- COMPOSITE: PR (process), FG (finished goods)

## Supabase Integration
- Headers table: `boms` (plural)
- Items table: `bom_items` with `sequence` NOT NULL
- Use `production_line_restrictions` (text[]) for line constraints

## BOM Editor UX

The BOM editor provides an intuitive interface for managing composite products and their components:

### Product Creation Flow
- **Single Products**: Direct creation with product type selection (MEAT: RM_MEAT, DRYGOODS: DG_ING/DG_LABEL/DG_WEB/DG_BOX/DG_SAUCE)
- **Composite Products**: Two-step process with product details and BOM items

### BOM Items Management
- **Component Selection**: Searchable ProductSelect component for choosing materials (RM, DG, PR)
- Add/remove components from BOM
- Set quantities, UoM, and sequence
- Configure production line restrictions
- Set optional/phantom flags

### Routing Configuration
- **Default Routing**: Optional routing selection for composite products
- Routing defines production workflow and resource requirements
- Available routings loaded from `routings` table
