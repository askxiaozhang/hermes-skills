import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { listSkills } from './lib/skills.mjs';

const rootDir = join(import.meta.dirname, '..', '..');
const readmePath = join(rootDir, 'README.md');
let readme = readFileSync(readmePath, 'utf-8');

const check = process.argv.includes('--check');
let changed = false;

for (const skill of listSkills()) {
  const startMarker = `<!-- DOWNLOAD:${skill.name}:start -->`;
  const endMarker = `<!-- DOWNLOAD:${skill.name}:end -->`;

  if (!readme.includes(startMarker)) {
    console.log(`  ⚠ No download markers for ${skill.name} in README`);
    continue;
  }

  const tag = `${skill.name}-v${skill.manifest.version}`;
  const zipName = `${skill.name}-${skill.manifest.version}.zip`;
  const url = `https://github.com/hermes-agent/hermes-skills/releases/download/${tag}/${zipName}`;
  const newLink = `[Download v${skill.manifest.version} .zip](${url})`;

  const startIdx = readme.indexOf(startMarker);
  const endIdx = readme.indexOf(endMarker) + endMarker.length;
  const currentSection = readme.substring(startIdx, endIdx);
  const newSection = `${startMarker}\n${newLink}\n${endMarker}`;

  if (currentSection !== newSection) {
    if (check) {
      console.log(`  ✗ README links out of sync for ${skill.name}`);
      changed = true;
    } else {
      readme = readme.substring(0, startIdx) + newSection + readme.substring(endIdx);
      console.log(`  ✓ Updated download link for ${skill.name}`);
      changed = true;
    }
  } else {
    console.log(`  ✓ ${skill.name} links in sync`);
  }
}

if (!check && changed) {
  writeFileSync(readmePath, readme);
  console.log('\nREADME.md updated.');
}

if (check && changed) {
  console.error('\nREADME links out of sync. Run: npm run readme:sync');
  process.exit(1);
}

if (!changed) console.log('\nAll links in sync.');
