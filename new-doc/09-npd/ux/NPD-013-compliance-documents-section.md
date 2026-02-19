# NPD-013: Compliance Documents Section

**Module**: NPD (New Product Development)
**Feature**: Compliance Documents Management (PRD Section 7 - Compliance Documents)
**Type**: Section/Panel (within Project Detail Page)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## Overview

Document management section within the NPD Project Detail page for uploading, organizing, and tracking compliance documentation required for project handoff. Supports drag-and-drop upload, category filtering, version tracking, and missing document alerts.

**Business Context:**
- Required documents must be complete before G4 -> Launch handoff
- Document types: HACCP, Label, Compliance, Trial Results
- Each document has metadata: type, version, uploaded by, date
- Missing required documents block handoff (NPD-FR-35)
- Documents stored in Supabase Storage with org isolation

**Required Documents for Handoff (PRD 7.3):**
- HACCP Plan (compliance)
- Label Proof (label)
- Allergen Declaration (compliance)
- Shelf-Life Report (trial)
- Sensory Evaluation (trial)

---

## ASCII Wireframe

### Success State (Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Project: NPD-2025-00001 - Premium Vegan Burger                                                  |
+--------------------------------------------------------------------------------------------------+
|  [Overview] [Formulations] [Costing] [Risks] [Documents] [Checklist] [Timeline]                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Compliance Documents                                                    [+ Upload Files]  |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |  [!] Missing Required Documents (2)                                                  |  |  |
|  |  |                                                                                      |  |  |
|  |  |  The following documents are required for project handoff:                           |  |  |
|  |  |  - HACCP Plan (compliance)                                                          |  |  |
|  |  |  - Sensory Evaluation (trial)                                                       |  |  |
|  |  |                                                                                      |  |  |
|  |  |  [Upload Missing Documents]                                                          |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  |  [All] [HACCP (1)] [Label (2)] [Compliance (1)] [Trial Results (3)]                       |  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |  +----------------+  +----------------+  +----------------+  +----------------+      |  |  |
|  |  |  |  [PDF Icon]    |  |  [PDF Icon]    |  |  [IMG Icon]    |  |  [DOC Icon]    |      |  |  |
|  |  |  |                |  |                |  |                |  |                |      |  |  |
|  |  |  |  Label Proof   |  |  Allergen      |  |  Nutrition     |  |  Shelf-Life    |      |  |  |
|  |  |  |  Final v2.1    |  |  Declaration   |  |  Facts Panel   |  |  Report v1.0   |      |  |  |
|  |  |  |                |  |  v1.0          |  |  v1.2          |  |                |      |  |  |
|  |  |  |  [Label]       |  |  [Compliance]  |  |  [Label]       |  |  [Trial]       |      |  |  |
|  |  |  |  [Uploaded]    |  |  [Uploaded]    |  |  [Uploaded]    |  |  [Pending]     |      |  |  |
|  |  |  |                |  |                |  |                |  |  [Review]      |      |  |  |
|  |  |  |  John D.       |  |  Sarah M.      |  |  John D.       |  |  Mike T.       |      |  |  |
|  |  |  |  Jan 14, 2026  |  |  Jan 12, 2026  |  |  Jan 10, 2026  |  |  Jan 08, 2026  |      |  |  |
|  |  |  |                |  |                |  |                |  |                |      |  |  |
|  |  |  |  [...] Menu    |  |  [...] Menu    |  |  [...] Menu    |  |  [...] Menu    |      |  |  |
|  |  |  +----------------+  +----------------+  +----------------+  +----------------+      |  |  |
|  |  |                                                                                      |  |  |
|  |  |  +----------------+  +----------------+  +----------------+                          |  |  |
|  |  |  |  [XLSX Icon]   |  |  [PDF Icon]    |  |  [PDF Icon]    |                          |  |  |
|  |  |  |                |  |                |  |                |                          |  |  |
|  |  |  |  Trial Batch   |  |  Micro Test    |  |  pH Analysis   |                          |  |  |
|  |  |  |  Results       |  |  Results       |  |  Report        |                          |  |  |
|  |  |  |  Batch 001     |  |  v1.0          |  |  v1.0          |                          |  |  |
|  |  |  |                |  |                |  |                |                          |  |  |
|  |  |  |  [Trial]       |  |  [Trial]       |  |  [Trial]       |                          |  |  |
|  |  |  |  [Uploaded]    |  |  [Uploaded]    |  |  [Uploaded]    |                          |  |  |
|  |  |  |                |  |                |  |                |                          |  |  |
|  |  |  |  Lisa K.       |  |  Lisa K.       |  |  Lisa K.       |                          |  |  |
|  |  |  |  Jan 05, 2026  |  |  Jan 05, 2026  |  |  Jan 03, 2026  |                          |  |  |
|  |  |  |                |  |                |  |                |                          |  |  |
|  |  |  |  [...] Menu    |  |  [...] Menu    |  |  [...] Menu    |                          |  |  |
|  |  |  +----------------+  +----------------+  +----------------+                          |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  |  Showing 7 of 7 documents                                                                 |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Document Card Detail

