import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { engineeringManifestSchema, skillMetadataSchema } from './schemas.js';

export async function readYamlFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return YAML.parse(raw);
}

export async function readManifest(projectRoot) {
  const filePath = path.join(projectRoot, 'engineering.yaml');
  const parsed = await readYamlFile(filePath);
  return engineeringManifestSchema.parse(parsed);
}

export async function readSkillMetadata(skillDir) {
  const filePath = path.join(skillDir, 'skill.yaml');
  const parsed = await readYamlFile(filePath);
  return skillMetadataSchema.parse(parsed);
}
