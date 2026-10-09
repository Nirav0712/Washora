# Washora Phase 12 — Database Reliability & Index Audit

## 1. MongoDB Connection Pool & Resilience Configuration

The MongoDB Atlas client connection in `DatabaseModule` is tuned for managed Node.js hosting environments (Hostinger):

```typescript
{
  uri: process.env.MONGODB_URI,
  maxPoolSize: 50,              // Bounds maximum concurrent connections to Atlas tier limits
  minPoolSize: 2,               // Keeps warm connections ready
  maxIdleTimeMS: 30000,         // Closes idle connections after 30s
  serverSelectionTimeoutMS: 10000, // Prevents indefinite server hang during network split
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true             // Built-in write retry for transient replica set stepdowns
}
```

---

## 2. Schema Index Audit & Duplicate Elimination

During Phase 12 auditing, duplicate index warnings were identified and resolved across the schema layer:

| Schema | Issue Identified | Resolution Applied |
|---|---|---|
| `user.schema.ts` | Duplicate index on `email` | Removed redundant `index: true` from `@Prop()`; retained explicit unique compound index |
| `tenant.schema.ts` | Duplicate index on `slug` | Removed redundant `index: true` from `@Prop()`; retained explicit unique index |
| `billing-invoice.schema.ts` | Duplicate unique on `invoiceNumber` | Removed `@Prop({ unique: true })`; retained schema compound index |
| `billing-payment.schema.ts` | Duplicate unique on `paymentNumber` | Removed `@Prop({ unique: true })`; retained schema compound index |
| `subscription-plan.schema.ts`| Duplicate unique on `slug` | Removed `@Prop({ unique: true })`; retained schema index |
| `platform-admin.schema.ts` | Duplicate unique on `email` | Removed `@Prop({ unique: true })`; retained schema index |
| `customer-account.schema.ts`| Redundant `index: true` on `tenantId` | Removed single-field index covered by compound `{ tenantId: 1, phone: 1 }` |
| `delivery-request.schema.ts`| 8 redundant single-field indexes | Removed single property indexes covered by compound query indexes |
| `pickup-request.schema.ts` | 8 redundant single-field indexes | Removed single property indexes covered by compound query indexes |
| `order.schema.ts` | Redundant index on `trackingTokenHash` | Retained explicit sparse index `{ trackingTokenHash: 1 }` |

---

## 3. Critical Query Indexes

Every business query is guaranteed an optimal compound index prefix:
- Orders: `{ tenantId: 1, orderNumber: 1 }` (unique), `{ tenantId: 1, branchId: 1, status: 1 }`, `{ tenantId: 1, createdAt: -1 }`
- Customers: `{ tenantId: 1, phone: 1 }` (unique), `{ tenantId: 1, name: 1 }`
- Logistics: `{ tenantId: 1, pickupNumber: 1 }`, `{ tenantId: 1, branchId: 1, scheduledDate: -1 }`
- Invoices: `{ tenantId: 1, createdAt: -1 }`, `{ invoiceNumber: 1 }` (unique)
- Notifications: `{ tenantId: 1, idempotencyKey: 1 }` (unique, sparse), `{ tenantId: 1, createdAt: -1 }`
