import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { StructuredLoggerService } from '../logging/structured-logger.service';

const CORRELATION_ID_REGEX = /^[a-zA-Z0-9_\-]{1,64}$/;

export interface RequestWithCorrelation extends Request {
  id?: string;
  correlationId?: string;
  startTime?: number;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new StructuredLoggerService('HTTP');

  use(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    req.startTime = Date.now();

    const incomingHeader =
      (req.headers['x-request-id'] as string) ||
      (req.headers['x-correlation-id'] as string);

    let correlationId: string;

    if (incomingHeader && CORRELATION_ID_REGEX.test(incomingHeader.trim())) {
      correlationId = incomingHeader.trim();
    } else {
      correlationId = randomUUID();
    }

    req.id = correlationId;
    req.correlationId = correlationId;

    // Set standard response headers
    res.setHeader('x-request-id', correlationId);
    res.setHeader('x-correlation-id', correlationId);

    // Capture response finish for logging
    res.on('finish', () => {
      const durationMs = req.startTime ? Date.now() - req.startTime : 0;
      const statusCode = res.statusCode;
      const method = req.method;
      const url = req.originalUrl || req.url;

      // Skip noisy health check poll logging in dev if needed
      if (url.startsWith('/api/health') || url.startsWith('/health')) {
        return;
      }

      const logData = {
        requestId: correlationId,
        durationMs,
        statusCode,
        method,
        url,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        tenantId: (req as any).user?.tenantId || req.headers['x-tenant-id'],
        userId: (req as any).user?._id || (req as any).user?.id,
      };

      if (statusCode >= 500) {
        this.logger.error(`${method} ${url} ${statusCode} - ${durationMs}ms`, logData);
      } else if (statusCode >= 400) {
        this.logger.warn(`${method} ${url} ${statusCode} - ${durationMs}ms`, logData);
      } else {
        this.logger.info(`${method} ${url} ${statusCode} - ${durationMs}ms`, logData);
      }
    });

    next();
  }
}
