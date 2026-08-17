# Engineering Skills Usage

This guide explains how to use the `eng` CLI in this repository and how to apply the shared skills to another project.

## Concepts

The tool uses this flow:

```text
engineering.yaml
  -> eng sync
  -> ~/.engineering/cache
  -> eng prepare codex
  -> .engineering/generated/context.md
  -> Codex reads the generated context and relevant skills
```

`engineering.yaml` is the project manifest. It declares which shared skills the project uses and where project-specific context lives.

The shared cache defaults to:

```text
~/.engineering/cache
```

You can override it:

```bash
ENGINEERING_HOME=/tmp/engineering npm run eng -- sync
```

Generated project files are written under:

```text
.engineering/generated/
```

Generated files are intentionally ignored by Git.

## Use This Repository

Install dependencies:

```bash
npm install
```

Inspect the repository without changing files:

```bash
npm run eng -- init --discover
```

Sync skills into the shared cache:

```bash
npm run eng -- sync
```

Prepare Codex context:

```bash
npm run eng -- prepare codex
```

Check the setup:

```bash
npm run eng -- doctor
```

Expected healthy doctor result:

```text
Results: 12 passed, 0 warnings, 0 failed
```

Run tests:

```bash
npm test
```

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
npm run eng -- --project /path/to/project init --discover
npm run eng -- --project /path/to/project sync
npm run eng -- --project /path/to/project prepare codex
npm run eng -- --project /path/to/project doctor
```

Or run the CLI file directly from the target project:

```bash
node /Users/ibowon/workspace/engineering-skills/src/cli.js init --discover
node /Users/ibowon/workspace/engineering-skills/src/cli.js sync
node /Users/ibowon/workspace/engineering-skills/src/cli.js prepare codex
node /Users/ibowon/workspace/engineering-skills/src/cli.js doctor
```

## Codex Workflow

Before asking Codex to work on a target project, run:

```bash
npm run eng -- --project /path/to/project sync
npm run eng -- --project /path/to/project prepare codex
```

Then instruct Codex:

```text
Read .engineering/generated/context.md first. Open only the relevant generated skill and project context files for this task.
```

Codex should use:

- `.engineering/generated/context.md` as the index
- `.engineering/generated/skills/<skill>/SKILL.md` for shared engineering rules
- the project context paths declared in `engineering.yaml`

## Command Reference

### `eng init --discover`

Reads the project structure and reports observed paths, discovered skills, and unknown context. It does not write files.

```bash
npm run eng -- init --discover
```

### `eng sync`

Reads `engineering.yaml`, validates declared skills, and copies them into the shared cache.

```bash
npm run eng -- sync
```

### `eng prepare codex`

Links cached skills into `.engineering/generated/skills` and creates `.engineering/generated/context.md`.

```bash
npm run eng -- prepare codex
```

### `eng doctor`

Checks manifest validity, skill metadata, cache state, generated context, generated skill links, and project context paths.

```bash
npm run eng -- doctor
```

## Current Limits

The v0.1 CLI supports only:

- local registry: `registry.type: local`
- Codex adapter: `eng prepare codex`
- explicit manifest skills

Not yet implemented:

- Git registry resolution
- `engineering.lock`
- composite skill resolution
- project extensions under `.engineering/overrides`
- interactive `eng init --configure`
- `eng apply`
- adapters for Claude, OMC, and OMX
