# Prompts Reference

## Agent Invocation Prompts

### Start New Project
```
Invoke ORCHESTRATOR to start a new project.
Project: {name}
Description: {description}
```

### Create PRD
```
Invoke PM-AGENT to create PRD.
Requirements: {requirements}
Stakeholders: {stakeholders}
```

### Design Architecture
```
Invoke ARCHITECT-AGENT to design system.
PRD: @docs/1-BASELINE/product/prd.md
Constraints: {constraints}
```

### Plan Sprint
```
Invoke SCRUM-MASTER to plan sprint.
Backlog: @docs/2-MANAGEMENT/epics/current/
Capacity: {capacity}
```

### Implement Story
```
Invoke {BACKEND-DEV|FRONTEND-DEV} to implement story.
Story: {story reference}
Design: {design reference}
```

### Review Code
```
Invoke CODE-REVIEWER to review implementation.
Code: {file references}
Story: {story reference}
```

## Query Prompts

### Get Status
```
What is the current project status?
Read @PROJECT-STATE.md
```

### List Blockers
```
What are the current blockers?
Check @.claude/state/TASK-QUEUE.md
```

### Review Decisions
```
What decisions have been made?
Check @.claude/state/DECISION-LOG.md
```

## Update Prompts

### Update State
```
Update PROJECT-STATE.md with:
- Current phase: {phase}
- Active sprint: {sprint}
- Progress: {progress}
```

### Log Decision
```
Log decision in DECISION-LOG.md:
- Decision: {decision}
- Rationale: {rationale}
- Impact: {impact}
```
