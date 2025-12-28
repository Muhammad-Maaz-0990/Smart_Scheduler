import { cp, rm, access } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const from = path.join(rootDir, 'frontend', 'build');
const to = path.join(rootDir, 'build');

try {
  await access(from);
} catch {
  console.error(`Build folder not found: ${from}`);
  process.exit(1);
}

await rm(to, { recursive: true, force: true });
await cp(from, to, { recursive: true });
console.log(`Copied ${from} -> ${to}`);
