import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportTicket, SupportTicketSchema } from '../../schemas/support-ticket.schema';
import {
  PlatformContactSettings,
  PlatformContactSettingsSchema,
} from '../../schemas/platform-contact-settings.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: PlatformContactSettings.name, schema: PlatformContactSettingsSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    CounterModule,
    AuditModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
