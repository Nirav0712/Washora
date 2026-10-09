import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { DeliveryRequest, DeliveryRequestSchema } from '../../schemas/delivery-request.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { StaffProfile, StaffProfileSchema } from '../../schemas/staff-profile.schema';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryRequest.name, schema: DeliveryRequestSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Order.name, schema: OrderSchema },
      { name: StaffProfile.name, schema: StaffProfileSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    CounterModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
