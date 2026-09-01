# Feature Design

## Objective

Turn a feature request or spec into an implementation-ready design with clear boundaries, flows, state/data/API changes, documentation needs, and verification criteria.

## Workflow

1. Read the effective context index generated for the project.
2. Locate the source request, feature spec, acceptance criteria, issue, PR description, or user story.
3. Extract goals, non-goals, user-visible behavior, edge cases, compatibility constraints, and success criteria.
4. Identify affected feature/module/subdomain boundaries and existing patterns to reuse.
5. Design the user flow, data flow, API contracts, state transitions, error handling, and migration needs at the level required by the change.
6. Call out architecture decisions that require `architecture-design` or `adr-authoring`.
7. Define test coverage: unit, integration, end-to-end, visual, accessibility, migration, or operational checks as relevant.
8. List documentation updates for specs, architecture, ADRs, design system, and release notes.
9. Produce a concise handoff that an implementer can execute without rediscovering scope.

## Output Shape

```text
Feature goal
Source requirements
Non-goals
Affected boundaries
User flow
Data/API/state changes
Error and edge cases
Architecture decisions needed
Test plan
Documentation updates
Implementation handoff
Open questions
```

## Anti Patterns

- Treating a feature request as ready for implementation without extracting acceptance criteria.
- Designing UI, API, and data changes independently when they affect the same behavior.
- Expanding scope beyond the request without recording the product or architecture decision.
- Skipping documentation and tests in the design handoff.
- Hiding unknowns inside vague implementation tasks.
