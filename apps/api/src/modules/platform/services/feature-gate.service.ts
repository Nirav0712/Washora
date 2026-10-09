import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { FeatureKey, SubscriptionStatus } from '@washora/shared';

@Injectable()
export class FeatureGateService {
  private readonly logger = new Logger(FeatureGateService.name);

  constructor(
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
  ) {}

  async isEnabled(tenantId: string, featureKey: FeatureKey | string): Promise<boolean> {
    try {
      const sub = await this.subscriptionModel
        .findOne({
          tenantId: new Types.ObjectId(tenantId),
          status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        })
        .populate('planId')
        .sort({ createdAt: -1 })
        .exec();

      if (!sub) {
        // Fallback default: If no active subscription found, allow core POS/Orders, but block advanced features
        return [FeatureKey.POS, FeatureKey.CUSTOMERS, FeatureKey.ORDERS].includes(featureKey as FeatureKey);
      }

      const plan = sub.planId as any;
      if (!plan || !plan.features) {
        return true;
      }

      // Feature lookup
      return plan.features[featureKey] !== false;
    } catch (err: any) {
      this.logger.warn(`Feature check error for ${featureKey}: ${err.message}`);
      return true; // fail open for resilience if subscription lookup fails
    }
  }

  async assertEnabled(tenantId: string, featureKey: FeatureKey | string): Promise<void> {
    const enabled = await this.isEnabled(tenantId, featureKey);
    if (!enabled) {
      throw new ForbiddenException(
        `Feature "${featureKey}" is not enabled in your current subscription plan. Please upgrade your plan to access this module.`,
      );
    }
  }
}
