@echo off
REM HYBRID V2 Orchestrator - Quick Start
REM Run Epic 01-Settings pilot with GLM integration

cd /d "C:\Users\Mariusz K\Documents\Programowanie\MonoPilot"

echo ============================================================
echo   HYBRID V2 ORCHESTRATOR - Epic 01-Settings
echo ============================================================
echo.
echo Stories: 01.2 (User Roles), 01.6 (Permissions), 01.4 (Org Profile)
echo Phases:  P1 P2 P3 P4 P5 (P6 P7 optional)
echo Model:   GLM-4.7 for P2/P3/P4/P7, Claude for P1/P5/P6
echo.
echo Starting pilot...
echo.

python .experiments\claude-glm-test\scripts\hybrid_orchestrator_v2.py ^
  --stories 01.2,01.6,01.4 ^
  --start-phase P1 ^
  --project-root .

echo.
echo ============================================================
echo   Pilot Complete!
echo ============================================================
echo.
echo Generate report:
echo   python .experiments\claude-glm-test\scripts\hybrid_monitor.py --stories 01.2,01.6,01.4 --action report
echo.

pause
