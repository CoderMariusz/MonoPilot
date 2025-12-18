#!/usr/bin/env python3
"""
Test Claude Prompt Cache
Sprawdza czy cache API działa i pokazuje oszczędności
"""

import os
import sys

# Check for API key
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in environment")
    print("Set it in .env.local or export it:")
    print('  export ANTHROPIC_API_KEY="sk-ant-..."')
    sys.exit(1)

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed")
    print("Install it: pip install anthropic")
    sys.exit(1)

print("="*70)
print("CLAUDE PROMPT CACHE TEST")
print("="*70)
print()

# Initialize client
client = anthropic.Anthropic(api_key=api_key)

# Create a long prompt that will benefit from caching
# The prompt must be >1024 tokens for Sonnet
base_context = """
You are an expert software architect helping with a food manufacturing MES system.

The system has the following modules:
1. Settings - User management, company settings, roles
2. Technical - Product formulations, BOMs, recipes
3. Planning - Production orders, scheduling
4. Production - Work orders, material consumption
5. Warehouse - Inventory, license plates, picking
6. Quality - Testing, inspections, compliance
7. Shipping - Orders, pallet building, dispatch

Tech stack:
- Frontend: Next.js 15, React 19, TypeScript, TailwindCSS
- Backend: Supabase (PostgreSQL + RLS)
- Validation: Zod schemas
- Testing: Vitest, Playwright

Key patterns:
- Multi-tenancy with RLS
- License Plate (LP) based inventory
- FIFO/FEFO picking
- GS1 compliance (GTIN-14, SSCC-18)
- BOM snapshot on work order creation
""" * 5  # Repeat to get >1024 tokens

# Test question
question = "How should I implement the license plate tracking system?"

print("[TEST] Testing Claude Prompt Cache...")
print(f"Context size: ~{len(base_context.split())} words")
print()

# REQUEST 1: No cache (first time)
print("="*70)
print("REQUEST 1: Initial request (no cache)")
print("="*70)
print()

try:
    response1 = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=200,
        system=[
            {
                "type": "text",
                "text": base_context,
                "cache_control": {"type": "ephemeral"}  # Enable caching
            }
        ],
        messages=[
            {
                "role": "user",
                "content": question
            }
        ]
    )

    # Display usage
    usage1 = response1.usage
    print(f"Input tokens:              {usage1.input_tokens}")
    print(f"Cache creation tokens:     {getattr(usage1, 'cache_creation_input_tokens', 0)}")
    print(f"Cache read tokens:         {getattr(usage1, 'cache_read_input_tokens', 0)}")
    print(f"Output tokens:             {usage1.output_tokens}")
    print()

    # Calculate cost
    input_cost = usage1.input_tokens * 3 / 1_000_000
    cache_write_cost = getattr(usage1, 'cache_creation_input_tokens', 0) * 3.75 / 1_000_000
    output_cost = usage1.output_tokens * 15 / 1_000_000
    total_cost1 = input_cost + cache_write_cost + output_cost

    print(f"Cost breakdown:")
    print(f"  Input:        ${input_cost:.6f}")
    print(f"  Cache write:  ${cache_write_cost:.6f}")
    print(f"  Output:       ${output_cost:.6f}")
    print(f"  TOTAL:        ${total_cost1:.6f}")
    print()

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

# Wait a moment
import time
print("Waiting 2 seconds...")
time.sleep(2)
print()

# REQUEST 2: Should use cache
print("="*70)
print("REQUEST 2: Same request (should use cache)")
print("="*70)
print()

try:
    response2 = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=200,
        system=[
            {
                "type": "text",
                "text": base_context,  # Same context!
                "cache_control": {"type": "ephemeral"}
            }
        ],
        messages=[
            {
                "role": "user",
                "content": question
            }
        ]
    )

    # Display usage
    usage2 = response2.usage
    print(f"Input tokens:              {usage2.input_tokens}")
    print(f"Cache creation tokens:     {getattr(usage2, 'cache_creation_input_tokens', 0)}")
    print(f"Cache read tokens:         {getattr(usage2, 'cache_read_input_tokens', 0)}")
    print(f"Output tokens:             {usage2.output_tokens}")
    print()

    # Calculate cost
    input_cost2 = usage2.input_tokens * 3 / 1_000_000
    cache_read_cost = getattr(usage2, 'cache_read_input_tokens', 0) * 0.30 / 1_000_000  # 90% cheaper!
    output_cost2 = usage2.output_tokens * 15 / 1_000_000
    total_cost2 = input_cost2 + cache_read_cost + output_cost2

    print(f"Cost breakdown:")
    print(f"  Input:        ${input_cost2:.6f}")
    print(f"  Cache read:   ${cache_read_cost:.6f} (90% cheaper!)")
    print(f"  Output:       ${output_cost2:.6f}")
    print(f"  TOTAL:        ${total_cost2:.6f}")
    print()

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

# RESULTS
print("="*70)
print("RESULTS")
print("="*70)
print()

cache_read_tokens = getattr(usage2, 'cache_read_input_tokens', 0)

if cache_read_tokens > 0:
    print("[SUCCESS] CACHE WORKING!")
    print()
    print(f"Cache read tokens: {cache_read_tokens}")
    print(f"Cache hit rate:    {(cache_read_tokens / (cache_read_tokens + usage2.input_tokens) * 100):.1f}%")
    print()

    # Savings
    savings = total_cost1 - total_cost2
    savings_pct = (savings / total_cost1 * 100) if total_cost1 > 0 else 0

    print(f"Cost comparison:")
    print(f"  Request 1 (no cache):  ${total_cost1:.6f}")
    print(f"  Request 2 (cached):    ${total_cost2:.6f}")
    print(f"  Savings:               ${savings:.6f} ({savings_pct:.1f}%)")
    print()

    # Extrapolate
    monthly_requests = 1000
    monthly_without = total_cost1 * monthly_requests
    monthly_with = (total_cost1 + total_cost2 * (monthly_requests - 1))
    monthly_savings = monthly_without - monthly_with

    print(f"Projected monthly savings (1000 requests):")
    print(f"  Without cache: ${monthly_without:.2f}")
    print(f"  With cache:    ${monthly_with:.2f}")
    print(f"  SAVINGS:       ${monthly_savings:.2f}/month")
    print()

else:
    print("[FAIL] CACHE NOT WORKING")
    print()
    print("Possible reasons:")
    print("  1. Cache hasn't been created yet (try again in 5 min)")
    print("  2. Prompt too short (needs >1024 tokens for Sonnet)")
    print("  3. Context changed between requests")
    print()

print("="*70)
print()

# Show actual responses (truncated)
print("Sample responses:")
print()
print("Request 1:")
print(response1.content[0].text[:200] + "...")
print()
print("Request 2:")
print(response2.content[0].text[:200] + "...")
print()

print("="*70)
print("Test complete! Check console.anthropic.com/usage for full details")
print("="*70)
