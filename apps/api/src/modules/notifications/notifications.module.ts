import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from '../../schemas/notification.schema';
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from '../../schemas/notification-template.schema';
import {
  WhatsAppSettings,
  WhatsAppSettingsSchema,
} from '../../schemas/whatsapp-settings.schema';
import {
  CustomerPreference,
  CustomerPreferenceSchema,
} from '../../schemas/customer-preference.schema';
import {
  NotificationAutomation,
  NotificationAutomationSchema,
} from '../../schemas/notification-automation.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationTemplateService } from './notification-template.service';
import { WhatsAppSettingsService } from './whatsapp-settings.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationAutomationService } from './notification-automation.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationEventService } from './notification-event.service';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: WhatsAppSettings.name, schema: WhatsAppSettingsSchema },
      { name: CustomerPreference.name, schema: CustomerPreferenceSchema },
      { name: NotificationAutomation.name, schema: NotificationAutomationSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    AuditModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationTemplateService,
    WhatsAppSettingsService,
    NotificationPreferenceService,
    NotificationAutomationService,
    NotificationDispatcherService,
    NotificationEventService,
    WhatsAppProvider,
  ],
  exports: [
    NotificationsService,
    NotificationEventService,
    NotificationTemplateService,
    WhatsAppSettingsService,
    NotificationPreferenceService,
    NotificationAutomationService,
  ],
})
export class NotificationsModule {}
