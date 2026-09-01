import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { readManifest } from '../src/manifest.js';
import { syncSkills } from '../src/cache.js';
import { discoverProject, formatDiscovery } from '../src/discover.js';
import { formatDoctor, runDoctor } from '../src/doctor.js';
import { prepareCodex } from '../src/prepare.js';
import { setupProject } from '../src/setup.js';

const root = path.resolve('.');
const execFileAsync = promisify(execFile);
const defaultSkills = [
  'adr-authoring',
  'architecture-design',
  'architecture-drift-review',
  'clean-architecture-docs',
  'code-review',
  'documentation-consistency',
  'feature-design',
  'implementation-guidelines',
  'spec-to-implementation-review',
  'system-diagram',
];
const fixtureFilter = (source) =>
  !source.includes(`${path.sep}node_modules${path.sep}`)
  && !source.includes(`${path.sep}.omx${path.sep}`)
  && !source.includes(`${path.sep}.engineering${path.sep}`)
  && !source.includes(`${path.sep}.codex${path.sep}`)
  && !source.includes(`${path.sep}.claude${path.sep}`)
  && !source.includes(`${path.sep}.git${path.sep}`);

test('reads the v0.1 engineering manifest', async () => {
  const manifest = await readManifest(root);
  assert.equal(manifest.version, 1);
  assert.equal(manifest.registry.type, 'local');
  assert.deepEqual(Object.keys(manifest.skills).sort(), defaultSkills);
  for (const skillName of defaultSkills) {
    assert.equal(manifest.skills[skillName], '0.1.0');
  }
  assert.equal(manifest.context.specs, './docs/specs');
});

test('syncs declared skills into the shared cache', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));
  const env = { ENGINEERING_HOME: tmp };
  const manifest = await readManifest(root);

  const results = await syncSkills(root, manifest, { env });

  assert.deepEqual(
    results.map((result) => `${result.status}:${result.name}@${result.version}`).sort(),
    defaultSkills.map((skillName) => `added:${skillName}@0.1.0`),
  );

  const secondResults = await syncSkills(root, manifest, { env });
  assert.deepEqual(
    secondResults.map((result) => `${result.status}:${result.name}@${result.version}`).sort(),
    defaultSkills.map((skillName) => `updated:${skillName}@0.1.0`),
  );

  for (const skillName of defaultSkills) {
    await fs.access(path.join(tmp, 'cache', skillName, '0.1.0', 'SKILL.md'));
  }
});

test('prepares a Codex context index with linked skills', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-project-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));
  const env = { ENGINEERING_HOME: cacheHome };

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const manifest = await readManifest(tmp);
  await syncSkills(tmp, manifest, { env });
  const result = await prepareCodex(tmp, manifest, { env });
  const context = await fs.readFile(result.contextPath, 'utf8');

  assert.match(context, /# Effective Engineering Context/);
  assert.match(context, /feature-design@0\.1\.0/);
  assert.match(context, /architecture-design@0\.1\.0/);
  assert.match(context, /adr-authoring@0\.1\.0/);
  assert.match(context, /system-diagram@0\.1\.0/);
  assert.match(context, /implementation-guidelines@0\.1\.0/);
  assert.match(context, /clean-architecture-docs@0\.1\.0/);
  assert.match(context, /code-review@0\.1\.0/);
  assert.match(context, /documentation-consistency@0\.1\.0/);
  assert.match(context, /architecture-drift-review@0\.1\.0/);
  assert.match(context, /spec-to-implementation-review@0\.1\.0/);
  await fs.lstat(path.join(tmp, '.engineering', 'generated', 'skills', 'implementation-guidelines'));
});

test('prepare can install project-local Codex skills', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-project-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));
  const env = { ENGINEERING_HOME: cacheHome };

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const manifest = await readManifest(tmp);
  await syncSkills(tmp, manifest, { env });
  const result = await prepareCodex(tmp, manifest, { env, installSkills: true });

  assert.equal(result.installedSkills.length, defaultSkills.length);
  await fs.access(path.join(tmp, '.codex', 'skills', 'feature-design', 'SKILL.md'));
  await fs.access(path.join(tmp, '.codex', 'skills', 'architecture-design', 'SKILL.md'));
  await fs.access(path.join(tmp, '.codex', 'skills', 'implementation-guidelines', 'SKILL.md'));
  await fs.access(path.join(tmp, '.codex', 'skills', 'clean-architecture-docs', 'SKILL.md'));
  await fs.access(path.join(tmp, '.codex', 'skills', 'code-review', 'skill.yaml'));
  await fs.access(path.join(tmp, '.codex', 'skills', 'documentation-consistency', 'SKILL.md'));
});

