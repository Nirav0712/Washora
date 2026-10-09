import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerAccount, CustomerAccountSchema } from '../../schemas/customer-account.schema';
import { CustomerNote, CustomerNoteSchema } from '../../schemas/customer-note.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { PickupRequest, PickupRequestSchema } from '../../schemas/pickup-request.schema';
import { DeliveryRequest, DeliveryRequestSchema } from '../../schemas/delivery-request.schema';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerTrackingService } from './customer-tracking.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerTrackingController } from './customer-tracking.controller';
import { CustomerAuthGuard } from './guards/customer-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerAccount.name, schema: CustomerAccountSchema },
      { name: CustomerNote.name, schema: CustomerNoteSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: PickupRequest.name, schema: PickupRequestSchema },
      { name: DeliveryRequest.name, schema: DeliveryRequestSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'washora_dev_jwt_secret_2026_super_secure'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
    AuditModule,
    NotificationsModule,
  ],
  controllers: [
    CustomerAuthController,
    CustomerPortalController,
    CustomerTrackingController,
  ],
  providers: [
    CustomerAuthService,
    CustomerPortalService,
    CustomerTrackingService,
    CustomerAuthGuard,
  ],
  exports: [
    CustomerAuthService,
    CustomerPortalService,
    CustomerTrackingService,
    CustomerAuthGuard,
  ],
})
export class CustomerPortalModule {}
