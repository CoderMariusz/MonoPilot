#!/bin/bash
# Generate Missing Context Files for Epic 06, 08, 09, 10, 11
# Last Updated: 2026-01-15
# Usage: ./generate-missing-context-files.sh

set -e

BASE_DIR="C:/Users/Mariusz K/Documents/Programowanie/MonoPilot"
CONTEXT_TEMPLATE_DIR="$BASE_DIR/docs/2-MANAGEMENT/epics/current/06-quality/context/06.1"

echo "=== MonoPilot Context Files Generator ==="
echo "Generating missing context YAML files..."
echo ""

# Function to create context files for a story
create_context_files() {
    local epic=$1
    local story_id=$2
    local story_name=$3
    local context_dir="$BASE_DIR/docs/2-MANAGEMENT/epics/current/$epic/context/$story_id"

    # Check if folder exists, create if not
    mkdir -p "$context_dir"

    # Count existing files
    local file_count=$(ls -1 "$context_dir" 2>/dev/null | wc -l)

    if [ "$file_count" -eq 5 ]; then
        echo "✓ $story_id: Already complete (5/5 files)"
        return 0
    fi

    echo "→ $story_id: Creating missing files ($file_count/5)..."

    # Create _index.yaml if missing
    if [ ! -f "$context_dir/_index.yaml" ]; then
        cat > "$context_dir/_index.yaml" << EOF
# Story $story_id - Index File (Entry Point)
# Generated: $(date +%Y-%m-%d)
# Purpose: Story metadata and dependencies - read this first

story:
  id: "$story_id"
  name: "$story_name"
  epic: "$epic"
  phase: "TBD"
  complexity: "M"
  estimate_days: 3
  type: "fullstack"
  state: "ready"

# Files in this context folder
context_files:
  - _index.yaml      # This file - metadata, dependencies
  - database.yaml    # Tables, RLS, seed data
  - api.yaml         # Endpoints, auth, errors
  - frontend.yaml    # Components, services, types
  - tests.yaml       # Acceptance criteria, test specifications

# Dependencies
dependencies:
  required: []
  blocked_by: []
  blocks: []

# Reference Documents
files_to_read:
  prd:
    path: "docs/1-BASELINE/product/modules/MODULE.md"
    sections: ["FR-XXX"]
  story:
    path: "docs/2-MANAGEMENT/epics/current/$epic/$story_id.*.md"

# High-level deliverables
deliverables:
  - type: "migration"
    count: 1
    description: "Database schema changes"
  - type: "service"
    count: 1
    description: "Service layer methods"
  - type: "api"
    count: 3
    description: "API endpoints"
  - type: "component"
    count: 5
    description: "UI components"
  - type: "test"
    count: 3
    description: "Unit + integration + e2e tests"

# Technical notes
technical_notes:
  - "Auto-generated context file - customize as needed"
  - "Read story markdown for complete requirements"
EOF
    fi

    # Create database.yaml if missing
    if [ ! -f "$context_dir/database.yaml" ]; then
        cat > "$context_dir/database.yaml" << EOF
# Story $story_id - Database Context
# Generated: $(date +%Y-%m-%d)

migrations:
  - name: "create_table_XXX"
    type: "create_table"
    path: "supabase/migrations/YYYYMMDD_create_XXX.sql"

tables:
  - name: "table_name"
    description: "Table description"
    columns:
      - name: "id"
        type: "UUID"
        primary_key: true
      - name: "org_id"
        type: "UUID"
        references: "organizations(id)"
        rls: true
    rls_policies:
      - name: "org_isolation"
        operation: "SELECT"
        using: "org_id = (SELECT org_id FROM users WHERE id = auth.uid())"
    indexes:
      - columns: ["org_id"]
        type: "btree"

functions: []
triggers: []
views: []
EOF
    fi

    # Create api.yaml if missing
    if [ ! -f "$context_dir/api.yaml" ]; then
        cat > "$context_dir/api.yaml" << EOF
# Story $story_id - API Context
# Generated: $(date +%Y-%m-%d)

endpoints:
  - method: "GET"
    path: "/api/MODULE/resource"
    auth: true
    roles: ["ADMIN", "USER"]
    description: "List resources"

  - method: "POST"
    path: "/api/MODULE/resource"
    auth: true
    roles: ["ADMIN"]
    description: "Create resource"

services:
  - name: "ResourceService"
    path: "lib/services/resource-service.ts"
    methods:
      - name: "list"
        description: "List resources with pagination"
      - name: "create"
        description: "Create new resource"

validation:
  - schema: "resourceSchema"
    path: "lib/validation/resource.ts"
    fields:
      - name: "field_name"
        type: "string"
        required: true
EOF
    fi

    # Create frontend.yaml if missing
    if [ ! -f "$context_dir/frontend.yaml" ]; then
        cat > "$context_dir/frontend.yaml" << EOF
# Story $story_id - Frontend Context
# Generated: $(date +%Y-%m-%d)

pages:
  - path: "app/(authenticated)/MODULE/resource/page.tsx"
    type: "list"
    description: "Resource list page"

components:
  - name: "ResourceDataTable"
    path: "components/MODULE/ResourceDataTable.tsx"
    type: "table"
    description: "Main data table"

  - name: "ResourceModal"
    path: "components/MODULE/ResourceModal.tsx"
    type: "modal"
    description: "Create/Edit modal"

hooks:
  - name: "useResources"
    path: "lib/hooks/use-resources.ts"
    description: "React Query hook for resources"

ux:
  wireframes: []
  patterns:
    table: "ShadCN DataTable pattern"
    modal: "ShadCN Dialog pattern"
  states:
    - "loading"
    - "empty"
    - "error"
    - "success"
EOF
    fi

    # Create tests.yaml if missing
    if [ ! -f "$context_dir/tests.yaml" ]; then
        cat > "$context_dir/tests.yaml" << EOF
# Story $story_id - Tests Context
# Generated: $(date +%Y-%m-%d)

unit_tests:
  - file: "lib/services/__tests__/resource-service.test.ts"
    coverage_target: 80
    test_count: 10
    description: "Service layer tests"

integration_tests:
  - file: "app/api/MODULE/resource/route.test.ts"
    test_count: 5
    description: "API endpoint tests"

e2e_tests:
  - file: "tests/e2e/MODULE/resource.spec.ts"
    test_count: 3
    description: "Full workflow tests"

rls_tests:
  - description: "Org isolation verification"
  - description: "Cross-tenant access prevention"

acceptance_criteria_mapping:
  - ac: "AC-1: Basic CRUD"
    tests: ["unit: create", "integration: POST /api", "e2e: create flow"]
  - ac: "AC-2: Permissions"
    tests: ["integration: 403 forbidden", "rls: org isolation"]

coverage_targets:
  unit: 80
  integration: 90
  e2e: 100
EOF
    fi

    echo "  ✓ Created $(( 5 - file_count )) files for $story_id"
}

