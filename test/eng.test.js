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

const root = path.resolve('.');
const execFileAsync = promisify(execFile);
const fixtureFilter = (source) =>
  !source.includes(`${path.sep}node_modules${path.sep}`)
  && !source.includes(`${path.sep}.omx${path.sep}`)
  && !source.includes(`${path.sep}.engineering${path.sep}`)
  && !source.includes(`${path.sep}.git${path.sep}`);

test('reads the v0.1 engineering manifest', async () => {
  const manifest = await readManifest(root);
  assert.equal(manifest.version, 1);
  assert.equal(manifest.registry.type, 'local');
  assert.equal(manifest.skills['implementation-guidelines'], '0.1.0');
  assert.equal(manifest.skills['code-review'], '0.1.0');
});

test('syncs declared skills into the shared cache', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-cache-'));
  const env = { ENGINEERING_HOME: tmp };
  const manifest = await readManifest(root);

  const results = await syncSkills(root, manifest, { env });

  assert.deepEqual(
    results.map((result) => `${result.status}:${result.name}@${result.version}`).sort(),
    ['added:code-review@0.1.0', 'added:implementation-guidelines@0.1.0'],
  );

  const secondResults = await syncSkills(root, manifest, { env });
  assert.deepEqual(
    secondResults.map((result) => `${result.status}:${result.name}@${result.version}`).sort(),
    ['updated:code-review@0.1.0', 'updated:implementation-guidelines@0.1.0'],
  );

  await fs.access(path.join(tmp, 'cache', 'implementation-guidelines', '0.1.0', 'SKILL.md'));
  await fs.access(path.join(tmp, 'cache', 'code-review', '0.1.0', 'skill.yaml'));
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
  assert.match(context, /implementation-guidelines@0\.1\.0/);
  assert.match(context, /code-review@0\.1\.0/);
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

  assert.equal(result.installedSkills.length, 2);
  await fs.access(path.join(tmp, '.codex', 'skills', 'implementation-guidelines', 'SKILL.md'));
  await fs.access(path.join(tmp, '.codex', 'skills', 'code-review', 'skill.yaml'));
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
    /Run `eng sync` first/,
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
  assert.match(sync.stdout, /added implementation-guidelines@0\.1\.0/);
  assert.match(sync.stdout, /added code-review@0\.1\.0/);

  const prepare = await execFileAsync(process.execPath, [path.join(root, 'src', 'cli.js'), '--project', tmp, 'prepare', 'codex'], { env });
  assert.match(prepare.stdout, /prepared codex context:/);

  const context = await fs.readFile(path.join(tmp, '.engineering', 'generated', 'context.md'), 'utf8');
  assert.match(context, /Effective Engineering Context/);
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
  assert.match(output, /Engineering Skills Doctor/);
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
  assert.match(output, /Codex skill implementation-guidelines/);
  assert.match(output, /Codex skill code-review/);
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

  assert.match(result.stdout, /Engineering Skills Doctor/);
  assert.match(result.stdout, /0 warnings, 0 failed/);
});

test('usage documentation is included in the project', async () => {
  const readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
  const usage = await fs.readFile(path.join(root, 'docs', 'USAGE.md'), 'utf8');
  const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

  assert.match(readme, /docs\/USAGE\.md/);
  assert.match(readme, /npm install -g @bowonlee\/engineering-skills/);
  assert.match(usage, /eng init --discover/);
  assert.match(usage, /eng sync/);
  assert.match(usage, /eng prepare codex/);
  assert.match(usage, /eng prepare codex --install-skills/);
  assert.match(usage, /eng doctor/);
  assert.match(usage, /Use From Another Project/);
  assert.match(usage, /Codex Workflow/);
  assert.equal(packageJson.name, '@bowonlee/engineering-skills');
  assert.equal(packageJson.bin.eng, './src/cli.js');
  assert.equal(packageJson.publishConfig.access, 'public');
});
