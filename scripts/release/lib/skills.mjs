import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SKILLS_DIR = join(import.meta.dirname, '..', '..', '..', 'skills');

export function listSkills() {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const dir = join(SKILLS_DIR, d.name);
      const manifestPath = join(dir, 'manifest.json');
      const skillPath = join(dir, 'SKILL.md');
      if (!existsSync(manifestPath)) return null;
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const hasSkillMd = existsSync(skillPath);
      return { name: d.name, dir, manifest, hasSkillMd };
    })
    .filter(Boolean);
}

export function validateSkill(skill) {
  const errors = [];
  if (!skill.manifest.name) errors.push('Missing manifest.name');
  if (!skill.manifest.version) errors.push('Missing manifest.version');
  if (!skill.manifest.description || skill.manifest.description.length < 20)
    errors.push('manifest.description too short (min 20 chars)');
  if (!skill.manifest.category) errors.push('Missing manifest.category');
  if (!skill.manifest.compat || !skill.manifest.compat.length)
    errors.push('Missing manifest.compat array');
  if (!skill.hasSkillMd) errors.push('Missing SKILL.md');
  return errors;
}
