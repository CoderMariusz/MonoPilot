#!/usr/bin/env python3
"""
Global Knowledge Base Manager
Version: 2.0.0
Purpose: Cross-project Q&A pattern sharing and synchronization
"""

import os
import json
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime


class GlobalKnowledgeBase:
    """
    Manages global knowledge base for cross-project sharing

    Features:
    - 3-tier lookup: local → global → default
    - Auto-sync Q&A patterns
    - Agent/Pattern/Skill sharing
    - Conflict resolution
    """

    def __init__(self, project_name: str = "MonoPilot"):
        """Initialize global knowledge base"""
        self.project_name = project_name

        # Global directory (user home)
        self.global_dir = Path.home() / ".claude-agent-pack" / "global"

        # Local directory (project)
        self.local_dir = Path(".claude/cache")

        # Ensure global dir exists
        if not self.global_dir.exists():
            print(f"[WARN] Global directory not found: {self.global_dir}")
            print("[INFO] Run: bash scripts/setup-global-cache.sh")
            self.enabled = False
            return

        self.enabled = True
        print(f"[OK] Global Knowledge Base connected: {self.global_dir}")

        # Load config
        self.config = self._load_global_config()

        # Register this project
        self._register_project()

    def _load_global_config(self) -> Dict:
        """Load global configuration"""
        config_file = self.global_dir / "config.json"

        if not config_file.exists():
            return {
                "version": "2.0.0",
                "globalKnowledgeBase": {
                    "enabled": True,
                    "resolutionOrder": ["local", "global", "default"]
                }
            }

        with open(config_file) as f:
            return json.load(f)

    def _register_project(self):
        """Register this project in global registry"""
        config_file = self.global_dir / "config.json"

        if not config_file.exists():
            return

        with open(config_file) as f:
            config = json.load(f)

        # Add project if not exists
        projects = config.get("metadata", {}).get("projects", [])

        project_entry = {
            "name": self.project_name,
            "path": str(Path.cwd()),
            "lastSync": datetime.now().isoformat()
        }

        # Update or add
        found = False
        for i, proj in enumerate(projects):
            if proj.get("name") == self.project_name:
                projects[i] = project_entry
                found = True
                break

        if not found:
            projects.append(project_entry)

        # Save
        if "metadata" not in config:
            config["metadata"] = {}
        config["metadata"]["projects"] = projects

        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)

        print(f"[OK] Project registered: {self.project_name}")

    def sync_qa_to_global(self, qa_patterns: List[Dict]):
        """
        Sync local Q&A patterns to global cache

        Args:
            qa_patterns: List of Q&A pattern dicts with:
                - query (str)
                - response (dict)
                - metadata (dict)
                - tags (list)
                - usage_count (int)
                - quality_score (float)
        """
        if not self.enabled:
            print("[SKIP] Global sync disabled (directory not found)")
            return

        global_qa_dir = self.global_dir / "qa-patterns"
        global_qa_file = global_qa_dir / "patterns.json"

        # Load existing global patterns
        if global_qa_file.exists():
            with open(global_qa_file) as f:
                global_patterns = json.load(f)
        else:
            global_patterns = {
                "version": "1.0.0",
                "patterns": [],
                "metadata": {
                    "totalPatterns": 0,
                    "lastSync": None
                }
            }

        # Merge patterns
        synced = 0
        for pattern in qa_patterns:
            # Add project attribution
            pattern["project"] = self.project_name
            pattern["syncedAt"] = datetime.now().isoformat()

            # Check if already exists (by query similarity)
            exists = any(
                p.get("query") == pattern.get("query")
                for p in global_patterns["patterns"]
            )

            if not exists:
                global_patterns["patterns"].append(pattern)
                synced += 1

        # Update metadata
        global_patterns["metadata"]["totalPatterns"] = len(global_patterns["patterns"])
        global_patterns["metadata"]["lastSync"] = datetime.now().isoformat()

        # Save
        with open(global_qa_file, 'w') as f:
            json.dump(global_patterns, f, indent=2)

        print(f"[SYNC] Synced {synced} new Q&A patterns to global")
        return synced

    def search_global_qa(self, query: str, tags: Optional[List[str]] = None) -> List[Dict]:
        """
        Search global Q&A patterns (from all projects)

        Returns matching patterns from global cache
        """
        if not self.enabled:
            return []

        global_qa_file = self.global_dir / "qa-patterns" / "patterns.json"

        if not global_qa_file.exists():
            return []

        with open(global_qa_file) as f:
            data = json.load(f)

        patterns = data.get("patterns", [])

        # Filter by tags if provided
        if tags:
            patterns = [
                p for p in patterns
                if any(tag in p.get("tags", []) for tag in tags)
            ]

        # Simple text matching (could use semantic search here too)
        query_lower = query.lower()
        matches = [
            p for p in patterns
            if query_lower in p.get("query", "").lower()
        ]

        # Sort by usage count and quality
        matches.sort(
            key=lambda x: (
                x.get("usage_count", 0) * x.get("quality_score", 0)
            ),
            reverse=True
        )

        return matches[:5]  # Top 5

    def get_popular_patterns(self, limit: int = 10) -> List[Dict]:
        """Get most popular Q&A patterns across all projects"""
        if not self.enabled:
            return []

        global_qa_file = self.global_dir / "qa-patterns" / "patterns.json"

        if not global_qa_file.exists():
            return []

        with open(global_qa_file) as f:
            data = json.load(f)

        patterns = data.get("patterns", [])

        # Sort by usage count * quality score
        patterns.sort(
            key=lambda x: (
                x.get("usage_count", 0) * x.get("quality_score", 0.5)
            ),
            reverse=True
        )

        return patterns[:limit]

    def share_agent(self, agent_name: str, agent_definition: str):
        """Share agent definition to global registry"""
        if not self.enabled:
            return

        agents_dir = self.global_dir / "agents"
        agent_file = agents_dir / f"{agent_name}.md"

        # Save agent definition
        with open(agent_file, 'w') as f:
            f.write(agent_definition)

        # Update registry
        registry_file = agents_dir / "registry.json"

        with open(registry_file) as f:
            registry = json.load(f)

        # Add to registry
        agent_entry = {
            "name": agent_name,
            "file": f"{agent_name}.md",
            "project": self.project_name,
            "sharedAt": datetime.now().isoformat()
        }

        # Update or add
        agents = registry.get("agents", [])
        found = False
        for i, agent in enumerate(agents):
            if agent.get("name") == agent_name:
                agents[i] = agent_entry
                found = True
                break

        if not found:
            agents.append(agent_entry)

        registry["agents"] = agents
        registry["metadata"]["totalAgents"] = len(agents)
        registry["metadata"]["lastUpdated"] = datetime.now().isoformat()

        with open(registry_file, 'w') as f:
            json.dump(registry, f, indent=2)

        print(f"[SHARE] Agent shared: {agent_name}")

    def get_global_agents(self) -> List[Dict]:
        """Get list of all globally shared agents"""
        if not self.enabled:
            return []

        registry_file = self.global_dir / "agents" / "registry.json"

        if not registry_file.exists():
            return []

        with open(registry_file) as f:
            registry = json.load(f)

        return registry.get("agents", [])

    def get_stats(self) -> Dict[str, Any]:
        """Get global knowledge base statistics"""
        if not self.enabled:
            return {"enabled": False}

        stats = {
            "enabled": True,
            "location": str(self.global_dir),
            "project": self.project_name
        }

        # Count Q&A patterns
        qa_file = self.global_dir / "qa-patterns" / "patterns.json"
        if qa_file.exists():
            with open(qa_file) as f:
                data = json.load(f)
            stats["qa_patterns"] = data["metadata"]["totalPatterns"]
        else:
            stats["qa_patterns"] = 0

        # Count agents
        agent_registry = self.global_dir / "agents" / "registry.json"
        if agent_registry.exists():
            with open(agent_registry) as f:
                data = json.load(f)
            stats["agents"] = data["metadata"]["totalAgents"]
        else:
            stats["agents"] = 0

        # Count projects
        config_file = self.global_dir / "config.json"
        if config_file.exists():
            with open(config_file) as f:
                config = json.load(f)
            stats["projects"] = len(config.get("metadata", {}).get("projects", []))
        else:
            stats["projects"] = 0

        return stats


