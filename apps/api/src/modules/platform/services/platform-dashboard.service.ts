import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../../../schemas/tenant.schema';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { AuditLog, AuditLogDocument } from '../../../schemas/audit-log.schema';
import { TenantStatus, SubscriptionStatus, BillingInterval, PlatformDashboardData } from '@washora/shared';

@Injectable()
export class PlatformDashboardService {
  private readonly logger = new Logger(PlatformDashboardService.name);

  constructor(
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
    @InjectModel(AuditLog.name)
    private auditModel: Model<AuditLogDocument>,
  ) {}

  async getDashboardData(): Promise<PlatformDashboardData> {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      pastDueTenants,
      suspendedTenants,
      activeSubs,
      recentTenants,
      recentSubscriptions,
      recentAuditLogs,
    ] = await Promise.all([
      this.tenantModel.countDocuments(),
      this.tenantModel.countDocuments({ status: TenantStatus.ACTIVE }),
      this.tenantModel.countDocuments({ status: TenantStatus.TRIAL }),
      this.tenantModel.countDocuments({ status: TenantStatus.PAST_DUE }),
      this.tenantModel.countDocuments({ status: TenantStatus.SUSPENDED }),
      this.subscriptionModel
        .find({ status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } })
        .populate('planId')
        .exec(),
      this.tenantModel.find().sort({ createdAt: -1 }).limit(5).exec(),
      this.subscriptionModel
        .find()
        .populate('planId')
        .populate('tenantId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(5)
        .exec(),
      this.auditModel.find().sort({ timestamp: -1 }).limit(10).exec(),
    ]);

    // Calculate MRR & ARR from active subscriptions
    let mrr = 0;
    activeSubs.forEach((s) => {
      const plan = s.planId as any;
      if (plan && plan.price) {
        if (s.billingInterval === BillingInterval.YEARLY) {
          mrr += Math.round(plan.price / 12);
        } else {
          mrr += plan.price;
        }
      }
    });

    const arr = mrr * 12;

    const tenantsByStatus: Record<string, number> = {
      [TenantStatus.PROVISIONING]: 0,
      [TenantStatus.TRIAL]: trialTenants,
      [TenantStatus.ACTIVE]: activeTenants,
      [TenantStatus.PAST_DUE]: pastDueTenants,
      [TenantStatus.SUSPENDED]: suspendedTenants,
      [TenantStatus.CANCELLED]: 0,
      [TenantStatus.ARCHIVED]: 0,
    };

    return {
      metrics: {
        totalTenants,
        activeTenants,
        trialTenants,
        pastDueTenants,
        suspendedTenants,
        mrr,
        arr,
        activeSubscriptions: activeSubs.length,
      },
      tenantsByStatus,
      recentTenants: recentTenants.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        slug: t.slug,
        status: t.status,
        createdAt: (t as any).createdAt,
      })),
      recentSubscriptions: recentSubscriptions.map((s) => ({
        id: s._id.toString(),
        tenantName: (s.tenantId as any)?.name || 'Unknown',
        planName: (s.planId as any)?.name || 'Standard',
        status: s.status,
        currentPeriodEnd: s.currentPeriodEnd,
        createdAt: (s as any).createdAt,
      })),
      recentAuditLogs: recentAuditLogs.map((a) => ({
        id: a._id.toString(),
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        metadata: a.metadata,
        timestamp: (a as any).createdAt || new Date(),
      })),
    };
  }
}
