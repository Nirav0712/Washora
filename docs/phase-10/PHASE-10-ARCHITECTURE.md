# Washora — Phase 10 Architecture
## SaaS Administration, Subscription & Multi-Tenant Governance

This document details the architectural design and system boundaries introduced in **Phase 10** to establish a governed, scalable multi-tenant SaaS platform.

---

## 1. High-Level Architectural Topology

```
+---------------------------------------------------------------------------------------------------+
|                                         WASHORA PLATFORM                                          |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|   +------------------------------------+             +------------------------------------+       |
|   |         apps/web                   |             |         apps/admin                 |       |
|   |  Tenant / Laundry Operations App   |             |  Platform / SaaS Administration    |       |
|   |  - POS & Counter Register          |             |  - Executive KPI Dashboard         |       |
|   |  - Garment Lifecycle & QC          |             |  - Tenant Lifecycle State Machine  |       |
|   |  - Staff, Attendance & Payroll     |             |  - Subscription Plan Builder       |       |
|   |  - Logistics (Pickups/Deliveries)  |             |  - Tenant Subscriptions Manager    |       |
|   |  - Customer Portal & CRM           |             |  - SaaS Billing & Invoicing        |       |
|   |  - Tenant Settings & Quota View    |             |  - Cross-Tenant Usage & Capacity   |       |
|   +------------------------------------+             |  - Governance Audit Trail          |       |
|                     |                                |  - Infrastructure Diagnostics      |       |
|                     |                                +------------------------------------+       |
|                     | (Bearer Token: User / Tenant)                    | (Bearer Token: Admin)    |
|                     \                                                 /                           |
|                      \                                               /                            |
|                       +---------------------------------------------+                             |
|                       |                   apps/api                  |                             |
|                       |             NestJS Enterprise API           |                             |
|                       +---------------------------------------------+                             |
|                       | Platform Auth & RBAC Guards                 |                             |
|                       | Feature Gate & Usage Limit Services         |                             |
|                       | Tenant Lifecycle State Machine              |                             |
|                       | SaaS Billing & Webhook Idempotency Engine   |                             |
|                       | Shared Data Layer (MongoDB Atlas)           |                             |
|                       +---------------------------------------------+                             |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Platform Domain Separation

Washora strictly separates two critical financial and operational domains:

| Domain Dimension | Shop Operational Finance (Phases 01–09) | SaaS Platform Billing (Phase 10) |
| :--- | :--- | :--- |
| **Actor Context** | Laundry Shop Owners, Cashiers, Delivery Drivers | Washora SaaS Platform Administrators (`SUPER_ADMIN`, `BILLING_ADMIN`, etc.) |
| **Target Entities** | Laundry End-Customers, Garment Orders, Suppliers | B2B Laundry Business Tenants (`TenantSubscription`, `SubscriptionPlan`) |
| **Transactions** | POS Payments, Customer Invoices, Expenses, Payroll | SaaS Subscription Billing Invoices (`SINV-XXXXXX`), Platform Payments (`SPAY-XXXXXX`) |
| **Storage Schemas** | `orders`, `payments`, `expenses`, `inventories` | `subscription_plans`, `tenant_subscriptions`, `billing_invoices`, `billing_payments` |
| **Isolation** | Hard-isolated per `tenantId` and `branchId` | Cross-tenant administrative control with granular platform RBAC |

---

## 3. Module Breakdown (`apps/api/src/modules/platform`)

1. **`PlatformAuthModule`**:
   - Platform admin authentication (`PlatformAdmin` schema).
   - Password hashing with PBKDF2/SHA512.
   - Account lockout after 5 consecutive failed attempts.
   - Granular RBAC permissions matrix (`SUPER_ADMIN`, `PLATFORM_ADMIN`, `SUPPORT_ADMIN`, `BILLING_ADMIN`, `READ_ONLY_ADMIN`).

2. **`TenantLifecycleService`**:
   - Provisioning engine creating tenant, primary branch, default `SHOP_OWNER` role, membership, and initial trial subscription atomically.
   - Centralized lifecycle state machine enforcing valid transitions:
     `PROVISIONING -> TRIAL -> ACTIVE -> PAST_DUE -> SUSPENDED -> CANCELLED -> ARCHIVED`.
   - Automatic subscription synchronization (e.g. suspending tenant pauses active subscriptions).

3. **`SubscriptionPlanService`**:
   - Configurable pricing tiers (e.g. Starter ₹999/mo, Professional ₹2,499/mo, Enterprise ₹5,999/mo).
   - Modular feature entitlement flags (`FeatureKey`) and operational quotas (`LimitKey`).
   - Referenced-plan deletion prevention (archives instead of hard-deleting active plan tiers).

4. **`TenantSubscriptionService`**:
   - Trial conversion, renewal tracking, cancel-at-period-end, reactivation, and administrative period overrides.
   - Upgrades and safe downgrade validation (blocks downgrade if tenant's active branches, staff, or customers exceed target plan quotas).
   - Immutable subscription audit history (`subscription_history`).

5. **`SaasBillingService` & Gateway Abstraction**:
   - Atomic invoice sequence numbering (`SINV-000001`).
   - Atomic payment sequence numbering (`SPAY-000001`).
   - Mock gateway provider interface (`BillingProvider`) for pluggable Razorpay/Stripe integration.
   - In-memory/event-cached webhook idempotency protecting against duplicate processing.

6. **`FeatureGateService` & `UsageLimitService`**:
   - Centralized backend runtime assertion decorators/services.
   - Dynamically checks tenant subscription tier entitlements before allowing module access.

7. **`SystemHealthService` & `PlatformDashboardService`**:
   - Safe operational diagnostics (database connectivity, latency, memory utilization, platform uptime).
   - Strict credential protection: environment variables and database connection strings are never leaked.
