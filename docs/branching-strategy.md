# Branching Strategy

The repository uses a small-team branch model optimized for 3 contributors.

## Branches

```text
dev      -> Sandbox / playground development, including fixing work
demo     -> Minimum public demo branch for features ready to be tried
main     -> Production / real usage branch for stable features
feat/*   -> Feature branches created from dev
fix/*    -> Bug fix branches created from dev
chore/*  -> Maintenance/configuration branches created from dev
docs/*   -> Documentation branches created from dev
```

## Rules

- `dev` is the only sandbox branch. Experiments, fixes, and early feature work start here.
- `demo` receives only reviewed work from `dev` that is ready for public trial.
- `main` receives only promoted work from `demo` and is treated as the real usage branch.
- Feature, fix, chore, and docs branches start from the latest `dev`.
- Pull requests should target `dev` first unless a production emergency process is introduced later.
- Each pull request should keep a focused scope.
- Merge only after CI passes and at least one teammate reviews the change.
- Do not merge `dev` directly to `main`. The release path is always `dev -> demo -> main`.
- The old `fixing` branch is retired. Use `fix/<bug-name>` branches from `dev` instead.

## Contributor Flow

```bash
git checkout dev
git pull origin dev
git checkout -b feat/test-case-list
```

After implementing:

```bash
git add .
git commit -m "Add test case list scaffold"
git push origin feat/test-case-list
```

Then open a pull request to `dev`.

## Promotion Flow

After `dev` is stable enough for public trial:

```bash
git checkout demo
git pull origin demo
git merge dev
git push origin demo
```

After `demo` is accepted for real usage:

```bash
git checkout main
git pull origin main
git merge demo
git push origin main
```

Return to `dev` after promotion:

```bash
git checkout dev
git pull origin dev
```
