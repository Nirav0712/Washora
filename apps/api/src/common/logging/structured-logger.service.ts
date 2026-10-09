import { Injectable, LoggerService, Scope, Optional } from '@nestjs/common';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'jwt_secret',
  'jwt_access_secret',
  'jwt_refresh_secret',
  'authorization',
  'auth',
  'otp',
  'otpcode',
  'otpcodehash',
  'apikey',
  'api_key',
  'privatekey',
  'private_key',
  'secretkey',
  'secret_key',
  'creditcard',
  'cardnumber',
  'cvv',
  'cvc',
  'pin',
  'mongodb_uri',
  'database_uri',
  'uri',
  'connectionstring',
  'whatsapp_api_key',
  'razorpay_key_secret',
  'stripe_secret_key',
  'cloudinary_api_secret',
]);

export function redactSensitiveData(data: any, depth = 0): any {
  if (data === null || data === undefined) return data;
  if (depth > 6) return '[MAX_DEPTH_REACHED]';

  if (typeof data === 'string') {
    // Redact Bearer tokens if present in raw strings
    if (/bearer\s+[a-zA-Z0-9_\-\.]+/i.test(data)) {
      return data.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
    }
    // Redact MongoDB connection strings if present
    if (/mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@/i.test(data)) {
      return data.replace(/(mongodb(?:\+srv)?:\/\/)[^:]+:[^@]+@/gi, '$1[REDACTED_AUTH]@');
    }
    return data;
  }

  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  // If Error instance
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : data.stack,
    };
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');
    let isSensitive = SENSITIVE_KEYS.has(lowerKey);

    if (!isSensitive) {
      for (const sensitive of SENSITIVE_KEYS) {
        if (lowerKey.includes(sensitive)) {
          isSensitive = true;
          break;
        }
      }
    }

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = redactSensitiveData(val, depth + 1);
    }
  }

  return sanitized;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  context?: string;
  message: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  durationMs?: number;
  error?: any;
  metadata?: Record<string, any>;
  env: string;
}

@Injectable({ scope: Scope.DEFAULT })
export class StructuredLoggerService implements LoggerService {
  private serviceName = 'washora-api';
  private env = process.env.NODE_ENV || 'development';
  private isProduction = this.env === 'production';
  private context?: string;

  constructor(@Optional() context?: string) {
    if (context) {
      this.context = context;
    }
  }

  setContext(context: string) {
    this.context = context;
  }

  private writeLog(
    level: LogLevel,
    message: any,
    contextOrMeta?: string | Record<string, any>,
    errorOrStack?: any,
  ) {
    let ctx = this.context;
    let meta: Record<string, any> | undefined;
    let err: any = undefined;

    if (typeof contextOrMeta === 'string') {
      ctx = contextOrMeta;
    } else if (typeof contextOrMeta === 'object' && contextOrMeta !== null) {
      meta = contextOrMeta;
    }

    if (errorOrStack) {
      err = errorOrStack;
    }

    const sanitizedMessage = typeof message === 'string' ? redactSensitiveData(message) : redactSensitiveData(message);
    const sanitizedMeta = meta ? redactSensitiveData(meta) : undefined;
    const sanitizedErr = err ? redactSensitiveData(err) : undefined;

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      context: ctx,
      message: typeof sanitizedMessage === 'string' ? sanitizedMessage : JSON.stringify(sanitizedMessage),
      requestId: sanitizedMeta?.requestId,
      tenantId: sanitizedMeta?.tenantId,
      userId: sanitizedMeta?.userId,
      durationMs: sanitizedMeta?.durationMs,
      error: sanitizedErr,
      metadata: sanitizedMeta,
      env: this.env,
    };

    if (this.isProduction) {
      // JSON log for production
      const jsonOutput = JSON.stringify(entry);
      if (level === 'error' || level === 'fatal') {
        process.stderr.write(jsonOutput + '\n');
      } else {
        process.stdout.write(jsonOutput + '\n');
      }
    } else {
      // Readable format for development
      const formattedContext = ctx ? `[${ctx}] ` : '';
      const reqInfo = entry.requestId ? `(req:${entry.requestId}) ` : '';
      const formattedMsg = typeof message === 'object' ? JSON.stringify(sanitizedMessage, null, 2) : sanitizedMessage;
      const formattedLog = `[${entry.timestamp}] ${level.toUpperCase().padEnd(5)} ${formattedContext}${reqInfo}${formattedMsg}`;
      
      if (level === 'error' || level === 'fatal') {
        // eslint-disable-next-line no-console
        console.error(formattedLog, sanitizedErr || '');
      } else if (level === 'warn') {
        // eslint-disable-next-line no-console
        console.warn(formattedLog);
      } else {
        // eslint-disable-next-line no-console
        console.log(formattedLog);
      }
    }
  }

  log(message: any, contextOrMeta?: string | Record<string, any>) {
    this.writeLog('info', message, contextOrMeta);
  }

  info(message: any, contextOrMeta?: string | Record<string, any>) {
    this.writeLog('info', message, contextOrMeta);
  }

  error(message: any, traceOrMeta?: any, context?: string) {
    if (typeof traceOrMeta === 'string' && !context) {
      this.writeLog('error', message, context, traceOrMeta);
    } else {
      this.writeLog('error', message, context || (typeof traceOrMeta === 'object' ? traceOrMeta : undefined), traceOrMeta);
    }
  }

  warn(message: any, contextOrMeta?: string | Record<string, any>) {
    this.writeLog('warn', message, contextOrMeta);
  }

  debug(message: any, contextOrMeta?: string | Record<string, any>) {
    this.writeLog('debug', message, contextOrMeta);
  }

  fatal(message: any, traceOrMeta?: any, context?: string) {
    this.writeLog('fatal', message, context, traceOrMeta);
  }
}
