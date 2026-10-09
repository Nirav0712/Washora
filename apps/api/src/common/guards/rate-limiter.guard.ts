import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly storage = new Map<string, RateLimitRecord>();
  private readonly defaultTtlMs = 60000; // 1 minute
  private readonly defaultLimit = 100; // 100 requests per minute default

  constructor(private readonly reflector: Reflector = new Reflector()) {
    // Periodic cleanup of expired records every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.storage.entries()) {
        if (record.resetTime <= now) {
          this.storage.delete(key);
        }
      }
    }, 300000).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route does not define explicit rate limit and no global enforcement needed, pass through
    if (!rateLimitOptions) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const ttlMs = rateLimitOptions.ttlMs || this.defaultTtlMs;
    const limit = rateLimitOptions.limit || this.defaultLimit;
    const prefix = rateLimitOptions.keyPrefix || 'rl';

    // Derive safe client identifier: IP address or user ID
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userId = (req as any).user?._id || (req as any).user?.id || '';
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    const key = `${prefix}:${context.getClass().name}:${context.getHandler().name}:${identifier}`;

    const now = Date.now();
    let record = this.storage.get(key);

    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + ttlMs,
      };
      this.storage.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, limit - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > limit) {
      res.setHeader('Retry-After', retryAfterSeconds);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'TOO_MANY_REQUESTS',
          message: `Too many requests. Please try again after ${retryAfterSeconds} seconds.`,
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  // Helper method for testing reset
  reset() {
    this.storage.clear();
  }
}
