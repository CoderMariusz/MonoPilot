Execute Epic 01-Settings pilot using HYBRID V2 Orchestrator (Python + GLM).

COMMAND (w osobnym terminalu):

cd "C:\Users\Mariusz K\Documents\Programowanie\MonoPilot"
python .experiments/claude-glm-test/scripts/hybrid_orchestrator_v2.py --stories 01.2,01.6,01.4 --start-phase P1

Stories: 01.2 (User Roles), 01.6 (Permissions), 01.4 (Org Profile)

Architecture:
- Python orchestrator (eliminuje Claude orchestration tokens)
- GLM-4.7 dla P2/P3/P4/P7 (testy, kod, refactor, docs)
- Claude Sonnet dla P1/P5/P6 (UX, review, QA)
- Parallel execution per phase (3 stories simultaneously via threading)

8-Phase Sequence:
P1: UX Design (Claude Sonnet) - 3 stories parallel
P2: Test Writing RED (GLM-4.7) - 3 stories parallel
P3: Implementation GREEN (GLM-4.7) - 3 stories parallel
P4: Refactoring (GLM-4.7) - 3 stories parallel [ADDED]
P5: Code Review (Claude Sonnet) - 3 stories parallel
P3 iter2: Bug fixes (GLM-4.7) - tylko stories z issues
P5 iter2: Re-review (Claude Sonnet) - verify fixes
P6: QA Testing (Claude Sonnet) - 3 stories parallel
P7: Documentation (GLM-4.5-Air) - 3 stories parallel

Expected Results:
- Claude tokens: 18,000 (95% reduction vs 378K pure Claude)
- GLM tokens: 210,000 (P2+P3+P4+P7)
- Time: ~2h (parallel execution)
- Quality: 10/10 ACs per story

Monitoring:
python .experiments/claude-glm-test/scripts/hybrid_monitor.py --stories 01.2,01.6,01.4 --action report

Reference: .experiments/claude-glm-test/HYBRID-ORCHESTRATOR-V2-FINAL.md
