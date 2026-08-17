import os from 'node:os';
import path from 'node:path';

export function resolveProjectPath(projectRoot, inputPath) {
  if (!inputPath) return undefined;
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(projectRoot, inputPath);
}

export function engineeringHome(env = process.env) {
  return env.ENGINEERING_HOME || path.join(os.homedir(), '.engineering');
}

export function cacheRoot(env = process.env) {
  return path.join(engineeringHome(env), 'cache');
}

export function generatedRoot(projectRoot) {
  return path.join(projectRoot, '.engineering', 'generated');
}
