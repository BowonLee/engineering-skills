# Bakeflow

Reusable engineering skill baking and context management for AI coding agents.

This repository implements the v0.1 MVP described in `engineering-skills-architecture.md`: a manifest-driven resolver that syncs shared skills into a local cache and prepares an agent-readable context index for Codex.

For practical setup and day-to-day usage, read [docs/USAGE.md](docs/USAGE.md).

## Current Scope

Implemented:

- `engineering.yaml` manifest
- Local skill registry under `skills/`
- Shared cache under `${ENGINEERING_HOME:-~/.engineering}/cache`
- One-command npx setup with `bakeflow setup --codex` or `bakeflow setup --claude`
- Read-only repository discovery with `bakeflow init --discover`
- `bakeflow sync`
- `bakeflow prepare codex`
- Project-local Codex skill install with `bakeflow prepare codex --install-skills`
- `bakeflow doctor`
- Codex context index at `.engineering/generated/context.md`

Deferred:

- Git registry resolution
- `bakeflow init`
- `engineering.lock`
- Skill dependency resolution
- Project extensions and initialization interviews
- Additional adapters

## Install

Install as a global CLI package:

```bash
npm install -g @bakerleebb/bakeflow
bakeflow --help
```

Run directly with npx in any project:

```bash
npx --yes @bakerleebb/bakeflow setup --codex
npx --yes @bakerleebb/bakeflow setup --claude
```

Install directly from GitHub:

```bash
npm install -g git+ssh://git@github.com/BowonLee/engineering-skills.git
bakeflow --help
```

For local development:

```bash
npm install
```

Run the CLI from this repository:

```bash
npm run bakeflow -- --help
```

Or link it locally:

```bash
npm link
bakeflow --help
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

Set up a project for Codex in one command:

```bash
npx --yes @bakerleebb/bakeflow setup --codex
```

Set up a project for Claude Code in one command:

```bash
npx --yes @bakerleebb/bakeflow setup --claude
```

Set up both adapters:

```bash
npx --yes @bakerleebb/bakeflow setup all
```

Inspect the current project without changing files:

```bash
npm run bakeflow -- init --discover
```

Sync declared skills into the shared cache:

```bash
npm run bakeflow -- sync
```

Prepare Codex context for the current project:

```bash
npm run bakeflow -- prepare codex
```

Also install project-local Codex native skills:

```bash
npm run bakeflow -- prepare codex --install-skills
```

Check manifest, skill metadata, cache, generated context, and context paths:

```bash
npm run bakeflow -- doctor
```

Use another project root:

```bash
npm run bakeflow -- --project /path/to/project init --discover
npm run bakeflow -- --project /path/to/project sync
npm run bakeflow -- --project /path/to/project prepare codex
npm run bakeflow -- --project /path/to/project doctor
```

## Generated Output

`bakeflow prepare codex` creates:

```text
.engineering/generated/
├── context.md
└── skills/
    ├── code-review -> ~/.engineering/cache/code-review/0.1.0
    └── implementation-guidelines -> ~/.engineering/cache/implementation-guidelines/0.1.0
```

Generated files are ignored by Git. Agents should read `.engineering/generated/context.md` first, then open only the relevant skill and project context files for the current task.

`bakeflow prepare claude` creates:

```text
.engineering/generated/claude-context.md
.claude/
├── CLAUDE.md
└── skills/
    ├── code-review/
    └── implementation-guidelines/
```

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
npm run pack:check
```
