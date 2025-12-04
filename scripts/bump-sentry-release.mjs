#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RELEASE_FILE = path.resolve(process.cwd(), '.env.sentry');
const DEFAULT_PREFIX = 'release-';
const DEFAULT_PAD = 5;

const readCurrentRelease = () => {
  if (!existsSync(RELEASE_FILE)) {
    return `${DEFAULT_PREFIX}${'0'.repeat(DEFAULT_PAD)}`;
  }

  const content = readFileSync(RELEASE_FILE, 'utf8');
  const match = content.match(/SENTRY_RELEASE=(.+)/);
  if (!match) {
    return `${DEFAULT_PREFIX}${'0'.repeat(DEFAULT_PAD)}`;
  }

  return match[1].trim();
};

const formatRelease = (prefix, number, padWith) => `${prefix}${String(number).padStart(padWith, '0')}`;

const getNextRelease = (current) => {
  const releaseMatch = current.match(/^(.*?)(\d+)$/);
  if (!releaseMatch) {
    const fallbackNumber = Date.now();
    return `${current}-${fallbackNumber}`;
  }

  const [, prefix, number] = releaseMatch;
  const nextNumber = Number.parseInt(number, 10) + 1;
  return formatRelease(prefix || DEFAULT_PREFIX, nextNumber, number.length || DEFAULT_PAD);
};

const currentRelease = readCurrentRelease();
const nextRelease = getNextRelease(currentRelease);
const fileContent = `SENTRY_RELEASE=${nextRelease}
VITE_SENTRY_RELEASE=${nextRelease}
`;

writeFileSync(RELEASE_FILE, fileContent);

try {
  execSync(`git add ${RELEASE_FILE}`, { stdio: 'ignore' });
} catch {
  // git add may fail (e.g. during initial install without git)
}

console.log(`Sentry release bumped: ${currentRelease} -> ${nextRelease}`);
