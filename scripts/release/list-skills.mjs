import { listSkills, validateSkill } from './lib/skills.mjs';

const skills = listSkills();
let hasErrors = false;

console.log(`\nFound ${skills.length} skill(s):\n`);

for (const skill of skills) {
  const errors = validateSkill(skill);
  const status = errors.length ? '✗' : '✓';
  console.log(`  ${status} ${skill.manifest.name} v${skill.manifest.version} — ${skill.manifest.category}`);
  if (errors.length) {
    hasErrors = true;
    for (const err of errors) console.log(`    ⚠ ${err}`);
  }
}

console.log('');
process.exit(hasErrors ? 1 : 0);
