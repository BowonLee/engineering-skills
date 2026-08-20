import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncSkills } from './cache.js';
import { readManifest } from './manifest.js';
import { prepareCodex } from './prepare.js';
import { prepareClaude } from './claude.js';
import { formatDoctor, runDoctor } from './doctor.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(source, target) {
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(source, target, { recursive: true });
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureIgnored(projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const entries = ['.engineering/cache/', '.engineering/registry/', '.engineering/generated/', '.codex/skills/', '.claude/skills/'];
  let content = '';
  if (await pathExists(gitignorePath)) {
    content = await fs.readFile(gitignorePath, 'utf8');
  }

  const missing = entries.filter((entry) => !content.split(/\r?\n/).includes(entry));
  if (missing.length === 0) return [];

  const prefix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  await fs.writeFile(gitignorePath, `${content}${prefix}${missing.join('\n')}\n`, 'utf8');
  return missing;
}

async function writeDefaultManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, 'engineering.yaml');
  if (await pathExists(manifestPath)) return { created: false, manifestPath };

  const registryRoot = path.join(projectRoot, '.engineering', 'registry');
  await copyDir(path.join(packageRoot, 'skills'), path.join(registryRoot, 'skills'));
  await ensureDir(path.join(projectRoot, 'docs', 'architecture'));
  await ensureDir(path.join(projectRoot, 'docs', 'adr'));
  await ensureDir(path.join(projectRoot, 'docs', 'design-system'));
  await ensureDir(path.join(projectRoot, 'docs', 'specs'));

  const manifest = [
    'version: 1',
    '',
    'registry:',
    '  type: local',
    '  path: ./.engineering/registry',
    '',
    'skills:',
    '  implementation-guidelines: 0.1.0',
    '  code-review: 0.1.0',
    '  documentation-consistency: 0.1.0',
    '  architecture-drift-review: 0.1.0',
    '  spec-to-implementation-review: 0.1.0',
    '',
    'context:',
    '  architecture: ./docs/architecture',
    '  adr: ./docs/adr',
    '  design_system: ./docs/design-system',
    '  specs: ./docs/specs',
    '',
  ].join('\n');

  await fs.writeFile(manifestPath, manifest, 'utf8');
  return { created: true, manifestPath };
}

export async function setupProject(projectRoot, options = {}) {
  const codex = options.codex ?? true;
  const claude = options.claude ?? false;

  const bootstrap = await writeDefaultManifest(projectRoot);
  const ignored = await ensureIgnored(projectRoot);
  const env = {
    ...process.env,
    ...options.env,
    ENGINEERING_HOME: options.env?.ENGINEERING_HOME || process.env.ENGINEERING_HOME || path.join(projectRoot, '.engineering'),
  };

  const manifest = await readManifest(projectRoot);
  const synced = await syncSkills(projectRoot, manifest, { env });
  const prepared = codex ? await prepareCodex(projectRoot, manifest, { env, installSkills: true }) : null;
  const preparedClaude = claude ? await prepareClaude(projectRoot, manifest, { env }) : null;
  const doctor = await runDoctor(projectRoot, { env });

  return {
    bootstrap,
    ignored,
    synced,
    prepared,
    preparedClaude,
    doctor,
    engineeringHome: env.ENGINEERING_HOME,
  };
}

export function formatSetup(result) {
  const lines = ['Bakeflow Setup', ''];
  lines.push(result.bootstrap.created ? `created manifest: ${result.bootstrap.manifestPath}` : `using manifest: ${result.bootstrap.manifestPath}`);
  if (result.ignored.length > 0) {
    lines.push(`updated .gitignore: ${result.ignored.join(', ')}`);
  }
  lines.push(`engineering home: ${result.engineeringHome}`);
  lines.push('');
  lines.push('Synced skills:');
  for (const skill of result.synced) {
    lines.push(`- ${skill.status} ${skill.name}@${skill.version}`);
  }
  lines.push('');
  if (result.prepared) {
    lines.push(`prepared codex context: ${result.prepared.contextPath}`);
    lines.push(`installed codex skills: ${result.prepared.installedSkills.map((skill) => `${skill.name}@${skill.version}`).join(', ')}`);
  }
  if (result.preparedClaude) {
    lines.push(`prepared claude context: ${result.preparedClaude.contextPath}`);
    lines.push(`installed claude skills: ${result.preparedClaude.activeSkills.map((skill) => `${skill.name}@${skill.version}`).join(', ')}`);
    lines.push(`${result.preparedClaude.claudeMd.status} claude instructions: ${result.preparedClaude.claudeMd.path}`);
  }
  lines.push('');
  lines.push(formatDoctor(result.doctor));
  return lines.join('\n');
}
