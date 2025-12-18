#!/usr/bin/env python3
"""
Unified Cache Service - Integration Layer
Version: 2.0.0
Purpose: Unified interface to all cache layers with automatic fallback
"""

import os
import sys
import json
from pathlib import Path
from typing import Optional, Dict, Any

# Import cache managers
from cache_manager import CacheManager
from semantic_cache import SemanticCache, CHROMADB_AVAILABLE, OPENAI_AVAILABLE


class UnifiedCache:
    """
    Unified cache service that coordinates all 4 layers:
    1. Claude Prompt Cache (automatic via API)
    2. Hot Cache (in-memory, instant)
    3. Cold Cache (disk, fast)
    4. Semantic Cache (AI-powered similarity)

    Usage:
        cache = UnifiedCache()
        result = cache.get("How to implement JWT auth?")
        if result:
            print("Cache HIT!")
        else:
            # Call API, then:
            cache.set(query, response)
    """

    def __init__(self, config_path: str = None):
        """Initialize unified cache with all layers"""
        print("[INIT] Starting Unified Cache System v2.0.0...")

        # Initialize cache manager (Hot + Cold)
        try:
            self.cache_manager = CacheManager(config_path)
            print("[OK] Cache Manager initialized (Hot + Cold)")
        except Exception as e:
            print(f"[ERROR] Cache Manager failed: {e}")
            self.cache_manager = None

        # Initialize semantic cache (if available)
        self.semantic_cache = None
        if CHROMADB_AVAILABLE and OPENAI_AVAILABLE:
            try:
                self.semantic_cache = SemanticCache(config_path)
                print(f"[OK] Semantic Cache initialized (threshold: {self.semantic_cache.similarity_threshold})")
            except Exception as e:
                print(f"[WARN] Semantic Cache failed: {e}")
        else:
            if not CHROMADB_AVAILABLE:
                print("[WARN] Semantic Cache disabled: ChromaDB not installed")
            if not OPENAI_AVAILABLE:
                print("[WARN] Semantic Cache disabled: OpenAI SDK not installed")

        # Statistics
        self.stats = {
            "total_queries": 0,
            "hot_hits": 0,
            "cold_hits": 0,
            "semantic_hits": 0,
            "misses": 0,
            "errors": 0
        }

        print("[OK] Unified Cache ready!\n")

    def get(self, query: str, use_semantic: bool = True) -> Optional[Dict]:
        """
        Get response from cache (tries all layers in order)

        Returns:
            Dict with response if found, None if miss
        """
        self.stats["total_queries"] += 1

        # LAYER 2 & 3: Try exact match cache (Hot + Cold)
        if self.cache_manager:
            try:
                result = self.cache_manager.get(query)
                if result:
                    # Check which layer hit
                    if self.cache_manager.metrics["hot_hits"] > self.stats["hot_hits"]:
                        self.stats["hot_hits"] += 1
                        print(f"[HIT] Hot Cache: {query[:50]}...")
                    elif self.cache_manager.metrics["cold_hits"] > self.stats["cold_hits"]:
                        self.stats["cold_hits"] += 1
                        print(f"[HIT] Cold Cache: {query[:50]}...")

                    return result
            except Exception as e:
                print(f"[ERROR] Cache Manager get failed: {e}")
                self.stats["errors"] += 1

        # LAYER 4: Try semantic cache (similar queries)
        if use_semantic and self.semantic_cache:
            try:
                result = self.semantic_cache.search_similar(query)
                if result and result.get("cache_hit"):
                    self.stats["semantic_hits"] += 1
                    similarity = result.get("similarity", 0)
                    print(f"[HIT] Semantic Cache (similarity: {similarity:.2f}): {query[:50]}...")
                    return result
            except Exception as e:
                print(f"[ERROR] Semantic Cache search failed: {e}")
                self.stats["errors"] += 1

        # MISS: No cache hit
        self.stats["misses"] += 1
        print(f"[MISS] Cache miss: {query[:50]}...")
        return None

    def set(self, query: str, response: Any, metadata: Optional[Dict] = None, tags: Optional[list] = None):
        """
        Store response in all cache layers

        Args:
            query: The question/query
            response: The answer/response (can be dict, string, etc.)
            metadata: Additional metadata (agent, quality_score, etc.)
            tags: Tags for semantic search
        """
        # Ensure response is dict
        if not isinstance(response, dict):
            response = {"answer": str(response)}

        # Store in exact match cache (Hot + Cold)
        if self.cache_manager:
            try:
                self.cache_manager.set(query, response, metadata)
                print(f"[STORE] Exact Cache: {query[:50]}...")
            except Exception as e:
                print(f"[ERROR] Cache Manager set failed: {e}")
                self.stats["errors"] += 1

        # Store in semantic cache
        if self.semantic_cache:
            try:
                self.semantic_cache.store(query, response, metadata, tags)
                print(f"[STORE] Semantic Cache: {query[:50]}...")
            except Exception as e:
                print(f"[ERROR] Semantic Cache store failed: {e}")
                self.stats["errors"] += 1

    def get_stats(self) -> Dict[str, Any]:
        """Get unified statistics from all layers"""
        total = self.stats["total_queries"]

        if total == 0:
            hit_rate = 0
        else:
            total_hits = self.stats["hot_hits"] + self.stats["cold_hits"] + self.stats["semantic_hits"]
            hit_rate = (total_hits / total * 100)

        return {
            **self.stats,
            "overall_hit_rate": hit_rate,
            "cache_manager_stats": self.cache_manager.get_metrics() if self.cache_manager else {},
            "semantic_cache_stats": self.semantic_cache.get_metrics() if self.semantic_cache else {}
        }

    def clear_all(self):
        """Clear all cache layers"""
        print("\n[CLEAR] Clearing all cache layers...")

        if self.cache_manager:
            self.cache_manager.clear_cache()

        if self.semantic_cache:
            self.semantic_cache.clear_cache()

        print("[OK] All caches cleared\n")