# Epic 09 - Finance (21 incomplete stories)
echo ""
echo "=== Epic 09 - Finance ==="
create_context_files "09-finance" "09.6" "WO Cost Summary"
create_context_files "09-finance" "09.7" "Inventory Valuation FIFO/WAC"
create_context_files "09-finance" "09.8" "Currency Management"
create_context_files "09-finance" "09.9" "Tax Code Integration"
create_context_files "09-finance" "09.10" "Cost Center CRUD"
create_context_files "09-finance" "09.11" "Cost Rollup Multi-Level"
create_context_files "09-finance" "09.12" "Overhead Allocation"
create_context_files "09-finance" "09.13" "Material Variance"
create_context_files "09-finance" "09.14" "Labor Variance"
create_context_files "09-finance" "09.15" "Yield Scrap Variance"
create_context_files "09-finance" "09.16" "Real-Time Variance Dashboard"
create_context_files "09-finance" "09.17" "Variance Drill-Down"
create_context_files "09-finance" "09.18" "BOM Cost Simulation"
create_context_files "09-finance" "09.19" "Cost Reporting Suite"
create_context_files "09-finance" "09.20" "WO Cost by Operation"
create_context_files "09-finance" "09.21" "Margin Analysis"
create_context_files "09-finance" "09.22" "Cost Center Budget"
create_context_files "09-finance" "09.23" "Budget Management"
create_context_files "09-finance" "09.24" "Cost Dashboard Trends"
create_context_files "09-finance" "09.25" "Variance Root Cause"
create_context_files "09-finance" "09.26" "Comarch Integration"

# Epic 10 - OEE (11 incomplete stories)
echo ""
echo "=== Epic 10 - OEE ==="
create_context_files "10-oee" "10.10" "Machine Utilization Heatmap"
create_context_files "10-oee" "10.11" "Downtime Pareto Analysis"
create_context_files "10-oee" "10.12" "Performance Dashboard"
create_context_files "10-oee" "10.13" "Custom Report Builder"
create_context_files "10-oee" "10.14" "Email Alerts Shift Handover"
create_context_files "10-oee" "10.15" "Production Rate Tracking"
create_context_files "10-oee" "10.16" "MTBF MTTR Calculation"
create_context_files "10-oee" "10.17" "Bottleneck Analysis"
create_context_files "10-oee" "10.18" "Mobile Downtime Logging"
create_context_files "10-oee" "10.19" "TPM Benchmarking"
create_context_files "10-oee" "10.20" "Export to BI Tools"

# Epic 11 - Integrations (14 incomplete stories)
echo ""
echo "=== Epic 11 - Integrations ==="
create_context_files "11-integrations" "11.4" "Webhook Configuration"
create_context_files "11-integrations" "11.5" "Data Export"
create_context_files "11-integrations" "11.6" "Supplier Portal Comarch"
create_context_files "11-integrations" "11.7" "Customer Portal"
create_context_files "11-integrations" "11.8" "EDI ORDERS Inbound"
create_context_files "11-integrations" "11.9" "EDI INVOIC Outbound"
create_context_files "11-integrations" "11.10" "EDI DESADV Outbound"
create_context_files "11-integrations" "11.11" "Import Templates"
create_context_files "11-integrations" "11.12" "Retry Logic DLQ"
create_context_files "11-integrations" "11.13" "Comarch Advanced"
create_context_files "11-integrations" "11.14" "XML Export"
create_context_files "11-integrations" "11.15" "EDI Advanced"
create_context_files "11-integrations" "11.16" "Comarch Payment"
create_context_files "11-integrations" "11.17" "Custom Builder"
create_context_files "11-integrations" "11.18" "API Marketplace"

echo ""
echo "=== Summary ==="
echo "Context file generation complete!"
echo "Run this script to generate all missing context files automatically."
