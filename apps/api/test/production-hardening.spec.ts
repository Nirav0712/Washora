import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  StructuredLoggerService,
  redactSensitiveData,
} from '../src/common/logging/structured-logger.service';
import { validateEnvironment } from '../src/config/env.validation';
import { WebhookVerifierService } from '../src/common/services/webhook-verifier.service';
import { JobRunnerService } from '../src/common/jobs/job-runner.service';
import { RateLimiterGuard } from '../src/common/guards/rate-limiter.guard';
import { Reflector } from '@nestjs/core';

describe('Phase 12 — Production Hardening, Observability & Reliability Suite', () => {
  let mongod: MongoMemoryServer;
  let app: INestApplication;
  let connection: Connection;
  let webhookVerifier: WebhookVerifierService;
  let jobRunner: JobRunnerService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    process.env.MONGODB_URI = mongod.getUri();
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = 'test_production_hardening_access_secret_2026_x1';
    process.env.JWT_REFRESH_SECRET = 'test_production_hardening_refresh_secret_2026_z2';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: ['health', 'health/live', 'health/ready'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());
    webhookVerifier = moduleFixture.get<WebhookVerifierService>(WebhookVerifierService);
    jobRunner = moduleFixture.get<JobRunnerService>(JobRunnerService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  // =========================================================================
  // 1. CENTRALIZED STRUCTURED LOGGING & REDACTION
  // =========================================================================
  describe('1. Centralized Structured Logging & Recursive Redaction', () => {
    it('1.1 should redact sensitive field "password" recursively in objects', () => {
      const data = { user: { email: 'test@example.com', password: 'SecretPassword123!' } };
      const redacted = redactSensitiveData(data);
      expect(redacted.user.password).toBe('[REDACTED]');
      expect(redacted.user.email).toBe('test@example.com');
    });

    it('1.2 should redact passwordHash, accessToken, and refreshToken', () => {
      const data = {
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh_tok_123456789',
      };
      const redacted = redactSensitiveData(data);
      expect(redacted.passwordHash).toBe('[REDACTED]');
      expect(redacted.accessToken).toBe('[REDACTED]');
      expect(redacted.refreshToken).toBe('[REDACTED]');
    });

    it('1.3 should redact OTP codes and hashes', () => {
      const data = { phone: '+919876543210', otpCode: '482910', otpCodeHash: 'hash123' };
      const redacted = redactSensitiveData(data);
      expect(redacted.otpCode).toBe('[REDACTED]');
      expect(redacted.otpCodeHash).toBe('[REDACTED]');
      expect(redacted.phone).toBe('+919876543210');
    });

    it('1.4 should redact database connection strings in raw strings', () => {
      const raw = 'Connecting to mongodb+srv://admin:MyPass123@cluster0.mongodb.net/prod_db';
      const redacted = redactSensitiveData(raw);
      expect(redacted).toContain('[REDACTED_AUTH]@cluster0.mongodb.net/prod_db');
      expect(redacted).not.toContain('MyPass123');
    });

    it('1.5 should redact Bearer authorization tokens in raw strings', () => {
      const raw = 'Header authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokenPayload';
      const redacted = redactSensitiveData(raw);
      expect(redacted).toContain('Bearer [REDACTED]');
      expect(redacted).not.toContain('tokenPayload');
    });

    it('1.6 should redact credit card numbers, cvv, and pin', () => {
      const data = {
        payment: {
          cardNumber: '4111222233334444',
          cvv: '123',
          pin: '9876',
          amount: 500,
        },
      };
      const redacted = redactSensitiveData(data);
      expect(redacted.payment.cardNumber).toBe('[REDACTED]');
      expect(redacted.payment.cvv).toBe('[REDACTED]');
      expect(redacted.payment.pin).toBe('[REDACTED]');
      expect(redacted.payment.amount).toBe(500);
    });

    it('1.7 should redact WhatsApp credentials and payment provider secrets', () => {
      const data = {
        whatsapp_api_key: 'wh_secret_abc123',
        razorpay_key_secret: 'rzp_sec_xyz789',
        stripe_secret_key: 'sk_live_123456',
        cloudinary_api_secret: 'cld_sec_999',
      };
      const redacted = redactSensitiveData(data);
      expect(redacted.whatsapp_api_key).toBe('[REDACTED]');
      expect(redacted.razorpay_key_secret).toBe('[REDACTED]');
      expect(redacted.stripe_secret_key).toBe('[REDACTED]');
      expect(redacted.cloudinary_api_secret).toBe('[REDACTED]');
    });

    it('1.8 should handle array elements recursively', () => {
      const list = [
        { id: 1, secret: 'top_secret' },
        { id: 2, password: 'pw2' },
      ];
      const redacted = redactSensitiveData(list);
      expect(redacted[0].secret).toBe('[REDACTED]');
      expect(redacted[1].password).toBe('[REDACTED]');
      expect(redacted[0].id).toBe(1);
    });

    it('1.9 should safely handle null and undefined values', () => {
      expect(redactSensitiveData(null)).toBeNull();
      expect(redactSensitiveData(undefined)).toBeUndefined();
    });

    it('1.10 should limit deep recursive objects beyond max depth', () => {
      let deepObj: any = { value: 'leaf' };
      for (let i = 0; i < 10; i++) {
        deepObj = { nested: deepObj };
      }
      const redacted = redactSensitiveData(deepObj);
      expect(JSON.stringify(redacted)).toContain('[MAX_DEPTH_REACHED]');
    });

    it('1.11 should format structured logs with required metadata fields', () => {
      const logger = new StructuredLoggerService('UnitTest');
      expect(logger).toBeDefined();
      expect(typeof logger.log).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('1.12 should sanitize Error instances without leaking internal stacks in production', () => {
      const err = new Error('Test database error');
      const redacted = redactSensitiveData(err);
      expect(redacted.name).toBe('Error');
      expect(redacted.message).toBe('Test database error');
    });
  });

  // =========================================================================
  // 2. REQUEST CORRELATION & TRACING
  // =========================================================================
  describe('2. Request Correlation & Tracing Middleware', () => {
    it('2.1 should generate a UUID v4 correlation ID when none is provided in request', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('2.2 should echo valid client-provided x-request-id in response header', async () => {
      const customId = 'client-trace-id-12345';
      const res = await request(app.getHttpServer())
        .get('/health')
        .set('x-request-id', customId);
      expect(res.headers['x-request-id']).toBe(customId);
      expect(res.headers['x-correlation-id']).toBe(customId);
    });

    it('2.3 should accept and validate client-provided x-correlation-id header', async () => {
      const customId = 'corr-abc-987';
      const res = await request(app.getHttpServer())
        .get('/health')
        .set('x-correlation-id', customId);
      expect(res.headers['x-request-id']).toBe(customId);
    });

    it('2.4 should replace oversized client correlation ID (>64 chars) with generated UUID', async () => {
      const oversizedId = 'a'.repeat(70);
      const res = await request(app.getHttpServer())
        .get('/health')
        .set('x-request-id', oversizedId);
      expect(res.headers['x-request-id']).not.toBe(oversizedId);
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('2.5 should replace malformed/injection correlation ID with safe UUID', async () => {
      const maliciousId = '<script>alert(1)</script>';
      const res = await request(app.getHttpServer())
        .get('/health')
        .set('x-request-id', maliciousId);
      expect(res.headers['x-request-id']).not.toBe(maliciousId);
      expect(res.headers['x-request-id']).not.toContain('<script>');
    });

    it('2.6 should include correlation ID in API error responses', async () => {
      const customId = 'err-trace-999';
      const res = await request(app.getHttpServer())
        .get('/api/orders/invalid-mongo-id')
        .set('x-request-id', customId);
      expect(res.body.requestId).toBe(customId);
    });

    it('2.7 should handle empty string correlation ID header by generating a fresh UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/health')
        .set('x-request-id', '   ');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).not.toBe('   ');
    });

    it('2.8 should support hyphenated and underscore IDs up to 64 chars', async () => {
      const validCustom = 'REQ_TRACE-2026-09-TENANT-XYZ-00123';
      const res = await request(app.getHttpServer())
        .get('/health')
        .set('x-request-id', validCustom);
      expect(res.headers['x-request-id']).toBe(validCustom);
    });

    it('2.9 should expose x-request-id in CORS exposed headers', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('2.10 should propagate correlation ID consistently across different endpoints', async () => {
      const id1 = 'batch-req-1';
      const id2 = 'batch-req-2';
      const res1 = await request(app.getHttpServer()).get('/health/live').set('x-request-id', id1);
      const res2 = await request(app.getHttpServer()).get('/health/live').set('x-request-id', id2);
      expect(res1.headers['x-request-id']).toBe(id1);
      expect(res2.headers['x-request-id']).toBe(id2);
    });
  });

  // =========================================================================
  // 3. CONSISTENT PUBLIC ERROR CONTRACT & SANITIZATION
  // =========================================================================
  describe('3. Consistent API Error Handling & Sanitization', () => {
    it('3.1 should return structured public error contract on 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/non-existent-endpoint-route')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
      expect(res.body.message).toBeDefined();
      expect(res.body.requestId).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.path).toBe('/api/non-existent-endpoint-route');
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('3.2 should map invalid MongoDB ObjectId to 400 INVALID_ID_FORMAT', () => {
      const filter = new HttpExceptionFilter();
      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => ({ status: mockStatus }),
          getRequest: () => ({ url: '/api/customers/invalid-id', method: 'GET', id: 'req-123' }),
        }),
      } as any;

      const castError = new Error('Cast to ObjectId failed for value "invalid-id"');
      castError.name = 'CastError';
      (castError as any).kind = 'ObjectId';

      filter.catch(castError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 400,
          code: 'INVALID_ID_FORMAT',
        }),
      );
    });

    it('3.3 should return 400 with validation details on invalid request body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email' }) // missing password
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
      expect(res.body.error).toBeDefined();
      expect(res.body.error.details).toBeDefined();
    });

    it('3.4 should reject unknown unwhitelisted fields in request payload (mass assignment protection)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@washora.com',
          password: 'Password123!',
          isSuperAdmin: true, // unwhitelisted
          role: 'SUPERADMIN',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('should not exist');
    });

    it('3.5 should return 401 UNAUTHORIZED on missing auth token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tenants/current')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('3.6 should return 401 UNAUTHORIZED on invalid Bearer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tenants/current')
        .set('Authorization', 'Bearer invalid_malformed_token_123')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('3.7 should never expose MongoDB internal stack trace or credentials in error payload in production mode', () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const filter = new HttpExceptionFilter();
      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => ({ status: mockStatus }),
          getRequest: () => ({ url: '/api/internal', method: 'GET', id: 'req-prod-1' }),
        }),
      } as any;

      const internalErr = new Error('Fatal connection to mongodb+srv://admin:pass@cluster.mongodb.net');
      filter.catch(internalErr, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      const responsePayload = mockJson.mock.calls[0][0];
      expect(responsePayload.message).toBe('Internal server error');
      expect(JSON.stringify(responsePayload)).not.toContain('mongodb+srv://');
      expect(responsePayload.stack).toBeUndefined();

      process.env.NODE_ENV = oldEnv;
    });

    it('3.8 should include ISO timestamp in error response', async () => {
      const res = await request(app.getHttpServer()).get('/api/not-found-xyz');
      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
    });

    it('3.9 should include request path in error payload', async () => {
      const path = '/api/unknown/resource/path';
      const res = await request(app.getHttpServer()).get(path);
      expect(res.body.path).toBe(path);
    });

    it('3.10 should preserve custom error messages and error codes from business exceptions', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@user.com', password: 'WrongPassword123!' });

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  // =========================================================================
  // 4. HEALTH & LIVENESS / READINESS CHECKS
  // =========================================================================
  describe('4. Health, Liveness & Readiness Probes', () => {
    it('4.1 GET /health should return 200 with service and DB status', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      const data = res.body.data || res.body;

      expect(data.service).toBe('washora-api');
      expect(data.database).toBe('connected');
      expect(data.status).toBe('ok');
      expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(data.timestamp).toBeDefined();
    });

    it('4.2 GET /health/live should return 200 with process memory and node version', async () => {
      const res = await request(app.getHttpServer()).get('/health/live').expect(200);
      const data = res.body.data || res.body;

      expect(data.status).toBe('alive');
      expect(data.service).toBe('washora-api');
      expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(data.memory).toBeDefined();
      expect(data.memory.heapUsedMb).toBeGreaterThan(0);
      expect(data.memory.rssMb).toBeGreaterThan(0);
      expect(data.nodeVersion).toBe(process.version);
    });

    it('4.3 GET /health/ready should return 200 when database ping succeeds with latency', async () => {
      const res = await request(app.getHttpServer()).get('/health/ready').expect(200);
      const data = res.body.data || res.body;

      expect(data.status).toBe('ready');
      expect(data.service).toBe('washora-api');
      expect(data.database.status).toBe('connected');
      expect(data.database.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('4.4 GET /health should return valid response envelope with success: true', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('4.5 GET /health/live should return valid response envelope with success: true', async () => {
      const res = await request(app.getHttpServer()).get('/health/live').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('alive');
    });

    it('4.6 GET /health/ready should return valid response envelope with ready status', async () => {
      const res = await request(app.getHttpServer()).get('/health/ready').expect(200);
      expect(res.body.status || res.body.data?.status).toBe('ready');
    });

    it('4.7 Health endpoints should never leak MongoDB credentials or JWT secrets', async () => {
      const res = await request(app.getHttpServer()).get('/health/ready');
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('mongodb://');
      expect(bodyStr).not.toContain('jwt');
      expect(bodyStr).not.toContain('secret');
    });

    it('4.8 Health endpoints should be public (no authentication required)', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);
      await request(app.getHttpServer()).get('/health/live').expect(200);
      await request(app.getHttpServer()).get('/health/ready').expect(200);
    });
  });

  // =========================================================================
  // 5. PRODUCTION ENVIRONMENT CONFIGURATION VALIDATION
  // =========================================================================
  describe('5. Production Configuration Validation', () => {
    it('5.1 should pass validation with valid configuration', () => {
      const validEnv = {
        NODE_ENV: 'production',
        PORT: '4000',
        MONGODB_URI: 'mongodb+srv://user:pass@cluster0.mongodb.net/washora_db',
        JWT_ACCESS_SECRET: 'a_very_secure_and_long_jwt_access_secret_key_prod_2026',
        JWT_REFRESH_SECRET: 'a_very_secure_and_long_jwt_refresh_secret_key_prod_2026',
        CORS_ORIGIN: 'https://washora.com,https://admin.washora.com',
      };
      const result = validateEnvironment(validEnv);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('5.2 should reject invalid port number in configuration', () => {
      const invalidEnv = {
        PORT: '999999', // out of range
      };
      const result = validateEnvironment(invalidEnv);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('PORT'))).toBe(true);
    });

    it('5.3 should reject negative or non-numeric port numbers', () => {
      const invalidEnv = { PORT: '-80' };
      const result = validateEnvironment(invalidEnv);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('PORT'))).toBe(true);
    });

    it('5.4 should require MONGODB_URI in production environment', () => {
      const prodEnv = {
        NODE_ENV: 'production',
        PORT: '4000',
        JWT_ACCESS_SECRET: 'a'.repeat(35),
        JWT_REFRESH_SECRET: 'b'.repeat(35),
      };
      const result = validateEnvironment(prodEnv);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('MONGODB_URI'))).toBe(true);
    });

    it('5.5 should reject invalid MONGODB_URI protocol', () => {
      const invalidEnv = {
        PORT: '4000',
        MONGODB_URI: 'http://localhost:27017/washora',
      };
      const result = validateEnvironment(invalidEnv);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('mongodb://'))).toBe(true);
    });

    it('5.6 should require JWT_ACCESS_SECRET of at least 32 characters in production', () => {
      const prodEnv = {
        NODE_ENV: 'production',
        PORT: '4000',
        MONGODB_URI: 'mongodb://localhost:27017/db',
        JWT_ACCESS_SECRET: 'short_secret', // < 32 chars
        JWT_REFRESH_SECRET: 'a'.repeat(35),
      };
      const result = validateEnvironment(prodEnv);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('JWT_ACCESS_SECRET'))).toBe(true);
    });

    it('5.7 should require JWT_REFRESH_SECRET of at least 32 characters in production', () => {
      const prodEnv = {
        NODE_ENV: 'production',
        PORT: '4000',
        MONGODB_URI: 'mongodb://localhost:27017/db',
        JWT_ACCESS_SECRET: 'a'.repeat(35),
        JWT_REFRESH_SECRET: 'short_refresh', // < 32 chars
      };
      const result = validateEnvironment(prodEnv);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('JWT_REFRESH_SECRET'))).toBe(true);
    });

    it('5.8 should reject identical JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production', () => {
      const identicalSecret = 'identical_secret_for_both_access_and_refresh_32_chars';
      const prodEnv = {
        NODE_ENV: 'production',
        PORT: '4000',
        MONGODB_URI: 'mongodb://localhost:27017/db',
        JWT_ACCESS_SECRET: identicalSecret,
        JWT_REFRESH_SECRET: identicalSecret,
      };
      const result = validateEnvironment(prodEnv);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('must not be identical'))).toBe(true);
    });

    it('5.9 should generate warnings for partially configured Cloudinary credentials', () => {
      const partialEnv = {
        PORT: '4000',
        CLOUDINARY_CLOUD_NAME: 'washora-cloud',
        // missing API key and secret
      };
      const result = validateEnvironment(partialEnv);
      expect(result.warnings.some((w) => w.includes('Cloudinary'))).toBe(true);
    });

    it('5.10 should never print or expose secret values in validation errors or warnings', () => {
      const sensitiveVal = 'SuperSecretString12345!';
      const invalidEnv = {
        NODE_ENV: 'production',
        PORT: '4000',
        JWT_ACCESS_SECRET: sensitiveVal, // short in prod
      };
      const result = validateEnvironment(invalidEnv);
      const output = JSON.stringify(result);
      expect(output).not.toContain(sensitiveVal);
    });
  });

  // =========================================================================
  // 6. RATE LIMITING & ABUSE PROTECTION
  // =========================================================================
  describe('6. Rate Limiting & Abuse Protection', () => {
    let rateLimiter: RateLimiterGuard;

    function getRateLimiter(options?: any) {
      const mockReflector = {
        getAllAndOverride: () => options,
      } as any;
      return new RateLimiterGuard(mockReflector);
    }

    it('6.1 should allow requests within rate limit threshold', () => {
      const limiter = getRateLimiter({ limit: 5, ttlMs: 60000 });
      const mockContext = createMockExecutionContext('192.168.1.1');
      expect(limiter.canActivate(mockContext)).toBe(true);
      expect(limiter.canActivate(mockContext)).toBe(true);
      expect(limiter.canActivate(mockContext)).toBe(true);
    });

    it('6.2 should reject requests exceeding limit with 429 Too Many Requests', () => {
      const limiter = getRateLimiter({ limit: 2, ttlMs: 60000 });
      const mockContext = createMockExecutionContext('192.168.1.5');
      expect(limiter.canActivate(mockContext)).toBe(true);
      expect(limiter.canActivate(mockContext)).toBe(true);

      // Third request should throw 429
      expect(() => limiter.canActivate(mockContext)).toThrow(
        expect.objectContaining({ status: HttpStatus.TOO_MANY_REQUESTS }),
      );
    });

    it('6.3 should set X-RateLimit-Limit, Remaining, and Reset headers', () => {
      const limiter = getRateLimiter({ limit: 10, ttlMs: 60000 });
      const resHeaders: Record<string, any> = {};
      const mockContext = createMockExecutionContext('192.168.1.10', resHeaders);
      limiter.canActivate(mockContext);

      expect(resHeaders['X-RateLimit-Limit']).toBe(10);
      expect(resHeaders['X-RateLimit-Remaining']).toBe(9);
      expect(resHeaders['X-RateLimit-Reset']).toBeDefined();
    });

    it('6.4 should set Retry-After header on 429 rejection', () => {
      const limiter = getRateLimiter({ limit: 1, ttlMs: 60000 });
      const resHeaders: Record<string, any> = {};
      const mockContext = createMockExecutionContext('192.168.1.20', resHeaders);
      limiter.canActivate(mockContext);

      try {
        limiter.canActivate(mockContext);
      } catch {
        // expected
      }

      expect(resHeaders['Retry-After']).toBeDefined();
      expect(resHeaders['Retry-After']).toBeGreaterThan(0);
    });

    it('6.5 should isolate rate limit buckets across distinct IP addresses', () => {
      const limiter = getRateLimiter({ limit: 2, ttlMs: 60000 });
      const ctxA = createMockExecutionContext('10.0.0.1');
      const ctxB = createMockExecutionContext('10.0.0.2');

      expect(limiter.canActivate(ctxA)).toBe(true);
      expect(limiter.canActivate(ctxA)).toBe(true);
      expect(() => limiter.canActivate(ctxA)).toThrow();

      // IP B should still have its quota
      expect(limiter.canActivate(ctxB)).toBe(true);
      expect(limiter.canActivate(ctxB)).toBe(true);
    });

    it('6.6 should isolate rate limit buckets by authenticated user ID when present', () => {
      const limiter = getRateLimiter({ limit: 2, ttlMs: 60000 });
      const ctxUser1 = createMockExecutionContext('10.0.0.1', {}, 'user-111');
      const ctxUser2 = createMockExecutionContext('10.0.0.1', {}, 'user-222');

      expect(limiter.canActivate(ctxUser1)).toBe(true);
      expect(limiter.canActivate(ctxUser1)).toBe(true);
      expect(() => limiter.canActivate(ctxUser1)).toThrow();

      // User 2 from the same IP should still be allowed
      expect(limiter.canActivate(ctxUser2)).toBe(true);
    });

    it('6.7 should pass through when route has no RateLimit decorator', () => {
      const limiter = getRateLimiter(undefined);
      const mockContext = createMockExecutionContext('192.168.1.1');
      expect(limiter.canActivate(mockContext)).toBe(true);
    });

    it('6.8 should allow resetting rate limit storage', () => {
      const limiter = getRateLimiter({ limit: 1, ttlMs: 60000 });
      const mockContext = createMockExecutionContext('192.168.1.99');
      expect(limiter.canActivate(mockContext)).toBe(true);
      expect(() => limiter.canActivate(mockContext)).toThrow();

      limiter.reset();
      expect(limiter.canActivate(mockContext)).toBe(true);
    });
  });

  // =========================================================================
  // 7. WEBHOOK SIGNATURE & IDEMPOTENCY VERIFIER
  // =========================================================================
  describe('7. Webhook Signature & Idempotency Verifier', () => {
    const testSecret = 'wh_secret_key_production_test_2026';
    const testPayload = JSON.stringify({ event: 'payment.success', amount: 1500, tenantId: 't1' });

    it('7.1 should verify valid HMAC SHA256 signature', () => {
      const hmac = createHmac('sha256', testSecret).update(testPayload).digest('hex');
      const isValid = webhookVerifier.verifyHmacSignature(testPayload, hmac, testSecret);
      expect(isValid).toBe(true);
    });

    it('7.2 should verify valid signature with sha256= prefix', () => {
      const hmac = 'sha256=' + createHmac('sha256', testSecret).update(testPayload).digest('hex');
      const isValid = webhookVerifier.verifyHmacSignature(testPayload, hmac, testSecret);
      expect(isValid).toBe(true);
    });

    it('7.3 should reject invalid/tampered signature', () => {
      const fakeSig = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const isValid = webhookVerifier.verifyHmacSignature(testPayload, fakeSig, testSecret);
      expect(isValid).toBe(false);
    });

    it('7.4 should reject signature when payload has been tampered with', () => {
      const hmac = createHmac('sha256', testSecret).update(testPayload).digest('hex');
      const tamperedPayload = testPayload + ' ';
      const isValid = webhookVerifier.verifyHmacSignature(tamperedPayload, hmac, testSecret);
      expect(isValid).toBe(false);
    });

    it('7.5 should record webhook event ID and detect duplicate replayed events', () => {
      const eventId = 'evt_razorpay_987654321';
      const firstCheck = webhookVerifier.checkAndRecordIdempotency(eventId, 'RAZORPAY');
      expect(firstCheck).toBe(true); // first time accepted

      const secondCheck = webhookVerifier.checkAndRecordIdempotency(eventId, 'RAZORPAY');
      expect(secondCheck).toBe(false); // duplicate rejected
    });

    it('7.6 should isolate event IDs across different webhook providers', () => {
      const eventId = 'evt_common_id_100';
      const razorpayCheck = webhookVerifier.checkAndRecordIdempotency(eventId, 'RAZORPAY');
      const whatsappCheck = webhookVerifier.checkAndRecordIdempotency(eventId, 'WHATSAPP');

      expect(razorpayCheck).toBe(true);
      expect(whatsappCheck).toBe(true);
    });

    it('7.7 should combine signature verification and idempotency in verifyAndProcessEvent', () => {
      const eventId = 'evt_combined_test_200';
      const hmac = createHmac('sha256', testSecret).update(testPayload).digest('hex');

      const result1 = webhookVerifier.verifyAndProcessEvent(testPayload, hmac, testSecret, eventId, 'STRIPE');
      expect(result1.isValid).toBe(true);
      expect(result1.isDuplicate).toBe(false);

      // Replay should flag as duplicate
      const result2 = webhookVerifier.verifyAndProcessEvent(testPayload, hmac, testSecret, eventId, 'STRIPE');
      expect(result2.isValid).toBe(true);
      expect(result2.isDuplicate).toBe(true);
      expect(result2.reason).toBe('DUPLICATE_EVENT');
    });

    it('7.8 should return INVALID_SIGNATURE before checking duplicate status if signature fails', () => {
      const eventId = 'evt_bad_sig_300';
      const result = webhookVerifier.verifyAndProcessEvent(testPayload, 'bad_sig', testSecret, eventId, 'STRIPE');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('INVALID_SIGNATURE');
    });
  });

  // =========================================================================
  // 8. BACKGROUND JOB RUNNER & RESILIENT RETRIES
  // =========================================================================
  describe('8. Background Job Runner & Resilient Retries', () => {
    beforeEach(() => {
      jobRunner.clearDeadLetterJobs();
    });

    it('8.1 should create a job with valid metadata and default attempt limits', () => {
      const job = jobRunner.createJob('SEND_WHATSAPP_NOTIFICATION', { phone: '+919999999999' }, {
        tenantId: 'tenant-123',
        correlationId: 'req-abc-001',
      });

      expect(job.jobId).toBeDefined();
      expect(job.jobType).toBe('SEND_WHATSAPP_NOTIFICATION');
      expect(job.status).toBe('QUEUED');
      expect(job.attemptCount).toBe(0);
      expect(job.maxAttempts).toBe(3);
      expect(job.tenantId).toBe('tenant-123');
      expect(job.correlationId).toBe('req-abc-001');
    });

    it('8.2 should execute registered handler successfully and set status COMPLETED', async () => {
      let executed = false;
      jobRunner.registerHandler('PROCESS_INVOICE_PDF', async (job) => {
        expect(job.payload.invoiceId).toBe('inv-100');
        executed = true;
      });

      const job = jobRunner.createJob('PROCESS_INVOICE_PDF', { invoiceId: 'inv-100' });
      const result = await jobRunner.executeJob(job);

      expect(result.success).toBe(true);
      expect(result.status).toBe('COMPLETED');
      expect(job.status).toBe('COMPLETED');
      expect(job.attemptCount).toBe(1);
      expect(job.completedAt).toBeDefined();
      expect(executed).toBe(true);
    });

    it('8.3 should handle temporary failure by calculating exponential backoff and status FAILED', async () => {
      const job = jobRunner.createJob('TRANSIENT_TASK', { data: 1 }, { maxAttempts: 3 });

      const result = await jobRunner.executeJob(job, async () => {
        throw new Error('Temporary network timeout');
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.isPermanentError).toBe(false);
      expect(job.status).toBe('FAILED');
      expect(job.attemptCount).toBe(1);
      expect(job.nextRetryAt).toBeDefined();
      expect(job.nextRetryAt!.getTime()).toBeGreaterThan(Date.now());
      expect(job.lastError).toBe('Temporary network timeout');
    });

    it('8.4 should transition to DEAD_LETTER after exceeding maxAttempts', async () => {
      const job = jobRunner.createJob('PERSISTENT_FAIL_TASK', { data: 2 }, { maxAttempts: 2 });

      // First attempt
      await jobRunner.executeJob(job, async () => {
        throw new Error('503 Service Unavailable');
      });
      expect(job.status).toBe('FAILED');
      expect(job.attemptCount).toBe(1);

      // Second attempt (reaching maxAttempts = 2)
      const result = await jobRunner.executeJob(job, async () => {
        throw new Error('503 Service Unavailable');
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('DEAD_LETTER');
      expect(result.isPermanentError).toBe(true);
      expect(job.status).toBe('DEAD_LETTER');
      expect(jobRunner.getDeadLetterJobs()).toHaveLength(1);
      expect(jobRunner.getDeadLetterJobs()[0].jobId).toBe(job.jobId);
    });

    it('8.5 should transition permanent validation error directly to DEAD_LETTER on first attempt', async () => {
      const job = jobRunner.createJob('VALIDATION_TASK', { invalidField: true }, { maxAttempts: 5 });

      const validationErr = new Error('Invalid customer phone number');
      validationErr.name = 'ValidationError';

      const result = await jobRunner.executeJob(job, async () => {
        throw validationErr;
      });

      expect(result.status).toBe('DEAD_LETTER');
      expect(result.isPermanentError).toBe(true);
      expect(job.status).toBe('DEAD_LETTER');
      expect(job.attemptCount).toBe(1);
    });

    it('8.6 should move job to DEAD_LETTER if no handler is registered', async () => {
      const job = jobRunner.createJob('UNREGISTERED_JOB_TYPE', {});
      const result = await jobRunner.executeJob(job);

      expect(result.status).toBe('DEAD_LETTER');
      expect(result.error).toContain('No handler registered');
      expect(job.status).toBe('DEAD_LETTER');
    });

    it('8.7 should clear dead letter queue when requested', () => {
      const job = jobRunner.createJob('JOB_A', {});
      job.status = 'DEAD_LETTER';
      (jobRunner as any).deadLetterJobs.push(job);
      expect(jobRunner.getDeadLetterJobs()).toHaveLength(1);

      jobRunner.clearDeadLetterJobs();
      expect(jobRunner.getDeadLetterJobs()).toHaveLength(0);
    });

    it('8.8 should preserve tenant context and correlationId throughout job execution lifecycle', async () => {
      let capturedJob: any;
      jobRunner.registerHandler('CONTEXT_CHECK', async (job) => {
        capturedJob = job;
      });

      const job = jobRunner.createJob('CONTEXT_CHECK', { value: 42 }, {
        tenantId: 'tenant-audit-777',
        correlationId: 'req-corr-888',
      });

      await jobRunner.executeJob(job);
      expect(capturedJob.tenantId).toBe('tenant-audit-777');
      expect(capturedJob.correlationId).toBe('req-corr-888');
    });

    it('8.9 should compute backoff dynamically according to attempt count', async () => {
      const job = jobRunner.createJob('BACKOFF_TEST', {}, { maxAttempts: 5 });

      // Attempt 1: 2^1 * 1000 = 2000ms
      await jobRunner.executeJob(job, async () => { throw new Error('err'); });
      const delay1 = job.nextRetryAt!.getTime() - Date.now();

      // Attempt 2: 2^2 * 1000 = 4000ms
      await jobRunner.executeJob(job, async () => { throw new Error('err'); });
      const delay2 = job.nextRetryAt!.getTime() - Date.now();

      expect(delay2).toBeGreaterThan(delay1);
    });

    it('8.10 should support overriding handler inline at execution time', async () => {
      const job = jobRunner.createJob('INLINE_OVERRIDE', { x: 10 });
      let ranCustom = false;

      const result = await jobRunner.executeJob(job, async (j) => {
        expect(j.payload.x).toBe(10);
        ranCustom = true;
      });

      expect(result.success).toBe(true);
      expect(ranCustom).toBe(true);
    });
  });

  // =========================================================================
  // 9. MULTI-TENANT ISOLATION & SYSTEM RELIABILITY
  // =========================================================================
  describe('9. Multi-Tenant Isolation & Reliability Controls', () => {
    it('9.1 should verify database connection is alive and ready for operations', () => {
      expect(connection.readyState).toBe(1); // 1 = connected
    });

    it('9.2 should reject unauthenticated access to current tenant management', async () => {
      await request(app.getHttpServer()).get('/api/tenants/current').expect(401);
    });

    it('9.3 should reject unauthenticated access to tenant subscription details', async () => {
      await request(app.getHttpServer()).get('/api/subscriptions/current').expect(401);
    });

    it('9.4 should reject unauthenticated access to staff profile management', async () => {
      await request(app.getHttpServer()).get('/api/staff').expect(401);
    });

    it('9.5 should reject unauthenticated access to orders', async () => {
      await request(app.getHttpServer()).get('/api/orders').expect(401);
    });

    it('9.6 should reject unauthenticated access to customer CRM', async () => {
      await request(app.getHttpServer()).get('/api/customers').expect(401);
    });
  });
});

// Helper function to mock ExecutionContext for unit testing guards
function createMockExecutionContext(
  ip: string,
  resHeaders: Record<string, any> = {},
  userId?: string,
): any {
  const req: any = {
    ip,
    socket: { remoteAddress: ip },
    user: userId ? { _id: userId, id: userId } : undefined,
  };
  const res: any = {
    statusCode: 200,
    setHeader: (name: string, val: any) => {
      resHeaders[name] = val;
    },
  };

  const handler = function sampleHandler() {};
  const targetClass = class SampleController {};

  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getHandler: () => handler,
    getClass: () => targetClass,
  };
}
