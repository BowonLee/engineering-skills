# Implementation Guidelines

## Objective

Implement changes in a way that respects the current project's architecture, documented decisions, dependency boundaries, and verification expectations.

## Workflow

1. Read the effective context index generated for the project.
2. Inspect project architecture and relevant ADRs before changing behavior.
3. Reuse existing modules, utilities, and patterns before introducing new abstractions.
4. Keep dependency direction consistent with the documented architecture.
5. Keep changes small enough to review and verify.
6. Add or update focused tests for changed behavior.
7. Run the smallest validation that proves the change.

## Anti Patterns

- Creating new layers without checking existing architecture.
- Copying common logic instead of reusing established utilities.
- Treating generated context as source-of-truth project documentation.
- Skipping verification when behavior changed.
