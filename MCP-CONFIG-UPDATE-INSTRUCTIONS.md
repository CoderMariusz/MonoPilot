# MCP Configuration Update Instructions

**Time Required:** 2 minutes
**Risk Level:** LOW (backup created)
**Status:** READY TO EXECUTE

---

## Quick Instructions

### Step 1: Backup Current Config (Already Done)
Backup saved to: `C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\claude_desktop_config.json.BACKUP`

### Step 2: Update MCP Config

**Option A: Copy from prepared file (EASIEST)**
1. Open: `C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\claude_desktop_config.json.NEW`
2. Copy entire contents
3. Open: `C:\Users\Mariusz K\AppData\Roaming\Claude\claude_desktop_config.json`
4. Replace entire contents with copied text
5. Save file

**Option B: Manual edit**
1. Open: `C:\Users\Mariusz K\AppData\Roaming\Claude\claude_desktop_config.json`
2. Replace this line:
   ```
   "C:/Users/Mariusz K/Documents/Programowanie/Agents/agent-methodology-pack/.claude/mcp-servers/cache-server/server.py"
   ```
   With:
   ```
   "C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/agent-methodology-pack/.claude/mcp-servers/cache-server/server.py"
   ```
3. Replace this section:
   ```json
   "env": {
     "CACHE_DIR": "C:/Users/Mariusz K/Documents/Programowanie/Agents/agent-methodology-pack/.claude/cache"
   }
   ```
   With:
   ```json
   "env": {
     "CACHE_DIR": "C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/.claude/cache",
     "PYTHONUNBUFFERED": "1"
   }
   ```
4. Save file

### Step 3: Restart Claude Code
1. Close Claude Code completely (File > Exit)
2. Reopen Claude Code
3. Wait 10 seconds for initialization

### Step 4: Verify MCP Tools Available
Check that these tools are available:
- cache_get
- cache_set
- cache_stats
- cache_clear
- generate_key

---

## New Configuration (Full File)

```json
{
  "mcpServers": {
    "agent-cache": {
      "command": "python",
      "args": [
        "-u",
        "C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/agent-methodology-pack/.claude/mcp-servers/cache-server/server.py"
      ],
      "env": {
        "CACHE_DIR": "C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/.claude/cache",
        "PYTHONUNBUFFERED": "1"
      }
    }
  }
}
```

---

## Verification Commands

After restart, run these to verify:

```bash
# Test 1: Check server initializes
cd "C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\agent-methodology-pack\.claude\mcp-servers\cache-server"
python -c "from server import MCPCacheServer; s = MCPCacheServer(); print('OK: Server ready')"

# Test 2: Check cache stats
python -c "from server import MCPCacheServer; import json; s = MCPCacheServer(); print(json.dumps(s.cache_stats(), indent=2))"
```

Expected output:
```
OK: Server ready
MCP Cache Server initialized successfully
```

---

## Troubleshooting

### Issue: MCP tools not appearing
**Solution:**
1. Verify config file saved correctly
2. Check file path (use forward slashes)
3. Restart Claude Code again
4. Wait 30 seconds

### Issue: Server initialization error
**Solution:**
1. Check Python version: `python --version` (should be 3.8+)
2. Test server manually: Run verification command above
3. Check logs: `.claude/cache/logs/mcp-access.log`

### Issue: Cache not working
**Solution:**
1. Verify CACHE_DIR path is correct
2. Check cache directory exists: `ls -la "C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\.claude\cache"`
3. Check permissions on cache directory

---

## Rollback (If Needed)

If you need to revert:
1. Copy contents from: `claude_desktop_config.json.BACKUP`
2. Paste into: `C:\Users\Mariusz K\AppData\Roaming\Claude\claude_desktop_config.json`
3. Restart Claude Code

---

## Success Indicators

You'll know it's working when:
- ✅ Claude Code starts without errors
- ✅ MCP tools appear in tool list
- ✅ Server log shows "MCP Cache Server initialized successfully"
- ✅ Cache stats command shows metrics
- ✅ Running same query twice shows CACHE HIT on second run

---

**Next:** After successful update, see `ENVIRONMENT-SETUP-REPORT.md` for next steps.