```
+------------------------+
|  [PDF Icon - Large]    |  File type icon based on mime_type
|                        |  PDF = red, XLSX = green, DOC = blue, IMG = purple
|                        |
|  Label Proof           |  file_name (truncated to 20 chars)
|  Final v2.1            |  version (optional)
|                        |
|  [Label]               |  file_type badge (colored)
|  [Uploaded]            |  status badge (Uploaded=green, Pending Review=yellow, Required=red)
|                        |
|  John D.               |  uploaded_by (user name)
|  Jan 14, 2026          |  uploaded_at (formatted date)
|                        |
|  [...] Menu            |  Action menu (Preview, Download, Delete)
+------------------------+

Card Dimensions:
- Desktop: 180px x 240px
- Tablet: 160px x 220px
- Mobile: Full width, 80px height (horizontal card)
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Project: NPD-2025-00001 - Premium Vegan Burger                                                  |
+--------------------------------------------------------------------------------------------------+
|  [Overview] [Formulations] [Costing] [Risks] [Documents] [Checklist] [Timeline]                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Compliance Documents                                                    [+ Upload Files]  |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  [All] [HACCP] [Label] [Compliance] [Trial Results]                                       |  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |                                                                                      |  |  |
|  |  |                              [Spinner]                                               |  |  |
|  |  |                                                                                      |  |  |
|  |  |                        Loading documents...                                          |  |  |
|  |  |                                                                                      |  |  |
|  |  |  [Skeleton Cards]                                                                    |  |  |
|  |  |  +----------------+  +----------------+  +----------------+  +----------------+      |  |  |
|  |  |  |  [=========]   |  |  [=========]   |  |  [=========]   |  |  [=========]   |      |  |  |
|  |  |  |  [=======]     |  |  [=======]     |  |  [=======]     |  |  [=======]     |      |  |  |
|  |  |  |  [====]        |  |  [====]        |  |  [====]        |  |  [====]        |      |  |  |
|  |  |  |  [========]    |  |  [========]    |  |  [========]    |  |  [========]    |      |  |  |
|  |  |  +----------------+  +----------------+  +----------------+  +----------------+      |  |  |
|  |  |                                                                                      |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State (No Documents)

```
+--------------------------------------------------------------------------------------------------+
|  Project: NPD-2025-00001 - Premium Vegan Burger                                                  |
+--------------------------------------------------------------------------------------------------+
|  [Overview] [Formulations] [Costing] [Risks] [Documents] [Checklist] [Timeline]                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Compliance Documents                                                    [+ Upload Files]  |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |  [!] Missing Required Documents (5)                                                  |  |  |
|  |  |                                                                                      |  |  |
|  |  |  The following documents are required for project handoff:                           |  |  |
|  |  |  - HACCP Plan (compliance)                                                          |  |  |
|  |  |  - Label Proof (label)                                                              |  |  |
|  |  |  - Allergen Declaration (compliance)                                                |  |  |
|  |  |  - Shelf-Life Report (trial)                                                        |  |  |
|  |  |  - Sensory Evaluation (trial)                                                       |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  |  [All] [HACCP] [Label] [Compliance] [Trial Results]                                       |  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |                                                                                      |  |  |
|  |  |                              [File Upload Icon]                                      |  |  |
|  |  |                                                                                      |  |  |
|  |  |                          No Documents Uploaded                                       |  |  |
|  |  |                                                                                      |  |  |
|  |  |           Upload compliance documents to prepare for project handoff.               |  |  |
|  |  |                                                                                      |  |  |
|  |  |           Required documents include HACCP plans, label proofs,                     |  |  |
|  |  |           allergen declarations, and trial results (shelf-life,                     |  |  |
|  |  |           sensory evaluation, microbiological tests).                               |  |  |
|  |  |                                                                                      |  |  |
|  |  |    +----------------------------------------------------------------------+         |  |  |
|  |  |    |                                                                      |         |  |  |
|  |  |    |       Drag & drop files here, or click to browse                    |         |  |  |
|  |  |    |                                                                      |         |  |  |
|  |  |    |       Accepted: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max 50MB)      |         |  |  |
|  |  |    |                                                                      |         |  |  |
|  |  |    +----------------------------------------------------------------------+         |  |  |
|  |  |                                                                                      |  |  |
|  |  |                          [Upload Your First Document]                               |  |  |
|  |  |                                                                                      |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Project: NPD-2025-00001 - Premium Vegan Burger                                                  |
+--------------------------------------------------------------------------------------------------+
|  [Overview] [Formulations] [Costing] [Risks] [Documents] [Checklist] [Timeline]                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Compliance Documents                                                    [+ Upload Files]  |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  [All] [HACCP] [Label] [Compliance] [Trial Results]                                       |  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |  [X] Failed to Load Documents                                                        |  |  |
|  |  |                                                                                      |  |  |
|  |  |  Error: Unable to retrieve compliance documents from storage.                        |  |  |
|  |  |  Error code: NPD_DOCUMENT_FETCH_FAILED                                              |  |  |
|  |  |                                                                                      |  |  |
|  |  |  Possible causes:                                                                   |  |  |
|  |  |  - Network connection lost                                                          |  |  |
|  |  |  - Storage service unavailable                                                      |  |  |
|  |  |  - Session expired                                                                  |  |  |
|  |  |                                                                                      |  |  |
|  |  |  [Try Again]                                                    [Contact Support]   |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Uploading State

