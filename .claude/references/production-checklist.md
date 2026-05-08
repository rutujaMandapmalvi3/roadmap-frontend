# Production Checklist — mymap-client Frontend

> Apply to every PR before merge. No exceptions.

---

## TypeScript

- [ ] `npx tsc --noEmit` exits 0 — zero TypeScript errors
- [ ] No `any` type in changed files — use explicit types or `unknown` with narrowing
- [ ] All API response shapes typed in `src/types/` — never inferred from usage
- [ ] Props typed with explicit interface — not inferred-from-usage types
- [ ] `tsconfig.json` `strict: true` not overridden or disabled

## Component States (mandatory — all 4 required)

Every component that fetches data must handle all 4 states:
- [ ] **Loading**: spinner or skeleton while request in flight (`role="status"` or `aria-busy`)
- [ ] **Empty**: explicit empty state UI — no blank page (new user home, empty list)
- [ ] **Error**: error message visible with `role="alert"` — no silent failure
- [ ] **Success**: data rendered correctly

No component may ship with missing states. Blank screens in production = broken product.

## API Client

- [ ] No `fetch` calls outside `src/lib/api.ts` — all backend calls go through the API client
- [ ] All API calls include `Authorization: Bearer <token>` header
- [ ] 401 response triggers redirect to `/login` — handled in `api.ts`, not per-component
- [ ] 403 response handled — redirect to home or show "not found" error
- [ ] In-flight requests cancelled on unmount via `AbortController`
- [ ] No backend secrets in `NEXT_PUBLIC_*` env vars

## Auth Guard

- [ ] `useAuth` hook applied on every protected page (`page.tsx` at app root, `/roadmap`)
- [ ] `/login` and `/signup` do not require auth guard
- [ ] Token never stored in URL params or request body
- [ ] Unauthenticated users redirected to `/login`, not shown blank page

## React Flow

- [ ] `roadmap.phases` empty-array check before rendering — never crash on empty
- [ ] Node labels escape user content — no `dangerouslySetInnerHTML` with roadmap data
- [ ] Follow-up updates use `setRoadmap(data.roadmap)` — React state update triggers re-render
- [ ] React Flow canvas accessible: keyboard navigation, visible focus rings on nodes

## Accessibility (WCAG 2.1 AA)

- [ ] All form inputs have associated `<label>` elements
- [ ] Error messages use `role="alert"` — announced to screen readers immediately
- [ ] Loading indicators use `role="status"` or `aria-busy="true"`
- [ ] Interactive elements keyboard navigable (Tab, Enter/Space)
- [ ] No `onClick` on non-interactive elements without `role="button"` and `tabIndex={0}`
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Lighthouse Accessibility score ≥ 90

## Code Quality

- [ ] No `console.log` in production code paths
- [ ] No inline styles — Tailwind classes only
- [ ] No commented-out code blocks
- [ ] Traceability comment on implementing functions: `// FR-NNN: description`
- [ ] No hardcoded strings that belong in env vars

## Tests

- [ ] Unit tests cover all branches in changed components
- [ ] All 4 component states tested (loading, empty, error, success)
- [ ] Auth guard tested: no token → no API call
- [ ] `api.ts` mock used in all component tests — never calls real backend
- [ ] `npm test` passes with no failures
- [ ] Traceability matrix updated in `intprep/.claude/docs/traceability.md`

## Build Verification

- [ ] `npm run build` exits 0 — no build errors
- [ ] No build warnings about missing env vars
- [ ] Bundle size not unexpectedly large (check `.next/analyze` if analyzer configured)
- [ ] Lighthouse Performance score ≥ 90 on production build
