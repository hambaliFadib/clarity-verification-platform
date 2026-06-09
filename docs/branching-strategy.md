# Branching Strategy

The repository uses a small-team branch model optimized for 3 contributors.

## Branches

```text
dev-alpha   -> Individual sandbox branch created from dev
dev-beta    -> Individual sandbox branch created from dev
dev-charlie -> Individual sandbox branch created from dev
dev         -> Integration branch for completed sandbox work
main        -> Production / real usage branch for stable features
```

## Rules

- `dev-alpha`, `dev-beta`, and `dev-charlie` are sandbox branches for feature work and fixing.
- Each sandbox branch starts from the latest `dev`.
- Completed sandbox work merges into `dev`.
- `dev` is the integration branch and should stay usable after every merge.
- `main` receives only promoted work from `dev` after `dev` has no known blocking bugs.
- Merge only after CI passes and at least one teammate reviews the change.
- The release path is always `dev-alpha/dev-beta/dev-charlie -> dev -> main`.
- The old `demo` and `fixing` branches are retired from the active workflow.

## Contributor Flow

For `dev-alpha`, replace the branch name with `dev-beta` or `dev-charlie` as needed:

```bash
git checkout dev
git pull origin dev
git checkout dev-alpha
git merge dev
```

After implementing:

```bash
git add .
git commit -m "Add focused change"
git push origin dev-alpha
```

Then open a pull request to `dev`.

## Integration Flow

After a sandbox branch is ready:

```bash
git checkout dev
git pull origin dev
git merge dev-alpha
git push origin dev
```

CI runs on `dev` after the merge.

## Promotion Flow

After `dev` is stable and has no known blocking bugs:

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

CI runs on `main`, then Vercel deploys the production app from `main`.

Return to `dev` after promotion:

```bash
git checkout dev
git pull origin dev
```
