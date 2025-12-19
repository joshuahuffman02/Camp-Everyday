# AGENTS.md

## Repository expectations

- Prefer `rg` (ripgrep) for file and text search.
- Use `pnpm` for installs and scripts.
- Do not add new dependencies without explicit approval.
- Avoid destructive git commands (`reset --hard`, `checkout --`, mass deletes).
- Keep edits ASCII-only unless the file already contains Unicode.
- Prefer `apply_patch` for single-file edits.

## Monorepo layout

- Web app: `platform/apps/web`
- API: `platform/apps/api`
- Shared package: `platform/packages/shared`

## Verification

- If tests are requested, run the project-specific command the team uses.
- If no test command is provided, ask before running long or destructive checks.
