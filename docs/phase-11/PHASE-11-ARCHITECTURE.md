# Washora — Phase 11: Advanced Reporting, Analytics & Business Intelligence Architecture

## 1. Executive Summary

Phase 11 introduces a high-performance, multi-tenant Business Intelligence (BI) and reporting system for the Washora laundry management SaaS platform. The architecture transforms operational data across all 10 preceding operational phases (POS, Orders, Garment Lifecycle/QC, Staff/Attendance, Finance, Inventory/Suppliers, Logistics, WhatsApp/Notifications, Customer CRM, and Multi-Tenant SaaS Administration) into actionable, real-time analytics.

---

## 2. Core Architectural Principles

1. **Zero-Scan Direct Queries**: Analytics queries utilize targeted MongoDB aggregation pipelines bounded by `tenantId`, authorized `branchId` scopes, and indexed ISO-8601 UTC timestamp ranges. Dashboard summaries avoid unbounded per-record roundtrips or client-side aggregation.
2. **Context-Enforced Multi-Tenancy**: Tenant context is resolved solely from verified cryptographic JWT credentials (`req.user.tenantId`). Browser-supplied tenant parameters are strictly rejected.
3. **Branch Access RBAC**: Multi-branch operators and cashiers are strictly partitioned to their authorized branch IDs (`req.user.branchIds`). Shop Owners have tenant-wide reporting visibility.
4. **Resilient Zero-State Math**: All metric calculations, averages, ratios, and period-over-period comparisons use guard clauses against empty datasets, zero divisions, or missing collections. Metrics return `0` or `null` gracefully with zero runtime exceptions.
5. **Multi-Channel Data Harmonization**: Orders, payments, processing stages, garments, inventory movements, QC inspections, delivery milestones, and dispatch notifications are integrated across standardized response DTOs.

---

## 3. Module Structure

```text
apps/api/src/modules/reports/
├── controllers/
│   └── reports.controller.ts        # 16 REST endpoints with JWT & RBAC guards
├── services/
│   ├── reports.service.ts           # Business orchestration, caching & comparison deltas
│   ├── reports-query.service.ts     # MongoDB Aggregation Pipelines across 11 domains
│   ├── reports-cache.service.ts     # In-memory tenant/branch/period TTL caching
│   └── reports-export.service.ts    # Streaming CSV report generation & CSV sanitization
├── dto/
│   └── report-filter.dto.ts         # Strictly validated query DTOs (Date presets, branch, IDs)
├── interfaces/
│   └── reports.interface.ts         # Strongly-typed TypeScript BI response contracts
├── utils/
│   └── reports-date.util.ts         # Timezone-aware date preset & period math engine
└── reports.module.ts                # NestJS Module registration & Mongoose model bindings
```

---

## 4. Subsystem Breakdown

### 4.1 ReportsDateUtil (Centralized Date Engine)
Converts human preset ranges (`TODAY`, `YESTERDAY`, `THIS_WEEK`, `LAST_WEEK`, `THIS_MONTH`, `LAST_MONTH`, `THIS_QUARTER`, `LAST_QUARTER`, `THIS_YEAR`, `LAST_YEAR`, `CUSTOM`) into exact UTC date boundaries (`startDate`, `endDate`) along with an equivalent previous comparison period (`prevStartDate`, `prevEndDate`). Calculates period-over-period absolute and percentage deltas with safe handling for zero baselines.

### 4.2 ReportsQueryService (Aggregation Engine)
Contains optimized aggregation pipelines for:
- **Executive Dashboard**: Unified KPIs across revenue, active orders, customer acquisition, net expense, processing throughput, and delivery success rate.
- **Sales Analytics**: Gross revenue, discounts, net sales, taxes, collections, receivables, refunds, AOV, and daily/weekly/monthly revenue breakdowns.
- **Order Lifecycle Analytics**: Status distributions, SLA completion durations, and processing bottlenecks.
- **Customer CRM & Cohort Retention**: New vs. returning splits, lifetime customer spend, RFM segments (New, Returning, High Value, Inactive, At Risk), and monthly cohort retention matrices.
- **Service & Product Performance**: Service volume rankings, product merchandise revenue, category contribution, and garment type distributions.
- **Branch Performance**: Revenue, order count, processing volume, and estimated profit comparisons across all physical branch locations.
- **Payment Analytics**: Payment mode breakdowns (Cash, UPI, Card, Net Banking, Wallet, Online Gateway), collection status, and refund volumes.
- **Finance & P&L**: Operational profit calculations (`Net Revenue - Direct Expenses - Inventory Consumption - Payroll`).
- **Inventory & Valuation**: Current stock valuation (`sum(currentStock * averageCost)`), low-stock warnings, and material movement tracking.
- **Processing Plant & QC**: Stage cycle times (Sorting, Washing, Drying, Ironing, Packing), QC pass/fail rates, and defect categorization.
- **Logistics & Dispatch**: Pickup/delivery completion rates, transit duration, driver workload, and failed attempt analytics.
- **Notification Analytics**: Multi-channel delivery rates across WhatsApp, SMS, Email, and Push notifications.

### 4.3 ReportsCacheService (Tenant-Scoped Cache)
Provides lightweight, in-memory TTL caching for high-frequency dashboard summaries. Cache keys are strictly hashed by `tenantId:branchScope:datePreset:startDate:endDate`, completely preventing cross-tenant or cross-branch data contamination.

### 4.4 ReportsExportService (CSV Export Engine)
Streams RFC-4180 compliant CSV files with formula-injection sanitization (stripping leading `=`, `+`, `-`, `@` characters) for secure consumption in Microsoft Excel and Google Sheets.