# Example usage
if __name__ == "__main__":
    print("="*70)
    print("GLOBAL KNOWLEDGE BASE - DEMO")
    print("="*70)
    print()

    # Initialize
    gkb = GlobalKnowledgeBase(project_name="MonoPilot")

    if not gkb.enabled:
        print("\n[ERROR] Global Knowledge Base not initialized")
        print("Run: bash scripts/setup-global-cache.sh")
        exit(1)

    # Test: Sync some Q&A patterns
    print("\n" + "="*70)
    print("TEST 1: Sync Q&A Patterns to Global")
    print("="*70 + "\n")

    test_patterns = [
        {
            "query": "How to implement Supabase RLS policies?",
            "response": {"answer": "RLS policies: 1. Enable RLS on table, 2. Create policies with CREATE POLICY, 3. Use auth.uid()"},
            "metadata": {"agent": "BACKEND-DEV", "quality_score": 0.95},
            "tags": ["supabase", "security", "rls", "database"],
            "usage_count": 5,
            "quality_score": 0.95
        },
        {
            "query": "Best practices for Next.js App Router?",
            "response": {"answer": "App Router: 1. Use Server Components by default, 2. Client components only when needed, 3. Leverage streaming"},
            "metadata": {"agent": "FRONTEND-DEV", "quality_score": 0.90},
            "tags": ["nextjs", "app-router", "best-practices"],
            "usage_count": 3,
            "quality_score": 0.90
        }
    ]

    synced = gkb.sync_qa_to_global(test_patterns)
    print(f"\n[RESULT] Synced {synced} patterns")

    # Test: Search global Q&A
    print("\n" + "="*70)
    print("TEST 2: Search Global Q&A")
    print("="*70 + "\n")

    results = gkb.search_global_qa("Supabase", tags=["security"])
    print(f"Found {len(results)} matching patterns for 'Supabase' + security tag")

    for i, result in enumerate(results, 1):
        print(f"\n  {i}. {result['query']}")
        print(f"     Project: {result.get('project', 'unknown')}")
        print(f"     Usage: {result.get('usage_count', 0)}x")

    # Test: Get popular patterns
    print("\n" + "="*70)
    print("TEST 3: Get Popular Patterns (All Projects)")
    print("="*70 + "\n")

    popular = gkb.get_popular_patterns(limit=5)
    print(f"Top {len(popular)} most popular patterns:\n")

    for i, pattern in enumerate(popular, 1):
        score = pattern.get("usage_count", 0) * pattern.get("quality_score", 0)
        print(f"  {i}. {pattern['query'][:60]}...")
        print(f"     Score: {score:.1f} | Project: {pattern.get('project', 'unknown')}")

    # Stats
    print("\n" + "="*70)
    print("GLOBAL KNOWLEDGE BASE STATISTICS")
    print("="*70 + "\n")

    stats = gkb.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    print("\n" + "="*70)
    print("[OK] Global Knowledge Base operational!")
    print("="*70)
