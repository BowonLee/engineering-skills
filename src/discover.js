import fs from 'node:fs/promises';
import path from 'node:path';

async function pathType(filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) return 'directory';
    if (stat.isFile()) return 'file';
    return 'other';
  } catch {
    return 'missing';
  }
}

async function firstExisting(projectRoot, candidates) {
  for (const candidate of candidates) {
    const absolute = path.join(projectRoot, candidate);
    if ((await pathType(absolute)) === 'directory') return candidate;
  }
  return undefined;
}

async function listDirectoryNames(projectRoot, relativePath) {
  try {
    const entries = await fs.readdir(path.join(projectRoot, relativePath), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

export async function discoverProject(projectRoot) {
  const sourceRoot = await firstExisting(projectRoot, ['src', 'lib', 'app', 'packages']);
  const docsRoot = await firstExisting(projectRoot, ['docs', 'documentation']);
  const architecturePath = await firstExisting(projectRoot, ['docs/architecture', 'documentation/architecture']);
  const adrPath = await firstExisting(projectRoot, ['docs/adr', 'docs/adrs', 'documentation/adr']);
  const designSystemPath = await firstExisting(projectRoot, ['docs/design-system', 'docs/design_system', 'documentation/design-system']);
  const skillNames = await listDirectoryNames(projectRoot, 'skills');

  const observed = [];
  for (const [label, value] of [
    ['source_root', sourceRoot],
    ['docs_root', docsRoot],
    ['context.architecture', architecturePath],
    ['context.adr', adrPath],
    ['context.design_system', designSystemPath],
  ]) {
    if (value) observed.push({ key: label, path: value, confidence: 'high', status: 'observed' });
  }

  const unknown = [];
  if (!sourceRoot) unknown.push('source_root');
  if (!docsRoot) unknown.push('docs_root');
  if (!architecturePath) unknown.push('context.architecture');
  if (!adrPath) unknown.push('context.adr');
  if (!designSystemPath) unknown.push('context.design_system');

  return {
    projectRoot,
    observed,
    unknown,
    skills: skillNames.map((name) => ({ name, path: `skills/${name}` })),
  };
}

export function formatDiscovery(discovery) {
  const lines = [
    'Engineering Skills Discovery',
    '',
    `Project: ${discovery.projectRoot}`,
    '',
    'Observed:',
  ];

  if (discovery.observed.length === 0) {
    lines.push('- none');
  } else {
    for (const item of discovery.observed) {
      lines.push(`- ${item.key}: ${item.path} (${item.confidence}, ${item.status})`);
    }
  }

  lines.push('', 'Skills:');
  if (discovery.skills.length === 0) {
    lines.push('- none');
  } else {
    for (const skill of discovery.skills) lines.push(`- ${skill.name}: ${skill.path}`);
  }

  lines.push('', 'Needs confirmation:');
  if (discovery.unknown.length === 0) {
    lines.push('- none');
  } else {
    for (const item of discovery.unknown) lines.push(`- ${item}`);
  }

  lines.push('', 'No files were changed.');
  return lines.join('\n');
}
