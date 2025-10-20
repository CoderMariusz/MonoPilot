# BOM Architecture

## Categorization
- MEAT (RM)
- DRYGOODS (DG)
- COMPOSITE: PR (process), FG (finished goods)

## Supabase Integration
- Headers table: `boms` (plural)
- Items table: `bom_items` with `sequence` NOT NULL
- Use `production_line_restrictions` (text[]) for line constraints
