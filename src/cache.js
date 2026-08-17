import fs from 'node:fs/promises';
import path from 'node:path';
import { cacheRoot, resolveProjectPath } from './paths.js';
import { readSkillMetadata } from './manifest.js';

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

export function skillCachePath(skillName, version, env = process.env) {
  return path.join(cacheRoot(env), skillName, version);
}

export async function resolveLocalRegistrySkill(projectRoot, manifest, skillName) {
  const registryPath = resolveProjectPath(projectRoot, manifest.registry.path || '.');
  return path.join(registryPath, 'skills', skillName);
}

export async function syncSkills(projectRoot, manifest, options = {}) {
  if (manifest.registry.type !== 'local') {
    throw new Error('Only local registry is supported in v0.1. Git registry support is intentionally deferred.');
  }

  const results = [];
  for (const [skillName, version] of Object.entries(manifest.skills)) {
    const source = await resolveLocalRegistrySkill(projectRoot, manifest, skillName);
    if (!(await pathExists(source))) {
      throw new Error(`Skill "${skillName}" was not found at ${source}`);
    }

    const metadata = await readSkillMetadata(source);
    if (metadata.name !== skillName) {
      throw new Error(`Skill metadata name mismatch: expected "${skillName}", got "${metadata.name}"`);
    }
    if (metadata.version !== version) {
      throw new Error(`Skill ${skillName} version mismatch: manifest=${version}, skill.yaml=${metadata.version}`);
    }

    const target = skillCachePath(skillName, version, options.env);
    const existed = await pathExists(target);
    await copyDir(source, target);
    results.push({ name: skillName, version, source, target, status: existed ? 'updated' : 'added' });
  }

  return results;
}
