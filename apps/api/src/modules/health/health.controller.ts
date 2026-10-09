import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly processStartTime = Date.now();

  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check overview endpoint' })
  checkHealth() {
    const isDbConnected = this.connection.readyState === 1;

    return {
      status: isDbConnected ? 'ok' : 'degraded',
      database: isDbConnected ? 'connected' : 'disconnected',
      service: 'washora-api',
      uptimeSeconds: Math.floor((Date.now() - this.processStartTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe (process is running)' })
  checkLiveness() {
    const memoryUsage = process.memoryUsage();
    return {
      status: 'alive',
      service: 'washora-api',
      uptimeSeconds: Math.floor((Date.now() - this.processStartTime) / 1000),
      memory: {
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      },
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (critical dependencies are ready)' })
  async checkReadiness(@Res() res: Response) {
    const startPing = Date.now();
    let isDbReady = false;
    let pingLatencyMs = 0;

    try {
      if (this.connection.readyState === 1 && this.connection.db) {
        // Execute a bounded ping command on admin database (timeout 3000ms)
        const pingPromise = this.connection.db.admin().ping();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database ping timed out')), 3000),
        );

        await Promise.race([pingPromise, timeoutPromise]);
        pingLatencyMs = Date.now() - startPing;
        isDbReady = true;
      }
    } catch {
      isDbReady = false;
    }

    if (isDbReady) {
      return res.status(HttpStatus.OK).json({
        status: 'ready',
        database: {
          status: 'connected',
          latencyMs: pingLatencyMs,
        },
        service: 'washora-api',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        database: {
          status: 'disconnected',
          readyState: this.connection.readyState,
        },
        service: 'washora-api',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
