# Contributing

Contributions are welcome! Here's how to add a new skill:

## Adding a Skill

1. Create a directory under `skills/` with your skill name (lowercase, hyphens)
2. Add a `SKILL.md` with YAML frontmatter (`name`, `description`)
3. Add a `manifest.json` with `name`, `version`, `category`, `description`, `compat`
4. Optionally add `README.md`, `references/`, `scripts/`
5. Submit a PR

## Skill Structure

```
skills/your-skill/
├── SKILL.md          # Required: the actual skill prompt
├── manifest.json     # Required: machine-readable metadata
├── README.md         # Recommended: human-friendly docs
└── references/       # Optional: supporting files
```

## Validation

Run `npm run validate` before submitting. It checks:
- All manifests are valid JSON with required fields
- SKILL.md has correct frontmatter
- README download links are in sync
