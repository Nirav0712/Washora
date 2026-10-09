import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export interface WebhookVerificationResult {
  isValid: boolean;
  isDuplicate: boolean;
  reason?: string;
}

@Injectable()
export class WebhookVerifierService {
  private readonly processedEvents = new Map<string, number>();
  private readonly eventTtlMs = 86400000; // 24 hours

  constructor() {
    // Periodic purge of expired event keys
    setInterval(() => {
      const now = Date.now();
      for (const [key, expiresAt] of this.processedEvents.entries()) {
        if (expiresAt <= now) {
          this.processedEvents.delete(key);
        }
      }
    }, 3600000).unref();
  }

  verifyHmacSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
    algorithm = 'sha256',
  ): boolean {
    if (!payload || !signature || !secret) {
      return false;
    }

    try {
      const hmac = createHmac(algorithm, secret);
      const computed = hmac.update(payload).digest('hex');

      // Strip sha256= prefix if present (e.g. GitHub or WhatsApp webhooks)
      const cleanSig = signature.replace(/^sha256=/i, '').trim();

      if (computed.length !== cleanSig.length) {
        return false;
      }

      const computedBuf = Buffer.from(computed, 'hex');
      const sigBuf = Buffer.from(cleanSig, 'hex');

      return timingSafeEqual(computedBuf, sigBuf);
    } catch {
      return false;
    }
  }

  checkAndRecordIdempotency(
    eventId: string,
    provider: string,
    ttlMs: number = this.eventTtlMs,
  ): boolean {
    if (!eventId) return false;

    const key = `${provider}:${eventId}`;
    const now = Date.now();
    const existing = this.processedEvents.get(key);

    if (existing && existing > now) {
      // Duplicate event
      return false;
    }

    this.processedEvents.set(key, now + ttlMs);
    return true;
  }

  verifyAndProcessEvent(
    payload: string | Buffer,
    signature: string,
    secret: string,
    eventId: string,
    provider: string,
  ): WebhookVerificationResult {
    const isSigValid = this.verifyHmacSignature(payload, signature, secret);
    if (!isSigValid) {
      return {
        isValid: false,
        isDuplicate: false,
        reason: 'INVALID_SIGNATURE',
      };
    }

    const isUnique = this.checkAndRecordIdempotency(eventId, provider);
    if (!isUnique) {
      return {
        isValid: true,
        isDuplicate: true,
        reason: 'DUPLICATE_EVENT',
      };
    }

    return {
      isValid: true,
      isDuplicate: false,
    };
  }

  clearEvents() {
    this.processedEvents.clear();
  }
}
