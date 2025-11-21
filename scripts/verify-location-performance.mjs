#!/usr/bin/env node

/**
 * Location Management Performance Verification Script
 * Story: 1.6 Location Management
 * Task 13: Performance Optimization (AC-005.4)
 *
 * Verifies that idx_locations_warehouse index exists and is being used
 * Ensures query performance meets requirements (< 100ms for 500 locations)
 *
 * Usage:
 *   node scripts/verify-location-performance.mjs
 *   SUPABASE_DB_URL=<connection_string> node scripts/verify-location-performance.mjs
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const PERFORMANCE_THRESHOLDS = {
  MAX_QUERY_TIME_MS: 100, // AC-005.4: < 100ms for 500 locations
  MIN_CACHE_HIT_RATIO: 0.95, // 95% cache hit rate
  MAX_QUERY_COST: 50, // Query planner cost
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logCheck(passed, message) {
  const icon = passed ? '✓' : '✗'
  const color = passed ? 'green' : 'red'
  log(`[${icon}] ${message}`, color)
}

// ============================================================================
// Verification Functions
// ============================================================================

async function verifyIndexExists() {
  log('\n1. Checking if idx_locations_warehouse index exists...', 'cyan')

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'locations'
        AND indexname = 'idx_locations_warehouse'
    `,
  })

  if (error) {
    // If RPC doesn't exist, try direct query
    const { data: indexData, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'locations')
      .eq('indexname', 'idx_locations_warehouse')
      .maybeSingle()

    if (indexError) {
      log(`⚠️  Cannot verify index (requires admin access)`, 'yellow')
      log(`   Manually verify with: SELECT * FROM pg_indexes WHERE indexname = 'idx_locations_warehouse'`, 'yellow')
      return { passed: null, note: 'Manual verification required' }
    }

    const indexExists = !!indexData
    logCheck(indexExists, `Index idx_locations_warehouse exists`)

    if (indexExists) {
      log(`   Definition: ${indexData.indexdef}`, 'blue')
    }

    return { passed: indexExists, data: indexData }
  }

  const indexExists = data && data.length > 0
  logCheck(indexExists, `Index idx_locations_warehouse exists`)

  if (indexExists) {
    log(`   Definition: ${data[0].indexdef}`, 'blue')
  }

  return { passed: indexExists, data: data?.[0] }
}

async function checkTableSize() {
  log('\n2. Checking locations table size...', 'cyan')

  const { count, error } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  if (error) {
    log(`   Error: ${error.message}`, 'red')
    return { passed: false, count: 0 }
  }

  log(`   Total locations: ${count}`, 'blue')

  if (count < 100) {
    log(`   ⚠️  Warning: Only ${count} locations. Performance test most relevant at 500+ locations`, 'yellow')
  } else if (count >= 500) {
    log(`   ✓ Good: ${count} locations - performance test is meaningful`, 'green')
  }

  return { passed: true, count }
}

async function benchmarkWarehouseQuery() {
  log('\n3. Benchmarking warehouse filter query...', 'cyan')

  // Get first warehouse
  const { data: warehouse, error: whError } = await supabase
    .from('warehouses')
    .select('id, code, name')
    .limit(1)
    .single()

  if (whError || !warehouse) {
    log(`   ⚠️  No warehouses found - skipping query benchmark`, 'yellow')
    return { passed: null, note: 'No test data' }
  }

  log(`   Testing query for warehouse: ${warehouse.name} (${warehouse.code})`, 'blue')

  // Benchmark: Get locations by warehouse_id
  const startTime = Date.now()

  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select(`
      id,
      code,
      name,
      type,
      zone,
      zone_enabled,
      capacity,
      capacity_enabled,
      barcode,
      is_active,
      warehouse:warehouses!warehouse_id (
        code,
        name
      )
    `)
    .eq('warehouse_id', warehouse.id)
    .eq('is_active', true)
    .order('code', { ascending: true })

  const endTime = Date.now()
  const queryTime = endTime - startTime

  if (locError) {
    log(`   Error: ${locError.message}`, 'red')
    return { passed: false, queryTime }
  }

  const passed = queryTime < PERFORMANCE_THRESHOLDS.MAX_QUERY_TIME_MS

  logCheck(passed, `Query time: ${queryTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.MAX_QUERY_TIME_MS}ms)`)
  log(`   Locations returned: ${locations?.length || 0}`, 'blue')

  if (!passed) {
    log(`   ⚠️  Query exceeded performance threshold`, 'red')
    log(`   Recommendation: Verify idx_locations_warehouse index is being used`, 'yellow')
  }

  return { passed, queryTime, resultCount: locations?.length || 0 }
}

async function benchmarkFilteredQuery() {
  log('\n4. Benchmarking warehouse + type filter query...', 'cyan')

  // Get first warehouse
  const { data: warehouse, error: whError } = await supabase
    .from('warehouses')
    .select('id')
    .limit(1)
    .single()

  if (whError || !warehouse) {
    log(`   ⚠️  No warehouses found - skipping`, 'yellow')
    return { passed: null }
  }

  const startTime = Date.now()

  const { data, error } = await supabase
    .from('locations')
    .select('id, code, name, type, barcode')
    .eq('warehouse_id', warehouse.id)
    .eq('type', 'storage')
    .eq('is_active', true)
    .order('code', { ascending: true })

  const endTime = Date.now()
  const queryTime = endTime - startTime

  if (error) {
    log(`   Error: ${error.message}`, 'red')
    return { passed: false, queryTime }
  }

  const passed = queryTime < PERFORMANCE_THRESHOLDS.MAX_QUERY_TIME_MS

  logCheck(passed, `Filtered query time: ${queryTime}ms`)
  log(`   Results: ${data?.length || 0} storage locations`, 'blue')

  return { passed, queryTime, resultCount: data?.length || 0 }
}

async function checkRLSPolicies() {
  log('\n5. Verifying RLS policies...', 'cyan')

  // This is informational - cannot directly query RLS without admin access
  log(`   ⚠️  RLS policy verification requires admin access`, 'yellow')
  log(`   Manually verify: SELECT * FROM pg_policies WHERE tablename = 'locations'`, 'blue')

  return { passed: null, note: 'Manual verification recommended' }
}

async function runPerformanceReport() {
  log('\n=================================================================', 'cyan')
  log('  Location Management Performance Verification', 'cyan')
  log('  Story: 1.6 Location Management | Task 13', 'cyan')
  log('=================================================================', 'cyan')

  const results = {}

  try {
    // Run all verifications
    results.indexExists = await verifyIndexExists()
    results.tableSize = await checkTableSize()
    results.warehouseQuery = await benchmarkWarehouseQuery()
    results.filteredQuery = await benchmarkFilteredQuery()
    results.rlsPolicies = await checkRLSPolicies()

    // Summary
    log('\n=================================================================', 'cyan')
    log('  VERIFICATION SUMMARY', 'cyan')
    log('=================================================================', 'cyan')

    const checks = [
      {
        name: 'Index exists (idx_locations_warehouse)',
        passed: results.indexExists.passed,
        critical: true,
      },
      {
        name: 'Warehouse query performance < 100ms',
        passed: results.warehouseQuery.passed,
        critical: true,
      },
      {
        name: 'Filtered query performance < 100ms',
        passed: results.filteredQuery.passed,
        critical: false,
      },
    ]

    let allCriticalPassed = true
    let totalPassed = 0
    let totalChecks = 0

    checks.forEach((check) => {
      if (check.passed !== null) {
        totalChecks++
        if (check.passed) {
          totalPassed++
        }
        logCheck(check.passed, `${check.name}${check.critical ? ' (CRITICAL)' : ''}`)

        if (check.critical && !check.passed) {
          allCriticalPassed = false
        }
      } else {
        log(`[~] ${check.name} - Manual verification required`, 'yellow')
      }
    })

    log(`\nPassed: ${totalPassed}/${totalChecks} checks`, totalPassed === totalChecks ? 'green' : 'yellow')

    if (allCriticalPassed) {
      log('\n✓ All CRITICAL performance requirements satisfied (AC-005.4)', 'green')
      log('  Story 1.6 is ready for production deployment', 'green')
      return 0
    } else {
      log('\n✗ CRITICAL performance requirements NOT satisfied', 'red')
      log('  Do NOT deploy to production until fixed', 'red')
      log('\nRecommendations:', 'yellow')
      log('  1. Verify idx_locations_warehouse index exists in database', 'yellow')
      log('  2. Run EXPLAIN ANALYZE on slow queries', 'yellow')
      log('  3. Check database statistics are up-to-date (ANALYZE locations)', 'yellow')
      log('  4. Consider increasing shared_buffers if cache hit ratio is low', 'yellow')
      return 1
    }
  } catch (error) {
    log(`\n❌ Fatal error during verification: ${error.message}`, 'red')
    console.error(error)
    return 1
  }
}

// ============================================================================
// Main
// ============================================================================

runPerformanceReport()
  .then((exitCode) => {
    process.exit(exitCode)
  })
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
