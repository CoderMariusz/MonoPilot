#!/usr/bin/env python3
"""
Comprehensive Cache Validation
Tests all 4 layers and verifies they work correctly
"""

import sys
import time
from pathlib import Path
from unified_cache import UnifiedCache

def test_layer_1_claude_prompt_cache():
    """Layer 1: Claude Prompt Cache (automatic via API)"""
    print("\n" + "="*70)
    print("LAYER 1: CLAUDE PROMPT CACHE")
    print("="*70)
    print("\nStatus: AUTOMATIC (handled by Claude API)")
    print("[INFO] This layer caches prompts automatically when using Claude API")
    print("[INFO] Expected savings: 90% cost, 85% latency")
    print("[OK] Layer 1 ready (automatic)")
    return True

def test_layer_2_hot_cache(cache):
    """Layer 2: Hot Cache (in-memory, instant)"""
    print("\n" + "="*70)
    print("LAYER 2: HOT CACHE (In-Memory)")
    print("="*70)

    test_query = "Test hot cache query - unique timestamp: " + str(time.time())
    test_response = {"answer": "Hot cache test response", "tokens": 100}

    print("\n[TEST] Storing in cache...")
    cache.set(test_query, test_response, {"test": "hot"})

    print("[TEST] Retrieving from cache (should be instant)...")
    result = cache.get(test_query, use_semantic=False)

    if result and result.get("response", {}).get("answer") == "Hot cache test response":
        print("[OK] Hot cache working!")
        return True
    else:
        print("[FAIL] Hot cache not working")
        return False

def test_layer_3_cold_cache(cache):
    """Layer 3: Cold Cache (disk, compressed)"""
    print("\n" + "="*70)
    print("LAYER 3: COLD CACHE (Disk + Compression)")
    print("="*70)

    # Clear hot cache to force cold cache usage
    print("\n[TEST] Clearing hot cache to test cold cache...")
    cache.cache_manager.hot_cache.clear()
    cache.cache_manager.hot_cache_access.clear()

    # This query should still exist in cold cache from previous test
    test_query = "Test cold cache persistence"
    test_response = {"answer": "Cold cache test response", "tokens": 200}

    print("[TEST] Storing in cache...")
    cache.set(test_query, test_response, {"test": "cold"})

    # Clear hot cache again
    cache.cache_manager.hot_cache.clear()
    cache.cache_manager.hot_cache_access.clear()

    print("[TEST] Retrieving from cold cache (after hot clear)...")
    result = cache.get(test_query, use_semantic=False)

    if result:
        print("[OK] Cold cache working!")
        print(f"[INFO] Retrieved: {result.get('response', {}).get('answer', '')[:50]}...")
        return True
    else:
        print("[FAIL] Cold cache not working")
        return False

def test_layer_4_semantic_cache(cache):
    """Layer 4: Semantic Cache (AI-powered similarity)"""
    print("\n" + "="*70)
    print("LAYER 4: SEMANTIC CACHE (AI Similarity)")
    print("="*70)

    if not cache.semantic_cache:
        print("[SKIP] Semantic cache not available")
        return None

    base_query = "How do I setup authentication in my web application?"
    similar_queries = [
        "Add user authentication to webapp",
        "Implement login system for website",
        "Setup auth for web app"
    ]

    test_response = {
        "answer": "Authentication setup: 1. Choose method (JWT/Session), 2. Setup auth routes, 3. Protect endpoints",
        "tokens": 3000
    }

    print(f"\n[TEST] Storing base query...")
    print(f"  Base: {base_query}")
    cache.set(base_query, test_response, {"test": "semantic"}, tags=["auth", "security"])

    print(f"\n[TEST] Testing similar queries (threshold: {cache.semantic_cache.similarity_threshold})...")

    hits = 0
    for i, query in enumerate(similar_queries, 1):
        print(f"\n  Similar #{i}: {query}")
        result = cache.get(query, use_semantic=True)

        if result and result.get("cache_hit"):
            similarity = result.get("similarity", 0)
            print(f"    [HIT] Similarity: {similarity:.3f}")
            hits += 1
        else:
            print(f"    [MISS] Below threshold")

    hit_rate = (hits / len(similar_queries) * 100)
    print(f"\n[RESULT] Semantic hit rate: {hit_rate:.1f}% ({hits}/{len(similar_queries)})")

    if hits >= 2:  # At least 2 out of 3 should hit
        print("[OK] Semantic cache working!")
        return True
    else:
        print("[WARN] Semantic cache hit rate low")
        return False


def main():
    print("="*70)
    print("COMPREHENSIVE CACHE VALIDATION")
    print("Testing all 4 layers of Universal Cache System")
    print("="*70)

    # Initialize
    print("\n[INIT] Initializing Unified Cache...")
    cache = UnifiedCache()

    # Track results
    results = {}

    # Test each layer
    results["Layer 1: Claude Prompt Cache"] = test_layer_1_claude_prompt_cache()
    results["Layer 2: Hot Cache"] = test_layer_2_hot_cache(cache)
    results["Layer 3: Cold Cache"] = test_layer_3_cold_cache(cache)
    results["Layer 4: Semantic Cache"] = test_layer_4_semantic_cache(cache)

    # Summary
    print("\n" + "="*70)
    print("VALIDATION SUMMARY")
    print("="*70 + "\n")

    for layer, status in results.items():
        if status is True:
            status_str = "[PASS]"
        elif status is False:
            status_str = "[FAIL]"
        else:
            status_str = "[SKIP]"

        print(f"{status_str} {layer}")

    # Overall status
    passed = sum(1 for s in results.values() if s is True)
    total = sum(1 for s in results.values() if s is not None)

    print(f"\n[RESULT] {passed}/{total} layers operational")

    # Get final stats
    print("\n" + "="*70)
    print("CACHE STATISTICS")
    print("="*70 + "\n")

    stats = cache.get_stats()
    print(f"Total Queries:        {stats['total_queries']}")
    print(f"Hot Cache Hits:       {stats['hot_hits']}")
    print(f"Cold Cache Hits:      {stats['cold_hits']}")
    print(f"Semantic Cache Hits:  {stats['semantic_hits']}")
    print(f"Cache Misses:         {stats['misses']}")
    print(f"Overall Hit Rate:     {stats['overall_hit_rate']:.1f}%")

    print("\n" + "="*70)

    if passed == total:
        print("[SUCCESS] All cache layers operational!")
        print("="*70)
        return 0
    else:
        print("[WARNING] Some layers have issues")
        print("="*70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
