# Spec To Implementation Review

## Objective

Verify that implementation behavior, tests, and documentation match the feature specification or requested change.

## Workflow

1. Read the effective context index generated for the project.
2. Locate the relevant spec, issue, PR description, user request, or acceptance criteria.
3. Extract the required behaviors, non-goals, edge cases, and verification expectations.
4. Compare the implementation against each requirement.
5. Check whether tests prove the required behaviors and likely regressions.
6. Identify missing docs, ADRs, migrations, or release notes when the spec implies them.
7. Report gaps as requirement-to-evidence findings: requirement, implementation evidence, test evidence, and repair.

## Anti Patterns

- Treating implementation completeness as proven because code exists.
- Treating tests as sufficient when they do not map to the stated acceptance criteria.
- Expanding scope beyond the spec without calling out the product or architecture decision.
- Ignoring non-goals and compatibility constraints.
