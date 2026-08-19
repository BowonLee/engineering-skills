#!/usr/bin/env node
import process from 'node:process';
import path from 'node:path';
import { readManifest } from './manifest.js';
import { syncSkills } from './cache.js';
import { prepareCodex } from './prepare.js';
import { prepareClaude } from './claude.js';
import { discoverProject, formatDiscovery } from './discover.js';
import { formatDoctor, runDoctor } from './doctor.js';
import { formatSetup, setupProject } from './setup.js';

function usage() {
  return `Usage:
  bakeflow sync
  bakeflow setup [codex|claude|all] [--codex] [--claude]
  bakeflow init --discover
  bakeflow prepare codex [--install-skills]
  bakeflow prepare claude
  bakeflow doctor

Options:
  --project <path>  Project root (default: current directory)
`;
}

function parseArgs(argv) {
  const args = [...argv];
  let projectRoot = process.cwd();
  const positionals = [];
  const flags = new Set();

  while (args.length > 0) {
    const arg = args.shift();
    if (arg === '--project') {
      const value = args.shift();
      if (!value) throw new Error('--project requires a path');
      projectRoot = path.resolve(value);
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      return { help: true, projectRoot, positionals, flags };
    }
    if (arg.startsWith('--')) {
      flags.add(arg);
      continue;
    }
    positionals.push(arg);
  }

  return { projectRoot, positionals, flags };
}

function projectEnv(projectRoot) {
  return {
    ...process.env,
    ENGINEERING_HOME: process.env.ENGINEERING_HOME || path.join(projectRoot, '.engineering'),
  };
}

async function main() {
  const { help, projectRoot, positionals, flags } = parseArgs(process.argv.slice(2));
  const env = projectEnv(projectRoot);
  if (help || positionals.length === 0) {
    console.log(usage());
    return;
  }

  const [command, target] = positionals;

  if (command === 'setup') {
    const knownTargets = new Set(['codex', 'claude', 'all']);
    if (target && !knownTargets.has(target)) {
      throw new Error(`Unknown setup target: ${target}`);
    }
    const wantsCodex = target === 'codex' || target === 'all' || flags.has('--codex');
    const wantsClaude = target === 'claude' || target === 'all' || flags.has('--claude');
    const result = await setupProject(projectRoot, {
      codex: wantsCodex || (!target && !wantsClaude),
      claude: wantsClaude,
      env,
    });
    console.log(formatSetup(result));
    if (result.doctor.checks.some((check) => check.status === 'fail')) {
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'init' && (target === '--discover' || flags.has('--discover'))) {
    const discovery = await discoverProject(projectRoot);
    console.log(formatDiscovery(discovery));
    return;
  }

  if (command === 'doctor') {
    const result = await runDoctor(projectRoot, { env });
    console.log(formatDoctor(result));
    if (result.checks.some((check) => check.status === 'fail')) {
      process.exitCode = 1;
    }
    return;
  }

  const manifest = await readManifest(projectRoot);

  if (command === 'sync') {
    const results = await syncSkills(projectRoot, manifest, { env });
    for (const result of results) {
      console.log(`${result.status} ${result.name}@${result.version}`);
      console.log(`  from ${result.source}`);
      console.log(`  to   ${result.target}`);
    }
    return;
  }

  if (command === 'prepare' && target === 'codex') {
    const result = await prepareCodex(projectRoot, manifest, { env, installSkills: flags.has('--install-skills') });
    console.log(`prepared codex context: ${result.contextPath}`);
    console.log(`linked skills: ${result.activeSkills.map((skill) => `${skill.name}@${skill.version}`).join(', ')}`);
    if (result.installedSkills.length > 0) {
      console.log(`installed codex skills: ${result.installedSkills.map((skill) => `${skill.name}@${skill.version}`).join(', ')}`);
    }
    return;
  }

  if (command === 'prepare' && target === 'claude') {
    const result = await prepareClaude(projectRoot, manifest, { env });
    console.log(`prepared claude context: ${result.contextPath}`);
    console.log(`installed claude skills: ${result.activeSkills.map((skill) => `${skill.name}@${skill.version}`).join(', ')}`);
    console.log(`${result.claudeMd.status} claude instructions: ${result.claudeMd.path}`);
    return;
  }

  throw new Error(`Unknown command: ${positionals.join(' ')}`);
}

main().catch((error) => {
  console.error(`bakeflow: ${error.message}`);
  process.exitCode = 1;
});
