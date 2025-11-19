#!/bin/bash

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg"
BASE_URL="https://pgroxddbtaevdegnidaz.supabase.co/rest/v1"

tables=(
  allergens asn_items asns audit_log bom_costs bom_history bom_items boms
  grn_items grns license_plates locations lp_compositions lp_genealogy lp_reservations
  machines organizations pallet_items pallets po_correction po_header po_line
  product_allergens production_lines production_outputs products routing_operation_names
  routing_operations routings sessions settings settings_tax_codes settings_warehouse
  stock_moves suppliers tax_codes to_header to_line users warehouse_settings warehouses
  wo_by_products wo_costs wo_materials wo_operations wo_reservations work_orders
)

echo "Testing ${#tables[@]} tables..."
echo ""

ok_count=0
fail_count=0
failed_tables=""

for table in "${tables[@]}"; do
  result=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$table?select=id&limit=1" -H "apikey: $API_KEY")
  if [ "$result" = "200" ]; then
    echo "OK: $table"
    ((ok_count++))
  else
    echo "FAIL: $table (HTTP $result)"
    ((fail_count++))
    failed_tables="$failed_tables $table"
  fi
done

echo ""
echo "=== SUMMARY ==="
echo "OK: $ok_count"
echo "FAILED: $fail_count"
if [ -n "$failed_tables" ]; then
  echo "Failed tables:$failed_tables"
fi
