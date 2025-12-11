#!/usr/bin/env python3
"""
Interactive Cache Test CLI
Version: 2.0.0
Purpose: Live testing of cache system with real prompts
"""

import json
import time
import sys
from pathlib import Path
from unified_cache import UnifiedCache
from global_cache import GlobalKnowledgeBase


class InteractiveCacheTest:
    """Interactive CLI for testing cache in real-time"""

    def __init__(self):
        print("="*70)
        print("INTERACTIVE CACHE TEST")
        print("Live testing with real prompts")
        print("="*70)
        print()

        # Load test prompts
        prompts_file = Path(__file__).parent / "live_test_prompts.json"
        with open(prompts_file) as f:
            self.test_data = json.load(f)

        # Initialize cache
        print("[INIT] Initializing cache system...")
        self.cache = UnifiedCache()

        # Initialize global KB
        print("[INIT] Connecting to global knowledge base...")
        self.global_kb = GlobalKnowledgeBase(project_name="MonoPilot")

        print()

    def show_menu(self):
        """Show main menu"""
        print("\n" + "="*70)
        print("MENU")
        print("="*70)
        print()
        print("1. Test Semantic Cache (similar queries)")
        print("2. Test Exact Match Cache (identical queries)")
        print("3. Test Global Knowledge Base (cross-project)")
        print("4. Stress Test (many variations)")
        print("5. Custom Query (enter your own)")
        print("6. View Cache Statistics")
        print("7. Clear All Caches")
        print("8. Exit")
        print()

    def test_semantic_cache(self):
        """Test semantic cache with similar queries"""
        print("\n" + "="*70)
        print("TEST: SEMANTIC CACHE")
        print("="*70)
        print()

        # Show categories
        categories = list(self.test_data["testCategories"].keys())
        print("Available categories:")
        for i, cat in enumerate(categories, 1):
            print(f"  {i}. {cat}")

        print()
        choice = input("Select category (1-10) or 'all': ").strip()

        if choice.lower() == 'all':
            selected_cats = categories
        else:
            try:
                idx = int(choice) - 1
                selected_cats = [categories[idx]]
            except:
                print("[ERROR] Invalid choice")
                return

        total_hits = 0
        total_queries = 0

        for cat in selected_cats:
            cat_data = self.test_data["testCategories"][cat]

            print(f"\n--- Category: {cat.upper()} ---")
            print(f"Base: {cat_data['basePrompt']}")

            # Store base query
            base_response = {
                "answer": f"This is a cached answer about {cat}",
                "tokens_used": 5000,
                "category": cat
            }

            self.cache.set(
                cat_data["basePrompt"],
                base_response,
                {"category": cat, "quality_score": 0.90},
                cat_data["tags"]
            )

            time.sleep(0.5)  # Give it a moment

            # Test similar queries
            print(f"\nTesting {len(cat_data['similarPrompts'])} similar queries:")

            for i, similar in enumerate(cat_data["similarPrompts"], 1):
                total_queries += 1
                print(f"\n  {i}. {similar[:60]}...")

                result = self.cache.get(similar)

                if result:
                    if result.get("similarity"):
                        print(f"     [HIT] Semantic (similarity: {result['similarity']:.3f})")
                        total_hits += 1
                    else:
                        print(f"     [HIT] Exact match")
                        total_hits += 1
                else:
                    print(f"     [MISS]")

        # Summary
        hit_rate = (total_hits / total_queries * 100) if total_queries > 0 else 0
        print(f"\n" + "="*70)
        print(f"RESULT: {total_hits}/{total_queries} hits ({hit_rate:.1f}%)")
        print("="*70)

    def test_exact_match(self):
        """Test exact match cache"""
        print("\n" + "="*70)
        print("TEST: EXACT MATCH CACHE")
        print("="*70)
        print()

        prompts = self.test_data["exactMatchTests"]["prompts"]

        print("Phase 1: Storing prompts...")
        for i, prompt in enumerate(prompts, 1):
            print(f"  {i}. {prompt}")
            self.cache.set(
                prompt,
                {"answer": f"Answer to: {prompt}", "tokens": 1000},
                {"test": "exact_match"}
            )

        print("\nPhase 2: Retrieving (should be 100% hit rate)...")
        hits = 0
        for i, prompt in enumerate(prompts, 1):
            print(f"  {i}. {prompt}")
            result = self.cache.get(prompt, use_semantic=False)
            if result:
                print(f"     [HIT]")
                hits += 1
            else:
                print(f"     [MISS]")

        hit_rate = (hits / len(prompts) * 100)
        print(f"\n[RESULT] {hits}/{len(prompts)} hits ({hit_rate:.1f}%)")

    def test_global_kb(self):
        """Test global knowledge base"""
        print("\n" + "="*70)
        print("TEST: GLOBAL KNOWLEDGE BASE")
        print("="*70)
        print()

        if not self.global_kb.enabled:
            print("[ERROR] Global KB not enabled")
            return

        # Get test data
        cross_project = self.test_data["crossProjectTests"]["projectSpecific"]

        print("Phase 1: Syncing to global...")
        patterns = []
        for test in cross_project:
            pattern = {
                "query": test["prompt"],
                "response": {"answer": f"Answer from {test['project']}"},
                "metadata": {"project": test["project"], "quality_score": 0.85},
                "tags": test["tags"],
                "usage_count": 1,
                "quality_score": 0.85
            }
            patterns.append(pattern)
            print(f"  - {test['prompt'][:60]}...")

        synced = self.global_kb.sync_qa_to_global(patterns)
        print(f"\n[RESULT] Synced {synced} patterns to global")

        print("\nPhase 2: Searching global KB...")
        search_queries = [
            ("License Plate", ["tracking"]),
            ("FIFO", ["warehouse"]),
            ("multi-tenancy", ["supabase"])
        ]

        for query, tags in search_queries:
            print(f"\n  Search: '{query}' with tags {tags}")
            results = self.global_kb.search_global_qa(query, tags)
            print(f"  Found: {len(results)} results")
            for r in results:
                print(f"    - {r['query'][:50]}... (Project: {r.get('project', 'unknown')})")

        # Stats
        print("\nGlobal KB Stats:")
        stats = self.global_kb.get_stats()
        for key, value in stats.items():
            print(f"  {key}: {value}")

    def stress_test(self):
        """Stress test with many variations"""
        print("\n" + "="*70)
        print("TEST: STRESS TEST")
        print("="*70)
        print()

        stress_data = self.test_data["stressTest"]
        base = stress_data["basePrompt"]
        variations = stress_data["variations"]

        print(f"Base query: {base}")
        print(f"Testing with {len(variations)} variations...\n")

        # Store base
        self.cache.set(
            base,
            {"answer": "Error handling in JS: try-catch, promises, async/await"},
            {"test": "stress", "quality_score": 0.90},
            ["javascript", "error-handling", "best-practices"]
        )

        time.sleep(0.5)

        # Test variations
        hits = 0
        for i, variation in enumerate(variations, 1):
            print(f"{i:2d}. {variation[:55]}... ", end="")
            result = self.cache.get(variation)

            if result:
                if result.get("similarity"):
                    print(f"[HIT] {result['similarity']:.3f}")
                else:
                    print(f"[HIT] exact")
                hits += 1
            else:
                print(f"[MISS]")

        hit_rate = (hits / len(variations) * 100)
        print(f"\n[RESULT] {hits}/{len(variations)} hits ({hit_rate:.1f}%)")

    def custom_query(self):
        """Test with custom user query"""
        print("\n" + "="*70)
        print("CUSTOM QUERY TEST")
        print("="*70)
        print()

        query = input("Enter your query: ").strip()

        if not query:
            print("[ERROR] Empty query")
            return

        print(f"\n[TEST] Searching cache for: {query}")
        result = self.cache.get(query)

        if result:
            if result.get("similarity"):
                print(f"\n[HIT] Semantic cache (similarity: {result['similarity']:.3f})")
                print(f"Original query: {result.get('original_query', '')}")
            else:
                print(f"\n[HIT] Exact match cache")

            print(f"\nCached response:")
            print(f"  {result.get('response', result)}")
        else:
            print(f"\n[MISS] Not found in cache")

            store = input("\nStore this query for future? (y/n): ").strip().lower()
            if store == 'y':
                answer = input("Enter answer/response: ").strip()
                tags = input("Enter tags (comma-separated): ").strip().split(',')
                tags = [t.strip() for t in tags if t.strip()]

                self.cache.set(
                    query,
                    {"answer": answer},
                    {"quality_score": 0.80},
                    tags
                )
                print("[OK] Query stored in cache")

    def view_stats(self):
        """View cache statistics"""
        print("\n" + "="*70)
        print("CACHE STATISTICS")
        print("="*70)
        print()

        stats = self.cache.get_stats()

        print("Overall:")
        print(f"  Total Queries:        {stats['total_queries']}")
        print(f"  Hot Cache Hits:       {stats['hot_hits']}")
        print(f"  Cold Cache Hits:      {stats['cold_hits']}")
        print(f"  Semantic Cache Hits:  {stats['semantic_hits']}")
        print(f"  Cache Misses:         {stats['misses']}")
        print(f"  Overall Hit Rate:     {stats['overall_hit_rate']:.1f}%")

        if self.global_kb.enabled:
            print("\nGlobal Knowledge Base:")
            gkb_stats = self.global_kb.get_stats()
            for key, value in gkb_stats.items():
                print(f"  {key}: {value}")

    def clear_caches(self):
        """Clear all caches"""
        print("\n[WARN] This will clear ALL cache layers!")
        confirm = input("Are you sure? (yes/no): ").strip().lower()

        if confirm == 'yes':
            print("\n[CLEAR] Clearing all caches...")
            self.cache.clear_all()
            print("[OK] Caches cleared")
        else:
            print("[CANCEL] Clear cancelled")

    def run(self):
        """Main loop"""
        while True:
            self.show_menu()
            choice = input("Select option (1-8): ").strip()

            if choice == '1':
                self.test_semantic_cache()
            elif choice == '2':
                self.test_exact_match()
            elif choice == '3':
                self.test_global_kb()
            elif choice == '4':
                self.stress_test()
            elif choice == '5':
                self.custom_query()
            elif choice == '6':
                self.view_stats()
            elif choice == '7':
                self.clear_caches()
            elif choice == '8':
                print("\n[EXIT] Goodbye!")
                break
            else:
                print("[ERROR] Invalid option")

            input("\nPress Enter to continue...")


if __name__ == "__main__":
    try:
        tester = InteractiveCacheTest()
        tester.run()
    except KeyboardInterrupt:
        print("\n\n[EXIT] Interrupted by user")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
