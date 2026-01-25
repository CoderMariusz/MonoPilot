#!/bin/bash
# append-checkpoint.sh - Simplified checkpoint writing
# Usage: ./scripts/append-checkpoint.sh STORY_ID PHASE AGENT "metrics"

STORY_ID="$1"
PHASE="$2"
AGENT="$3"
METRICS="$4"
TIMESTAMP=$(date +%H:%M)

CHECKPOINT_FILE=".claude/checkpoints/${STORY_ID}.yaml"

# Ensure directory exists
mkdir -p "$(dirname "$CHECKPOINT_FILE")"

# Append checkpoint line
echo "P${PHASE}: ✓ ${AGENT} ${TIMESTAMP} ${METRICS}" >> "$CHECKPOINT_FILE"

echo "✓ Checkpoint written: P${PHASE} for ${STORY_ID}"