```
+--------------------------------------------------------------------------------------------------+
|  Project: NPD-2025-00001 - Premium Vegan Burger                                                  |
+--------------------------------------------------------------------------------------------------+
|  [Overview] [Formulations] [Costing] [Risks] [Documents] [Checklist] [Timeline]                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Compliance Documents                                                                      |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |                                                                                      |  |  |
|  |  |  Uploading 3 files...                                                               |  |  |
|  |  |                                                                                      |  |  |
|  |  |  +-------------------------------------------------------------------------+        |  |  |
|  |  |  |                                                                         |        |  |  |
|  |  |  |  HACCP_Plan_2026.pdf                                                   |        |  |  |
|  |  |  |  [====================================] 100%  2.4 MB      [Completed]  |        |  |  |
|  |  |  |                                                                         |        |  |  |
|  |  |  |  Shelf_Life_Report.xlsx                                                |        |  |  |
|  |  |  |  [========================            ] 67%   1.8 MB/2.7 MB           |        |  |  |
|  |  |  |                                                                         |        |  |  |
|  |  |  |  Sensory_Evaluation.pdf                                                |        |  |  |
|  |  |  |  [==========                          ] 25%   0.5 MB/2.0 MB           |        |  |  |
|  |  |  |                                                                         |        |  |  |
|  |  |  +-------------------------------------------------------------------------+        |  |  |
|  |  |                                                                                      |  |  |
|  |  |  Est. time remaining: 15 seconds                                                    |  |  |
|  |  |                                                                                      |  |  |
|  |  |  [Cancel Upload]                                                                    |  |  |
|  |  |                                                                                      |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Missing Required Documents Banner (Detail)

```
+--------------------------------------------------------------------------------------+
|  [!] Missing Required Documents (2)                                  [red background] |
|                                                                                      |
|  The following documents are required for project handoff:                           |
|                                                                                      |
|  +--------------------------------+  +--------------------------------+              |
|  |  [ ] HACCP Plan               |  |  [ ] Sensory Evaluation        |              |
|  |      Type: compliance         |  |      Type: trial               |              |
|  |      Status: Required         |  |      Status: Required          |              |
|  +--------------------------------+  +--------------------------------+              |
|                                                                                      |
|  [Upload Missing Documents]                                                          |
+--------------------------------------------------------------------------------------+

