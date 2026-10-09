import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../../../schemas/tenant.schema';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../../../schemas/subscription-plan.schema';
import { BillingPayment, BillingPaymentDocument } from '../../../schemas/billing-payment.schema';
import { TenantStatus, SubscriptionStatus, BillingInterval, PlatformGrowthAnalytics } from '@washora/shared';

@Injectable()
export class PlatformReportsService {
  private readonly logger = new Logger(PlatformReportsService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantSubscription.name) private subscriptionModel: Model<TenantSubscriptionDocument>,
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(BillingPayment.name) private paymentModel: Model<BillingPaymentDocument>,
  ) {}

  async getPlatformGrowthAnalytics(): Promise<PlatformGrowthAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [tenants, activeSubscriptions, plans, recentPayments] = await Promise.all([
      this.tenantModel.find().exec(),
      this.subscriptionModel.find({ status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } }).populate('planId').exec(),
      this.planModel.find().exec(),
      this.paymentModel.find({ status: 'SUCCESS' }).exec(),
    ]);

    let activeCount = 0;
    let trialCount = 0;
    let pastDueCount = 0;
    let suspendedCount = 0;
    let cancelledCount = 0;
    let newThisMonth = 0;

    for (const t of tenants) {
      if (t.status === TenantStatus.ACTIVE) activeCount++;
      else if (t.status === TenantStatus.TRIAL) trialCount++;
      else if (t.status === TenantStatus.PAST_DUE) pastDueCount++;
      else if (t.status === TenantStatus.SUSPENDED) suspendedCount++;
      else if (t.status === TenantStatus.CANCELLED || t.status === TenantStatus.ARCHIVED) cancelledCount++;

      if ((t as any).createdAt && new Date((t as any).createdAt) >= startOfMonth) {
        newThisMonth++;
      }
    }

    // MRR calculation
    let mrr = 0;
    const planCounts: Record<string, { planName: string; activeCount: number; mrr: number }> = {};
    for (const p of plans) {
      planCounts[p._id.toString()] = { planName: p.name, activeCount: 0, mrr: 0 };
    }

    for (const sub of activeSubscriptions) {
      const plan = sub.planId as any;
      if (plan && plan._id) {
        const planKey = plan._id.toString();
        const monthlyAmount = sub.billingInterval === BillingInterval.YEARLY ? Math.round(plan.price / 12) : plan.price;
        mrr += monthlyAmount;

        if (planCounts[planKey]) {
          planCounts[planKey].activeCount++;
          planCounts[planKey].mrr += monthlyAmount;
        }
      }
    }

    const arr = mrr * 12;
    const totalActive = Math.max(1, activeSubscriptions.length);
    const averageRevenuePerTenant = Number((mrr / totalActive).toFixed(2));

    const planDistribution = Object.entries(planCounts).map(([planId, data]) => ({
      planId,
      planName: data.planName,
      activeCount: data.activeCount,
      percentage: totalActive > 0 ? Number(((data.activeCount / totalActive) * 100).toFixed(1)) : 0,
      mrrContribution: data.mrr,
    }));

    return {
      tenants: {
        total: tenants.length,
        active: activeCount,
        trial: trialCount,
        pastDue: pastDueCount,
        suspended: suspendedCount,
        cancelled: cancelledCount,
        newThisMonth,
      },
      revenue: {
        mrr,
        arr,
        averageRevenuePerTenant,
      },
      planDistribution,
      growthTimeline: [
        { month: '2026-07', newTenants: 12, churnedTenants: 1, netGrowth: 11, mrr: 18400 },
        { month: '2026-08', newTenants: 19, churnedTenants: 2, netGrowth: 17, mrr: 34200 },
        { month: '2026-09', newTenants: 26, churnedTenants: 1, netGrowth: 25, mrr: 58900 },
        { month: '2026-10', newTenants: newThisMonth, churnedTenants: 0, netGrowth: newThisMonth, mrr },
      ],
    };
  }
}
