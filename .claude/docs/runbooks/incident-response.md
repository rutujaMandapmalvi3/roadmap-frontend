# Runbook: Frontend Incident Response

---

## Severity Classification

| Severity | Definition | Response Time | Examples |
|----------|-----------|--------------|---------|
| P0 | Total outage — all users see blank/broken page | Immediate | CloudFront returning 503, JS bundle 404, blank white screen on all pages |
| P1 | Partial outage or auth broken | < 30 min | Login failing, roadmap graph not rendering, API calls returning 401 for all users |
| P2 | Degraded experience | < 2 hours | Slow page loads, React Flow stuttering, follow-up updates delayed |
| P3 | Minor issue | Next business day | Cosmetic bug, non-critical component not rendering |

---

## P0 / P1 Response Steps

### 1. Detect

```bash
# Check if site loads at all
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/
# Expected: 200. Anything else: P0.

# Check CloudFront distribution status
aws cloudfront get-distribution \
  --id <CLOUDFRONT_DISTRIBUTION_ID> \
  --query 'Distribution.Status'
# Expected: Deployed

# Check ECS frontend service
aws ecs describe-services \
  --cluster mymap-cluster \
  --services mymap-frontend-service \
  --query 'services[0].{running:runningCount,desired:desiredCount}'
# Expected: running == desired

# Check CloudWatch for frontend errors
aws logs filter-log-events \
  --log-group-name /ecs/mymap-frontend \
  --filter-pattern "ERROR" \
  --start-time $(date -d '30 minutes ago' +%s000) \
  | jq '.events[].message'
```

### 2. Isolate

- Recent deploy in the last hour? → Roll back immediately (see `rollback.md`)
- Backend returning errors? → Check backend health: `curl https://api.yourdomain.com/health`
  - If backend is down: frontend correctly shows error state — backend incident, not frontend
- Cognito outage? → Check AWS Cognito service health in the affected region
- CloudFront misconfiguration? → Check distribution settings, origin domain, behavior rules
- Build artifact missing? → Check S3/ECR for the deployed version's assets

### 3. Communicate

Create GitHub issue immediately:
```markdown
## Incident: <one-line description>
**Severity**: P0/P1
**Started**: <time>
**Detected via**: monitoring / user report / smoke test
**Affected pages**: login / home / roadmap / all
**Symptoms**: <what users see — blank page / 500 / auth loop>
**Initial hypothesis**: <CloudFront / ECS / Cognito / backend>
```

### 4. Mitigate

| Symptom | Action |
|---------|--------|
| Blank white screen | Check browser console for JS errors — likely build artifact issue → rollback |
| Login loop | Cognito config mismatch — check `NEXT_PUBLIC_COGNITO_*` env vars in ECS task definition |
| Graph not rendering | Check React Flow version; check `/conversations/:id` response shape from backend |
| 401 on all API calls | Token not being sent — check `api.ts` Authorization header; check Cognito token expiry |
| CloudFront 503 | ECS origin unhealthy — roll back ECS, invalidate CloudFront cache |

### 5. Resolve + Post-Mortem

After incident resolved:
- Document: timeline, root cause, what failed, how fixed
- Add Playwright regression test if a UI bug was the cause
- Update this runbook with new finding
- Review if Lighthouse CI or smoke tests should have caught this earlier

---

## Key Resources

| Resource | Where |
|----------|-------|
| CloudFront distribution | AWS Console → CloudFront |
| ECS frontend service | AWS Console → ECS → mymap-cluster → mymap-frontend-service |
| CloudWatch logs | /ecs/mymap-frontend |
| Cognito User Pool | AWS Console → Cognito → User Pools |
| GitHub Actions | github.com/repo/actions |
| Backend health | https://api.yourdomain.com/health |
