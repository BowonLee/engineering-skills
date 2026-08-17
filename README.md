# Engineering Skills

Reusable engineering skill management for AI coding agents.

This repository implements the v0.1 MVP described in `engineering-skills-architecture.md`: a manifest-driven resolver that syncs shared skills into a local cache and prepares an agent-readable context index for Codex.

## Current Scope

Implemented:

- `engineering.yaml` manifest
- Local skill registry under `skills/`
- Shared cache under `${ENGINEERING_HOME:-~/.engineering}/cache`
- Read-only repository discovery with `eng init --discover`
- `eng sync`
- `eng prepare codex`
- `eng doctor`
- Codex context index at `.engineering/generated/context.md`

Deferred:

- Git registry resolution
- `eng init`
- `engineering.lock`
- Skill dependency resolution
- Project extensions and initialization interviews
- Additional adapters

## Install

```bash
npm install
```

Run the CLI from this repository:

```bash
npm run eng -- --help
```

Or link it locally:

```bash
npm link
eng --help
```

## Manifest

`engineering.yaml` declares the skills a project uses and the project context paths an agent should inspect.

```yaml
version: 1

registry:
  type: local
  path: .

skills:
  implementation-guidelines: 0.1.0
  code-review: 0.1.0

context:
  architecture: ./docs/architecture
  adr: ./docs/adr
  design_system: ./docs/design-system
```

## Commands

Sync declared skills into the shared cache:

```bash
npm run eng -- init --discover
```

Sync declared skills into the shared cache:

```bash
npm run eng -- sync
```

Prepare Codex context for the current project:

```bash
npm run eng -- prepare codex
```

Check manifest, skill metadata, cache, generated context, and context paths:

```bash
npm run eng -- doctor
```

Use another project root:

```bash
npm run eng -- --project /path/to/project init --discover
npm run eng -- --project /path/to/project sync
npm run eng -- --project /path/to/project prepare codex
```

## Generated Output

`eng prepare codex` creates:

```text
.engineering/generated/
├── context.md
└── skills/
    ├── code-review -> ~/.engineering/cache/code-review/0.1.0
    └── implementation-guidelines -> ~/.engineering/cache/implementation-guidelines/0.1.0
```

Generated files are ignored by Git. Agents should read `.engineering/generated/context.md` first, then open only the relevant skill and project context files for the current task.

## Skill Format

Each skill has:

```text
skills/<name>/
├── skill.yaml
└── SKILL.md
```

`skill.yaml`:

```yaml
name: code-review
version: 0.1.0
description: >
  Review implementation changes for architecture and quality risks.
tags:
  - review
project_context:
  recommended:
    - architecture
```

## Validation

```bash
npm test
```