test('CLI supports prepare codex --install-skills', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-project-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const env = { ...process.env, ENGINEERING_HOME: cacheHome };
  await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'sync'], { env });
  const result = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'prepare', 'codex', '--install-skills'], { env });

  assert.match(result.stdout, /installed codex skills:/);
  await fs.access(path.join(tmp, '.codex', 'skills', 'implementation-guidelines', 'SKILL.md'));
});

test('setup bootstraps an empty project for npx-style usage', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bakeflow-setup-'));

  const env = { ...process.env };
  delete env.ENGINEERING_HOME;
  const result = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'setup', '--codex'], { env });

  assert.match(result.stdout, /Bakeflow Setup/);
  assert.match(result.stdout, /created manifest:/);
  assert.match(result.stdout, /Results: \d+ passed, 0 warnings, 0 failed/);
  await fs.access(path.join(tmp, 'engineering.yaml'));
  await fs.access(path.join(tmp, '.engineering', 'registry', 'skills', 'feature-design', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'registry', 'skills', 'architecture-design', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'registry', 'skills', 'implementation-guidelines', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'registry', 'skills', 'clean-architecture-docs', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'registry', 'skills', 'documentation-consistency', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'cache', 'implementation-guidelines', '0.1.0', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'generated', 'context.md'));
  await fs.access(path.join(tmp, '.codex', 'skills', 'code-review', 'skill.yaml'));
  await fs.access(path.join(tmp, 'docs', 'specs'));
});

test('setup can bootstrap Claude Code project skills', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bakeflow-claude-'));

  const env = { ...process.env };
  delete env.ENGINEERING_HOME;
  const result = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'setup', '--claude'], { env });

  assert.match(result.stdout, /prepared claude context:/);
  assert.match(result.stdout, /installed claude skills:/);
  assert.match(result.stdout, /Results: \d+ passed, 0 warnings, 0 failed/);
  const claudeSkill = await fs.readFile(path.join(tmp, '.claude', 'skills', 'implementation-guidelines', 'SKILL.md'), 'utf8');
  assert.match(claudeSkill, /^---\nname: implementation-guidelines\n/m);
  assert.match(claudeSkill, /description: Shared implementation principles/);
  await fs.access(path.join(tmp, '.engineering', 'generated', 'claude-context.md'));
  await fs.access(path.join(tmp, '.claude', 'CLAUDE.md'));
  await fs.access(path.join(tmp, '.claude', 'skills', 'adr-authoring', 'SKILL.md'));
  await fs.access(path.join(tmp, '.claude', 'skills', 'system-diagram', 'SKILL.md'));
  await fs.access(path.join(tmp, '.claude', 'skills', 'clean-architecture-docs', 'SKILL.md'));
  await fs.access(path.join(tmp, '.claude', 'skills', 'spec-to-implementation-review', 'SKILL.md'));
});

test('CLI supports prepare claude', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bakeflow-claude-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const env = { ...process.env, ENGINEERING_HOME: cacheHome };
  await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'sync'], { env });
  const result = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'prepare', 'claude'], { env });

  assert.match(result.stdout, /prepared claude context:/);
  assert.match(result.stdout, /created claude instructions:/);
  await fs.access(path.join(tmp, '.claude', 'skills', 'code-review', 'SKILL.md'));
});

test('setupProject reports healthy doctor state', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bakeflow-setup-'));
  const result = await setupProject(tmp, { env: {} });

  assert.equal(result.bootstrap.created, true);
  assert.equal(result.engineeringHome, path.join(tmp, '.engineering'));
  assert.equal(result.doctor.checks.some((check) => check.status === 'fail'), false);
});

test('prepare reports a clear error when sync has not run', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-project-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));
  const env = { ENGINEERING_HOME: cacheHome };

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const manifest = await readManifest(tmp);
  await assert.rejects(
    () => prepareCodex(tmp, manifest, { env }),
    /Run `bakeflow sync` first/,
  );
});

