# mymap-client — Frontend Claude Instructions

## What This Is
Next.js 14 frontend for myMap. Renders AI-generated learning roadmaps as interactive React Flow graphs. Authenticates via AWS Cognito. Talks to the Express backend at `NEXT_PUBLIC_API_URL`.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **UI**: React Flow (roadmap graph), Tailwind CSS
- **Auth**: AWS Cognito — ID token stored in browser, sent as `Authorization: Bearer <token>`
- **API client**: `src/lib/api.ts` — all backend calls go through here. Never call `fetch` directly in components.
- **Auth hooks**: `src/lib/useAuth.ts` — redirects to `/login` if no token

## Project Structure
```
src/
├── app/
│   ├── page.tsx              — home: past roadmaps list + "Create New" form toggle
│   ├── login/page.tsx        — Cognito login form
│   ├── signup/page.tsx       — Cognito signup form
│   └── roadmap/page.tsx      — React Flow graph + follow-up form
├── components/               — reusable UI components
├── lib/
│   ├── api.ts                — all backend fetch calls (generateRoadmap, sendFollowUp, getMyRoadmaps, getRoadmap)
│   ├── auth.ts               — Cognito SDK helpers
│   └── useAuth.ts            — auth guard hook: reads token, redirects to /login if missing
└── types/                    — shared TypeScript types (Conversation, Roadmap, Phase, Milestone)
```

## Page Responsibilities

### `app/page.tsx` (home)
- On mount: `useEffect` → `api.getMyRoadmaps()` → list past roadmaps
- New user (empty list): form shows immediately
- Returning user: list shows, form behind "Create New" toggle
- On form submit: `api.generateRoadmap(form)` → navigate to `/roadmap?conversationId=<_id>`

### `app/roadmap/page.tsx`
- Reads `conversationId` from URL params
- On mount: `api.getRoadmap(conversationId)` → loads full conversation
- Renders roadmap phases as React Flow nodes, milestones as edges
- Follow-up form: `api.sendFollowUp({ conversationId, followUpMessage })` → `setRoadmap(data.roadmap)` → React Flow re-renders in place

## API Client (`src/lib/api.ts`)

All calls include `Authorization: Bearer <Cognito ID Token>`.

| Function | Method | Endpoint | When called |
|----------|--------|----------|------------|
| `generateRoadmap(form)` | POST | /chat | Fresh roadmap form submit |
| `sendFollowUp({ conversationId, followUpMessage })` | POST | /chat | Follow-up form submit |
| `getMyRoadmaps()` | GET | /conversations | page.tsx mount |
| `getRoadmap(id)` | GET | /conversations/:id | roadmap/page.tsx mount |

## Critical Rules

### Auth
- Token from Cognito — never from localStorage if avoidable (prefer sessionStorage or cookie)
- `useAuth.ts` must run on every protected page — no bare page without auth guard
- Token passed as `Authorization: Bearer <token>` header — never in URL params or body

### API Client
- Components NEVER call `fetch` directly — always through `api.ts`
- Handle all 4 states: loading, empty, error, success — no blank screens
- Cancel in-flight requests on unmount (AbortController)
- 401 response → redirect to `/login`

### React Flow
- Roadmap JSON shape: `phases[].title`, `phases[].duration`, `phases[].milestones[].title`, `phases[].milestones[].resources`
- Phases = nodes. Milestones = child nodes or edges. Resources = text in node.
- Re-render on follow-up: `setRoadmap(data.roadmap)` updates React state → React Flow re-renders automatically

### TypeScript
- Strict mode on — no `any`
- All API response shapes typed in `src/types/`
- Props typed with explicit interface — no inferred-from-usage types

## Environment Variables
```
NEXT_PUBLIC_API_URL           — backend URL (e.g. https://api.yourdomain.com)
NEXT_PUBLIC_COGNITO_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID
NEXT_PUBLIC_COGNITO_REGION
```

Never put backend-only secrets here (`MONGODB_URI`, `OPENAI_API_KEY` — those are backend env vars only).

## Engineering Standards
- All 4 component states required: loading, empty, error, success
- WCAG 2.1 AA: keyboard navigable, visible focus, semantic HTML
- No inline styles — Tailwind classes only
- No `console.log` left in production code
- All PRs: unit tests, no TypeScript errors, Lighthouse score ≥ 90
