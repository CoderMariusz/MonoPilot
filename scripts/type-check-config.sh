#!/bin/bash
# TypeScript Check Enforcement Configuration for MonoPilot
# Controls the enforcement level for TypeScript checking
#
# This file is sourced by type-check-monitor.sh and pre-push hook

# ============================================
# ENFORCEMENT MODE
# ============================================
# - "warn": Show errors but don't block (Phase 1 - Current)
# - "prevent-regression": Block only if errors increase (Phase 2)
# - "strict": Block all errors (Phase 3 - Target)
ENFORCEMENT_MODE="${ENFORCEMENT_MODE:-warn}"

# ============================================
# THRESHOLDS
# ============================================
# Baseline error count (updated as errors are fixed)
# Last updated: 2024-12-30
BASELINE_ERRORS=298

# Error count at which strict mode auto-activates
STRICT_MODE_THRESHOLD=50

# ============================================
# PHASE TRANSITIONS
# ============================================
# Phase 1 (Week 1-2): warn
#   - Shows errors but doesn't block pushes
#   - CI/CD reports but doesn't fail
#   - Team gets familiar with error reporting
#
# Phase 2 (Week 3-4): prevent-regression
#   - Blocks if error count increases
#   - Allows push if errors same or decreased
#   - Prevents new regressions
#
# Phase 3 (After <50 errors): strict
#   - Blocks all pushes with any errors
#   - Full type safety enforced
#   - CI/CD fails on any error

# ============================================
# HELPER FUNCTIONS
# ============================================

# Get the current enforcement mode description
get_enforcement_mode_description() {
    case "$ENFORCEMENT_MODE" in
        warn)
            echo "Warning Only (Phase 1) - Errors shown but not blocking"
            ;;
        prevent-regression)
            echo "Prevent Regression (Phase 2) - Blocks only if errors increase"
            ;;
        strict)
            echo "Strict (Phase 3) - All errors block"
            ;;
        *)
            echo "Unknown mode: $ENFORCEMENT_MODE"
            ;;
    esac
}

# Check if we should auto-upgrade to strict mode
should_auto_enable_strict() {
    local current_errors="$1"
    if [[ "$current_errors" -lt "$STRICT_MODE_THRESHOLD" ]]; then
        return 0  # true - should enable strict
    fi
    return 1  # false - not yet
}

# Get progress percentage toward strict mode
get_progress_percentage() {
    local current_errors="$1"
    local errors_to_fix=$((BASELINE_ERRORS - STRICT_MODE_THRESHOLD))
    local errors_fixed=$((BASELINE_ERRORS - current_errors))

    if [[ $errors_to_fix -le 0 ]]; then
        echo "100"
        return
    fi

    local percentage=$((errors_fixed * 100 / errors_to_fix))
    if [[ $percentage -lt 0 ]]; then
        percentage=0
    elif [[ $percentage -gt 100 ]]; then
        percentage=100
    fi

    echo "$percentage"
}

# Export variables and functions for sourcing scripts
export ENFORCEMENT_MODE
export BASELINE_ERRORS
export STRICT_MODE_THRESHOLD
