# Bakeflow Usage

English | [한국어](USAGE.ko.md)

This guide explains how to use the `bakeflow` CLI in this repository and how to apply the shared skills to another project.

## Concepts

The tool uses this flow:

```text
engineering.yaml
  -> bakeflow sync
  -> ~/.engineering/cache
  -> bakeflow prepare codex
  -> .engineering/generated/context.md
  -> optional .codex/skills install
  -> Codex reads the generated context and relevant skills
```

`engineering.yaml` is the project manifest. It declares which shared skills the project uses and where project-specific context lives.

The shared cache defaults to:

```text
~/.engineering/cache
```

You can override it:

```bash
ENGINEERING_HOME=/tmp/engineering npm run bakeflow -- sync
```

Generated project files are written under:

```text
.engineering/generated/
```

Generated files are intentionally ignored by Git.

## One-Command npx Setup

From any project root, run:

```bash
npx --yes @bakerleebb/bakeflow setup --codex
```

This command:

- creates `engineering.yaml` if it does not already exist
- copies the bundled skill registry into `.engineering/registry`
- uses `.engineering/cache` as the project-local cache
- runs `bakeflow sync`
- runs `bakeflow prepare codex --install-skills`
- runs `bakeflow doctor`
- updates `.gitignore` with generated/cache paths

For Claude Code:

```bash
npx --yes @bakerleebb/bakeflow setup --claude
```

For both Codex and Claude Code:

```bash
npx --yes @bakerleebb/bakeflow setup all
```

Verify the package before setup:

```bash
npm view @bakerleebb/bakeflow version
npx --yes @bakerleebb/bakeflow --help
```

The generated project files are:

```text
.engineering/
├── cache/
├── generated/
│   ├── context.md
│   └── skills/
└── registry/
    └── skills/

.codex/
└── skills/

.claude/
├── CLAUDE.md
└── skills/
```

## Use This Repository

Install as a global CLI package:

```bash
npm install -g @bakerleebb/bakeflow
```

Install directly from GitHub:

```bash
npm install -g git+ssh://git@github.com/BowonLee/engineering-skills.git
```

After a global install, use:

```bash
bakeflow --help
bakeflow setup --codex
bakeflow setup --claude
bakeflow init --discover
bakeflow sync
bakeflow prepare codex
bakeflow prepare claude
bakeflow doctor
```

For local development, install dependencies:

```bash
npm install
```

Inspect the repository without changing files:

```bash
npm run bakeflow -- init --discover
```

Sync skills into the shared cache:

```bash
npm run bakeflow -- sync
```

Prepare Codex context:

```bash
npm run bakeflow -- prepare codex
```

Install project-local Codex native skills:

```bash
npm run bakeflow -- prepare codex --install-skills
```

Check the setup:

```bash
npm run bakeflow -- doctor
```

Expected healthy doctor result:

```text
Results: 12 passed, 0 warnings, 0 failed
```

Run tests:

```bash
npm test
npm run pack:check
```

## Published Package Check

The package is intended to be inspectable from npm:

```bash
npm view @bakerleebb/bakeflow name version bin files --json
npm pack @bakerleebb/bakeflow --dry-run
```

The package should include both English and Korean documentation, the CLI source, schemas, and bundled skills.

## Use From Another Project

In the target project, create `engineering.yaml`:

```yaml
version: 1

registry:
  type: local
  path: /Users/ibowon/workspace/engineering-skills

skills:
  implementation-guidelines: 0.1.0
  code-review: 0.1.0

context:
  architecture: ./docs/architecture
  adr: ./docs/adr
  design_system: ./docs/design-system
```

From this repository, run against the target project:

```bash
npm run bakeflow -- --project /path/to/project init --discover
npm run bakeflow -- --project /path/to/project sync
npm run bakeflow -- --project /path/to/project prepare codex
npm run bakeflow -- --project /path/to/project prepare codex --install-skills
npm run bakeflow -- --project /path/to/project doctor
```

