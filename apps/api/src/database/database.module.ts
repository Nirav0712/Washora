import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const uri = configService.get<string>('database.uri') || configService.get<string>('MONGODB_URI');

        if (!uri) {
          logger.error('MONGODB_URI is not defined in environment variables!');
          throw new Error('Database URI is missing');
        }

        return {
          uri,
          lazyConnection: true,
          maxPoolSize: 50,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          retryWrites: true,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              logger.log('MongoDB connection established successfully');
            });
            connection.on('disconnected', () => {
              logger.warn('MongoDB connection disconnected');
            });
            connection.on('error', (error: any) => {
              const errName = error?.name || 'MongoError';
              const errCode = error?.code || error?.codeName || 'UNKNOWN';
              const errMsg = error?.message || String(error);
              logger.error(`[MongoDB Connection Error] name=${errName} code=${errCode}: ${errMsg}`);
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
