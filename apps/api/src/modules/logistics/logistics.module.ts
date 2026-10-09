import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { PickupRequest, PickupRequestSchema } from '../../schemas/pickup-request.schema';
import { DeliveryRequest, DeliveryRequestSchema } from '../../schemas/delivery-request.schema';
import { StaffProfile, StaffProfileSchema } from '../../schemas/staff-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PickupRequest.name, schema: PickupRequestSchema },
      { name: DeliveryRequest.name, schema: DeliveryRequestSchema },
      { name: StaffProfile.name, schema: StaffProfileSchema },
    ]),
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
