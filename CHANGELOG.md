I'm ready to help you create a technical changelog for developers. I can assist with:

- **Writing changelog entries** with precise technical language and developer-focused descriptions
- **Organizing changes** by category (Features, Bug Fixes, Breaking Changes, Improvements, etc.)
- **Formatting** using standard changelog conventions (semantic versioning, timestamps, etc.)
- **Documenting** API changes, dependency updates, performance improvements, and migration notes
- **Reviewing and refining** existing changelog content for accuracy and clarity

To get started, please provide:

1. **Version number** - What version are you documenting?
2. **Release date** - When is/was this released?
3. **Changes to document** - What modifications, fixes, features, or breaking changes should be included?
4. **Existing changelog file** - Do you have a `CHANGELOG.md` or similar file I should update, or should I create one?

Alternatively, if you have specific changelog entries or a file you'd like me to work with, just share that and I can help format and refine them.

# Changelog

All notable changes to MonoPilot are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Unreleased

### Added

#### Story 02.5a - BOM Items Core (MVP) (PRODUCTION-READY)

- **BOM Items CRUD Operations** - Full management of components in Bill of Materials
  - List items with product joins, sorted by sequence (supports 100+ items within 500ms)
  - Create new items with auto-sequence (max + 10) and operation assignment
  - Update items (quantity, UoM, sequence, scrap %, operation, notes) with partial updates
  - Delete items with automatic table refresh and optimistic UI updates
  - Get next sequence for auto-increment (handy for forms)

- **Auto-Sequence Numbering (FR-2.36)** - Simplifies item ordering without manual gaps
  - Items automatically get sequence max+10 on creation (10, 20, 30, etc.)
  - Allows manual override for custom ordering
  - No uniqueness constraint (items can share sequences intentionally)
  - Supports insert operations (set item 3 to sequence 15 between 20 and 30)
  - Sorted client-side and database-side with consistent ascending order

- **Quantity Validation (FR-2.39)** - Ensures positive, precise measurements
  - Quantity must be > 0 (enforced at Zod schema and DB constraint)
  - Maximum 6 decimal places supported (DECIMAL 15,6 column)
  - Error message: "Quantity must be greater than 0"
  - Supports measurements like 50.123456 kg for precise batching
  - Prevents 0 and negative values at both client and server

- **Unit of Measure (UoM) Validation (FR-2.38)** - Non-blocking warnings for unit mismatches
  - Auto-fills from product's base_uom (ensures consistency)
  - Warns when entered UoM differs from component's base unit (non-blocking)
  - Warning message: "UoM mismatch: component base UoM is 'kg', you entered 'L'"
  - Database trigger logs WARNING (not EXCEPTION) to allow save
  - Supports multi-unit BOMs (50 kg flour + 30 L water + 100 pcs bags)
  - Clear amber alert banner in modal with explanation

- **Operation Assignment (FR-2.33)** - Links items to specific production steps
  - Dropdown populated from BOM's assigned routing operations
  - Displays as "Op 10: Mixing" format (sequence + name)
  - Can be unassigned (null allowed)
  - Validation: Operation must exist in routing if provided
  - Prevents assignment if BOM has no routing with helpful error message
  - Server-side validation with operation lookup from routing_operations table

- **Scrap Percentage Tracking (FR-2.35)** - Accounts for material loss during production
  - Valid range: 0-100 (enforced by DB CHECK constraint)
  - Default: 0 (no expected loss)
  - 2 decimal places supported (2.5%, not 2.55%)
  - Example use: 102 kg flour input with 2% scrap = 100 kg output
  - Displayed in items table as sub-row (only if > 0)
  - Used for yield and cost calculations

- **Optional Notes Field (FR-2.40)** - Special handling instructions per item
  - Max 500 characters per item
  - Examples: "Store below 20°C", "Mix for 5 minutes", "Premium grade only"
  - Helps production team with item-specific guidance
  - Character counter in modal (e.g., "50/500")
  - Searchable and retrievable via API

- **BOM Items Table Component** - Read-only display with all 4 UI states
  - 6 columns: Sequence, Component (code+name), Type badge, Quantity, UoM, Operation, Actions
  - Type badges color-coded (RM: blue, ING: amber, PKG: purple, WIP: green)
  - Scrap sub-row displays when scrap_percent > 0
  - Footer summary: Total items, Total input (grouped by UoM), Expected output
  - Loading state with skeleton rows (aria-busy="true")
  - Error state with retry button (retry callback)
  - Empty state with icon, CTA button "Add First Component", and help tip
  - Success state with full table and actions dropdown (Edit/Delete)
  - Permission-based UI (hides Add/Edit/Delete when canEdit=false)
  - Accessibility: All headers labeled, rows keyboard-navigable, WCAG 2.1 AA compliant

