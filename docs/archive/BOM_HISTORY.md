# BOM History Tracking

## Overview

The BOM History system tracks all changes made to Bills of Materials (BOMs) when their status changes from `draft` to `active`. This provides a complete audit trail of what changed, who made the change, and when it happened.

## How It Works

### When History is Created

BOM history entries are automatically created when:
- A BOM's status changes from `draft` to `active`
- The change is saved via the `CompositeProductModal` component

### What Gets Tracked

The system tracks:
- **BOM Header Changes**: Status, version, notes, effective dates, default routing
- **Item Changes**: 
  - Added items (new materials added to BOM)
  - Removed items (materials removed from BOM)
  - Modified items (quantity, UOM, sequence, priority, scrap percentage, flags, etc.)

### Database Schema

The `bom_history` table stores:
- `id`: Unique identifier
- `bom_id`: Reference to the BOM
- `version`: BOM version number
- `changed_by`: UUID of the user who made the change
- `changed_at`: Timestamp of the change
- `status_from`: Previous status
- `status_to`: New status
- `changes`: JSONB object containing detailed change information
- `description`: Human-readable description of the change

## Accessing History

### From BOM Editor

1. Open a composite product in the BOM editor
2. Click the "View History" button (purple button) next to the BOM status controls
3. View all history entries for that BOM in a modal

### From History Page

1. Navigate to `/bom-history` page
2. View all BOM changes across the entire system
3. Filter by:
   - Product (part number)
   - Date range
   - User (who made the change)

## Change Format

Each history entry contains a `changes` JSON object:

```json
{
  "bom": {
    "status": {"old": "draft", "new": "active"},
    "version": {"old": "1.0", "new": "1.1"}
  },
  "items": {
    "added": [
      {"material_id": 123, "quantity": 5.0, "uom": "kg"}
    ],
    "removed": [
      {"id": 45, "material_id": 100, "quantity": 3.0}
    ],
    "modified": [
      {
        "id": 46,
        "material_id": 101,
        "changes": {
          "quantity": {"old": 3.0, "new": 4.5}
        }
      }
    ]
  }
}
```

## API Usage

### Create History Entry

```typescript
import { BomHistoryAPI } from '@/lib/api/bomHistory';

await BomHistoryAPI.create({
  bom_id: 123,
  version: '1.1',
  status_from: 'draft',
  status_to: 'active',
  changes: { /* change details */ },
  description: 'BOM activated with updates'
});
```

### Get History for a BOM

```typescript
const history = await BomHistoryAPI.getByBomId(bomId);
```

### Get All History

```typescript
const allHistory = await BomHistoryAPI.getAll({
  limit: 100,
  offset: 0,
  bom_id: 123 // optional filter
});
```

## Notes

- History is only created when status changes from `draft` to `active`
- Changes during draft status are not tracked
- History entries are immutable (cannot be modified or deleted)
- The system uses Row Level Security (RLS) to ensure only authenticated users can read/create history


