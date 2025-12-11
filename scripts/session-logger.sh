#!/bin/bash
# Session Logger for Claude Code
# Logs session metrics to .claude/logs/sessions/
#
# Usage: Called by hooks or manually
#   bash scripts/session-logger.sh start
#   bash scripts/session-logger.sh log "event_type" "details"
#   bash scripts/session-logger.sh end
#
# Version: 1.0

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/.claude/logs/sessions"
METRICS_FILE="$PROJECT_ROOT/.claude/METRICS.md"
SESSION_FILE=""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get current session file
get_session_file() {
    local today=$(date +%Y-%m-%d)
    local session_id=$(date +%H%M%S)
    SESSION_FILE="$LOG_DIR/session-$today-$session_id.jsonl"
}

# Initialize logging
init_logging() {
    mkdir -p "$LOG_DIR"
    get_session_file

    # Create session start entry
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "{\"event\":\"session_start\",\"timestamp\":\"$timestamp\",\"project\":\"$(basename "$PROJECT_ROOT")\"}" >> "$SESSION_FILE"

    # Store session file path for later use
    echo "$SESSION_FILE" > "$LOG_DIR/.current_session"

    echo -e "${GREEN}Session logging started: $SESSION_FILE${NC}"
}

# Log an event
log_event() {
    local event_type="$1"
    local details="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Get current session file
    if [ -f "$LOG_DIR/.current_session" ]; then
        SESSION_FILE=$(cat "$LOG_DIR/.current_session")
    else
        get_session_file
    fi

    # Escape details for JSON
    details=$(echo "$details" | sed 's/"/\\"/g' | tr '\n' ' ')

    echo "{\"event\":\"$event_type\",\"timestamp\":\"$timestamp\",\"details\":\"$details\"}" >> "$SESSION_FILE"
}

# Log agent invocation
log_agent() {
    local agent_name="$1"
    local task_type="$2"
    local status="$3"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    if [ -f "$LOG_DIR/.current_session" ]; then
        SESSION_FILE=$(cat "$LOG_DIR/.current_session")
    fi

    echo "{\"event\":\"agent_invocation\",\"timestamp\":\"$timestamp\",\"agent\":\"$agent_name\",\"task\":\"$task_type\",\"status\":\"$status\"}" >> "$SESSION_FILE"
}

# Log file change
log_file_change() {
    local file_path="$1"
    local change_type="$2"  # created, modified, deleted
    local lines_changed="$3"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    if [ -f "$LOG_DIR/.current_session" ]; then
        SESSION_FILE=$(cat "$LOG_DIR/.current_session")
    fi

    echo "{\"event\":\"file_change\",\"timestamp\":\"$timestamp\",\"file\":\"$file_path\",\"type\":\"$change_type\",\"lines\":$lines_changed}" >> "$SESSION_FILE"
}

# Log token usage
log_tokens() {
    local input_tokens="$1"
    local output_tokens="$2"
    local cost_usd="$3"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    if [ -f "$LOG_DIR/.current_session" ]; then
        SESSION_FILE=$(cat "$LOG_DIR/.current_session")
    fi

    echo "{\"event\":\"token_usage\",\"timestamp\":\"$timestamp\",\"input_tokens\":$input_tokens,\"output_tokens\":$output_tokens,\"cost_usd\":$cost_usd}" >> "$SESSION_FILE"
}

# End session and generate summary
end_session() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    if [ -f "$LOG_DIR/.current_session" ]; then
        SESSION_FILE=$(cat "$LOG_DIR/.current_session")
    else
        echo "No active session found"
        return 1
    fi

    # Add session end entry
    echo "{\"event\":\"session_end\",\"timestamp\":\"$timestamp\"}" >> "$SESSION_FILE"

    # Generate summary
    generate_summary

    # Clean up
    rm -f "$LOG_DIR/.current_session"

    echo -e "${GREEN}Session ended. Log: $SESSION_FILE${NC}"
}

# Generate session summary
generate_summary() {
    if [ ! -f "$SESSION_FILE" ]; then
        return
    fi

    local total_events=$(wc -l < "$SESSION_FILE")
    local agent_calls=$(grep -c "agent_invocation" "$SESSION_FILE" 2>/dev/null || echo "0")
    local file_changes=$(grep -c "file_change" "$SESSION_FILE" 2>/dev/null || echo "0")
    local token_events=$(grep -c "token_usage" "$SESSION_FILE" 2>/dev/null || echo "0")

    # Calculate totals from token events
    local total_input=0
    local total_output=0
    local total_cost=0

    if [ "$token_events" -gt 0 ]; then
        total_input=$(grep "token_usage" "$SESSION_FILE" | sed 's/.*"input_tokens":\([0-9]*\).*/\1/' | awk '{s+=$1} END {print s}')
        total_output=$(grep "token_usage" "$SESSION_FILE" | sed 's/.*"output_tokens":\([0-9]*\).*/\1/' | awk '{s+=$1} END {print s}')
    fi

    # Create summary file
    local summary_file="${SESSION_FILE%.jsonl}.summary.md"
    cat > "$summary_file" << EOF
# Session Summary

**Session:** $(basename "$SESSION_FILE")
**Date:** $(date +%Y-%m-%d)
**End Time:** $(date +%H:%M:%S)

## Metrics

| Metric | Value |
|--------|-------|
| Total Events | $total_events |
| Agent Calls | $agent_calls |
| File Changes | $file_changes |
| Input Tokens | $total_input |
| Output Tokens | $total_output |
| Total Tokens | $((total_input + total_output)) |

## Events Log
See: $(basename "$SESSION_FILE")
EOF

    echo -e "${CYAN}Summary: $summary_file${NC}"
}

