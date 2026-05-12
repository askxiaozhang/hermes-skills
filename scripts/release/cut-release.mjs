import { listSkills, validateSkill } from './lib/skills.mjs';

const dryRun = process.argv.includes('--dry-run');

const skills = listSkills();
const errors = skills.flatMap(s => validateSkill(s).map(e => `${s.name}: ${e}`));

if (errors.length) {
  console.error('\nValidation errors:\n');
  errors.forEach(e => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`\nRelease manager (${dryRun ? 'DRY RUN' : 'LIVE'})\n`);
console.log('Skills ready for release:\n');

for (const skill of skills) {
  console.log(`  • ${skill.manifest.name} v${skill.manifest.version}`);
}

console.log('\nTo release, create a git tag:');
console.log('  git tag <skill-name>-v<version>');
console.log('  git push origin <skill-name>-v<version>');
console.log('\nExample:');
console.log('  git tag bilibili-blogger-tracker-v1.0.0');
console.log('  git push origin bilibili-blogger-tracker-v1.0.0');
console.log('\nThe GitHub Action will automatically:');
console.log('  1. Pack the skill into a .zip + .sha256');
console.log('  2. Create a GitHub Release with the artifacts');
console.log('  3. Sync README download links\n');
