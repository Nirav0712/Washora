import { Injectable, Logger } from '@nestjs/common';
import {
  BillingProvider,
  CreateCheckoutSessionParams,
  CheckoutSessionResult,
  VerifyPaymentResult,
  WebhookVerificationResult,
} from '../interfaces/billing-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class MockBillingProvider implements BillingProvider {
  private readonly logger = new Logger(MockBillingProvider.name);

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    const sessionId = `cs_mock_${crypto.randomBytes(12).toString('hex')}`;
    return {
      sessionId,
      checkoutUrl: `https://checkout.washora.mock/pay/${sessionId}?invoice=${params.invoiceId}`,
      provider: 'MOCK_GATEWAY',
    };
  }

  async verifyPayment(providerPaymentId: string): Promise<VerifyPaymentResult> {
    return {
      isSuccess: !providerPaymentId.includes('fail'),
      providerPaymentId,
      amount: 2999,
      currency: 'INR',
      paidAt: new Date(),
    };
  }

  async refundPayment(providerPaymentId: string, amount?: number): Promise<{ isSuccess: boolean; refundId: string }> {
    return {
      isSuccess: true,
      refundId: `rfnd_mock_${crypto.randomBytes(8).toString('hex')}`,
    };
  }

  async verifyWebhook(
    headers: Record<string, string>,
    payload: string | Buffer | Record<string, any>,
  ): Promise<WebhookVerificationResult> {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const event = parsed.event || 'payment.success';
    const eventId = parsed.eventId || `evt_${crypto.randomBytes(8).toString('hex')}`;
    const invoiceNumber = parsed.payload?.invoiceNumber || parsed.invoiceNumber;
    const providerPaymentId = parsed.payload?.providerPaymentId || parsed.providerPaymentId || `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
    const amount = parsed.payload?.amount || parsed.amount || 0;

    return {
      isValid: true,
      event,
      eventId,
      invoiceNumber,
      providerPaymentId,
      amount,
      rawPayload: parsed,
    };
  }
}
