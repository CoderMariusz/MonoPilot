#!/usr/bin/env python3
"""
Test different similarity thresholds to find optimal value
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from semantic_cache import SemanticCache

def test_threshold(threshold: float):
    """Test semantic cache with given threshold"""
    print(f"\n{'='*60}")
    print(f"Testing with threshold: {threshold}")
    print(f"{'='*60}\n")

    # Create cache with custom threshold
    cache = SemanticCache()
    cache.similarity_threshold = threshold

    # Clear previous data
    cache.clear_cache()

    # Test queries (similar but not identical)
    queries = [
        "How to implement JWT authentication in Node.js?",
        "Add user authentication with JWT tokens",
        "Implement login system with JWT",
        "What's the best way to handle JWT auth in Node?",
        "Create REST API endpoint for user data",
        "Build API route to fetch users"
    ]

    # Store first query
    print("Storing base query...")
    cache.store(
        query=queries[0],
        response={
            "answer": "To implement JWT auth: 1. Install jsonwebtoken, 2. Create middleware...",
            "tokens_used": 5000
        },
        metadata={
            "agent": "BACKEND-DEV",
            "quality_score": 0.95,
            "project": "test-project"
        },
        tags=["authentication", "jwt", "nodejs", "security"]
    )

    # Test similar queries
    print("\nTesting similar queries:\n")
    hits = 0
    total = len(queries) - 1

    for query in queries[1:]:
        print(f"Query: {query[:50]}...")
        result = cache.search_similar(query)

        if result and result["cache_hit"]:
            similarity = result['similarity']
            print(f"  [HIT] Similarity: {similarity:.4f}")
            hits += 1
        else:
            print(f"  [MISS]")

    hit_rate = (hits / total * 100) if total > 0 else 0
    print(f"\n{'='*60}")
    print(f"Threshold {threshold}: {hits}/{total} hits ({hit_rate:.1f}%)")
    print(f"{'='*60}")

    return hit_rate

if __name__ == "__main__":
    print("\n" + "="*60)
    print("SEMANTIC CACHE THRESHOLD TUNING")
    print("="*60)

    # Test different thresholds
    thresholds = [0.90, 0.85, 0.80, 0.78, 0.75, 0.70, 0.65]
    results = {}

    for threshold in thresholds:
        try:
            hit_rate = test_threshold(threshold)
            results[threshold] = hit_rate
        except Exception as e:
            print(f"[ERROR] Failed at threshold {threshold}: {e}")
            continue

    # Summary
    print("\n\n" + "="*60)
    print("SUMMARY - Hit Rates by Threshold")
    print("="*60)

    for threshold, hit_rate in sorted(results.items(), reverse=True):
        bar = "█" * int(hit_rate / 2)  # Visual bar
        print(f"  {threshold:.2f}: {hit_rate:5.1f}% {bar}")

    # Find optimal
    if results:
        optimal = max(results.items(), key=lambda x: (x[1], -x[0]))  # Max hit rate, prefer higher threshold
        print(f"\n[RECOMMEND] Optimal threshold: {optimal[0]:.2f} ({optimal[1]:.1f}% hit rate)")

    print("\n[OK] Threshold tuning complete!")
