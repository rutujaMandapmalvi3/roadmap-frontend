# Runbook: Frontend Deploy

**Trigger**: Merge to `main` with changes under `mymap-client/**` — GitHub Actions runs `deploy-frontend.yml` automatically.

---

## Pre-Deploy Checklist (verify before merging to main)

- [ ] All tests passing locally: `npm test`
- [ ] TypeScript clean: `npx tsc --noEmit` — zero errors
- [ ] Lint clean: `npm run lint`
- [ ] Traceability audit clear (zero ❌ in `intprep/.claude/docs/traceability.md`)
- [ ] No open CRITICAL or HIGH security findings
- [ ] No secrets in `NEXT_PUBLIC_*` env vars: `grep -r "MONGODB_URI\|OPENAI_API_KEY" .env*`
- [ ] PR approved by required CODEOWNERS
- [ ] Changelog updated under [Unreleased]
- [ ] Lighthouse CI score ≥ 90 on Performance, Accessibility

---

## Automated Pipeline Steps

GitHub Actions `deploy-frontend.yml` runs in order:

1. **Test job**: `npm ci && npm test` — fails fast, blocks deploy
2. **Type check**: `npx tsc --noEmit` — TypeScript strict must pass
3. **Lint**: `npm run lint` — ESLint, no errors
4. **Build**: `npm run build` — Next.js production build
5. **Push**: Docker image pushed to ECR (if containerized) OR static export uploaded to S3
6. **Deploy ECS**: `aws ecs update-service` for SSR container (if applicable)
7. **Invalidate CloudFront**: `aws cloudfront create-invalidation --paths "/*"`
8. **Wait**: CloudFront propagation + ECS stable
9. **Smoke test**: Playwright smoke suite against production URL

---

## Manual Deploy (emergency only)

```bash
# 1. Build Next.js
cd mymap-client
npm run build

# 2. Build and push Docker image (if SSR via ECS)
SHA=$(git rev-parse --short HEAD)
ECR="<account-id>.dkr.ecr.us-east-1.amazonaws.com/mymap-frontend"

docker build -f docker/frontend.Dockerfile -t $ECR:$SHA .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR
docker push $ECR:$SHA

# 3. Update ECS service
aws ecs update-service \
  --cluster mymap-cluster \
  --service mymap-frontend-service \
  --task-definition mymap-frontend \
  --force-new-deployment

aws ecs wait services-stable --cluster mymap-cluster --services mymap-frontend-service

# 4. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <CLOUDFRONT_DISTRIBUTION_ID> \
  --paths "/*"

# 5. Verify
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/
# Expected: 200
```

---

## Verify Deploy Success

```bash
# Home page loads
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/
# Expected: 200

# Login page loads
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/login
# Expected: 200

# Static assets served from CloudFront (check Cache-Control header)
curl -sI https://yourdomain.com/_next/static/chunks/main.js | grep -i cache-control
# Expected: max-age=31536000 (immutable)
```

Manual smoke checks:
- [ ] Login page loads and Cognito form is functional
- [ ] Home page lists past roadmaps after login
- [ ] New roadmap form submits and graph renders
- [ ] React Flow graph is interactive (pan, zoom)
- [ ] Follow-up form updates graph without full page reload

---

## Post-Deploy

```bash
# Tag release
git tag v<semver> && git push origin v<semver>

# Create GitHub release
gh release create v<semver> --generate-notes
```

If anything fails → see `rollback.md`.
