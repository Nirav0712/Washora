import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { StructuredLoggerService } from './common/logging/structured-logger.service';
import { validateEnvironment } from './config/env.validation';
import { RateLimiterGuard } from './common/guards/rate-limiter.guard';

async function bootstrap() {
  const structuredLogger = new StructuredLoggerService('Bootstrap');

  // 1. Environment validation
  const validation = validateEnvironment(process.env);
  if (validation.warnings.length > 0) {
    validation.warnings.forEach((warn) => structuredLogger.warn(`[Config Warning] ${warn}`));
  }

  if (!validation.isValid) {
    validation.errors.forEach((err) => structuredLogger.error(`[Config Error] ${err}`));
    if (process.env.NODE_ENV === 'production') {
      structuredLogger.fatal('Startup aborted due to invalid production environment configuration.');
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(structuredLogger);

  // Body parser size limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-branch-id', 'x-request-id', 'x-correlation-id'],
    exposedHeaders: ['x-request-id', 'x-correlation-id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
  });

  // Global API Prefix
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Guards & Interceptors
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new RateLimiterGuard(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Graceful shutdown
  app.enableShutdownHooks();

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Washora Enterprise API')
    .setDescription(
      'Complete Laundry Business Management Platform — Multi-Tenant Backend with RBAC and Branch Isolation',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port);
  structuredLogger.log(`🚀 Washora SaaS Backend running on http://localhost:${port}`);
  structuredLogger.log(`📖 API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
