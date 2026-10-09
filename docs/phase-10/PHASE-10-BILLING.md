# Washora — Phase 10 SaaS Billing & Invoicing Architecture

This document describes the platform billing engine, invoice generation, sequence numbering, and payment gateway abstraction.

---

## 1. Platform Invoicing & Numbering Standards

To eliminate any ambiguity between customer laundry receipts and B2B SaaS platform charges, Phase 10 uses dedicated atomic counter sequences:

| Entity | Counter Sequence Name | Format Example | Schema Collection |
| :--- | :--- | :--- | :--- |
| **SaaS Billing Invoice** | `PLATFORM_BILLING_INVOICE` | `SINV-000001` | `billing_invoices` |
| **SaaS Billing Payment** | `PLATFORM_BILLING_PAYMENT` | `SPAY-000001` | `billing_payments` |
| **Shop Laundry POS Payment** | `PAYMENT` | `PAY-000001` | `payments` |
| **Shop Laundry Order** | `ORDER` | `ORD-000001` | `orders` |

---

## 2. Gateway Abstraction Layer (`BillingProvider`)

The platform billing engine interacts with payment gateways via a unified TypeScript interface:

```typescript
export interface BillingProvider {
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult>;
  verifyPayment(providerPaymentId: string): Promise<VerifyPaymentResult>;
  refundPayment(providerPaymentId: string, amount?: number): Promise<{ isSuccess: boolean; refundId: string }>;
  verifyWebhook(headers: Record<string, string>, payload: any): Promise<WebhookVerificationResult>;
}
```

- **Mock Implementation (`MockBillingProvider`):** Used in development, CI, and test automation without requiring real API keys.
- **Pluggable Integration:** Future Razorpay/Stripe implementations can be swapped in by binding the provider token in NestJS dependency injection.

---

## 3. Webhook Idempotency & Duplicate Protection

```
                                  Incoming Webhook
                                         |
                                         v
                      +-------------------------------------+
                      |    Has eventId been processed?      |
                      +-------------------------------------+
                                     /       \
                              [Yes] /         \ [No]
                                   v           v
           +-------------------------------+  +--------------------------------+
           | Return 200 OK                 |  | Verify webhook signature & payload |
           | { isDuplicate: true }         |  +--------------------------------+
           | (Ignore without duplicate pay)|                  |
           +-------------------------------+                  v
                                              +--------------------------------+
                                              | Find Invoice by invoiceNumber  |
                                              | Create BillingPayment (SPAY)   |
                                              | Update Invoice -> PAID         |
                                              | Activate Subscription          |
                                              | Cache eventId in Set/Store     |
                                              +--------------------------------+
```

1. Every incoming webhook requires an `eventId`.
2. The `SaasBillingService` checks an in-memory/persistent set of processed event IDs.
3. If an event is re-delivered, the engine safely returns `{ success: true, isDuplicate: true }` without generating duplicate payments or ledger entries.
