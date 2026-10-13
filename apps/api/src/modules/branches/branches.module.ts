import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';

import { TenantSubscription, TenantSubscriptionSchema } from '../../schemas/tenant-subscription.schema';
import { SubscriptionPlan, SubscriptionPlanSchema } from '../../schemas/subscription-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
      { name: TenantSubscription.name, schema: TenantSubscriptionSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
    ]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
