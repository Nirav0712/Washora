# Washora Phase 12 — Architecture & Production Readiness

## 1. System Overview & Deployment Topology

Washora is an enterprise-grade, multi-tenant laundry management SaaS platform designed for managed, serverless, and low-overhead hosting environments without requiring a mandatory VPS, Kubernetes, or Redis cluster.

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|  - Web POS & Branch Portal (Next.js 14)       --> Vercel                |
|  - SaaS Platform Admin Console (Next.js 14)   --> Vercel                |
|  - Customer Self-Service Portal (PWA/Responsive)                        |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTPS / REST + JSON
                                    v
+-------------------------------------------------------------------------+
|                             API BACKEND                                 |
|  - Framework: NestJS 10 + Express Runtime                               |
|  - Hosting: Hostinger Managed Node.js / Serverless / Container           |
|  - Security: Helmet, Strict CORS, Correlation Middleware, Rate Limiting  |
|  - Modules: Auth, Multi-Tenancy, POS, Payments, Logistics, Staff,       |
|             Subscriptions, Analytics, Notifications, Health             |
+-------------------------------------------------------------------------+
                    |                                 |
                    v                                 v
+------------------------------------+  +--------------------------------+
|          DATABASE TIER             |  |         MEDIA STORAGE          |
|  - MongoDB Atlas (Replica Set M0+) |  |  - Cloudinary CDN              |
|  - Connection Pool: 2-50 Conns     |  |  - Signatures, POD Photos,     |
|  - Compound Tenant-Scoped Indexes  |  |    Garment Defect Photos       |
+------------------------------------+  +--------------------------------+
```

---

## 2. Key Architecture Decisions & Constraints

1. **Zero VPS Requirement**: Built to operate cleanly on managed hosting (Hostinger Node.js runtime) and Vercel for frontend clients.
2. **Provider-Neutral Background Processing**: Durable job runner abstraction with bounded exponential backoff retries, dead-letter state recording, and multi-instance concurrency safety without hard-requiring Redis.
3. **Multi-Tenant Security Enforcement**: Every operational query enforces `tenantId` and `branchId` scoping derived strictly from validated JWT claims and server-side membership resolution.
4. **Structured JSON Observability**: Production JSON structured logging with automatic recursive redaction of credentials, tokens, OTPs, and payment data.
5. **Request Correlation & Tracing**: Every inbound request receives/validates an `x-request-id` header propagated to logs, error payloads, response headers, and background tasks.
