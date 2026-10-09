import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SystemHealthReport } from '@washora/shared';

@Injectable()
export class SystemHealthService {
  private readonly logger = new Logger(SystemHealthService.name);
  private readonly startTime = Date.now();

  constructor(@InjectConnection() private connection: Connection) {}

  async getHealth(): Promise<SystemHealthReport> {
    let dbConnected = false;
    let dbPingMs = -1;
    let dbState = 'DISCONNECTED';

    try {
      const pingStart = Date.now();
      const state = this.connection.readyState;
      if (state === 1 && this.connection.db) {
        await this.connection.db.admin().ping();
        dbConnected = true;
        dbPingMs = Date.now() - pingStart;
        dbState = 'CONNECTED';
      } else {
        dbState = state === 2 ? 'CONNECTING' : 'DISCONNECTED';
      }
    } catch (err: any) {
      dbConnected = false;
      dbState = 'ERROR';
      this.logger.warn(`Health check DB ping error: ${err.message}`);
    }

    const mem = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    const isHealthy = dbConnected;

    return {
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
      uptimeSeconds,
      database: {
        connected: dbConnected,
        state: dbState,
        pingMs: dbPingMs,
      },
      memory: {
        rssMb: Math.round((mem.rss / (1024 * 1024)) * 100) / 100,
        heapTotalMb: Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100,
        heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
      },
    };
  }
}
