import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { listSkills } from './lib/skills.mjs';

const distDir = join(import.meta.dirname, '..', '..', 'dist', 'release');
if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

const targetName = process.argv[2];
const skills = targetName && targetName !== '--all'
  ? listSkills().filter(s => s.name === targetName)
  : listSkills();

if (!skills.length) {
  console.error(`No skill found: ${targetName}`);
  process.exit(1);
}

for (const skill of skills) {
  const zipName = `${skill.manifest.name}-${skill.manifest.version}.zip`;
  const zipPath = join(distDir, zipName);
  console.log(`Packing ${skill.manifest.name} v${skill.manifest.version}...`);
  execSync(`cd ${skill.dir} && zip -r ${zipPath} . -x '.git*' 'node_modules/*'`, { stdio: 'inherit' });
  execSync(`sha256sum ${zipPath} > ${zipPath}.sha256`, { stdio: 'inherit' });
  console.log(`  → ${zipPath}\n`);
}

console.log('Done.');
