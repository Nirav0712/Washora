# Washora — Phase 11: Performance & Aggregation Strategy

## 1. Aggregation Optimization Principles

### 1.1 Single-Pass Aggregation Pipelines
Instead of issuing multiple queries per branch, service, or status, the reporting engine utilizes `$facet` and `$group` operations:
- A single request to `/reports/sales` fetches summary metrics, timeline distribution, branch breakdown, and payment splits in **1 database roundtrip**.
- Multi-branch metrics are grouped server-side using `$group: { _id: "$branchId" }` rather than executing $N$ queries for $N$ branches.

### 1.2 Compound Index Strategy
Reporting pipelines leverage existing compound indexes across all primary collections:
- `orders`: `{ tenantId: 1, branchId: 1, createdAt: -1 }` and `{ tenantId: 1, status: 1 }`
- `payments`: `{ tenantId: 1, branchId: 1, createdAt: -1 }`
- `expenses`: `{ tenantId: 1, branchId: 1, date: -1 }`
- `garments`: `{ tenantId: 1, branchId: 1, currentStage: 1 }`
- `customers`: `{ tenantId: 1, createdAt: -1 }`
- `stock_movements`: `{ tenantId: 1, branchId: 1, createdAt: -1 }`

### 1.3 Strict Match Early
Every MongoDB aggregation pipeline places `$match: { tenantId: ..., createdAt: { $gte: ..., $lte: ... } }` as the **very first stage**, ensuring the database engine filters out 99%+ of records before performing memory-intensive groupings or projections.

---

## 2. In-Memory Tenant Caching

High-traffic dashboard endpoints (e.g. `GET /reports/dashboard`) use `ReportsCacheService`:
- Default cache TTL: 60 seconds.
- Keys are hashed with SHA-256 containing `tenantId + branchId + datePreset + customRange`.
- Cache invalidation occurs on standard write events or automated TTL expiration.
- Memory usage is strictly bounded with LRU eviction to avoid memory bloat.

---

## 3. Streaming CSV Export

Exporting large datasets (e.g. 50,000+ orders) avoids buffering complete arrays into memory:
- Node.js response streaming writes CSV rows directly to HTTP response headers (`Content-Type: text/csv; charset=utf-8`).
- Content is formatted on-the-fly with sanitized strings to prevent spreadsheet formula execution exploits.
