# Runbook: Frontend Rollback

**Use when**: Home page returns 500/503, login broken, React Flow fails to render, CloudFront serving stale/broken build.

**Decision time**: If smoke test fails within 10 minutes of deploy — roll back immediately. Do not debug broken build in production.

---

## Option A: Trigger GitHub Actions Rollback (preferred)

```bash
gh workflow run deploy-frontend-rollback.yml \
  -f target_sha=$(git rev-parse HEAD~1)
```

Wait for workflow, then verify:
```bash
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/
# Expected: 200
```

---

## Option B: Manual ECS + CloudFront Rollback

### Step 1: Roll back ECS to previous task revision

```bash
# Find previous task definition revision
aws ecs describe-task-definition --task-definition mymap-frontend \
  --query 'taskDefinition.revision'
# Note current revision N. Previous = N-1.

aws ecs update-service \
  --cluster mymap-cluster \
  --service mymap-frontend-service \
  --task-definition mymap-frontend:<N-1>

aws ecs wait services-stable --cluster mymap-cluster --services mymap-frontend-service
```

### Step 2: Invalidate CloudFront to flush broken build assets

```bash
aws cloudfront create-invalidation \
  --distribution-id <CLOUDFRONT_DISTRIBUTION_ID> \
  --paths "/*"
```

Wait ~2–5 minutes for invalidation to propagate globally.

### Step 3: Verify

```bash
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/login
```

Both should return 200. Manually check login and roadmap flow.

---

## CloudFront-Only Rollback (static asset issue, ECS is fine)

If the issue is stale static assets but the SSR container is healthy:

```bash
# Invalidate all paths
aws cloudfront create-invalidation \
  --distribution-id <CLOUDFRONT_DISTRIBUTION_ID> \
  --paths "/*"
```

Monitor in AWS Console → CloudFront → Invalidations until status = Completed.

---

## After Rollback

1. Create GitHub issue: `fix(frontend): rollback v<N> — <reason>`
2. Add to issue: what failed, which smoke test, reproduction steps
3. Do NOT re-deploy same SHA — fix first, then re-deploy
4. Update traceability matrix: mark release as rolled back

---

## What Not To Do

- Do not skip the CloudFront invalidation — old broken assets will continue serving from edge
- Do not debug the broken build in production
- Do not delete the broken ECR image — keep for post-mortem
- Do not re-invalidate repeatedly — one full invalidation (`/*`) is sufficient
