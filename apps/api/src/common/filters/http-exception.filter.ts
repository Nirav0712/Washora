import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StructuredLoggerService, redactSensitiveData } from '../logging/structured-logger.service';

export interface PublicErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
  path: string;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new StructuredLoggerService(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string; correlationId?: string }>();

    const requestId = request.id || request.correlationId || (request.headers['x-request-id'] as string) || 'unknown-req';
    const path = request.originalUrl || request.url;
    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected internal error occurred';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorCode = this.statusToCode(status);
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        message = obj.message || obj.error || message;
        errorCode = obj.code || obj.error || this.statusToCode(status);
        details = obj.details || (Array.isArray(obj.message) ? obj.message : null);

        if (Array.isArray(obj.message)) {
          message = obj.message.join(', ');
        }
      }
    } else if (exception instanceof Error) {
      const errName = (exception as any).name;
      const errMsg = exception.message || '';

      // MongoDB CastError / BSONError (Invalid ObjectId)
      if (
        errName === 'CastError' ||
        errName === 'BSONError' ||
        errName === 'BSONTypeError' ||
        (exception as any).kind === 'ObjectId' ||
        errMsg.includes('24 character hex string')
      ) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'INVALID_ID_FORMAT';
        message = 'Invalid record identifier format provided.';
      }
      // MongoDB Duplicate Key Error (code 11000)
      else if ((exception as any).code === 11000) {
        status = HttpStatus.CONFLICT;
        errorCode = 'DUPLICATE_KEY';
        const keyPattern = (exception as any).keyPattern;
        const key = keyPattern ? Object.keys(keyPattern).join(', ') : 'field';
        message = `A record with this ${key} already exists.`;
      } else {
        // Unexpected / unhandled internal exception
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'INTERNAL_SERVER_ERROR';
        
        // Log unexpected error with stack trace and correlation context
        this.logger.error(`Unhandled Exception on ${request.method} ${path}: ${exception.message}`, {
          requestId,
          path,
          method: request.method,
          stack: exception.stack,
          exceptionName: exception.name,
        });

        message = isProduction ? 'Internal server error' : exception.message;
      }
    }

    const normalizedCode = typeof errorCode === 'string' ? errorCode.toUpperCase().replace(/\s+/g, '_') : 'ERROR';
    const normalizedMessage = typeof message === 'string' ? message : 'An error occurred';

    const errorPayload: PublicErrorResponse = {
      success: false,
      statusCode: status,
      code: normalizedCode,
      message: normalizedMessage,
      requestId,
      timestamp: new Date().toISOString(),
      path,
      error: {
        code: normalizedCode,
        message: normalizedMessage,
        ...(details ? { details: redactSensitiveData(details) } : {}),
      },
    };

    response.status(status).json(errorPayload);
  }

  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
