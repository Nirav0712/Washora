import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Garment, GarmentSchema } from '../../schemas/garment.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { GarmentsService } from './garments.service';
import { GarmentsController } from './garments.controller';
import { CounterModule } from '../../common/services/counter.module';
import { AuditModule } from '../audit/audit.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Garment.name, schema: GarmentSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    CounterModule,
    AuditModule,
    MembershipsModule,
  ],
  providers: [GarmentsService],
  controllers: [GarmentsController],
  exports: [GarmentsService],
})
export class GarmentsModule {}
