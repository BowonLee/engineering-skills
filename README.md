# Bakeflow

Reusable engineering skill baking and context management for AI coding agents.

English | [한국어](README.ko.md)

Bakeflow is a manifest-driven CLI for managing shared engineering direction across different languages, frameworks, and product surfaces. It packages reusable skills for implementation, review, architecture drift, documentation consistency, and spec-to-implementation alignment, then prepares agent-readable project context for Codex and Claude Code.

"Consistent" does not mean "identical." Bakeflow provides abstract shared skill structure; each adopting project applies and evolves those skills against its own architecture, ADRs, design system, and feature specs.

For practical setup and day-to-day usage, read [docs/USAGE.md](docs/USAGE.md). Korean usage documentation is available at [docs/USAGE.ko.md](docs/USAGE.ko.md).

## Quick Start

Set up Codex project skills:

```bash
npx --yes @bakerleebb/bakeflow setup --codex
```

Set up Claude Code project skills:

```bash
npx --yes @bakerleebb/bakeflow setup --claude
```

Set up both:

```bash
npx --yes @bakerleebb/bakeflow setup all
```

Verify the published package:

```bash
npm view @bakerleebb/bakeflow version
npx --yes @bakerleebb/bakeflow --help
```

## Current Scope

Implemented:

- `engineering.yaml` manifest
- Local skill registry under `skills/`
- Project-local cache under `.engineering/cache` unless `ENGINEERING_HOME` is set
- One-command npx setup with `bakeflow setup --codex` or `bakeflow setup --claude`
- Read-only repository discovery with `bakeflow init --discover`
- `bakeflow sync`
- `bakeflow prepare codex`
- Project-local Codex skill install with `bakeflow prepare codex --install-skills`
- Claude Code skill install with `bakeflow prepare claude`
- `bakeflow doctor`
- Codex context index at `.engineering/generated/context.md`
- Claude context index at `.engineering/generated/claude-context.md`
- Default cross-project skills for implementation, review, documentation consistency, architecture drift, and spec-to-implementation review

Deferred:

- Git registry resolution
- `bakeflow init`
- `engineering.lock`
- Skill dependency resolution
- Project extensions and initialization interviews
- Additional adapters

## Installation

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
  clean-architecture-docs: 0.1.0
  code-review: 0.1.0

context:
  architecture: ./docs/architecture
  adr: ./docs/adr
  design_system: ./docs/design-system
  specs: ./docs/specs
```

## Default Skills

Bakeflow's bundled skills target engineering concerns that appear across many projects:

- `implementation-guidelines`: implement changes while respecting architecture, ADRs, and verification expectations.
- `clean-architecture-docs`: verify Clean Architecture boundaries and code-to-docs directory mapping.
- `code-review`: review changes against architecture, documentation, tests, and behavioral risk.
- `documentation-consistency`: keep docs, ADRs, design-system notes, and behavior aligned.
- `architecture-drift-review`: detect drift from documented architecture, dependency direction, and ownership boundaries.
- `spec-to-implementation-review`: compare specs, acceptance criteria, tests, and implementation behavior.

## Project Evolution Model

Adopting projects receive a project-local registry under `.engineering/registry/skills`. Treat it as a starting point:

1. Apply the bundled common skills.
2. Fill project context under `docs/architecture`, `docs/adr`, `docs/design-system`, and `docs/specs`.
3. Record project-specific rules locally first.
4. Promote only repeated, generalized rules back into shared skills.
5. Keep non-general rules in project context.

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

## Package Contents

The npm package includes:

- CLI source under `src/`
- built-in engineering skills under `skills/`
- JSON schemas under `schemas/`
- English documentation: `README.md`, `docs/USAGE.md`
- Korean documentation: `README.ko.md`, `docs/USAGE.ko.md`
- architecture note: `engineering-skills-architecture.md`

Use another project root:

Replace `/path/to/project` with the real absolute or relative path to the target project.

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
    ├── code-review -> .engineering/cache/code-review/0.1.0
    └── implementation-guidelines -> .engineering/cache/implementation-guidelines/0.1.0
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
