# Washora Phase 12 — Background Jobs & Webhooks Reliability

This document outlines the asynchronous job processing architecture, retry mechanics, dead-letter classifications, webhook verification, and replay protection implemented for Washora.

---

## 1. Background Processing in Managed Environments

### Context & Constraints
Washora backend is hosted on managed Node.js (Hostinger) without assuming persistent daemon workers (Redis, BullMQ, Celery) or a containerized fleet (Kubernetes).
All asynchronous operations are structured to remain **provider-neutral**, allowing in-memory and database-backed asynchronous processing without blocking HTTP request lifecycles.

### Asynchronous Operations Identified
1. **Notification Dispatching**: WhatsApp / SMS / Email sending via provider abstractions.
2. **Webhook Ingestion**: SaaS billing and WhatsApp delivery status callbacks.
3. **Billing Lifecycle**: Subscription period expiration, trial checks, grace periods.
4. **Maintenance & Cleanup**: Stale tokens, temporary report artifacts, expired OTPs.

---

## 2. Provider-Neutral Job Architecture

The job subsystem provides a structured interface and standardized lifecycle:

```typescript
export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';

export interface BackgroundJob<TPayload = any, TResult = any> {
  jobId: string;
  jobType: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
  attemptCount: number;
  maxAttempts: number;
  backoffMs: number;
  status: JobStatus;
  correlationId?: string;
  payload: TPayload;
  result?: TResult;
  lastError?: string;
}
```

### Execution Lifecycle & State Machine
```
[Enqueued] ──> PENDING ──> RUNNING ──> COMPLETED
                             │
                      Error Encountered
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
        Retryable Error             Non-Retryable / Max Attempts
               │                           │
         Backoff Delay                     ▼
               │                      DEAD_LETTER
               ▼
            PENDING
```

### Exponential Backoff Calculation
- Delay is computed as: `backoffMs * Math.pow(2, attemptCount - 1)`
- Maximum delay is bounded (default max: 60 seconds) to prevent infinite sleep intervals.

### Retry Classification
Errors are classified into **Retryable** vs **Non-Retryable**:
- **Retryable**:
  - `ECONNRESET`, `ETIMEDOUT`, `ECONNREFUSED`
  - HTTP 429 (Rate limited by downstream provider)
  - HTTP 500, 502, 503, 504 (Downstream transient server errors)
  - MongoNetworkError / transient DB disconnection
- **Non-Retryable (Immediate Dead-Letter)**:
  - HTTP 400 Bad Request (Payload schema mismatch)
  - HTTP 401 / 403 (Invalid provider credentials / configuration error)
  - HTTP 404 (Resource not found)
  - Business invariant violations (e.g., duplicate invoice payment attempt)

---

## 3. Webhook Reliability & Security

### Signature Verification Architecture
External webhooks (SaaS billing gateways, WhatsApp Business API) require cryptographic validation before payload ingestion.

```typescript
// Verified via WebhookVerifierService
const isValid = webhookVerifier.verifyHmacSha256(rawBody, signatureHeader, secret);
```

- **Timing-Safe Comparison**: Uses `crypto.timingSafeEqual` with fixed-length buffers to prevent timing side-channel attacks.
- **Prefix Handling**: Supports standard header formats (e.g., `sha256=<hash>` or raw hex).

### Replay Attack & Duplicate Protection
1. **Timestamp Freshness**: Incoming webhooks with timestamp headers older than tolerance (default: 300s) are rejected.
2. **Idempotency Key Tracking**:
   - Webhook events register their unique provider event ID (`eventId` / `idempotencyKey`).
   - Duplicate events within the TTL window return HTTP 200 OK immediately without re-executing business logic.
   - Prevents double-crediting invoices, duplicate subscription activations, or redundant customer notifications.

---

## 4. Verification Status

| Component | Status | Environment | Notes |
| :--- | :--- | :--- | :--- |
| Job Runner Lifecycle | **VERIFIED** | Local / Automated Tests | Tested state transitions, backoff, dead-lettering |
| Retry Classification | **VERIFIED** | Local / Automated Tests | Network vs business error segregation verified |
| Webhook HMAC Verification | **VERIFIED** | Local / Automated Tests | Timing-safe SHA256 matches confirmed |
| Webhook Replay Protection | **VERIFIED** | Local / Automated Tests | Timestamp tolerance & duplicate key deduplication verified |
| Live WhatsApp Delivery | **NOT VERIFIED** | Staging / Prod Required | Requires active Meta Cloud API credentials |
| Live Payment Webhooks | **NOT VERIFIED** | Staging / Prod Required | Requires active Payment Gateway credentials |
