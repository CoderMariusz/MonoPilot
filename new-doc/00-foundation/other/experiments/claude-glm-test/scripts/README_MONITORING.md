# Quality Monitoring Tools - MonoPilot Hybrid AI

Scripts do monitorowania jakości kodu generowanego przez Claude + GLM-4.7 hybrid approach.

---

## 📋 Dostępne Narzędzia

### 1. `monitor_quality.py` - Quality Metrics Tracking

**Purpose**: Record and monitor quality metrics for each story

**Usage**:
```bash
# Record metrics for completed story
python monitor_quality.py --story 03.4 --scenario b

# Generate weekly quality report
python monitor_quality.py --report --weeks 4

# Check specific story against baseline
python monitor_quality.py --check story_03.4/scenario_b/metrics.json
```

**Output**:
- Appends to `quality_metrics.jsonl` (time-series log)
- Creates `quality_alerts.json` if thresholds breached
- Generates quality report with trend analysis

---

### 2. `detect_regressions.py` - Regression Detection

**Purpose**: Detect quality regressions compared to baseline

**Usage**:
```bash
# Check single story for regressions
python detect_regressions.py --story 03.4 --scenario b

# Continuous monitoring (for CI/CD)
python detect_regressions.py --continuous --threshold 3

# Check trend for specific metric
python detect_regressions.py --trend code_quality_score --window 10
```

**Exit Codes**:
- `0` - No regressions, safe to proceed
- `1` - Regressions detected, halt deployment

**Alerts On**:
- AC pass rate drops >5%
- Test pass rate drops >10%
- Code quality score drops >1 point
- Bug count increases >3 bugs/story
- Any security vulnerabilities found

---

### 3. `compare_before_after.py` - Before/After Comparison

**Purpose**: Compare Claude-only baseline vs Hybrid approach

**Usage**:
```bash
# Compare single story (before = Claude, after = Hybrid)
python compare_before_after.py \
  --before story_03.2/scenario_a \
  --after story_03.2/scenario_b \
  --output comparison_03.2.md

# Batch comparison for multiple stories
python compare_before_after.py \
  --batch "story_03.2/scenario_a,story_03.2/scenario_b story_03.4/scenario_a,story_03.4/scenario_b" \
  --output batch_comparison.md
```

**Output**:
- Quality delta for each metric
- Cost savings calculation
- Verdict: Approve / Conditional / Reject

---

### 4. `quality_dashboard.py` - Visual Dashboard

**Purpose**: Generate visual quality dashboard (markdown or HTML)

**Usage**:
```bash
# Generate markdown dashboard
python quality_dashboard.py --output QUALITY_DASHBOARD.md

# Generate HTML dashboard
python quality_dashboard.py --html --output dashboard.html

# Live dashboard (auto-refresh every 5 min)
python quality_dashboard.py --html --live --output dashboard.html
# Then open dashboard.html in browser
```

**Features**:
- Story-by-story quality table
- Trend charts (ASCII for markdown, visual for HTML)
- Cost vs quality analysis
- Alert summary
- Actionable recommendations

---

### 5. `quality_gate.sh` - CI/CD Quality Gate

**Purpose**: Automated quality gate for CI/CD pipeline

**Usage**:
```bash
# Run full quality gate for story
./quality_gate.sh --story 03.4 --scenario b

# Continuous monitoring mode (fails if >3 regressions)
./quality_gate.sh --continuous --threshold 3
```

**Checks Performed**:
1. ✅ Automated tests pass
2. ✅ Quality metrics meet thresholds
3. ✅ No regressions detected
4. ✅ Security scan passes
5. ✅ TypeScript type check passes

**Integration with GitHub Actions**:
```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate
on: [pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Quality Gate
        run: |
          chmod +x .experiments/claude-glm-test/scripts/quality_gate.sh
          ./experiments/claude-glm-test/scripts/quality_gate.sh --continuous --threshold 3
```

---

## 🎯 Quality Thresholds

### Baseline (from Story 03.2 Scenario A - Claude-only)

```json
{
  "ac_pass_rate": 100.0,        // 10/10 ACs
  "test_pass_rate": 96.0,       // 48/50 tests
  "code_quality_score": 9.5,
  "bugs_per_story": 7.0,
  "review_iterations": 2.0,
  "security_vulnerabilities": 0
}
```

### Alert Thresholds (Hybrid must stay above these)

```json
{
  "ac_pass_rate_min": 95.0,          // Alert if <95%
  "test_pass_rate_min": 90.0,        // Alert if <90%
  "code_quality_score_min": 8.0,     // Alert if <8.0/10
  "bugs_per_story_max": 10.0,        // Alert if >10 bugs
  "review_iterations_max": 4.0,      // Alert if >4 iterations
  "security_vulnerabilities_max": 0   // Alert if ANY found
}
```

---

## 📊 Metrics Tracked

### Quality Metrics
- `ac_pass_rate` - Acceptance criteria pass rate (%)
- `test_pass_rate` - Automated test pass rate (%)
- `test_coverage_percent` - Code coverage (%)
- `code_quality_score` - Code review score (0-10)
- `bugs_per_story` - Initial bugs found in review
- `review_iterations` - Number of review cycles
- `security_vulnerabilities` - Count of security issues
- `production_ready` - Boolean (approved for deployment)
- `performance_acceptable` - Boolean (all ops <500ms)

