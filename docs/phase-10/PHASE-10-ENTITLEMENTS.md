# Washora — Phase 10 Feature Entitlements & Usage Limits

This document describes the runtime feature gating and usage limit enforcement services.

---

## 1. Feature Entitlement Keys (`FeatureKey`)

Entitlements are modeled as granular boolean flags defined in `@washora/shared`:

- `POS`: Counter register, billing, item tagging.
- `CUSTOMERS`: Customer CRM, balances, loyalty.
- `ORDERS`: Order creation, tracking, status progression.
- `PROCESSING`: Washing, dry cleaning, ironing workflows.
- `QC`: Quality inspection, defect rejection.
- `STAFF`: Employee profiles and management.
- `ATTENDANCE`: Shift clock-in/clock-out, hours tracking.
- `PAYROLL`: Automated salary calculation, payslip generation.
- `EXPENSES`: Operational petty cash & store overhead.
- `SUPPLIERS`: Chemical/packaging supplier catalog.
- `PURCHASES`: Inventory purchase orders and receipts.
- `INVENTORY`: SKU stock tracking and reorder thresholds.
- `FINANCE`: Financial ledger and P&L summaries.
- `PICKUP_DELIVERY`: On-demand pickup requests and route dispatch.
- `NOTIFICATIONS`: In-app and multi-channel alerts.
- `WHATSAPP`: Automated WhatsApp invoice & ready alerts.
- `CUSTOMER_PORTAL`: Self-service customer tracking & online payment.
- `CRM`: Customer segmentation and lifetime value analytics.
- `REPORTS`: Operational business intelligence reports.
- `MULTI_BRANCH`: Creation and management of multiple shop outlets.

---

## 2. Plan Usage Limits (`LimitKey`)

Configurable operational resource limits:

- `MAX_BRANCHES`: Maximum allowed active branches (outlets).
- `MAX_STAFF`: Maximum registered staff members.
- `MAX_CUSTOMERS`: Maximum active customer profiles.
- `MAX_MONTHLY_ORDERS`: Maximum orders created per billing period.
- `MAX_USERS`: Maximum administrative and staff login accounts.
- `MAX_PRODUCTS`: Maximum product & price catalog entries.
- `MAX_INVENTORY_ITEMS`: Maximum inventory SKUs.
- `MAX_WHATSAPP_MESSAGES`: Monthly quota for outbound WhatsApp messages.
- `MAX_STORAGE`: Document and receipt image attachment storage (in GB).

---

## 3. Central Server-Side Enforcement

Entitlements and limits are strictly enforced on the server via `FeatureGateService` and `UsageLimitService`:

```typescript
// Feature Gate check
await this.featureGate.assertEnabled(tenantId, FeatureKey.PAYROLL);
// Throws ForbiddenException if plan does not include PAYROLL

// Usage Limit check
await this.usageLimit.assertWithinLimit(tenantId, LimitKey.MAX_BRANCHES);
// Throws BadRequestException (PLAN_LIMIT_EXCEEDED) if branch limit is reached
```

Neither the client browser nor frontend state is trusted for entitlement decisions.
