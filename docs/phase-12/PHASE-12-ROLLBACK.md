# Washora Phase 12 — Rollback & Incident Recovery Strategy

This document outlines the rollback triggers, step-by-step procedures, database backward compatibility safeguards, and post-rollback health checks.

---

## 1. Rollback Triggers

Initiate a rollback immediately if any of the following occur during or post-deployment:
1. **Health Check Failure**: `/health/ready` fails continuously for > 2 minutes after deployment.
2. **Elevated Error Rate**: HTTP 5xx responses exceed 1% of total traffic over a 5-minute rolling window.
3. **Database Contention**: Connection timeouts, thread exhaustion, or unindexed query spikes causing API unresponsiveness.
4. **Authentication Outage**: Token validation or tenant isolation regressions detected in production smoke tests.

---

## 2. Backward Compatibility Safeguards

Washora follows an **Expand and Contract** release pattern for database changes:
- **No Destructive Schema Migrations**: Fields are never dropped or renamed in a single release.
- **Additive Index Deployments**: New compound indexes are non-blocking and additive (`background: true` / standard online indexing).
- **Graceful Nullability**: Code changes must accommodate both old and new schema variants to allow instant binary rollbacks without database rewinds.

---

## 3. Rollback Runbooks

### Runbook 1: Vercel Frontend Rollback (Instant)
1. Open the [Vercel Dashboard](https://vercel.com).
2. Navigate to **Washora Web** or **Washora Admin** project.
3. In the **Deployments** tab, locate the last known stable deployment.
4. Click the **...** (three dots) menu and select **Instant Rollback / Promote to Production**.
5. *Execution Time*: < 10 seconds. Zero downtime.

### Runbook 2: Hostinger API Rollback
1. Log in to Hostinger Control Panel -> **Node.js Application**.
2. Stop the application process.
3. Revert git commit to the previous stable release tag:
   ```bash
   git checkout <PREVIOUS_RELEASE_TAG>
   npm ci
   npm run build --workspace=@washora/shared
   npm run build --workspace=@washora/api
   ```
4. Restart the Node.js process.
5. Verify health:
   ```bash
   curl -i https://api.washora.com/health/ready
   ```
6. *Execution Time*: ~ 2 minutes.

---

## 4. Post-Rollback Verification

Execute the standard smoke test suite:
1. **API Readiness**: Verify `GET /health/ready` returns `HTTP 200` with `dbState: "connected"`.
2. **Tenant Auth**: Perform login via `/api/v1/auth/login`.
3. **Admin Auth**: Perform login via `/api/v1/platform-admin/auth/login`.
4. **Order Read**: Retrieve `/api/v1/orders`.
5. **Logs Verification**: Check structured logs for zero crash loops or unhandled exceptions.
