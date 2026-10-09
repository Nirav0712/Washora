import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Garment, GarmentSchema } from '../../schemas/garment.schema';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { TenantSettings, TenantSettingsSchema } from '../../schemas/tenant-settings.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { Service, ServiceSchema } from '../../schemas/service.schema';
import { ProcessingJob, ProcessingJobSchema } from '../../schemas/processing-job.schema';
import { ProcessingEvent, ProcessingEventSchema } from '../../schemas/processing-event.schema';
import { OrdersService } from './orders.service';
import { PricingCalculatorService } from './pricing-calculator.service';
import { OrdersController } from './orders.controller';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Garment.name, schema: GarmentSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: TenantSettings.name, schema: TenantSettingsSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Service.name, schema: ServiceSchema },
      { name: ProcessingJob.name, schema: ProcessingJobSchema },
      { name: ProcessingEvent.name, schema: ProcessingEventSchema },
    ]),
    CounterModule,
    AuditModule,
    MembershipsModule,
    NotificationsModule,
  ],
  providers: [OrdersService, PricingCalculatorService],
  controllers: [OrdersController],
  exports: [OrdersService, PricingCalculatorService],
})
export class OrdersModule {}
