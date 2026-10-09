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
          maxPoolSize: 50,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
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
              logger.error(`MongoDB connection error: ${error?.message || error}`);
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
