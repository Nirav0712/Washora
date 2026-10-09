import { Module, forwardRef } from '@nestjs/common';
import { TenantSubscriptionsController } from './tenant-subscriptions.controller';
import { PlatformModule } from '../platform/platform.module';

@Module({
  imports: [forwardRef(() => PlatformModule)],
  controllers: [TenantSubscriptionsController],
})
export class SubscriptionsModule {}
