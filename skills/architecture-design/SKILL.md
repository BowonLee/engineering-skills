# Architecture Design

## Objective

Design architecture for a system, module, or feature using current project evidence, explicit constraints, dependency boundaries, and verifiable tradeoffs.

## Workflow

1. Read the effective context index generated for the project.
2. Identify the requested design target, scope, non-goals, constraints, and acceptance criteria.
3. Inspect existing architecture docs, ADRs, relevant specs, and representative code paths before proposing structure.
4. Map current boundaries: layers, modules, ownership, dependency direction, data flow, integration points, and persistence boundaries.
5. Produce at least two viable options when the decision is material. If only one option is viable, explain why alternatives are invalid.
6. Compare options against decision drivers such as simplicity, boundary integrity, testability, migration risk, performance, security, and operability.
7. Select a recommended architecture and describe boundaries, dependency direction, data/control flow, failure handling, and rollout/migration shape.
8. Identify required docs, ADRs, specs, diagrams, tests, and validation commands.
9. Report open questions only when they materially change architecture or safety.

## Output Shape

Use this structure for non-trivial architecture work:

```text
Target
Evidence reviewed
Requirements and constraints
Current architecture
Decision drivers
Options considered
Recommended architecture
Boundaries and dependency direction
Data/control flow
Testing and verification strategy
Documentation updates
ADR needed
Open questions
```

## Anti Patterns

- Designing from generic best practices before reading the project's current architecture.
- Treating diagrams as the design when boundaries, ownership, and tradeoffs are not explained.
- Choosing an option without naming the decision drivers.
- Introducing new layers or services without migration and verification paths.
- Leaving an architecture-changing decision without an ADR recommendation.
