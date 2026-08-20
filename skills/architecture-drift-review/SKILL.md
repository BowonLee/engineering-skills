# Architecture Drift Review

## Objective

Detect implementation drift from the project's documented architecture before it becomes the new accidental standard.

## Workflow

1. Read the effective context index generated for the project.
2. Identify the documented architecture, ADRs, ownership boundaries, and dependency direction that apply to the changed files.
3. Inspect the implementation for new imports, layers, components, data flow, build steps, or generated files that alter those boundaries.
4. Classify each drift as intended, accidental, undocumented, or harmless.
5. For intended drift, require an ADR or architecture update.
6. For accidental drift, recommend the smallest code change that restores the documented boundary.
7. Report findings by risk, with concrete file references and the violated rule or missing decision record.

## Anti Patterns

- Calling every difference a drift without tying it to a documented boundary.
- Blocking intentional architecture evolution instead of asking for a recorded decision.
- Fixing symptoms while leaving the dependency direction or ownership problem intact.
- Introducing a new abstraction when reuse or deletion would repair the drift.
