#!/usr/bin/env python3
"""
Token Tracking for Wrapper vs Pure Claude
Monitors .claude/checkpoints/*.yaml and tallies tokens

Usage:
    python track_tokens.py --baseline-file before.txt --current-file after.txt
"""

import json
import re
from pathlib import Path

def parse_claude_code_output(logfile):
    """Parse Claude Code console output for token usage"""
    with open(logfile) as f:
        content = f.read()

    # Extract: "Token usage: X/1000000"
    matches = re.findall(r'Token usage: (\d+)/\d+', content)
    total_tokens = sum(int(m) for m in matches)

    return {
        "total_tokens": total_tokens,
        "messages": len(matches),
        "avg_per_message": total_tokens / len(matches) if matches else 0
    }

def compare_token_usage(baseline_file, wrapper_file):
    """Compare token usage between baseline and wrapper runs"""

    baseline = parse_claude_code_output(baseline_file)
    wrapper = parse_claude_code_output(wrapper_file)

    savings_tokens = baseline["total_tokens"] - wrapper["total_tokens"]
    savings_pct = (savings_tokens / baseline["total_tokens"]) * 100

    # Calculate costs (Sonnet: $3/M input, $15/M output, assume 50/50 split)
    avg_cost_per_token = (3 + 15) / 2 / 1_000_000
    baseline_cost = baseline["total_tokens"] * avg_cost_per_token
    wrapper_cost = wrapper["total_tokens"] * avg_cost_per_token

    # Add GLM cost (from wrapper logs - parse separately)
    glm_tokens = extract_glm_tokens(wrapper_file)
    glm_cost = glm_tokens * 0.14 / 1_000_000
    total_wrapper_cost = wrapper_cost + glm_cost

    print(f"""
╔══════════════════════════════════════════════════════════╗
║           TOKEN SAVINGS REPORT - Wrapper vs Baseline     ║
╚══════════════════════════════════════════════════════════╝

BASELINE (Pure Claude):
  Total tokens:    {baseline['total_tokens']:,}
  Messages:        {baseline['messages']}
  Avg per message: {baseline['avg_per_message']:.0f}
  Cost:            ${baseline_cost:.2f}

WRAPPER (Claude + GLM):
  Claude tokens:   {wrapper['total_tokens']:,}
  GLM tokens:      {glm_tokens:,}
  Total tokens:    {wrapper['total_tokens'] + glm_tokens:,}
  Cost (Claude):   ${wrapper_cost:.2f}
  Cost (GLM):      ${glm_cost:.2f}
  Total cost:      ${total_wrapper_cost:.2f}

SAVINGS:
  Claude tokens:   {savings_tokens:,} ({savings_pct:.1f}%)
  Cost savings:    ${baseline_cost - total_wrapper_cost:.2f} ({((baseline_cost - total_wrapper_cost) / baseline_cost * 100):.1f}%)

ANALYSIS:
  - Orchestration overhead: {baseline['total_tokens'] - wrapper['total_tokens']:,} tokens saved
  - GLM execution: {glm_tokens:,} tokens (${glm_cost:.2f})
  - Net savings: ${baseline_cost - total_wrapper_cost:.2f}
""")

def extract_glm_tokens(logfile):
    """Extract GLM token usage from stderr logs"""
    try:
        with open(logfile) as f:
            content = f.read()

        # Look for: [GLM WRAPPER] ... Tokens: 1234
        matches = re.findall(r'Tokens:\s*(\d+)', content)
        return sum(int(m) for m in matches)
    except:
        return 0

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline-file", required=True)
    parser.add_argument("--current-file", required=True)
    args = parser.parse_args()

    compare_token_usage(args.baseline_file, args.current_file)
