# ADR Authoring

## Objective

Create or update Architecture Decision Records so architecture-changing work has a durable decision, rationale, consequences, implementation impact, and verification criteria.

## Workflow

1. Read the effective context index generated for the project.
2. Find existing ADR conventions, numbering, status values, and architecture docs.
3. Identify the decision being made. Do not write an ADR for routine implementation details.
4. Capture context, constraints, decision drivers, alternatives considered, and the selected decision.
5. State consequences clearly: benefits, costs, risks, migration impact, compatibility impact, and future constraints.
6. Link affected code boundaries, specs, tests, docs, and rollout work.
7. Mark unresolved questions separately from accepted assumptions.
8. If updating an existing ADR, preserve history and add a supersedes/superseded-by relationship when appropriate.

## ADR Template

```markdown
# ADR NNN: Title

## Status

Proposed | Accepted | Superseded | Deprecated

## Context

## Decision Drivers

## Options Considered

## Decision

## Consequences

## Implementation Impact

## Verification

## Related Documents

## Open Questions
```

## Anti Patterns

- Writing an ADR after implementation to justify accidental drift.
- Recording only the chosen option without alternatives and tradeoffs.
- Mixing multiple independent decisions into one ADR.
- Leaving verification and implementation impact out of architecture decisions.
- Treating ADRs as immutable when a superseding decision is needed.
