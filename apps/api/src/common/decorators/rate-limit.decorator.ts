import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  ttlMs?: number; // Time window in milliseconds (default 60000ms = 1m)
  limit?: number; // Max requests per window (default 60)
  keyPrefix?: string;
}

export const RATE_LIMIT_KEY = 'RATE_LIMIT_OPTIONS';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
