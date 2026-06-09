# Branching Strategy

The repository uses a small-team branch model optimized for 3 contributors.

## Branches

```text
main     -> Production / future stable release
dev      -> Integration branch / Vercel preview / NeonDB dev branch
feat/*   -> Feature branches / Vercel preview / NeonDB dynamic child branch
fix/*    -> Bug fix branches
chore/*  -> Maintenance/configuration branches
docs/*   -> Documentation branches
```

## Rules

- `main` should stay stable and production-ready.
- `dev` is the active integration branch for Phase 1.
- Feature work starts from the latest `dev`.
- Pull requests should target `dev` unless a hotfix process is introduced later.
- Each pull request should keep a focused scope.
- Merge only after CI passes and at least one teammate reviews the change.

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
