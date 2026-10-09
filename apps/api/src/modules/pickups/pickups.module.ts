import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PickupsController } from './pickups.controller';
import { PickupsService } from './pickups.service';
import { PickupRequest, PickupRequestSchema } from '../../schemas/pickup-request.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { StaffProfile, StaffProfileSchema } from '../../schemas/staff-profile.schema';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PickupRequest.name, schema: PickupRequestSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Order.name, schema: OrderSchema },
      { name: StaffProfile.name, schema: StaffProfileSchema },
    ]),
    CounterModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [PickupsController],
  providers: [PickupsService],
  exports: [PickupsService],
})
export class PickupsModule {}
