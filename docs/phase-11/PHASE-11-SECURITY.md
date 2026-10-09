# Washora — Phase 11: Security & Multi-Tenant Isolation

## 1. Multi-Tenant Cryptographic Boundaries

```text
Incoming HTTP Request
       │
       ▼
[JwtAuthGuard] ─── Validates Cryptographic Signature & Expiry
       │
       ▼
[Extract JWT User] ─── Extract verified tenantId & authorized branchIds
       │
       ▼
[Resolve Tenant Context] ─── Reject client-provided tenant parameters with 400
       │
       ▼
[Branch Access Guard] ─── Check branchId against req.user.branchIds (403 if unauthorized)
       │
       ▼
[Reports Aggregation] ─── Pipeline forces $match: { tenantId: req.user.tenantId, branchId: ... }
```

### 1.1 Strict Isolation Invariants
1. **Never Trust Query Params for Tenant**: Query parameters like `?tenantId=...` are actively rejected by NestJS `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
2. **Context Resolution**: The database query strictly matches `tenantId: new Types.ObjectId(req.user.tenantId)`. Cross-tenant data leaks are physically impossible at the query boundary.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Role | Dashboard | Sales & Orders | Customers | Finance & P&L | Inventory | Plant & QC | Logistics | Export CSV |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SHOP_OWNER** | Full Tenant | Full Tenant | Full Tenant | Full Tenant | Full Tenant | Full Tenant | Full Tenant | Yes |
| **BRANCH_MANAGER** | Branch Only | Branch Only | Branch Only | Branch Only | Branch Only | Branch Only | Branch Only | Yes (Branch) |
| **CASHIER** | Restricted | Branch Sales | View Only | Forbidden | View Only | Forbidden | Forbidden | Forbidden |
| **OPERATOR** | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Branch Plant | Forbidden | Forbidden |
| **QC_INSPECTOR** | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Branch QC | Forbidden | Forbidden |
| **DELIVERY_AGENT** | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Forbidden | Assigned Only | Forbidden |

---

## 3. CSV Injection & Export Protection

When generating CSV reports for download:
- Cell values starting with dangerous formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) are sanitized by prepending a single quote `'` to neutralize formula execution in Microsoft Excel, LibreOffice, and Google Sheets.
- Export endpoints require identical authentication and permission verification (`REPORT_VIEW` / `REPORT_EXPORT`) as interactive JSON endpoints.
