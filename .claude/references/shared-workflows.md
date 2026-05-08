# Shared Workflows — mymap-client Frontend

> Rules that apply to all work on this service.
> PR/commit/versioning rules mirror the backend — same conventions across the monorepo.

---

## Branch Naming

```
type/task-NNN-short-description
```

| Type | When |
|------|------|
| `feature/` | New page, component, or API integration |
| `fix/` | Bug fix |
| `refactor/` | Code change with no behavior change |
| `chore/` | Deps, config, tooling |
| `docs/` | Documentation only |
| `security/` | Security fix (fast-track review) |

Examples:
- `feature/task-055-pagination-home-page`
- `fix/task-042-auth-redirect-loop`
- `security/sec-003-remove-token-from-localstorage`

Always branch from `develop`. Never from `main`.

---

## Commit Format (Conventional Commits — enforced)

```
type(scope): short description

[optional body — why, not what]

[optional footer — Closes #NNN, BREAKING CHANGE: ...]
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf`, `security`
**Scope**: `frontend`, `auth`, `roadmap`, `home`, `api`, `ci`, `infra`

Examples:
```
feat(home): add pagination controls to roadmap list

Implements TASK-055 — GET /conversations now returns page/limit/totalPages.
Closes #055

fix(auth): redirect to /login on 401 response in api.ts

Previously 401 left users on a broken page. Now handled centrally in api.ts.
Closes #042

fix(roadmap): handle empty phases array without crash

React Flow threw when roadmap.phases was []. Added empty-state guard.
Closes #039
```

**BREAKING CHANGE footer** → triggers major semver bump.

---

## PR Rules

### Size
- Max 400 LOC changed per PR
- Larger changes → split into stacked PRs

### Required before opening PR
- [ ] Branch up to date with `develop`
- [ ] `npm test` passes locally
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npm run lint` — zero ESLint errors
- [ ] No `console.log` in production code
- [ ] All 4 component states present in changed components: loading, empty, error, success
- [ ] Changelog entry under [Unreleased]
- [ ] Issue linked: `Closes #NNN`

### Required approvals
- 1 approval: small scope (single component, <50 LOC)
- 2 approvals: medium/large scope, or any change to:
  - `src/lib/api.ts` (auth header, error handling)
  - `src/lib/useAuth.ts` (auth guard)
  - `src/lib/auth.ts` (Cognito SDK)
  - `.github/workflows/`
  - `next.config.ts`
  - Any `NEXT_PUBLIC_*` env var changes

### Merge strategy
- Squash merge only (linear history on `develop`)
- Delete branch after merge

### Status checks (all must pass)
- CI: lint
- CI: TypeScript strict (`tsc --noEmit`)
- CI: unit tests
- CI: Lighthouse CI — Performance ≥ 90, Accessibility ≥ 90
- Security scan: no CRITICAL/HIGH findings

---

## Versioning (Semantic Versioning)

Driven by commit types since last release:
- `fix/docs/refactor/test/chore` → patch (1.0.0 → 1.0.1)
- `feat` → minor (1.0.0 → 1.1.0)
- `BREAKING CHANGE` footer → major (1.0.0 → 2.0.0)

Frontend and backend version independently. A frontend v1.2.0 does not require backend v1.2.0.

---

## CODEOWNERS

| Path | Required reviewers |
|------|--------------------|
| `src/lib/api.ts` | Auth header + error handling — 2 approvals |
| `src/lib/useAuth.ts` | Auth guard — 2 approvals |
| `src/lib/auth.ts` | Cognito SDK — 2 approvals |
| `.github/workflows/` | CI/CD — 2 approvals |
| `next.config.ts` | Build config — 1 approval |
| `src/app/login/` | Auth flow — 2 approvals |
| `src/app/signup/` | Auth flow — 2 approvals |