test('CLI supports --project for sync and prepare', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-project-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const env = { ...process.env, ENGINEERING_HOME: cacheHome };
  const sync = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'sync'], { env });
  assert.match(sync.stdout, /added feature-design@0\.1\.0/);
  assert.match(sync.stdout, /added architecture-design@0\.1\.0/);
  assert.match(sync.stdout, /added adr-authoring@0\.1\.0/);
  assert.match(sync.stdout, /added system-diagram@0\.1\.0/);
  assert.match(sync.stdout, /added implementation-guidelines@0\.1\.0/);
  assert.match(sync.stdout, /added clean-architecture-docs@0\.1\.0/);
  assert.match(sync.stdout, /added code-review@0\.1\.0/);
  assert.match(sync.stdout, /added documentation-consistency@0\.1\.0/);

  const prepare = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'prepare', 'codex'], { env });
  assert.match(prepare.stdout, /prepared codex context:/);

  const context = await fs.readFile(path.join(tmp, '.engineering', 'generated', 'context.md'), 'utf8');
  assert.match(context, /Effective Engineering Context/);
});

test('CLI defaults cache to the project .engineering directory', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bakeflow-project-cache-'));

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const env = { ...process.env };
  delete env.ENGINEERING_HOME;
  await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'sync'], { env });

  await fs.access(path.join(tmp, '.engineering', 'cache', 'feature-design', '0.1.0', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'cache', 'architecture-design', '0.1.0', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'cache', 'implementation-guidelines', '0.1.0', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'cache', 'clean-architecture-docs', '0.1.0', 'SKILL.md'));
  await fs.access(path.join(tmp, '.engineering', 'cache', 'code-review', '0.1.0', 'skill.yaml'));
  await fs.access(path.join(tmp, '.engineering', 'cache', 'architecture-drift-review', '0.1.0', 'SKILL.md'));
});

test('sync rejects missing skills and version mismatches', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-project-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));
  const env = { ENGINEERING_HOME: cacheHome };

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  await fs.writeFile(
    path.join(tmp, 'engineering.yaml'),
    [
      'version: 1',
      'registry:',
      '  type: local',
      '  path: .',
      'skills:',
      '  missing-skill: 0.1.0',
      '',
    ].join('\n'),
    'utf8',
  );

  await assert.rejects(
    async () => syncSkills(tmp, await readManifest(tmp), { env }),
    /was not found/,
  );

  await fs.writeFile(
    path.join(tmp, 'engineering.yaml'),
    [
      'version: 1',
      'registry:',
      '  type: local',
      '  path: .',
      'skills:',
      '  implementation-guidelines: 9.9.9',
      '',
    ].join('\n'),
    'utf8',
  );

  await assert.rejects(
    async () => syncSkills(tmp, await readManifest(tmp), { env }),
    /version mismatch/,
  );
});

test('discovers observed project context without writing files', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-discover-'));
  await fs.mkdir(path.join(tmp, 'docs', 'architecture'), { recursive: true });
  await fs.mkdir(path.join(tmp, 'docs', 'adr'), { recursive: true });
  await fs.mkdir(path.join(tmp, 'skills', 'example'), { recursive: true });

  const before = await fs.readdir(tmp, { recursive: true });
  const discovery = await discoverProject(tmp);
  const output = formatDiscovery(discovery);
  const after = await fs.readdir(tmp, { recursive: true });

  assert.deepEqual(after.sort(), before.sort());
  assert.match(output, /Engineering Skills Discovery/);
  assert.match(output, /context\.architecture: docs\/architecture/);
  assert.match(output, /example: skills\/example/);
  assert.match(output, /No files were changed/);
});

test('CLI supports init --discover', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-discover-'));
  await fs.mkdir(path.join(tmp, 'docs', 'design-system'), { recursive: true });

  const result = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'init', '--discover']);

  assert.match(result.stdout, /Engineering Skills Discovery/);
  assert.match(result.stdout, /context\.design_system: docs\/design-system/);
  assert.match(result.stdout, /No files were changed/);
});

test('doctor reports cache and generated state', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-doctor-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));
  const env = { ENGINEERING_HOME: cacheHome };

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  let doctor = await runDoctor(tmp, { env });
  let output = formatDoctor(doctor);
  assert.match(output, /Cache implementation-guidelines: missing/);
  assert.match(output, /Generated context: missing/);
  assert.equal(doctor.checks.some((check) => check.status === 'fail'), true);

  const manifest = await readManifest(tmp);
  await syncSkills(tmp, manifest, { env });
  await prepareCodex(tmp, manifest, { env });

  doctor = await runDoctor(tmp, { env });
  output = formatDoctor(doctor);
  assert.match(output, /Bakeflow Doctor/);
  assert.match(output, /Results: \d+ passed, 0 warnings, 0 failed/);
});

