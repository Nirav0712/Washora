# Washora Phase 12 — Centralized Logging & Error Handling

## 1. Structured Logging Service

### Log Format
- **Development**: Colorized, human-readable terminal format with timestamps, levels, context, and correlation IDs.
- **Production (`NODE_ENV=production`)**: Single-line structured JSON output written to `process.stdout` (info/warn/debug) and `process.stderr` (error/fatal).

### Log Schema
```json
{
  "timestamp": "2026-10-09T07:00:16.946Z",
  "level": "error",
  "service": "washora-api",
  "context": "JobRunner",
  "message": "Job PROCESS_INVOICE failed",
  "requestId": "5f9236c1-622b-410b-8273-1338076f2160",
  "tenantId": "6ac88eb57c730b27dd0ab5e1",
  "userId": "6ac88eb57c730b27dd0ab5e2",
  "durationMs": 42,
  "error": { "name": "Error", "message": "Connection timed out" },
  "metadata": {},
  "env": "production"
}
```

### Automatic Recursive Redaction
The logger automatically redacts sensitive fields at any depth:
- `password`, `passwordHash`
- `token`, `accessToken`, `refreshToken`, `jwt_access_secret`, `jwt_refresh_secret`
- `otp`, `otpCode`, `otpCodeHash`
- `authorization` headers & `Bearer <token>` strings
- `cardNumber`, `cvv`, `pin`
- `mongodb://` & `mongodb+srv://` connection strings with credentials
- Provider API keys: WhatsApp, Stripe, Razorpay, Cloudinary secrets

---

## 2. Public API Error Contract

All API error responses implement a uniform, predictable schema compatible with client SDKs and frontend exception handlers:

```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request payload provided.",
  "requestId": "5f9236c1-622b-410b-8273-1338076f2160",
  "timestamp": "2026-10-09T07:00:16.946Z",
  "path": "/api/orders",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload provided.",
    "details": ["orderItems must not be empty"]
  }
}
```

### Standard Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | `BAD_REQUEST` / `INVALID_ID_FORMAT` | Validation failure or malformed ObjectId |
| 401 | `UNAUTHORIZED` | Missing, expired, or revoked JWT token |
| 403 | `FORBIDDEN` / `BRANCH_ACCESS_DENIED` | Insufficient permissions or branch mismatch |
| 404 | `NOT_FOUND` | Resource does not exist or belongs to another tenant |
| 409 | `CONFLICT` / `DUPLICATE_KEY` | Unique constraint violation (e.g. order number) |
| 422 | `UNPROCESSABLE_ENTITY` | Business logic constraint rejection |
| 429 | `TOO_MANY_REQUESTS` | Rate limit window quota exceeded |
| 500 | `INTERNAL_SERVER_ERROR` | Sanitized internal error (stack trace withheld in prod) |