# Example usage and demo
if __name__ == "__main__":
    print("="*70)
    print("UNIFIED CACHE SYSTEM - DEMO")
    print("="*70)
    print()

    # Initialize unified cache
    cache = UnifiedCache()

    # Test queries
    test_cases = [
        {
            "query": "How to implement JWT authentication in Node.js?",
            "response": {
                "answer": "To implement JWT auth: 1. Install jsonwebtoken package, 2. Create middleware, 3. Sign tokens on login, 4. Verify on protected routes",
                "tokens_used": 5000,
                "cost": 0.05
            },
            "metadata": {
                "agent": "BACKEND-DEV",
                "quality_score": 0.95,
                "project": "MonoPilot"
            },
            "tags": ["authentication", "jwt", "nodejs", "security"]
        },
        {
            "query": "What is the best way to structure a React component?",
            "response": {
                "answer": "Best practices: 1. Single responsibility, 2. Props validation, 3. Composition over inheritance, 4. Hooks for state, 5. Memoization when needed",
                "tokens_used": 4500,
                "cost": 0.045
            },
            "metadata": {
                "agent": "FRONTEND-DEV",
                "quality_score": 0.92,
                "project": "MonoPilot"
            },
            "tags": ["react", "components", "best-practices", "frontend"]
        },
        {
            "query": "How to optimize PostgreSQL queries?",
            "response": {
                "answer": "Optimization tips: 1. Use EXPLAIN ANALYZE, 2. Add indexes on WHERE/JOIN columns, 3. Avoid SELECT *, 4. Use prepared statements, 5. Connection pooling",
                "tokens_used": 4800,
                "cost": 0.048
            },
            "metadata": {
                "agent": "BACKEND-DEV",
                "quality_score": 0.90,
                "project": "MonoPilot"
            },
            "tags": ["postgresql", "optimization", "database", "performance"]
        }
    ]

    print("\n" + "="*70)
    print("PHASE 1: STORING QUERIES IN CACHE")
    print("="*70 + "\n")

    for i, test in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i} ---")
        cache.set(
            query=test["query"],
            response=test["response"],
            metadata=test["metadata"],
            tags=test["tags"]
        )

    print("\n" + "="*70)
    print("PHASE 2: TESTING EXACT MATCH (should hit Hot/Cold cache)")
    print("="*70 + "\n")

    for i, test in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i} ---")
        result = cache.get(test["query"])
        if result:
            print(f"[SUCCESS] Retrieved from cache!")
        else:
            print(f"[FAIL] Should have been cached!")

    print("\n" + "="*70)
    print("PHASE 3: TESTING SEMANTIC MATCH (similar queries)")
    print("="*70 + "\n")

    similar_queries = [
        "Add JWT authentication to Node app",  # Similar to case 1
        "React component structure best practices",  # Similar to case 2
        "Improve Postgres database performance"  # Similar to case 3
    ]

    for i, query in enumerate(similar_queries, 1):
        print(f"\n--- Similar Query {i} ---")
        print(f"Query: {query}")
        result = cache.get(query)
        if result:
            if result.get("similarity"):
                print(f"[SUCCESS] Semantic match! (similarity: {result['similarity']:.2f})")
        else:
            print(f"[INFO] No semantic match (below threshold)")

    print("\n" + "="*70)
    print("FINAL STATISTICS")
    print("="*70 + "\n")

    stats = cache.get_stats()
    print(f"Total Queries:        {stats['total_queries']}")
    print(f"Hot Cache Hits:       {stats['hot_hits']}")
    print(f"Cold Cache Hits:      {stats['cold_hits']}")
    print(f"Semantic Cache Hits:  {stats['semantic_hits']}")
    print(f"Cache Misses:         {stats['misses']}")
    print(f"Errors:               {stats['errors']}")
    print(f"Overall Hit Rate:     {stats['overall_hit_rate']:.1f}%")

    print("\n" + "="*70)
    print("[OK] Unified Cache System operational!")
    print("="*70)
