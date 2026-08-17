# Code Review

## Objective

Review code changes against project architecture, documented decisions, quality expectations, and verification evidence.

## Workflow

1. Identify the changed behavior and touched boundaries.
2. Check whether the implementation follows existing architecture and dependency rules.
3. Check whether existing components, utilities, and patterns were reused appropriately.
4. Verify that tests cover the changed behavior and likely regressions.
5. Check whether docs or ADRs need updates.
6. Report findings by severity with concrete file references.

## Anti Patterns

- Prioritizing style comments over behavioral or architectural risk.
- Approving changes without verification evidence.
- Treating missing tests as acceptable when behavior changed.
