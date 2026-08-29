# Clean Architecture Docs

## Objective

Verify that the project follows its documented Clean Architecture structure and that documentation directories mirror the codebase's logical core, feature, and subdomain boundaries.

## Workflow

1. Read the effective context index generated for the project.
2. Identify the project's documented architecture roots, such as core, feature, module, domain, application, infrastructure, presentation, or adapter directories.
3. Map the codebase's logical boundaries before judging path names. Do not assume every project literally uses `core/` and `feature/`.
4. Check that project documentation has matching context for the same logical boundaries.
5. For each changed feature, module, or subdomain, verify that its documentation exists or that the architecture docs explain why it is intentionally undocumented.
6. Check dependency direction against the documented Clean Architecture rule for that project.
7. Classify gaps as missing code boundary, missing documentation boundary, stale documentation, or intentional architecture variation.
8. Report concrete gaps with code path, expected documentation path, relevant rule, and the smallest repair.

## Boundary Mapping

Prefer the project's own terminology. Common mappings include:

```text
code/core             -> docs/core
code/feature/<name>   -> docs/feature/<name>
src/domain            -> docs/domain
src/application       -> docs/application
src/infrastructure    -> docs/infrastructure
modules/<name>        -> docs/modules/<name>
packages/<name>       -> docs/packages/<name>
```

If the project uses a different layout, map the logical role rather than forcing these names.

## Review Questions

- What is the stable inner policy layer?
- What is the feature, module, or subdomain boundary?
- Which outer layers depend on inner layers?
- Does a matching docs path explain each important boundary?
- Did the change create, remove, split, or merge a boundary?
- If a boundary changed, is there an ADR or architecture note?

## Anti Patterns

- Forcing `core/` and `feature/` directory names onto projects that use equivalent Clean Architecture terms.
- Creating docs folders that mirror files mechanically without explaining architectural responsibility.
- Treating missing docs as harmless when a new feature, module, subdomain, or dependency direction was introduced.
- Updating documentation to match accidental architecture drift without recording the decision.
