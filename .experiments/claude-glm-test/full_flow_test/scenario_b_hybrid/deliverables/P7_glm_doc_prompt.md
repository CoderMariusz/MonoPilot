# Task: Write API Documentation for LabelPrintService

## Context
You implemented `LabelPrintService` for ZPL label generation. Now write comprehensive API documentation.

## Service Code
See the complete implementation in the context file.

## Documentation Requirements

### 1. Overview Section
- Brief description of service purpose
- Supported printers (Zebra ZPL II)
- Key features (QR code, barcode, multiple sizes)

### 2. API Reference
For each public method:
- Method signature with TypeScript types
- Parameter table with descriptions
- Return type and description
- Error cases and throws
- Code examples

Methods to document:
- `generateZPL(lp, options)`
- `generateBulkZPL(lps, options)`
- `validatePrintRequest(options)`

### 3. Label Specifications
- Supported label sizes table (4x6, 4x3, 3x2 with dimensions in dots)
- Label layout description
- QR code data structure
- Barcode format

### 4. Usage Guide
- Basic usage example
- Bulk printing example
- Integration with API endpoint
- Common patterns

### 5. Testing
- Where tests are located
- How to run tests

### 6. Technical Notes
- ZPL version
- DPI (203)
- Font specifications
- Barcode/QR code specs

## Output Format
Markdown documentation file following MonoPilot docs structure.

**Write complete, professional API documentation.**
