# Washora Phase 12 — Observability & Monitoring

This document describes the observability architecture, telemetry, correlation propagation, and future monitoring provider integration points.

---

## 1. Observability Architecture

```
Incoming Request
      │
      ▼
[Correlation Middleware] ─── Assigns / Validates x-request-id
      │
      ▼
[Structured Logger] ─────── Logs: { timestamp, level, requestId, context, msg }
      │                     (Sensitive data automatically redacted)
      ▼
[Route Execution / Service]
      │
      ├──> Success: Interceptor logs response status & duration (ms)
      └──> Exception: HttpExceptionFilter logs sanitized error + stack (dev only)
```

---

## 2. Structured Log Schema

In production environments (`NODE_ENV=production`), logs are emitted to `stdout` as single-line JSON strings:

```json
{
  "timestamp": "2026-10-09T06:45:00.123Z",
  "level": "INFO",
  "service": "washora-api",
  "environment": "production",
  "context": "OrdersService",
  "requestId": "req-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "message": "Order created successfully",
  "data": {
    "orderId": "65f01234abcd5678ef901234",
    "tenantId": "65f01234abcd5678ef900001",
    "totalAmount": 1500
  }
}
```

---

## 3. Telemetry & Metrics Signals

| Signal | Source | Path / Event | Usage |
| :--- | :--- | :--- | :--- |
| **Liveness Status** | Process Watcher | `GET /health/live` | Process uptime, heap memory, Node.js version |
| **Readiness Status** | Health Controller | `GET /health/ready` | MongoDB connectivity check (bounded timeout) |
| **Request Correlation** | Response Header | `X-Request-Id` | End-to-end tracing across client, API, and DB logs |
| **Job Execution Metrics** | Job Runner | Internal Event | `job_started`, `job_completed`, `job_dead_letter` |
| **Rate Limit Events** | Rate Limiter | Guard / 429 Response | Blocked client IPs / accounts |

---

## 4. Third-Party Provider Integration Points

The observability layer is designed to be **provider-neutral**. When migrating or attaching external APM / monitoring tools (e.g., Sentry, Datadog, Better Stack, Logtail):

1. **Error Monitoring (e.g. Sentry)**:
   - Hook into `HttpExceptionFilter.catch()`
   - Attach `requestId` as a Sentry tag
   - Pass redacted exception context
2. **Log Forwarding (e.g. BetterStack / CloudWatch)**:
   - Standard stdout JSON logs are automatically parsed by host-level collectors or Docker/systemd log shipping daemons.
3. **Uptime Monitoring**:
   - Point external health checkers (e.g. UptimeRobot, Pingdom) to `https://api.washora.com/health/live` (1-minute interval) and `https://api.washora.com/health/ready` (5-minute interval).