### Cost Metrics
- `claude_tokens` - Claude token usage
- `glm_tokens` - GLM token usage
- `total_cost_usd` - Total cost in USD
- `cost_per_quality_point` - Cost efficiency

---

## 🔄 Workflow Integration

### Daily Development Workflow

```bash
# 1. Complete story implementation (Scenario B - Hybrid)
# ... GLM generates code, Claude reviews ...

# 2. Record metrics after completion
python monitor_quality.py --story 03.4 --scenario b

# 3. Check for regressions
python detect_regressions.py --story 03.4 --scenario b

# 4. If passed, compare to baseline
python compare_before_after.py \
  --before story_03.2/scenario_a \
  --after story_03.4/scenario_b
```

### Weekly Review

```bash
# Generate quality report
python monitor_quality.py --report --weeks 1

# Generate dashboard
python quality_dashboard.py --output weekly_dashboard.md

# Check for trend regressions
python detect_regressions.py --trend code_quality_score --window 10
```

### Monthly Review

```bash
# Generate comprehensive dashboard
python quality_dashboard.py --html --output monthly_dashboard.html

# Batch comparison for all stories
python compare_before_after.py \
  --batch "03.2/a,03.2/b 03.4/a,03.4/b 03.5/a,03.5/b" \
  --output monthly_comparison.md
```

---

## 🚨 Alert Escalation

### Alert Severity Levels

**🔴 Critical** (Immediate action):
- Security vulnerabilities found (ANY)
- AC pass rate <90%
- Test pass rate <80%
- Code quality score <7.0

**Action**: Halt deployment, rollback if in production, investigate immediately

---

**🟡 High** (Action within 24h):
- AC pass rate 90-95%
- Test pass rate 80-90%
- Code quality score 7.0-8.0
- >10 bugs per story
- >4 review iterations

**Action**: Investigate root cause, enhance prompts, increase review rigor

---

**🟢 Medium** (Monitor):
- Code quality score 8.0-9.0
- 7-10 bugs per story
- 3-4 review iterations

**Action**: Track trend, optimize prompts if worsens

---

## 📁 Output Files

All monitoring outputs saved to `.experiments/claude-glm-test/`:

```
.experiments/claude-glm-test/
├── quality_metrics.jsonl        # Time-series metrics log
├── quality_baseline.json        # Claude-only baseline
├── quality_alerts.json          # Active alerts
├── regressions.jsonl            # Regression events log
├── QUALITY_DASHBOARD.md         # Latest dashboard
└── scripts/
    ├── monitor_quality.py
    ├── detect_regressions.py
    ├── compare_before_after.py
    ├── quality_dashboard.py
    └── quality_gate.sh
```

---

## 🎓 Example: Full Quality Check

```bash
#!/bin/bash
# Complete quality validation for Story 03.4 (Hybrid)

STORY="03.4"
SCENARIO="b"

echo "Running full quality check for Story $STORY (Scenario $SCENARIO)..."

# Step 1: Record metrics
python monitor_quality.py --story $STORY --scenario $SCENARIO

# Step 2: Check regressions
python detect_regressions.py --story $STORY --scenario $SCENARIO

if [ $? -ne 0 ]; then
    echo "❌ Regressions detected! Halting."
    exit 1
fi

# Step 3: Compare to baseline
python compare_before_after.py \
  --before story_03.2/scenario_a \
  --after story_${STORY}/scenario_${SCENARIO} \
  --output comparison_${STORY}.md

# Step 4: Update dashboard
python quality_dashboard.py --output QUALITY_DASHBOARD.md

echo "✅ Quality check complete. Dashboard updated."
```

---

## 💡 Tips

### Establishing Baseline

**First time setup**:
1. Run 1-2 stories with Claude-only (Scenario A)
2. Scripts will auto-create baseline from Story 03.2
3. All future hybrid stories compared to this baseline

### Interpreting Results

**Green (✅)**: Quality maintained or improved, cost saved → Continue hybrid

**Yellow (⚠️)**: Minor degradation → Investigate, enhance prompts

**Red (❌)**: Significant degradation → Halt, rollback, root cause analysis

### Optimizing GLM Prompts

If quality drifts:
1. Review failed stories for common patterns
2. Enhance prompts with more context
3. Include failing test cases in prompt
4. Reference project patterns explicitly

---

## 🔧 Maintenance

### Adding New Metrics

Edit `monitor_quality.py`:
```python
# In _create_default_baseline(), add new metric:
"targets": {
    # ... existing ...
    "new_metric_name": 95.0,  # Target value
}

"thresholds": {
    # ... existing ...
    "new_metric_name_min": 90.0,  # Alert threshold
}
```

### Adjusting Thresholds

If baseline changes over time, update `quality_baseline.json` manually or regenerate from new baseline story.

---

## 📞 Support

**For Questions**:
- Check `.experiments/claude-glm-test/QUALITY_ANALYSIS_REPORT.md`
- Review `.experiments/claude-glm-test/FINAL_COMPARISON_REPORT.md`

**For Bugs**:
- Create issue in MonoPilot repo with:
  - Story ID
  - Scenario
  - Actual vs expected metrics
  - Monitoring script output
