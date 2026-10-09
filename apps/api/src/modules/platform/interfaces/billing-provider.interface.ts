export interface CreateCheckoutSessionParams {
  tenantId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
}

export interface VerifyPaymentResult {
  isSuccess: boolean;
  providerPaymentId: string;
  amount: number;
  currency: string;
  paidAt?: Date;
  rawResponse?: Record<string, any>;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event: string;
  eventId: string;
  invoiceNumber?: string;
  providerPaymentId?: string;
  amount?: number;
  rawPayload: Record<string, any>;
}

export interface BillingProvider {
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult>;
  verifyPayment(providerPaymentId: string): Promise<VerifyPaymentResult>;
  refundPayment(providerPaymentId: string, amount?: number): Promise<{ isSuccess: boolean; refundId: string }>;
  verifyWebhook(headers: Record<string, string>, rawBody: string | Buffer | Record<string, any>): Promise<WebhookVerificationResult>;
}
