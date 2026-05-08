# API Contracts — Frontend Consuming Reference

> This is the frontend-side view of the API. The backend owns these contracts.
> Source of truth: `myMap/.claude/references/api-contracts.md`.
> If contracts change, backend updates theirs first — frontend updates this file to match.

---

## Base URL

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com   (production)
NEXT_PUBLIC_API_URL=http://localhost:3000         (local dev)
```

All requests go through `src/lib/api.ts`. Never call `fetch` directly in components.

---

## Auth Header (required on all endpoints except /health)

```
Authorization: Bearer <Cognito ID Token>
```

Token sourced from Cognito via `src/lib/auth.ts`. Passed in every `api.ts` call.
401 response → redirect to `/login`. Handle in `api.ts`, not in individual components.

---

## Endpoints

### POST /chat — Generate new roadmap

**When called**: `api.ts:generateRoadmap(form)` — user submits new roadmap form.

**Request:**
```ts
{
  topic: string;        // max 500 chars
  level: 'beginner' | 'intermediate' | 'advanced';
  timeframe: string;    // e.g. "3 months"
  goal: string;         // max 500 chars
}
```

**Response (201):**
```ts
{
  _id: string;          // conversationId — use for /roadmap?conversationId=<_id>
  userId: string;       // do not display
  topic: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  roadmap: {
    phases: Array<{
      title: string;
      duration: string;
      milestones: Array<{
        title: string;
        resources: string[];
      }>;
    }>;
  };
  createdAt: string;    // ISO 8601
  updatedAt: string;
}
```

**After success**: navigate to `/roadmap?conversationId=${data._id}`.

---

### POST /chat — Follow-up message

**When called**: `api.ts:sendFollowUp({ conversationId, followUpMessage })` — user submits follow-up form on roadmap page.

**Request:**
```ts
{
  conversationId: string;   // from URL param
  followUpMessage: string;  // max 1000 chars
}
```

**Response (200):** Same shape as POST /chat 201 response above. `roadmap` field is the updated roadmap. Call `setRoadmap(data.roadmap)` — React Flow re-renders automatically.

---

### GET /conversations — List user's roadmaps

**When called**: `api.ts:getMyRoadmaps()` — home page mount.

**Response (200):**
```ts
Array<{
  _id: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  // Note: messages and roadmap NOT included in list response
}>
```

Empty array = new user → show roadmap form immediately (do not show empty state with list UI).

---

### GET /conversations/:id — Full conversation

**When called**: `api.ts:getRoadmap(conversationId)` — roadmap page mount.

**Response (200):** Full conversation shape (same as POST /chat response).

**Error (403):** User does not own this conversation — redirect to `/` home page.
**Error (404):** Conversation not found — show error state.

---

## Error Shape (all endpoints)

```ts
{
  error: string;   // human-readable message — safe to display
  // Never contains: stack, DB errors, internal details
}
```

| Status | Meaning | Frontend action |
|--------|---------|----------------|
| 400 | Invalid input | Show validation error near form field |
| 401 | Not authenticated | Redirect to `/login` |
| 403 | Ownership denied | Redirect to `/` or show "not found" |
| 404 | Resource not found | Show "not found" error state |
| 429 | Rate limited | Show "too many requests, try again in X minutes" |
| 500 | Server error | Show generic "something went wrong" error state |

---

## React Flow Rendering Contract

Roadmap JSON → React Flow nodes:

```
roadmap.phases[]          → one node per phase (type: 'phase')
  .title                  → node label
  .duration               → node subtitle
  .milestones[]           → child nodes (type: 'milestone') connected to phase node
    .title                → milestone node label
    .resources[]          → displayed inside milestone node as a list
```

If `roadmap.phases` is empty or missing → show "Roadmap unavailable" error state, do not crash.

---

## Health Check

### GET /health — No auth required

```ts
// Response (200)
{
  status: 'ok';
  db: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
}
```

Frontend does not call `/health` — this is for ops/monitoring. Listed here for reference.
