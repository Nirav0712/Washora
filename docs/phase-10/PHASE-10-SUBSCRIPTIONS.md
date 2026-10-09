# Washora — Phase 10 Subscription & Lifecycle Management

This document details the subscription architecture, trial rules, plan configuration tiers, and lifecycle state machines.

---

## 1. Subscription Lifecycle Model

```
               +-------------------------------------------------+
               |                   PROVISIONING                  |
               +-------------------------------------------------+
                                        |
                                        v
               +-------------------------------------------------+
               |                      TRIAL                      |
               +-------------------------------------------------+
                     |                                     |
    (Subscribed /    |                                     | (Trial Expired /
     Trial Converted)|                                     |  Payment Failed)
                     v                                     v
+------------------------+                        +------------------------+
|         ACTIVE         | <--------------------> |        PAST_DUE        |
+------------------------+      (Settlement /     +------------------------+
       |           |             Delinquency)                  |
       |           |                                           | (Grace period
       |           |                                           |  exceeded)
       |           \--------------------+                      v
       |                                |          +------------------------+
       | (Voluntary                     \--------> |       SUSPENDED        |
       |  Cancellation)                            +------------------------+
       v                                                       |
+------------------------+                                     | (Retention expired)
|       CANCELLED        | ------------------------------------+
+------------------------+                                     |
            |                                                  |
            \--------------------------------------------------+
                                        |
                                        v
               +-------------------------------------------------+
               |                    ARCHIVED                     |
               |                (Terminal State)                 |
               +-------------------------------------------------+
```

---

## 2. Seeded Subscription Plans

Washora ships with 3 pre-configured SaaS plans:

### 1. Starter Plan (₹999 / month)
- **Target:** Single-store laundry shops getting started with cloud management.
- **Entitlements:** POS, Customers, Orders, Garment Processing, QC, Basic Staff (max 3), Expenses, Customer Portal, Standard Reports.
- **Limits:** Max 1 Branch, 3 Staff, 500 Customers, 300 Monthly Orders, 50 Products.

### 2. Professional Plan (₹2,499 / month)
- **Target:** Growing multi-branch laundry businesses with pickup/delivery logistics.
- **Entitlements:** All Starter features + Staff Attendance, Automated Payroll, Suppliers, Purchases, Inventory, Route Logistics, WhatsApp Notifications, CRM.
- **Limits:** Max 3 Branches, 15 Staff, 3,000 Customers, 1,500 Monthly Orders, 200 Products, 5,000 WhatsApp Messages.

### 3. Enterprise Plan (₹5,999 / month)
- **Target:** Large-scale commercial laundry chains with central processing units.
- **Entitlements:** All platform features enabled without restriction.
- **Limits:** Max 15 Branches, 100 Staff, 50,000 Customers, 25,000 Monthly Orders, 2,000 Products, 25,000 WhatsApp Messages.

---

## 3. Plan Upgrades & Safe Downgrades

- **Upgrades:** Upgrades apply immediately. All new feature gates unlock on demand (e.g. payroll or WhatsApp routes), and usage quotas expand automatically.
- **Downgrades:** Before applying a downgrade, the system verifies the tenant's active resource counts against the target plan limits:
  - If `activeBranches > targetLimit.MAX_BRANCHES`, `activeStaff > targetLimit.MAX_STAFF`, or `activeCustomers > targetLimit.MAX_CUSTOMERS`, the downgrade is rejected with a descriptive `400 BadRequestException`.
- **Chronological Audit History:** All plan modifications, trial conversions, cancellations, and administrative date overrides create immutable records in `subscription_history` with previous and new states, timestamp, and actor ID.