# Update global metrics file
update_metrics() {
    local today=$(date +%Y-%m-%d)

    # Count today's sessions
    local today_sessions=$(ls -1 "$LOG_DIR"/session-$today-*.jsonl 2>/dev/null | wc -l)

    # Calculate total tokens today
    local today_tokens=0
    for session in "$LOG_DIR"/session-$today-*.jsonl; do
        if [ -f "$session" ]; then
            local session_tokens=$(grep "token_usage" "$session" 2>/dev/null | sed 's/.*"input_tokens":\([0-9]*\).*"output_tokens":\([0-9]*\).*/\1 \2/' | awk '{s+=$1+$2} END {print s}')
            today_tokens=$((today_tokens + ${session_tokens:-0}))
        fi
    done

    # Update METRICS.md
    cat > "$METRICS_FILE" << EOF
# Project Metrics

**Last Updated:** $(date +"%Y-%m-%d %H:%M:%S")

## Today ($today)

| Metric | Value |
|--------|-------|
| Sessions | $today_sessions |
| Total Tokens | $today_tokens |

## Recent Sessions

| Date | Session | Tokens | Agents |
|------|---------|--------|--------|
EOF

    # Add last 10 sessions
    for session in $(ls -1t "$LOG_DIR"/session-*.jsonl 2>/dev/null | head -10); do
        local session_name=$(basename "$session" .jsonl)
        local session_date=$(echo "$session_name" | cut -d'-' -f2-4)
        local tokens=$(grep "token_usage" "$session" 2>/dev/null | sed 's/.*"input_tokens":\([0-9]*\).*"output_tokens":\([0-9]*\).*/\1 \2/' | awk '{s+=$1+$2} END {print s}')
        local agents=$(grep -c "agent_invocation" "$session" 2>/dev/null || echo "0")
        echo "| $session_date | $session_name | ${tokens:-0} | $agents |" >> "$METRICS_FILE"
    done

    echo "" >> "$METRICS_FILE"
    echo "*Auto-generated by session-logger.sh*" >> "$METRICS_FILE"
}

# Show current session status
show_status() {
    echo ""
    echo -e "${CYAN}=== Session Logger Status ===${NC}"
    echo ""

    if [ -f "$LOG_DIR/.current_session" ]; then
        SESSION_FILE=$(cat "$LOG_DIR/.current_session")
        echo -e "Active session: ${GREEN}$(basename "$SESSION_FILE")${NC}"
        echo -e "Events logged: $(wc -l < "$SESSION_FILE")"
    else
        echo -e "${YELLOW}No active session${NC}"
    fi

    echo ""
    echo -e "Log directory: $LOG_DIR"
    echo -e "Total sessions: $(ls -1 "$LOG_DIR"/session-*.jsonl 2>/dev/null | wc -l)"
    echo ""
}

# Main command handler
case "${1:-status}" in
    start|init)
        init_logging
        ;;
    end|stop)
        end_session
        update_metrics
        ;;
    log)
        log_event "$2" "$3"
        ;;
    agent)
        log_agent "$2" "$3" "$4"
        ;;
    file)
        log_file_change "$2" "$3" "$4"
        ;;
    tokens)
        log_tokens "$2" "$3" "$4"
        ;;
    summary)
        generate_summary
        ;;
    metrics)
        update_metrics
        echo -e "${GREEN}Metrics updated: $METRICS_FILE${NC}"
        ;;
    status)
        show_status
        ;;
    *)
        echo "Session Logger v1.0"
        echo ""
        echo "Usage:"
        echo "  $0 start              Start new session"
        echo "  $0 end                End session and generate summary"
        echo "  $0 log TYPE DETAILS   Log custom event"
        echo "  $0 agent NAME TASK STATUS  Log agent invocation"
        echo "  $0 file PATH TYPE LINES    Log file change"
        echo "  $0 tokens IN OUT COST      Log token usage"
        echo "  $0 metrics            Update global metrics"
        echo "  $0 status             Show current status"
        ;;
esac
