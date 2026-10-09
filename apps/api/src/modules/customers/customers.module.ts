import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { CustomerNote, CustomerNoteSchema } from '../../schemas/customer-note.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { PickupRequest, PickupRequestSchema } from '../../schemas/pickup-request.schema';
import { DeliveryRequest, DeliveryRequestSchema } from '../../schemas/delivery-request.schema';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerNote.name, schema: CustomerNoteSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: PickupRequest.name, schema: PickupRequestSchema },
      { name: DeliveryRequest.name, schema: DeliveryRequestSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