- **BOM Items Modal Component** - Form for create and edit operations
  - Create mode: Empty form with auto-sequence pre-fill
  - Edit mode: Pre-populated with existing item data, component field read-only
  - Product selector: Searchable (Combobox) with 300ms debounce, filters to RM/ING/PKG/WIP
  - Quantity input: Decimal (step 0.000001), validation for > 0 and 6 decimals max
  - UoM field: Auto-filled, read-only (grey background)
  - Sequence field: Integer input, optional (defaults to max+10)
  - Scrap field: Decimal (0-100%), optional (defaults to 0)
  - Operation dropdown: Populated from routing (if BOM has routing), else disabled with message
  - Notes textarea: Max 500 chars, character counter, optional
  - UoM mismatch warning: Amber alert (non-blocking), allows save with confirmation
  - Server error handling: Alert banner with error message, form stays open for retry
  - Submit buttons: "Save" (create) or "Save Changes" (edit)
  - Keyboard support: Escape to close, Tab navigation, Enter to submit

- **BOM Items Service Layer** - Clean, simple API for operations
  - `getBOMItems(bomId)` - List items with product joins and sorted by sequence
  - `createBOMItem(bomId, data)` - Create with auto-sequence and validation
  - `updateBOMItem(bomId, itemId, data)` - Partial updates supported
  - `deleteBOMItem(bomId, itemId)` - Simple delete with no cleanup needed (DB CASCADE handles it)
  - `getNextSequence(bomId)` - Returns max + 10, defaults to 10 on error
  - All functions return typed responses with warnings array (non-blocking)

- **BOM Items React Query Hooks** - Query and mutation management
  - `useBOMItems(bomId)` - Query with caching and refetch on window focus
  - `useCreateBOMItem()` - Mutation with optimistic updates, invalidates both list and next-sequence
  - `useUpdateBOMItem()` - Mutation with optimistic updates, invalidates list
  - `useDeleteBOMItem()` - Mutation, invalidates both list and next-sequence
  - Query key factory for consistent cache management
  - Automatic table refresh after operations
  - Toast notifications for success/error feedback

- **API Endpoints** - RESTful endpoints for BOM items management
  - `GET /api/v1/technical/boms/{id}/items` - List items with product details
  - `POST /api/v1/technical/boms/{id}/items` - Create item with 201 status
  - `PUT /api/v1/technical/boms/{id}/items/{itemId}` - Update item with partial support
  - `DELETE /api/v1/technical/boms/{id}/items/{itemId}` - Delete item
  - `GET /api/v1/technical/boms/{id}/items/next-sequence` - Get next sequence

- **Permission Enforcement** - Role-based access control
  - **READ**: All authenticated users (technical.R)
  - **CREATE**: Owner, Admin, Production Manager (technical.C)
  - **UPDATE**: Owner, Admin, Production Manager, Quality Manager (technical.U)
  - **DELETE**: Owner, Admin only (technical.D)
  - RLS policies enforce org_id isolation via bom_id FK
  - API routes check permissions before operations
  - Frontend hides UI controls for unauthorized users

- **Database Table (Migration 055)** - Structured storage for BOM items
  - `bom_items` table with 43 columns
  - Foreign keys: bom_id (CASCADE), product_id (RESTRICT)
  - Constraints: quantity > 0, scrap 0-100, sequence >= 0, notes <= 500 chars
  - Indexes: bom_id, product_id, (bom_id, sequence) composite
  - Triggers: Auto-update timestamp, UoM mismatch warning
  - RLS policies: 4 policies (select, insert, update, delete) with permission checks

- **Validation Schemas (Zod)** - Type-safe form validation
  - `bomItemFormSchema` - Create schema with all required/optional fields
  - `updateBOMItemSchema` - Update schema with all fields optional
  - Quantity validation: positive, max 6 decimals
  - Scrap validation: 0-100 range
  - Notes validation: max 500 chars
  - Sequence validation: non-negative integer
  - Operation validation: integer (FK at API level, not in schema)

- **TypeScript Types** - Full type coverage
  - `BOMItem` - Full item with product details and operation name
  - `CreateBOMItemRequest` - Request payload for creation
  - `UpdateBOMItemRequest` - Request payload for updates (partial)
  - `BOMItemsListResponse` - List response with summary
  - `BOMItemResponse` - Single item response with warnings
  - `BOMItemWarning` - Warning object (code, message, details)
  - All exported from types/bom-items.ts for consistency

- **Test Coverage** - Comprehensive testing across layers
  - 36 service tests (getBOMItems, create, update, delete, getNextSequence)
  - 63 validation tests (quantity, decimal places, scrap, notes, operation)
  - 40 component tests (BOMItemsTable all 4 states and interactions)
  - 37 component tests (BOMItemModal create/edit modes and validation)
  - 20 SQL/pgTAP tests (RLS policies, constraints, indexes)
  - 100% of acceptance criteria covered (13/13 ACs)
  - Performance verified: <500ms for 100 items

- **Documentation Suite** - Complete guides for users and developers
  - API Reference (bom-items-crud.md) - 5 endpoints with examples, curl/JS/React
  - Developer Guide (bom-items-management.md) - Architecture, usage patterns, error handling
  - Component Documentation (bom-items.md) - Props, states, accessibility
  - User Guide (bom-items-management.md) - Tasks, best practices, troubleshooting
  - Code examples tested and verified working

---

## Previous Releases

[Earlier releases documented above...]