Badge Colors:
- Required: Red (#EF4444) background, white text
- Pending Review: Yellow (#F59E0B) background, black text
- Uploaded: Green (#22C55E) background, white text
- Optional: Gray (#6B7280) background, white text
```

### Upload Dropzone Modal

```
+--------------------------------------------------------------------------------------------------+
|                            Upload Compliance Documents                              [X]          |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Project: NPD-2025-00001 - Premium Vegan Burger                                                  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |       +------------------------------------------------------------------------+          |  |
|  |       |                                                                        |          |  |
|  |       |                        [Cloud Upload Icon]                             |          |  |
|  |       |                                                                        |          |  |
|  |       |            Drag & drop files here, or click to browse                  |          |  |
|  |       |                                                                        |          |  |
|  |       |          Accepted: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG                |          |  |
|  |       |                    Maximum file size: 50 MB                            |          |  |
|  |       |                                                                        |          |  |
|  |       +------------------------------------------------------------------------+          |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  Document Type: [Select type...                                                     v]          |
|                 - HACCP                                                                         |
|                 - Label                                                                         |
|                 - Compliance                                                                    |
|                 - Trial Results                                                                 |
|                 - Other                                                                         |
|                                                                                                  |
|  Version (optional): [v1.0                                                          ]           |
|                                                                                                  |
|  Notes (optional):   [                                                              ]           |
|                      [                                                              ]           |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Selected Files (0)                                                                       |  |
|  |                                                                                            |  |
|  |  No files selected                                                                        |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  [Cancel]                                                              [Upload Files]           |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Upload Dropzone with Files Selected

```
+--------------------------------------------------------------------------------------------------+
|                            Upload Compliance Documents                              [X]          |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Project: NPD-2025-00001 - Premium Vegan Burger                                                  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |       +------------------------------------------------------------------------+          |  |
|  |       |                        [Cloud Upload Icon]                             |          |  |
|  |       |          Drag more files, or click to add more                         |          |  |
|  |       +------------------------------------------------------------------------+          |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  Document Type: [HACCP                                                              v]          |
|                                                                                                  |
|  Version (optional): [v1.0                                                          ]           |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Selected Files (3)                                                        [Clear All]    |  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |  [PDF]  HACCP_Plan_2026.pdf              2.4 MB                              [X]    |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |  [XLSX] Shelf_Life_Report.xlsx           2.7 MB                              [X]    |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |  [PDF]  Sensory_Evaluation.pdf           2.0 MB                              [X]    |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  |  Total: 7.1 MB                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  [Cancel]                                                              [Upload 3 Files]         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Card Action Menu (Expanded)

```
+------------------------+
|  [PDF Icon - Large]    |
|                        |
|  Label Proof           |
|  Final v2.1            |
|                        |
|  [Label]               |
|  [Uploaded]            |
|                        |
|  John D.               |
|  Jan 14, 2026          |
|                        |
|  [...] Menu            |
+------------------------+
        |
        v
+------------------------+
|  [Eye] Preview         |
|  [Download] Download   |
|  ---------------------- |
|  [Trash] Delete        |  (destructive, red text)
+------------------------+
```

---

## Key Components

### 1. Section Header
- **Title**: "Compliance Documents"
- **Primary Action**: "[+ Upload Files]" button (opens upload modal)
- **Context**: Within Project Detail page (NPD-002)

### 2. Missing Required Documents Banner
- **Type**: Alert banner (destructive/warning)
- **Background**: Red (#FEE2E2) with red border (#EF4444)
- **Icon**: Exclamation mark in circle (red)
- **Content**:
  - Count of missing required documents
  - List of missing document names with types
- **Action**: "[Upload Missing Documents]" button
- **Visibility**: Only shown when required documents missing
- **Position**: Above category tabs, always visible when applicable

### 3. Category Tabs
- **Type**: Horizontal tab bar (pill-style)
- **Tabs**:
  - All (default, shows count)
  - HACCP (shows count if > 0)
  - Label (shows count if > 0)
  - Compliance (shows count if > 0)
  - Trial Results (shows count if > 0)
- **Behavior**: Filter cards by file_type
- **Counts**: Show document count in tab label

### 4. Upload Dropzone
- **Type**: Dashed border area with drag-and-drop support
- **Size**: 200px height (inline in empty state), modal for primary upload
- **Accepted Types**: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
- **Max File Size**: 50 MB per file
- **Visual Feedback**:
  - Hover: Blue dashed border
  - Drag over: Blue background highlight
  - Drop: Files added to queue
- **Multiple Files**: Yes, supports multi-select

### 5. Document Card Grid
- **Layout**: CSS Grid, responsive columns
  - Desktop (>1024px): 4 columns
  - Tablet (768-1024px): 3 columns
  - Mobile (<768px): 1 column (horizontal card layout)
- **Card Size**:
  - Desktop: 180px x 240px
  - Mobile: Full width x 80px (horizontal)
- **Gap**: 16px between cards

### 6. Document Card
- **Elements**:
  1. File icon (based on mime_type)
  2. File name (truncated, 20 chars max)
  3. Version badge (if versioned)
  4. Type badge (colored by category)
  5. Status badge (Required/Uploaded/Pending Review/Optional)
  6. Uploaded by (user name)
  7. Upload date (formatted)
  8. Action menu (3-dot)
- **Interaction**: Hover shows shadow, click opens preview

### 7. Action Menu (per card)
- **Preview**: Opens document in modal/new tab
- **Download**: Downloads file to local device
- **Delete**: Opens confirmation dialog (destructive action)

---

## Category Tab Colors

| Category | Tab Color | Badge Color | File Types |
|----------|-----------|-------------|------------|
| All | Gray (#6B7280) | - | All documents |
| HACCP | Orange (#F97316) | Orange | HACCP plans, flow diagrams |
| Label | Purple (#8B5CF6) | Purple | Label proofs, nutrition facts |
| Compliance | Blue (#3B82F6) | Blue | Allergen declarations, certificates |
| Trial Results | Green (#22C55E) | Green | Shelf-life, sensory, micro tests |

---

## Status Badges

| Status | Color | Background | Text | Description |
|--------|-------|------------|------|-------------|
| Required | Red | #FEE2E2 | #991B1B | Document required but not uploaded |
| Uploaded | Green | #D1FAE5 | #065F46 | Document uploaded successfully |
| Pending Review | Yellow | #FEF3C7 | #92400E | Document uploaded, awaiting approval |
| Optional | Gray | #F3F4F6 | #374151 | Nice-to-have, not required |

---

## Main Actions

### Primary Actions
1. **[+ Upload Files]** (top-right header)
   - Opens upload modal with dropzone
   - Select document type, version, files
   - Available to: NPD Lead, R&D, Regulatory

2. **[Upload Missing Documents]** (in banner)
   - Opens upload modal pre-filtered to missing required types
   - Same flow as primary upload

3. **[Upload Your First Document]** (empty state CTA)
   - Same as primary upload

### Card Actions

| Action | Icon | Description | Permissions |
|--------|------|-------------|-------------|
| Preview | Eye | Opens document preview (PDF inline, images inline, others download) | All roles |
| Download | Download | Downloads file to local device | All roles |
| Delete | Trash | Opens confirmation dialog, removes document | NPD Lead, Regulatory (own uploads) |

### Card Action Availability

| Action | Draft | Approved | Locked |
|--------|-------|----------|--------|
| Preview | Yes | Yes | Yes |
| Download | Yes | Yes | Yes |
| Delete | Yes | Yes | No (project locked) |

---

## File Type Icons

| File Type | Icon | Color |
|-----------|------|-------|
| PDF | PDF document | Red (#EF4444) |
| DOC/DOCX | Word document | Blue (#3B82F6) |
| XLS/XLSX | Excel spreadsheet | Green (#22C55E) |
| PNG/JPG | Image | Purple (#8B5CF6) |
| Other | Generic file | Gray (#6B7280) |

---

## State Transitions

```
Page Load (Documents Tab Selected)
  |
LOADING (Show skeleton cards)
  | Success
  v
SUCCESS (Show document cards)
  | No documents
  v
EMPTY (Show empty state + dropzone + missing banner)
  | User uploads
  v
UPLOADING (Show progress modal)
  | Success
  v
SUCCESS (Refresh cards, show toast)

OR

LOADING
  | Failure
  v
ERROR (Show error banner with retry)
  | [Try Again]
  v
LOADING (retry)

SUCCESS
  | User clicks [+ Upload Files]
  v
UPLOAD MODAL (Dropzone + form)
  | User drags/selects files
  v
FILES SELECTED (Show file list)
  | User clicks [Upload]
  v
UPLOADING (Progress bars per file)
  | Success
  v
MODAL CLOSES (Refresh cards, show toast)
```

---

## Validation

### File Upload Validation

| Rule | Error Message |
|------|---------------|
| File too large (>50MB) | "File exceeds maximum size of 50 MB" |
| Invalid file type | "File type not accepted. Allowed: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG" |
| Document type required | "Please select a document type" |
| Empty file | "File appears to be empty" |
| Duplicate file name | "A document with this name already exists. Replace or rename?" |

### Business Validation

| Rule | Error Message |
|------|---------------|
| Delete locked document | "Cannot delete documents from locked project" |
| Missing required docs for handoff | "Missing required documents: HACCP Plan, Sensory Evaluation" |

---

## Data Required

### API Endpoints

**List Documents**
```
GET /api/npd/projects/:id/documents
```

**Query Parameters**
```typescript
{
  file_type?: string   // haccp | label | compliance | trial | other
}
```

**Response Schema**
```typescript
{
  documents: [
    {
      id: string
      org_id: string
      npd_project_id: string
      file_type: string        // "haccp" | "label" | "compliance" | "trial" | "other"
      file_name: string        // "HACCP_Plan_2026.pdf"
      storage_path: string     // "org_123/npd/project_456/docs/HACCP_Plan_2026.pdf"
      version: string | null   // "v2.1"
      mime_type: string        // "application/pdf"
      file_size: number        // 2457600 (bytes)
      uploaded_by: string      // User ID
      uploaded_by_name: string // "John Doe"
      uploaded_at: string      // ISO timestamp
      status: string           // "uploaded" | "pending_review"
    }
  ]
  total: number
  missing_required: [
    {
      name: string             // "HACCP Plan"
      file_type: string        // "compliance"
    }
  ]
}
```

**Upload Document**
```
POST /api/npd/documents
Content-Type: multipart/form-data

{
  npd_project_id: string
  file_type: string
  version?: string
  notes?: string
  file: File
}
```

**Response**
```typescript
{
  document: {
    id: string
    // ... same as above
  }
}
```

**Delete Document**
```
DELETE /api/npd/documents/:id
```

**Response**
```typescript
{
  success: true
}
```

**Get Document Download URL**
```
GET /api/npd/documents/:id/download
```

**Response**
```typescript
{
  url: string           // Signed URL (expires in 5 min)
  file_name: string
  mime_type: string
}
```

---

## Required Documents Matrix

| Document | Type | Required For | PRD Reference |
|----------|------|--------------|---------------|
| HACCP Plan | compliance | G4 gate, Handoff | PRD 7.3 |
| Label Proof | label | G4 gate, Handoff | PRD 7.3 |
| Allergen Declaration | compliance | G4 gate, Handoff | PRD 7.3 |
| Shelf-Life Report | trial | G4 gate, Handoff | PRD 7.3 |
| Sensory Evaluation | trial | G4 gate, Handoff | PRD 7.3 |

---

## Technical Notes

### Storage
- **Supabase Storage**: Bucket `npd-documents`
- **Path Structure**: `{org_id}/npd/{project_id}/docs/{file_name}`
- **Access**: Signed URLs with 5-minute expiry
- **RLS**: Storage policies enforce org isolation

### Performance
- **File Size Limit**: 50 MB per file
- **Concurrent Uploads**: Max 5 simultaneous
- **Progress Tracking**: Using XMLHttpRequest progress events
- **Thumbnail Generation**: None (show file type icon instead)

### Security
- **Virus Scanning**: Consider ClamAV integration for uploaded files
- **Encryption**: At-rest encryption via Supabase Storage
- **Access Logging**: All downloads logged in audit trail

### RLS Policy
```sql
CREATE POLICY "NPD Documents org isolation"
ON npd_documents FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Accessibility
- **Touch Targets**: All buttons >= 48x48dp
- **Drag & Drop**: Alternative click-to-browse always available
- **Screen Reader**:
  - Dropzone: "File upload area. Drag and drop files or press Enter to browse"
  - Card: "Label Proof PDF, version 2.1, uploaded by John D on January 14, 2026. Actions menu available"
  - Progress: Live region announces upload progress
- **Keyboard**:
  - Tab through cards and actions
  - Enter opens action menu or triggers default action
  - Escape closes modals
- **Focus**: Clear focus indicators on cards and buttons

---

## Related Screens

- **Parent**: NPD-002 Project Detail Page
- **Upload Modal**: Inline modal (not separate wireframe)
- **Preview Modal**: PDF.js viewer for PDFs, native for images
- **Delete Confirmation**: Standard confirmation dialog
- **Handoff Validation**: NPD-008 Handoff Wizard (checks required docs)

---

## Permissions

| Role | View Documents | Upload | Download | Delete Own | Delete All |
|------|----------------|--------|----------|------------|------------|
| Admin | Yes | Yes | Yes | Yes | Yes |
| NPD Lead | Yes | Yes | Yes | Yes | Yes |
| R&D | Yes | Yes | Yes | Yes | No |
| Regulatory | Yes | Yes | Yes | Yes | No |
| Finance | Yes | No | Yes | No | No |
| Production | Yes (handoff stage) | No | Yes | No | No |

---

## Testing Requirements

### Unit Tests
```typescript
describe('NPD Compliance Documents Section', () => {
  describe('Document List', () => {
    it('renders document cards in grid layout', async () => {});
    it('shows correct file type icons', async () => {});
    it('displays status badges with correct colors', async () => {});
    it('shows missing required docs banner when applicable', async () => {});
    it('hides banner when all required docs uploaded', async () => {});
  });

  describe('Category Tabs', () => {
    it('filters documents by category', async () => {});
    it('shows correct counts per category', async () => {});
    it('defaults to All tab', async () => {});
  });

  describe('Upload Flow', () => {
    it('opens upload modal on button click', async () => {});
    it('validates file size (max 50MB)', async () => {});
    it('validates file type', async () => {});
    it('shows progress during upload', async () => {});
    it('refreshes list after successful upload', async () => {});
    it('shows error toast on upload failure', async () => {});
  });

  describe('Card Actions', () => {
    it('opens preview on Preview click', async () => {});
    it('downloads file on Download click', async () => {});
    it('shows confirmation on Delete click', async () => {});
    it('removes card after confirmed delete', async () => {});
    it('disables delete for locked projects', async () => {});
  });

  describe('Drag & Drop', () => {
    it('highlights dropzone on drag over', async () => {});
    it('accepts dropped files', async () => {});
    it('rejects invalid file types', async () => {});
  });
});
```

### E2E Tests
```typescript
describe('NPD Compliance Documents E2E', () => {
  it('uploads document via drag and drop', async () => {
    // Navigate to project documents tab
    // Drag file to dropzone
    // Select document type
    // Submit upload
    // Verify new card appears
  });

  it('uploads document via file picker', async () => {
    // Click [+ Upload Files]
    // Click browse, select file
    // Select document type
    // Submit
    // Verify success toast
    // Verify new card in grid
  });

  it('downloads document', async () => {
    // Click action menu on card
    // Click Download
    // Verify file download initiated
  });

  it('deletes document', async () => {
    // Click action menu on card
    // Click Delete
    // Confirm in dialog
    // Verify card removed
    // Verify toast notification
  });

  it('shows missing required docs banner', async () => {
    // Create project with no documents
    // Navigate to documents tab
    // Verify banner visible with 5 missing docs
    // Upload HACCP plan
    // Verify banner shows 4 missing docs
  });

  it('filters by category', async () => {
    // Upload docs in different categories
    // Click HACCP tab
    // Verify only HACCP docs shown
    // Click All tab
    // Verify all docs shown
  });
});
```

---

## Handoff Notes

### For FRONTEND-DEV

1. **Component**: `apps/frontend/components/npd/ComplianceDocumentsSection.tsx`
2. **Upload Component**: `apps/frontend/components/npd/DocumentUploadModal.tsx`
3. **Service**: `apps/frontend/lib/services/npd-document-service.ts`
4. **Validation**: `apps/frontend/lib/validation/npd-document.ts`

5. **Key Implementation Notes**:
   - Use react-dropzone for drag-and-drop
   - Use ShadCN Card component for document cards
   - Use ShadCN Tabs for category filtering
   - Use ShadCN AlertDialog for delete confirmation
   - Progress tracking via XMLHttpRequest onprogress event
   - Signed URLs for downloads (5-minute expiry)

6. **API Endpoints** (implement new):
   - `GET /api/npd/projects/:id/documents`
   - `POST /api/npd/documents` (multipart/form-data)
   - `DELETE /api/npd/documents/:id`
   - `GET /api/npd/documents/:id/download`

7. **Dependencies**:
   - `react-dropzone` for drag-and-drop upload
   - `@supabase/storage-js` for file operations
   - `pdf.js` or `react-pdf` for PDF preview (optional)
   - `useToast` hook for notifications

8. **State Management**:
   - Documents list in React state
   - Upload progress in local state
   - Selected category in URL query param or local state
   - Modal state (open/closed) in local state

9. **Storage Configuration**:
   - Bucket: `npd-documents`
   - Path: `{org_id}/npd/{project_id}/docs/{timestamp}_{file_name}`
   - RLS: Enforce org_id on storage bucket

---

## Field Verification (PRD Cross-Check)

**Document Fields (from PRD Section 7.2 - npd_documents table):**
- id (internal, not shown)
- org_id (internal, RLS)
- npd_project_id (context from parent page)
- file_type (shown as category badge)
- file_name (shown in card)
- storage_path (internal, used for download)
- version (shown in card)
- mime_type (used for icon selection)
- file_size (shown in upload preview)
- uploaded_by (shown in card)
- uploaded_at (shown in card)

**Document Types (from PRD 7.1):**
- formulation (not shown, separate from compliance docs)
- trial (shown as Trial Results)
- compliance (shown)
- label (shown)
- other (shown in dropdown, not as tab)
- HACCP (added as separate category per common use)

**Required Documents for Handoff (PRD 7.3):**
- HACCP Plan (compliance)
- Label Proof (label)
- Allergen Declaration (compliance)
- Shelf-Life Report (trial)
- Sensory Evaluation (trial)

**UI Features (PRD 7.4):**
- Upload with drag-and-drop: Implemented
- Category filter: Implemented as tabs
- Version history: Via card version display
- Download/preview: Implemented as card actions
- Missing document warnings: Implemented as banner

**ALL PRD FIELDS VERIFIED**

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 5 states defined (Loading, Empty, Populated, Missing-Required, Uploading)
- [x] Error state defined
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, drag-drop alternative, screen reader, keyboard)
- [x] Category tabs with colors defined
- [x] Status badges with colors defined
- [x] File type icons with colors defined
- [x] Missing required documents banner defined
- [x] Upload modal/dropzone defined
- [x] Upload progress UI defined
- [x] Card actions documented
- [x] Permissions matrix documented
- [x] Business rules documented (required docs for handoff)
- [x] RLS policy documented
- [x] Storage configuration documented
- [x] Testing requirements defined
- [x] PRD compliance verified

---

## Handoff to FRONTEND-DEV

```yaml
feature: NPD Compliance Documents Section
story: NPD-013
prd_coverage: "NPD PRD Section 7 (Compliance Documents)"
  - "Document upload with drag-and-drop"
  - "Category filtering (HACCP, Label, Compliance, Trial Results)"
  - "Document cards with file icon, name, type, version, uploaded by, date"
  - "Actions: Preview, Download, Delete"
  - "Missing required docs banner"
  - "Status badges (Required, Uploaded, Pending Review, Optional)"
approval_status:
  mode: "auto_approve"
  user_approved: true
  screens_approved: [NPD-013-compliance-documents-section]
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/NPD-013-compliance-documents-section.md
  api_endpoints:
    - GET /api/npd/projects/:id/documents
    - POST /api/npd/documents
    - DELETE /api/npd/documents/:id
    - GET /api/npd/documents/:id/download
states_per_screen: [loading, empty, populated, missing-required-docs, uploading, error]
breakpoints:
  mobile: "<768px (single column cards, horizontal layout)"
  tablet: "768-1024px (3-column grid)"
  desktop: ">1024px (4-column grid)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "grid, gridcell, button, alert"
  keyboard_nav: "Tab, Enter, Escape"
  drag_drop_alternative: "Click to browse always available"
performance_targets:
  document_list_load: "<500ms"
  upload_start: "<1s"
  download_url_generation: "<500ms"
storage:
  bucket: "npd-documents"
  max_file_size: "50MB"
  accepted_types: "PDF, DOC, DOCX, XLS, XLSX, PNG, JPG"
components:
  - ComplianceDocumentsSection
  - DocumentCard
  - DocumentUploadModal
  - DocumentDropzone
  - MissingDocsBanner
  - CategoryTabs
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**User Approved**: Yes
**Iterations**: 0 of 3
**Estimated Effort**: 8-12 hours (dropzone, card grid, upload flow, actions)
**Quality Target**: 95/100 (comprehensive document management section)
**PRD Coverage**: 100% (NPD PRD Section 7 - Compliance Documents)
**Reference**: SET-029 Import/Export (similar upload dropzone pattern)
