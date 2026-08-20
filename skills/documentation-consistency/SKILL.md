# Documentation Consistency

## Objective

Keep project documentation, architecture notes, ADRs, design-system notes, and implementation behavior aligned.

## Workflow

1. Read the effective context index generated for the project.
2. Identify the documentation that claims ownership over the changed behavior.
3. Compare those claims with the current code, generated artifacts, tests, and user-facing behavior.
4. Separate stale documentation from missing implementation.
5. Check whether new behavior needs an ADR, architecture note, design-system note, or feature spec update.
6. Report concrete mismatches with file references and the smallest repair: update docs, update code, or write a new decision record.

## Anti Patterns

- Treating documentation as correct without checking the implementation.
- Updating docs to match accidental behavior without checking whether the behavior is intended.
- Creating broad documentation rewrites when a focused ADR or note would be enough.
- Letting generated context replace source project documentation.
