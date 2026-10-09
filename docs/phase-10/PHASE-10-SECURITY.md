# Washora — Phase 10 Security & Multi-Tenant Governance

This document describes the platform-level authentication architecture, RBAC model, tenant isolation guarantees, and sensitive action audit policies.

---

## 1. Platform Admin Roles & Permissions Matrix

| Platform Role | Scope & Description | Default Permissions |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Full unrestricted platform governance | All permissions (`*`) |
| **`PLATFORM_ADMIN`** | Day-to-day SaaS operations and tenant lifecycle | Dashboard, Tenants, Subscriptions, Plans, Usage, System Health |
| **`SUPPORT_ADMIN`** | Tenant support, verification, and diagnostics | Dashboard, Tenants View, Verify, Usage, System Health |
| **`BILLING_ADMIN`** | Platform finances, plan pricing, and invoices | Dashboard, Subscriptions View/Update, Invoices Manage, Payments Manage |
| **`READ_ONLY_ADMIN`** | Auditor and executive monitoring | View-only access across all platform entities |

---

## 2. Hard Security Boundaries

1. **Authentication Token Separation:**
   - Platform admin tokens carry `role: 'SUPER_ADMIN' | 'PLATFORM_ADMIN' | ...` and are verified by `PlatformAuthGuard`.
   - Tenant user tokens carry `tenantId`, `userId`, `roleId` and are verified by standard `JwtAuthGuard`.
   - Tenant tokens are rejected immediately if presented to `/api/platform/*` endpoints (401/403).
   - Platform admin tokens are not accepted at tenant-scoped `/api/orders`, `/api/pos`, etc.

2. **Cross-Tenant Data Isolation:**
   - Tenant users can only view their own subscription, usage, and invoices via `/api/subscriptions/*`.
   - Attempting to pass another tenant's ID or access another tenant's billing invoice returns 403 Forbidden.

3. **Failed-Login Lockout:**
   - Accounts are locked after 5 consecutive failed login attempts to mitigate brute-force attacks.

4. **Secret Protection in Governance & Diagnostics:**
   - Audit logs sanitize metadata to prevent storing passwords, tokens, or webhook secrets.
   - The `/api/platform/system-health` endpoint provides safe connectivity diagnostics without leaking environment variables, connection strings, or secret keys.