Or run the CLI file directly from the target project:

```bash
node /Users/ibowon/workspace/engineering-skills/src/cli.js init --discover
node /Users/ibowon/workspace/engineering-skills/src/cli.js sync
node /Users/ibowon/workspace/engineering-skills/src/cli.js prepare codex
node /Users/ibowon/workspace/engineering-skills/src/cli.js prepare codex --install-skills
node /Users/ibowon/workspace/engineering-skills/src/cli.js doctor
```

## Codex Workflow

Before asking Codex to work on a target project, run:

```bash
npm run bakeflow -- --project /path/to/project sync
npm run bakeflow -- --project /path/to/project prepare codex
```

If you want Codex to discover the skills as project-local native skills, run:

```bash
npm run bakeflow -- --project /path/to/project prepare codex --install-skills
```

Then instruct Codex:

```text
Read .engineering/generated/context.md first. Open only the relevant generated skill and project context files for this task.
```

Codex should use:

- `.engineering/generated/context.md` as the index
- `.engineering/generated/skills/<skill>/SKILL.md` for shared engineering rules
- `.codex/skills/<skill>/SKILL.md` when `--install-skills` was used
- the project context paths declared in `engineering.yaml`

## Command Reference

### `bakeflow setup --codex`

Bootstraps and verifies a project for Codex in one command.

```bash
npx --yes @bakerleebb/bakeflow setup --codex
```

If `engineering.yaml` is missing, Bakeflow creates a default manifest and project-local skill registry under `.engineering/registry`. If the manifest already exists, Bakeflow uses it as-is.

### `bakeflow setup --claude`

Bootstraps and verifies a project for Claude Code in one command.

```bash
npx --yes @bakerleebb/bakeflow setup --claude
```

This creates `.engineering/generated/claude-context.md`, installs project skills under `.claude/skills/`, and creates or updates `.claude/CLAUDE.md` with a Bakeflow instruction block. Claude Code loads project instructions from `CLAUDE.md` or `.claude/CLAUDE.md`, and project skills from `.claude/skills/<skill-name>/SKILL.md`.

To set up both adapters:

```bash
npx --yes @bakerleebb/bakeflow setup all
```

### `bakeflow init --discover`

Reads the project structure and reports observed paths, discovered skills, and unknown context. It does not write files.

```bash
npm run bakeflow -- init --discover
```

### `bakeflow sync`

Reads `engineering.yaml`, validates declared skills, and copies them into the shared cache.

```bash
npm run bakeflow -- sync
```

### `bakeflow prepare codex`

Links cached skills into `.engineering/generated/skills` and creates `.engineering/generated/context.md`.

```bash
npm run bakeflow -- prepare codex
```

With `--install-skills`, it also copies skills into project-local `.codex/skills`.

```bash
npm run bakeflow -- prepare codex --install-skills
```

### `bakeflow prepare claude`

Installs cached skills into `.claude/skills`, creates `.engineering/generated/claude-context.md`, and writes a managed Bakeflow block into `.claude/CLAUDE.md`.

```bash
npm run bakeflow -- prepare claude
```

### `bakeflow doctor`

Checks manifest validity, skill metadata, cache state, generated context, generated skill links, and project context paths.

```bash
npm run bakeflow -- doctor
```

## Current Limits

The v0.1 CLI supports only:

- local registry: `registry.type: local`
- Codex adapter: `bakeflow prepare codex`
- project-local Codex skill install: `bakeflow prepare codex --install-skills`
- Claude Code adapter: `bakeflow prepare claude`
- explicit manifest skills

Not yet implemented:

- Git registry resolution
- `engineering.lock`
- composite skill resolution
- project extensions under `.engineering/overrides`
- interactive `bakeflow init --configure`
- `bakeflow apply`
- adapters for OMC and OMX
