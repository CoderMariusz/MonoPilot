#!/usr/bin/env python3
"""
Semantic Cache Module - OpenAI Embeddings + ChromaDB
Version: 2.0.0
Purpose: Match similar queries using vector similarity search
Expected Hit Rate: 40-60% on similar queries
"""

import os
import json
import time
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime

try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    print("⚠️  ChromaDB not installed. Run: pip install chromadb")

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️  OpenAI SDK not installed. Run: pip install openai")


class SemanticCache:
    """
    Semantic cache using OpenAI embeddings and ChromaDB vector search

    Features:
    - Similar query matching (similarity > 0.85)
    - Q&A pattern storage
    - Quality scoring
    - Tag-based filtering
    - Usage tracking
    """

    def __init__(self, config_path: str = ".claude/cache/config.json"):
        """Initialize semantic cache"""
        if not CHROMADB_AVAILABLE:
            raise ImportError("ChromaDB required. Install: pip install chromadb")

        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI SDK required. Install: pip install openai")

        # Load config
        with open(config_path, 'r') as f:
            self.config = json.load(f)["semanticCache"]

        # Setup OpenAI client
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_model = self.config["model"]
        self.dimensions = self.config["dimensions"]
        self.similarity_threshold = self.config["similarityThreshold"]

        # Setup ChromaDB
        self.storage_path = Path(self.config["storage"])
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.chroma_client = chromadb.PersistentClient(
            path=str(self.storage_path),
            settings=Settings(anonymized_telemetry=False)
        )

        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="semantic_cache",
            metadata={"description": "Semantic cache for Q&A patterns"}
        )

        # Metrics
        self.metrics = {
            "queries": 0,
            "hits": 0,
            "misses": 0,
            "embeddings_generated": 0,
            "avg_similarity": 0.0,
            "cost_saved": 0.0
        }

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI text-embedding-3-small"""
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text,
                dimensions=self.dimensions
            )

            self.metrics["embeddings_generated"] += 1
            return response.data[0].embedding

        except Exception as e:
            print(f"❌ Error generating embedding: {e}")
            raise

    def search_similar(self, query: str, top_k: int = 3) -> Optional[Dict]:
        """
        Search for similar queries in cache

        Returns:
            Dict with cached response if similarity > threshold
            None if no similar query found
        """
        self.metrics["queries"] += 1

        # Generate query embedding
        query_embedding = self.generate_embedding(query)

        # Search ChromaDB
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )

            # Check if best match exceeds threshold
            if results["distances"][0]:
                # ChromaDB returns L2 distance, convert to cosine similarity
                # similarity = 1 - (distance / 2)
                best_distance = results["distances"][0][0]
                similarity = 1 - (best_distance / 2)

                if similarity >= self.similarity_threshold:
                    # Cache HIT!
                    self.metrics["hits"] += 1
                    self.metrics["avg_similarity"] = (
                        (self.metrics["avg_similarity"] * (self.metrics["hits"] - 1) + similarity)
                        / self.metrics["hits"]
                    )

                    # Get cached response
                    cached_data = json.loads(results["metadatas"][0][0]["response"])

                    # Increment usage count
                    doc_id = results["ids"][0][0]
                    self._increment_usage(doc_id)

                    return {
                        "response": cached_data,
                        "similarity": similarity,
                        "original_query": results["documents"][0][0],
                        "cache_hit": True
                    }

            # Cache MISS
            self.metrics["misses"] += 1
            return None

        except Exception as e:
            print(f"❌ Error searching semantic cache: {e}")
            return None

    def store(
        self,
        query: str,
        response: Dict,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None
    ):
        """
        Store query-response pair in semantic cache

        Args:
            query: The question/query text
            response: The answer/response
            metadata: Additional metadata (agent, project, quality_score, etc.)
            tags: Tags for filtering (e.g., ["auth", "jwt", "security"])
        """
        # Generate embedding
        embedding = self.generate_embedding(query)

        # Prepare metadata
        doc_id = f"qa_{int(time.time() * 1000)}"
        full_metadata = {
            "response": json.dumps(response),
            "timestamp": datetime.now().isoformat(),
            "usage_count": 0,
            "quality_score": metadata.get("quality_score", 0.7) if metadata else 0.7,
            "agent": metadata.get("agent", "unknown") if metadata else "unknown",
            "project": metadata.get("project", "unknown") if metadata else "unknown",
            "tags": json.dumps(tags or [])
        }

        # Store in ChromaDB
        try:
            self.collection.add(
                ids=[doc_id],
                embeddings=[embedding],
                documents=[query],
                metadatas=[full_metadata]
            )

            print(f"✅ Stored in semantic cache: {query[:50]}...")

        except Exception as e:
            print(f"❌ Error storing in semantic cache: {e}")

    def _increment_usage(self, doc_id: str):
        """Increment usage count for a cache entry"""
        try:
            # Get current metadata
            result = self.collection.get(ids=[doc_id], include=["metadatas"])
            if result["metadatas"]:
                metadata = result["metadatas"][0]
                metadata["usage_count"] = metadata.get("usage_count", 0) + 1

                # Update metadata
                self.collection.update(
                    ids=[doc_id],
                    metadatas=[metadata]
                )
        except Exception as e:
            print(f"⚠️  Error incrementing usage: {e}")

    def search_by_tags(self, tags: List[str], top_k: int = 10) -> List[Dict]:
        """Search Q&A patterns by tags"""
        try:
            # Get all documents and filter by tags
            all_docs = self.collection.get(include=["documents", "metadatas"])

            matching_docs = []
            for i, metadata in enumerate(all_docs["metadatas"]):
                doc_tags = json.loads(metadata.get("tags", "[]"))
                if any(tag in doc_tags for tag in tags):
                    matching_docs.append({
                        "query": all_docs["documents"][i],
                        "response": json.loads(metadata["response"]),
                        "tags": doc_tags,
                        "usage_count": metadata.get("usage_count", 0),
                        "quality_score": metadata.get("quality_score", 0.0)
                    })

            # Sort by usage count
            matching_docs.sort(key=lambda x: x["usage_count"], reverse=True)
            return matching_docs[:top_k]

        except Exception as e:
            print(f"❌ Error searching by tags: {e}")
            return []

    def get_popular_patterns(self, top_k: int = 10) -> List[Dict]:
        """Get most frequently used Q&A patterns"""
        try:
            all_docs = self.collection.get(include=["documents", "metadatas"])

            patterns = []
            for i, metadata in enumerate(all_docs["metadatas"]):
                patterns.append({
                    "query": all_docs["documents"][i],
                    "usage_count": metadata.get("usage_count", 0),
                    "quality_score": metadata.get("quality_score", 0.0),
                    "agent": metadata.get("agent", "unknown")
                })

            # Sort by usage count
            patterns.sort(key=lambda x: x["usage_count"], reverse=True)
            return patterns[:top_k]

        except Exception as e:
            print(f"❌ Error getting popular patterns: {e}")
            return []

    def get_metrics(self) -> Dict[str, Any]:
        """Get semantic cache metrics"""
        total = self.metrics["queries"]
        hit_rate = (self.metrics["hits"] / total * 100) if total > 0 else 0

        return {
            **self.metrics,
            "hit_rate": hit_rate,
            "total_entries": self.collection.count()
        }

    def clear_cache(self):
        """Clear all semantic cache entries"""
        try:
            # Delete collection and recreate
            self.chroma_client.delete_collection("semantic_cache")
            self.collection = self.chroma_client.create_collection(
                name="semantic_cache",
                metadata={"description": "Semantic cache for Q&A patterns"}
            )
            print("✅ Semantic cache cleared")
        except Exception as e:
            print(f"❌ Error clearing cache: {e}")


# Example usage
if __name__ == "__main__":
    print("🧠 Semantic Cache Demo\n")

    # Initialize
    try:
        cache = SemanticCache()
    except ImportError as e:
        print(f"❌ {e}")
        exit(1)

    # Test queries (similar but not identical)
    queries = [
        "How to implement JWT authentication in Node.js?",
        "Add user authentication with JWT tokens",
        "Implement login system with JWT",
        "Create REST API endpoint for user data",
        "Build API route to fetch users"
    ]

    # Store first query
    print("📝 Storing first query...")
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
    print("\n🔍 Testing similar queries:\n")
    for query in queries[1:]:
        print(f"Query: {query}")
        result = cache.search_similar(query)

        if result and result["cache_hit"]:
            print(f"  ✅ CACHE HIT! Similarity: {result['similarity']:.2f}")
            print(f"  Original: {result['original_query'][:50]}...")
        else:
            print(f"  ❌ CACHE MISS")
        print()

    # Display metrics
    print("📊 Semantic Cache Metrics:")
    metrics = cache.get_metrics()
    for key, value in metrics.items():
        print(f"  {key}: {value}")

    print("\n✅ Semantic cache working!")
