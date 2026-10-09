# Washora Phase 12 — Security Hardening & Isolation

## 1. Multi-Tenant & Branch Access Isolation

### Authorization Hierarchy
Every state-mutating and data-access endpoint strictly enforces server-side verification:

```text
Incoming Request
    ↓
1. Extract Bearer Token (JwtAuthGuard)
    ↓
2. Validate Active Membership & Tenant ID (TenantGuard)
    ↓
3. Validate Required Permission Flags (PermissionsGuard)
    ↓
4. Validate Branch Access Scope (BranchGuard)
    ↓
5. Resource Scoping Filter: { tenantId, _id, ... }
```

### Security Verification Matrix
- **Tenant Scope Enforcement**: Browser-supplied tenant IDs are strictly ignored in favor of the JWT tenant context.
- **Cross-Tenant Prevention**: Attempting to read or mutate Tenant A's orders, customers, or pickups using Tenant B's credentials yields an immediate `404 Not Found` or `403 Forbidden`.
- **Platform Admin Separation**: Platform SuperAdmin credentials and JWT tokens are cryptographically distinct from tenant staff tokens and cannot be used against tenant operational APIs.

---

## 2. API Security & Abuse Protection

### Rate Limiting Controls
- Implemented via `RateLimiterGuard` with configurable per-route `@RateLimit({ ttlMs, limit })` decorators.
- Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` headers.
- Separate in-memory buckets keyed by IP and/or authenticated user ID.

### HTTP Security Headers & Payload Controls
- **Helmet**: HSTS (`maxAge: 31536000`, `includeSubDomains: true`), X-Content-Type-Options, X-Frame-Options (`SAMEORIGIN`), Referrer-Policy.
- **CORS**: Explicit allowlist via `CORS_ORIGIN` env var. Wildcard origins with credentials are fully prohibited.
- **Body Parser Limits**: Express JSON and URL-encoded parsers bounded at `10mb` max body size.
- **Mass Assignment Protection**: NestJS `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
