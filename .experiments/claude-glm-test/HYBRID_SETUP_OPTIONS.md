# Hybrid Claude + GLM Setup Options

## Option A: Dual Instance (Recommended for Testing)

Run TWO Claude Code instances:

### Instance 1: Claude (Quality Gates)
```bash
# Terminal 1 - Standard Claude
cd MonoPilot
claude  # Uses normal Anthropic API
```
Use for: P1 UX, P5 Review, P6 QA (quality-critical)

### Instance 2: GLM (Implementation)
```bash
# Terminal 2 - GLM via Z.AI proxy
# First configure ~/.claude/settings.json with Z.AI
cd MonoPilot
claude  # Uses GLM via Z.AI proxy
```
Use for: P2 Tests, P3 Code, P4 Refactor, P7 Docs

### Switching between instances:
- Keep both terminals open
- Route tasks manually to appropriate terminal
- Or use ORCHESTRATOR in Claude instance to coordinate

---

## Option B: Single Instance with Wrapper (Current)

```
Claude Code (Sonnet) ──► Task tool ──► Claude agents (P1, P5, P6)
                    │
                    └──► Bash ──► glm_wrapper.py ──► GLM (P2, P3, P4, P7)
```

**Pros:** Single terminal, orchestrator controls routing
**Cons:** GLM doesn't see full project context

---

## Option C: Z.AI Full Replacement

```json
// ~/.claude/settings.json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your_zai_api_key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air"
  }
}
```

**Pros:**
- GLM has FULL project access
- All agents work normally
- Task tool works
- No wrapper needed

**Cons:**
- No Claude at all (100% GLM)
- May miss Claude's superior reasoning for complex tasks

---

## Option D: Profile Switching (Advanced)

Create two config profiles:

### Profile: Claude (default)
```bash
# ~/.claude/settings.json.claude
{
  "env": {}  # Default Anthropic
}
```

### Profile: GLM
```bash
# ~/.claude/settings.json.glm
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "zai_key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic"
  }
}
```

### Switch script:
```bash
#!/bin/bash
# switch-claude-profile.sh

if [ "$1" = "glm" ]; then
  cp ~/.claude/settings.json.glm ~/.claude/settings.json
  echo "Switched to GLM"
elif [ "$1" = "claude" ]; then
  cp ~/.claude/settings.json.claude ~/.claude/settings.json
  echo "Switched to Claude"
fi
```

Usage:
```bash
./switch-claude-profile.sh glm   # Before P2, P3, P4, P7
./switch-claude-profile.sh claude # Before P1, P5, P6
```

---

## Recommendation for Epic 6 Test

### Phase 1: Test GLM Full (Option C)
1. Configure Z.AI proxy
2. Run FULL pipeline on Epic 6 with GLM
3. Measure: quality, tokens, time, errors

### Phase 2: Compare with Hybrid (Option A)
1. Keep Claude for P5 Code Review
2. Use GLM for rest
3. Compare quality of reviews

### Phase 3: Production Decision
Based on results, choose:
- GLM Full (if quality acceptable)
- Hybrid (if Claude review needed)
- Wrapper (if fine-grained control needed)

---

## Z.AI API Key

Get from: https://open.bigmodel.cn/
- Register/Login
- Create API Key
- Copy for settings.json
