import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../../../schemas/subscription-plan.schema';
import { SubscriptionHistory, SubscriptionHistoryDocument } from '../../../schemas/subscription-history.schema';
import { Branch, BranchDocument } from '../../../schemas/branch.schema';
import { Membership, MembershipDocument } from '../../../schemas/membership.schema';
import { Customer, CustomerDocument } from '../../../schemas/customer.schema';
import { AuditService } from '../../audit/audit.service';
import {
  SubscriptionStatus,
  BillingInterval,
  SubscriptionHistoryEventType,
  LimitKey,
} from '@washora/shared';
import {
  CreateSubscriptionDto,
  ChangePlanDto,
  ManualSubscriptionUpdateDto,
} from '../dto/tenant-subscription.dto';

@Injectable()
export class TenantSubscriptionService {
  private readonly logger = new Logger(TenantSubscriptionService.name);

  constructor(
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(SubscriptionHistory.name)
    private subHistoryModel: Model<SubscriptionHistoryDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(Membership.name)
    private membershipModel: Model<MembershipDocument>,
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    private auditService: AuditService,
  ) {}

  async createSubscription(dto: CreateSubscriptionDto, actorAdminId?: string) {
    const tenantObjectId = new Types.ObjectId(dto.tenantId);
    const plan = await this.planModel.findById(new Types.ObjectId(dto.planId)).exec();
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const interval = dto.billingInterval || plan.billingInterval || BillingInterval.MONTHLY;
    const isTrial = dto.startTrial !== false;
    const trialDays = dto.trialDays ?? plan.trialDays ?? 14;

    const now = new Date();
    const trialStart = isTrial ? now : undefined;
    const trialEnd = isTrial ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined;

    let periodEnd: Date;
    if (isTrial && trialEnd) {
      periodEnd = trialEnd;
    } else {
      const days = interval === BillingInterval.YEARLY ? 365 : 30;
      periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    const subscription = await this.subscriptionModel.create({
      tenantId: tenantObjectId,
      planId: plan._id,
      status: isTrial ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
      billingInterval: interval,
      startDate: now,
      trialStart,
      trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    await this.subHistoryModel.create({
      tenantId: tenantObjectId,
      subscriptionId: subscription._id,
      event: isTrial ? SubscriptionHistoryEventType.TRIAL_STARTED : SubscriptionHistoryEventType.CREATED,
      newState: {
        planId: plan._id.toString(),
        planName: plan.name,
        status: subscription.status,
        billingInterval: interval,
        currentPeriodEnd: periodEnd.toISOString(),
      },
      actorId: actorAdminId ? new Types.ObjectId(actorAdminId) : undefined,
      actorType: actorAdminId ? 'PLATFORM_ADMIN' : 'SYSTEM',
    });

    await this.auditService.log({
      tenantId: dto.tenantId,
      action: 'SUBSCRIPTION_CREATED',
      entity: 'TenantSubscription',
      entityId: subscription._id.toString(),
      metadata: { planId: plan._id.toString(), planName: plan.name, actorAdminId },
    });

    return this.getSubscriptionById(subscription._id.toString());
  }

  async convertTrialToPaid(tenantId: string, billingInterval?: BillingInterval, actorId?: string) {
    const idObj = Types.ObjectId.isValid(tenantId) ? new Types.ObjectId(tenantId) : tenantId;
    const sub = await this.subscriptionModel
      .findOne({ $or: [{ _id: idObj }, { tenantId: idObj }] })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();

    if (!sub) {
      throw new NotFoundException('Subscription not found for tenant');
    }

    const plan = sub.planId as any;
    const interval = billingInterval || sub.billingInterval || BillingInterval.MONTHLY;
    const days = interval === BillingInterval.YEARLY ? 365 : 30;

    const previousState = {
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
    };

    const now = new Date();
    sub.status = SubscriptionStatus.ACTIVE;
    sub.billingInterval = interval;
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    sub.cancelAtPeriodEnd = false;
    await sub.save();

    await this.subHistoryModel.create({
      tenantId: sub.tenantId,
      subscriptionId: sub._id,
      event: SubscriptionHistoryEventType.ACTIVATED,
      previousState,
      newState: {
        status: sub.status,
        billingInterval: sub.billingInterval,
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      },
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorType: actorId ? 'PLATFORM_ADMIN' : 'TENANT_OWNER',
    });

    await this.auditService.log({
      tenantId: sub.tenantId.toString(),
      action: 'SUBSCRIPTION_TRIAL_CONVERTED',
      entity: 'TenantSubscription',
      entityId: sub._id.toString(),
      metadata: { planName: plan?.name, actorId },
    });

    return this.getSubscriptionById(sub._id.toString());
  }

  async changePlan(tenantId: string, dto: ChangePlanDto, actorId?: string, actorType: 'PLATFORM_ADMIN' | 'TENANT_OWNER' = 'PLATFORM_ADMIN') {
    const idObj = Types.ObjectId.isValid(tenantId) ? new Types.ObjectId(tenantId) : tenantId;
    const sub = await this.subscriptionModel
      .findOne({ $or: [{ _id: idObj }, { tenantId: idObj }] })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();

    if (!sub) {
      throw new NotFoundException('Active subscription not found for tenant');
    }

    const targetPlan = await this.planModel.findById(new Types.ObjectId(dto.newPlanId)).exec();
    if (!targetPlan) {
      throw new NotFoundException('Target subscription plan not found');
    }

    const currentPlan = sub.planId as any;

    // Downgrade check: Verify current tenant resource counts against new limits
    const isDowngrade = (targetPlan.price < (currentPlan?.price || 0));
    if (isDowngrade) {
      const [branchCount, staffCount, customerCount] = await Promise.all([
        this.branchModel.countDocuments({ tenantId: sub.tenantId, isActive: true }),
        this.membershipModel.countDocuments({ tenantId: sub.tenantId }),
        this.customerModel.countDocuments({ tenantId: sub.tenantId, isDeleted: { $ne: true } }),
      ]);

      const targetLimits = targetPlan.limits || {};
      const maxBranches = targetLimits[LimitKey.MAX_BRANCHES] || 1;
      const maxStaff = targetLimits[LimitKey.MAX_STAFF] || 5;
      const maxCustomers = targetLimits[LimitKey.MAX_CUSTOMERS] || 500;

      const conflicts: string[] = [];
      if (branchCount > maxBranches) {
        conflicts.push(`Current active branches (${branchCount}) exceed target plan limit (${maxBranches})`);
      }
      if (staffCount > maxStaff) {
        conflicts.push(`Current active staff members (${staffCount}) exceed target plan limit (${maxStaff})`);
      }
      if (customerCount > maxCustomers) {
        conflicts.push(`Current customer count (${customerCount}) exceeds target plan limit (${maxCustomers})`);
      }

      if (conflicts.length > 0) {
        throw new BadRequestException(
          `Cannot downgrade plan: ${conflicts.join('; ')}. Please remove excess resources or upgrade to a higher tier.`,
        );
      }
    }

    const previousState = {
      planId: currentPlan?._id?.toString(),
      planName: currentPlan?.name,
      price: currentPlan?.price,
      billingInterval: sub.billingInterval,
    };

    const interval = dto.billingInterval || sub.billingInterval || targetPlan.billingInterval || BillingInterval.MONTHLY;
    const days = interval === BillingInterval.YEARLY ? 365 : 30;
    const now = new Date();

    sub.planId = targetPlan._id;
    sub.billingInterval = interval;
    sub.status = SubscriptionStatus.ACTIVE;
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    sub.cancelAtPeriodEnd = false;
    await sub.save();

    await this.subHistoryModel.create({
      tenantId: sub.tenantId,
      subscriptionId: sub._id,
      event: SubscriptionHistoryEventType.PLAN_CHANGED,
      previousState,
      newState: {
        planId: targetPlan._id.toString(),
        planName: targetPlan.name,
        price: targetPlan.price,
        billingInterval: interval,
        reason: dto.reason,
      },
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorType,
      metadata: { reason: dto.reason, isDowngrade },
    });

    await this.auditService.log({
      tenantId: sub.tenantId.toString(),
      action: 'SUBSCRIPTION_PLAN_CHANGED',
      entity: 'TenantSubscription',
      entityId: sub._id.toString(),
      metadata: {
        previousPlan: currentPlan?.name,
        newPlan: targetPlan.name,
        reason: dto.reason,
        actorId,
      },
    });

    return this.getSubscriptionById(sub._id.toString());
  }

  async cancelSubscription(tenantId: string, immediate: boolean = false, reason?: string, actorId?: string) {
    const idObj = Types.ObjectId.isValid(tenantId) ? new Types.ObjectId(tenantId) : tenantId;
    const sub = await this.subscriptionModel
      .findOne({ $or: [{ _id: idObj }, { tenantId: idObj }] })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();

    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    const previousStatus = sub.status;
    if (immediate) {
      sub.status = SubscriptionStatus.CANCELLED;
      sub.cancelledAt = new Date();
    } else {
      sub.cancelAtPeriodEnd = true;
      sub.cancelledAt = new Date();
    }
    await sub.save();

    await this.subHistoryModel.create({
      tenantId: sub.tenantId,
      subscriptionId: sub._id,
      event: SubscriptionHistoryEventType.CANCELLED,
      previousState: { status: previousStatus },
      newState: {
        status: sub.status,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        cancelledAt: sub.cancelledAt.toISOString(),
      },
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorType: 'PLATFORM_ADMIN',
      metadata: { reason, immediate },
    });

    await this.auditService.log({
      tenantId: sub.tenantId.toString(),
      action: 'SUBSCRIPTION_CANCELLED',
      entity: 'TenantSubscription',
      entityId: sub._id.toString(),
      metadata: { immediate, reason, actorId },
    });

    return this.getSubscriptionById(sub._id.toString());
  }

  async reactivateSubscription(tenantId: string, actorId?: string) {
    const idObj = Types.ObjectId.isValid(tenantId) ? new Types.ObjectId(tenantId) : tenantId;
    const sub = await this.subscriptionModel
      .findOne({ $or: [{ _id: idObj }, { tenantId: idObj }] })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();

    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    sub.status = SubscriptionStatus.ACTIVE;
    sub.cancelAtPeriodEnd = false;
    sub.cancelledAt = undefined;
    const now = new Date();
    const days = sub.billingInterval === BillingInterval.YEARLY ? 365 : 30;
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    await sub.save();

    await this.subHistoryModel.create({
      tenantId: sub.tenantId,
      subscriptionId: sub._id,
      event: SubscriptionHistoryEventType.REACTIVATED,
      newState: { status: SubscriptionStatus.ACTIVE, currentPeriodEnd: sub.currentPeriodEnd.toISOString() },
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorType: 'PLATFORM_ADMIN',
    });

    await this.auditService.log({
      tenantId,
      action: 'SUBSCRIPTION_REACTIVATED',
      entity: 'TenantSubscription',
      entityId: sub._id.toString(),
      metadata: { actorId },
    });

    return this.getSubscriptionById(sub._id.toString());
  }

  async updateManualSubscription(subscriptionId: string, dto: ManualSubscriptionUpdateDto, actorAdminId: string) {
    const sub = await this.subscriptionModel.findById(new Types.ObjectId(subscriptionId)).populate('planId').exec();
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    const previousState = {
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      trialEnd: sub.trialEnd,
    };

    if (dto.status) sub.status = dto.status;
    if (dto.currentPeriodEnd) sub.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    if (dto.trialEnd) sub.trialEnd = new Date(dto.trialEnd);

    await sub.save();

    await this.subHistoryModel.create({
      tenantId: sub.tenantId,
      subscriptionId: sub._id,
      event: SubscriptionHistoryEventType.ACTIVATED,
      previousState,
      newState: {
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        trialEnd: sub.trialEnd?.toISOString(),
        reason: dto.reason,
      },
      actorId: new Types.ObjectId(actorAdminId),
      actorType: 'PLATFORM_ADMIN',
      metadata: { reason: dto.reason },
    });

    await this.auditService.log({
      tenantId: sub.tenantId.toString(),
      action: 'SUBSCRIPTION_MANUAL_OVERRIDE',
      entity: 'TenantSubscription',
      entityId: sub._id.toString(),
      metadata: { reason: dto.reason, actorAdminId },
    });

    return this.getSubscriptionById(sub._id.toString());
  }

  async getSubscriptionById(id: string) {
    const sub = await this.subscriptionModel.findById(new Types.ObjectId(id)).populate('planId').exec();
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    return sub;
  }

  async getSubscriptionByTenant(tenantId: string) {
    const sub = await this.subscriptionModel
      .findOne({ tenantId: new Types.ObjectId(tenantId) })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();

    if (!sub) {
      throw new NotFoundException('Subscription not found for tenant');
    }
    return sub;
  }

  async getSubscriptionHistory(subscriptionId: string) {
    return this.subHistoryModel
      .find({ subscriptionId: new Types.ObjectId(subscriptionId) })
      .sort({ timestamp: -1 })
      .exec();
  }

  async listSubscriptions(params: {
    page?: number;
    limit?: number;
    tenantId?: string;
    status?: SubscriptionStatus;
    planId?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.tenantId) filter.tenantId = new Types.ObjectId(params.tenantId);
    if (params.status) filter.status = params.status;
    if (params.planId) filter.planId = new Types.ObjectId(params.planId);

    const [items, total] = await Promise.all([
      this.subscriptionModel
        .find(filter)
        .populate('planId')
        .populate('tenantId', 'name slug email phone status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.subscriptionModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
