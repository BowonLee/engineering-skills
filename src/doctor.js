import fs from 'node:fs/promises';
import path from 'node:path';
import { skillCachePath } from './cache.js';
import { generatedRoot, resolveProjectPath } from './paths.js';
import { readManifest, readSkillMetadata } from './manifest.js';

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pass(name, message) {
  return { name, status: 'pass', message };
}

function warn(name, message) {
  return { name, status: 'warn', message };
}

function fail(name, message) {
  return { name, status: 'fail', message };
}

async function checkManifest(projectRoot) {
  try {
    const manifest = await readManifest(projectRoot);
    return { manifest, check: pass('Manifest', 'engineering.yaml is valid') };
  } catch (error) {
    return { manifest: null, check: fail('Manifest', `engineering.yaml is invalid: ${error.message}`) };
  }
}

async function checkDeclaredSkills(projectRoot, manifest) {
  const checks = [];
  if (manifest.registry.type !== 'local') {
    return [fail('Registry', 'Only local registry is supported in v0.1')];
  }

  const registryPath = resolveProjectPath(projectRoot, manifest.registry.path || '.');
  checks.push(pass('Registry', `local registry: ${registryPath}`));

  for (const [skillName, version] of Object.entries(manifest.skills)) {
    const skillDir = path.join(registryPath, 'skills', skillName);
    if (!(await pathExists(skillDir))) {
      checks.push(fail(`Skill ${skillName}`, `missing at ${skillDir}`));
      continue;
    }

    try {
      const metadata = await readSkillMetadata(skillDir);
      if (metadata.name !== skillName) {
        checks.push(fail(`Skill ${skillName}`, `metadata name mismatch: ${metadata.name}`));
        continue;
      }
      if (metadata.version !== version) {
        checks.push(fail(`Skill ${skillName}`, `metadata version mismatch: manifest=${version}, skill.yaml=${metadata.version}`));
        continue;
      }
      checks.push(pass(`Skill ${skillName}`, `${skillName}@${version} metadata is valid`));
    } catch (error) {
      checks.push(fail(`Skill ${skillName}`, `metadata invalid: ${error.message}`));
    }
  }

  return checks;
}

async function checkCache(manifest, env) {
  const checks = [];
  for (const [skillName, version] of Object.entries(manifest.skills)) {
    const cached = skillCachePath(skillName, version, env);
    if (!(await pathExists(cached))) {
      checks.push(fail(`Cache ${skillName}`, `missing ${cached}; run eng sync`));
      continue;
    }
    checks.push(pass(`Cache ${skillName}`, `found ${cached}`));
  }
  return checks;
}

async function checkGenerated(projectRoot, manifest) {
  const checks = [];
  const root = generatedRoot(projectRoot);
  const contextPath = path.join(root, 'context.md');
  if (await pathExists(contextPath)) {
    checks.push(pass('Generated context', contextPath));
  } else {
    checks.push(warn('Generated context', `missing ${contextPath}; run eng prepare codex`));
  }

  for (const skillName of Object.keys(manifest.skills)) {
    const linkPath = path.join(root, 'skills', skillName);
    try {
      const stat = await fs.lstat(linkPath);
      if (!stat.isSymbolicLink()) {
        checks.push(warn(`Generated skill ${skillName}`, `${linkPath} exists but is not a symlink`));
        continue;
      }
      checks.push(pass(`Generated skill ${skillName}`, `${linkPath} is linked`));
    } catch {
      checks.push(warn(`Generated skill ${skillName}`, `missing ${linkPath}; run eng prepare codex`));
    }
  }

  return checks;
}

async function checkContext(projectRoot, manifest) {
  const checks = [];
  for (const [name, relativePath] of Object.entries(manifest.context)) {
    const absolute = resolveProjectPath(projectRoot, relativePath);
    if (await pathExists(absolute)) {
      checks.push(pass(`Context ${name}`, absolute));
    } else {
      checks.push(warn(`Context ${name}`, `missing ${absolute}`));
    }
  }
  return checks;
}

export async function runDoctor(projectRoot, options = {}) {
  const checks = [];
  const { manifest, check } = await checkManifest(projectRoot);
  checks.push(check);
  if (!manifest) return { checks };

  checks.push(...(await checkDeclaredSkills(projectRoot, manifest)));
  checks.push(...(await checkCache(manifest, options.env)));
  checks.push(...(await checkGenerated(projectRoot, manifest)));
  checks.push(...(await checkContext(projectRoot, manifest)));

  return { checks };
}

export function formatDoctor(result) {
  const statusLabel = { pass: 'OK', warn: '!!', fail: 'XX' };
  const lines = ['Engineering Skills Doctor', ''];
  for (const check of result.checks) {
    lines.push(`[${statusLabel[check.status]}] ${check.name}: ${check.message}`);
  }

  const passed = result.checks.filter((check) => check.status === 'pass').length;
  const warned = result.checks.filter((check) => check.status === 'warn').length;
  const failed = result.checks.filter((check) => check.status === 'fail').length;
  lines.push('', `Results: ${passed} passed, ${warned} warnings, ${failed} failed`);
  return lines.join('\n');
}