test('doctor reports installed project-local Codex skills', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-doctor-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));
  const env = { ENGINEERING_HOME: cacheHome };

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const manifest = await readManifest(tmp);
  await syncSkills(tmp, manifest, { env });
  await prepareCodex(tmp, manifest, { env, installSkills: true });

  const output = formatDoctor(await runDoctor(tmp, { env }));
  assert.match(output, /Codex skill feature-design/);
  assert.match(output, /Codex skill architecture-design/);
  assert.match(output, /Codex skill implementation-guidelines/);
  assert.match(output, /Codex skill clean-architecture-docs/);
  assert.match(output, /Codex skill code-review/);
  assert.match(output, /Codex skill documentation-consistency/);
  assert.match(output, /0 warnings, 0 failed/);
});

test('CLI supports doctor', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-doctor-'));
  const cacheHome = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));

  await fs.cp(root, tmp, {
    recursive: true,
    filter: fixtureFilter,
  });

  const env = { ...process.env, ENGINEERING_HOME: cacheHome };
  await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'sync'], { env });
  await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'prepare', 'codex'], { env });
  const result = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'doctor'], { env });

  assert.match(result.stdout, /Bakeflow Doctor/);
  assert.match(result.stdout, /0 warnings, 0 failed/);
});

test('usage documentation is included in the project', async () => {
  const readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
  const readmeKo = await fs.readFile(path.join(root, 'README.ko.md'), 'utf8');
  const usage = await fs.readFile(path.join(root, 'docs', 'USAGE.md'), 'utf8');
  const usageKo = await fs.readFile(path.join(root, 'docs', 'USAGE.ko.md'), 'utf8');
  const skillsKo = await fs.readFile(path.join(root, 'docs', 'SKILLS.ko.md'), 'utf8');
  const architecture = await fs.readFile(path.join(root, 'engineering-skills-architecture.md'), 'utf8');
  const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

  assert.match(readme, /docs\/USAGE\.md/);
  assert.match(readme, /README\.ko\.md/);
  assert.match(readme, /npm install -g @bakerleebb\/bakeflow/);
  assert.match(readmeKo, /Bakeflow는/);
  assert.match(readmeKo, /균일함/);
  assert.match(readmeKo, /docs\/USAGE\.ko\.md/);
  assert.match(readmeKo, /docs\/SKILLS\.ko\.md/);
  assert.match(usage, /bakeflow init --discover/);
  assert.match(usage, /bakeflow setup --codex/);
  assert.match(usage, /bakeflow setup --claude/);
  assert.match(usage, /bakeflow prepare claude/);
  assert.match(usage, /bakeflow sync/);
  assert.match(usage, /bakeflow prepare codex/);
  assert.match(usage, /bakeflow prepare codex --install-skills/);
  assert.match(usage, /bakeflow doctor/);
  assert.match(usage, /Use From Another Project/);
  assert.match(usage, /Codex Workflow/);
  assert.match(usage, /feature-design/);
  assert.match(usage, /architecture-design/);
  assert.match(usage, /adr-authoring/);
  assert.match(usage, /system-diagram/);
  assert.match(usage, /documentation-consistency/);
  assert.match(usage, /architecture-drift-review/);
  assert.match(usage, /spec-to-implementation-review/);
  assert.match(usageKo, /npx 한 줄 설정/);
  assert.match(usageKo, /Claude Code용/);
  assert.match(usageKo, /문서와 구현의 일치성/);
  assert.match(usageKo, /SKILLS\.ko\.md/);
  assert.match(skillsKo, /Bakeflow 기본 스킬 문서/);
  assert.match(skillsKo, /feature-design/);
  assert.match(skillsKo, /architecture-design/);
  assert.match(skillsKo, /adr-authoring/);
  assert.match(skillsKo, /system-diagram/);
  assert.match(skillsKo, /implementation-guidelines/);
  assert.match(skillsKo, /clean-architecture-docs/);
  assert.match(skillsKo, /code-review/);
  assert.match(skillsKo, /documentation-consistency/);
  assert.match(skillsKo, /architecture-drift-review/);
  assert.match(skillsKo, /spec-to-implementation-review/);
  assert.match(skillsKo, /스킬 조합 예시/);
  assert.match(architecture, /현재 구현체의 이름은 `bakeflow`/);
  assert.match(architecture, /architecture-design/);
  assert.match(architecture, /adr-authoring/);
  assert.match(architecture, /documentation-consistency/);
  assert.match(architecture, /spec-to-implementation-review/);
  assert.equal(packageJson.name, '@bakerleebb/bakeflow');
  assert.equal(packageJson.bin.bakeflow, 'src/cli.js');
  assert.equal(packageJson.files.includes('README.ko.md'), true);
  assert.equal(packageJson.publishConfig.access, 'public');
});
