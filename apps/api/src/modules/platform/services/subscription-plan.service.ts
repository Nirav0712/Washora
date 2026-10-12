import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../../../schemas/subscription-plan.schema';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { AuditService } from '../../audit/audit.service';
import { BillingInterval, FeatureKey, LimitKey } from '@washora/shared';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dto/subscription-plan.dto';

@Injectable()
export class SubscriptionPlanService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionPlanService.name);

  constructor(
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
    private auditService: AuditService,
  ) {}

  async onModuleInit() {
    const isDbReady = () => (this.planModel.db?.readyState as number) === 1;

    if (isDbReady()) {
      await this.seedDefaultPlans();
    } else {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2000);
        this.planModel.db?.once('connected', () => {
          clearTimeout(timer);
          resolve();
        });
      });
      if (isDbReady()) {
        await this.seedDefaultPlans();
      } else {
        this.planModel.db?.once('connected', () => {
          this.seedDefaultPlans().catch((err) => {
            this.logger.warn(`Could not seed default plans: ${err?.message || err}`);
          });
        });
      }
    }
  }

  async seedDefaultPlans() {
    if ((this.planModel.db?.readyState as number) !== 1) {
      return;
    }
    try {
      const count = await this.planModel.countDocuments();
      if (count === 0) {
        const defaultPlans = [
          {
            name: 'Starter Plan',
            slug: 'starter',
            description: 'Essential POS and garment lifecycle management for single laundry stores',
            billingInterval: BillingInterval.MONTHLY,
            price: 999,
            currency: 'INR',
            trialDays: 14,
            isActive: true,
            isPublic: true,
            features: {
              [FeatureKey.POS]: true,
              [FeatureKey.CUSTOMERS]: true,
              [FeatureKey.ORDERS]: true,
              [FeatureKey.PROCESSING]: true,
              [FeatureKey.QC]: true,
              [FeatureKey.STAFF]: true,
              [FeatureKey.ATTENDANCE]: false,
              [FeatureKey.PAYROLL]: false,
              [FeatureKey.EXPENSES]: true,
              [FeatureKey.SUPPLIERS]: false,
              [FeatureKey.PURCHASES]: false,
              [FeatureKey.INVENTORY]: false,
              [FeatureKey.FINANCE]: false,
              [FeatureKey.PICKUP_DELIVERY]: false,
              [FeatureKey.NOTIFICATIONS]: true,
              [FeatureKey.WHATSAPP]: false,
              [FeatureKey.CUSTOMER_PORTAL]: true,
              [FeatureKey.CRM]: false,
              [FeatureKey.REPORTS]: true,
              [FeatureKey.MULTI_BRANCH]: false,
            },
            limits: {
              [LimitKey.MAX_BRANCHES]: 1,
              [LimitKey.MAX_STAFF]: 3,
              [LimitKey.MAX_CUSTOMERS]: 500,
              [LimitKey.MAX_MONTHLY_ORDERS]: 300,
              [LimitKey.MAX_USERS]: 2,
              [LimitKey.MAX_PRODUCTS]: 50,
              [LimitKey.MAX_INVENTORY_ITEMS]: 50,
              [LimitKey.MAX_WHATSAPP_MESSAGES]: 0,
              [LimitKey.MAX_STORAGE]: 1,
            },
          },
          {
            name: 'Professional Plan',
            slug: 'professional',
            description: 'Full multi-branch operations, pickup-delivery logistics, staff attendance & payroll',
            billingInterval: BillingInterval.MONTHLY,
            price: 2499,
            currency: 'INR',
            trialDays: 14,
            isActive: true,
            isPublic: true,
            features: {
              [FeatureKey.POS]: true,
              [FeatureKey.CUSTOMERS]: true,
              [FeatureKey.ORDERS]: true,
              [FeatureKey.PROCESSING]: true,
              [FeatureKey.QC]: true,
              [FeatureKey.STAFF]: true,
              [FeatureKey.ATTENDANCE]: true,
              [FeatureKey.PAYROLL]: true,
              [FeatureKey.EXPENSES]: true,
              [FeatureKey.SUPPLIERS]: true,
              [FeatureKey.PURCHASES]: true,
              [FeatureKey.INVENTORY]: true,
              [FeatureKey.FINANCE]: true,
              [FeatureKey.PICKUP_DELIVERY]: true,
              [FeatureKey.NOTIFICATIONS]: true,
              [FeatureKey.WHATSAPP]: true,
              [FeatureKey.CUSTOMER_PORTAL]: true,
              [FeatureKey.CRM]: true,
              [FeatureKey.REPORTS]: true,
              [FeatureKey.MULTI_BRANCH]: true,
            },
            limits: {
              [LimitKey.MAX_BRANCHES]: 3,
              [LimitKey.MAX_STAFF]: 15,
              [LimitKey.MAX_CUSTOMERS]: 3000,
              [LimitKey.MAX_MONTHLY_ORDERS]: 1500,
              [LimitKey.MAX_USERS]: 5,
              [LimitKey.MAX_PRODUCTS]: 200,
              [LimitKey.MAX_INVENTORY_ITEMS]: 300,
              [LimitKey.MAX_WHATSAPP_MESSAGES]: 2000,
              [LimitKey.MAX_STORAGE]: 5,
            },
          },
          {
            name: 'Enterprise Plan',
            slug: 'enterprise',
            description: 'Unlimited capacity, advanced CRM, multi-branch routing, dedicated support',
            billingInterval: BillingInterval.MONTHLY,
            price: 5999,
            currency: 'INR',
            trialDays: 14,
            isActive: true,
            isPublic: true,
            features: {
              [FeatureKey.POS]: true,
              [FeatureKey.CUSTOMERS]: true,
              [FeatureKey.ORDERS]: true,
              [FeatureKey.PROCESSING]: true,
              [FeatureKey.QC]: true,
              [FeatureKey.STAFF]: true,
              [FeatureKey.ATTENDANCE]: true,
              [FeatureKey.PAYROLL]: true,
              [FeatureKey.EXPENSES]: true,
              [FeatureKey.SUPPLIERS]: true,
              [FeatureKey.PURCHASES]: true,
              [FeatureKey.INVENTORY]: true,
              [FeatureKey.FINANCE]: true,
              [FeatureKey.PICKUP_DELIVERY]: true,
              [FeatureKey.NOTIFICATIONS]: true,
              [FeatureKey.WHATSAPP]: true,
              [FeatureKey.CUSTOMER_PORTAL]: true,
              [FeatureKey.CRM]: true,
              [FeatureKey.REPORTS]: true,
              [FeatureKey.MULTI_BRANCH]: true,
            },
            limits: {
              [LimitKey.MAX_BRANCHES]: 15,
              [LimitKey.MAX_STAFF]: 100,
              [LimitKey.MAX_CUSTOMERS]: 50000,
              [LimitKey.MAX_MONTHLY_ORDERS]: 25000,
              [LimitKey.MAX_USERS]: 30,
              [LimitKey.MAX_PRODUCTS]: 2000,
              [LimitKey.MAX_INVENTORY_ITEMS]: 5000,
              [LimitKey.MAX_WHATSAPP_MESSAGES]: 25000,
              [LimitKey.MAX_STORAGE]: 50,
            },
          },
        ];

        for (const plan of defaultPlans) {
          await this.planModel.create(plan);
        }
        this.logger.log('Seeded default Washora SaaS subscription plans');
      }
    } catch (err: any) {
      this.logger.warn(`Could not seed default plans: ${err.message}`);
    }
  }

  async createPlan(dto: CreateSubscriptionPlanDto, actorAdminId?: string) {
    const slug = (dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const existing = await this.planModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException(`Subscription plan with slug "${slug}" already exists`);
    }

    const plan = await this.planModel.create({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim(),
      billingInterval: dto.billingInterval || BillingInterval.MONTHLY,
      price: dto.price,
      currency: (dto.currency || 'INR').toUpperCase().trim(),
      trialDays: dto.trialDays ?? 14,
      isActive: dto.isActive !== false,
      isPublic: dto.isPublic !== false,
      features: dto.features || {},
      limits: dto.limits || {},
    });

    await this.auditService.log({
      action: 'SUBSCRIPTION_PLAN_CREATED',
      entity: 'SubscriptionPlan',
      entityId: plan._id.toString(),
      metadata: { name: plan.name, slug: plan.slug, price: plan.price, actorAdminId },
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto, actorAdminId?: string) {
    const plan = await this.planModel.findById(new Types.ObjectId(id)).exec();
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (dto.name) plan.name = dto.name.trim();
    if (dto.description !== undefined) plan.description = dto.description.trim();
    if (dto.price !== undefined) plan.price = dto.price;
    if (dto.trialDays !== undefined) plan.trialDays = dto.trialDays;
    if (dto.isActive !== undefined) plan.isActive = dto.isActive;
    if (dto.isPublic !== undefined) plan.isPublic = dto.isPublic;
    if (dto.features) plan.features = { ...plan.features, ...dto.features };
    if (dto.limits) plan.limits = { ...plan.limits, ...dto.limits };

    await plan.save();

    await this.auditService.log({
      action: 'SUBSCRIPTION_PLAN_UPDATED',
      entity: 'SubscriptionPlan',
      entityId: plan._id.toString(),
      metadata: { name: plan.name, price: plan.price, actorAdminId },
    });

    return plan;
  }

  async archivePlan(id: string, actorAdminId?: string) {
    const plan = await this.planModel.findById(new Types.ObjectId(id)).exec();
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    plan.isActive = false;
    plan.isPublic = false;
    await plan.save();

    await this.auditService.log({
      action: 'SUBSCRIPTION_PLAN_ARCHIVED',
      entity: 'SubscriptionPlan',
      entityId: plan._id.toString(),
      metadata: { name: plan.name, slug: plan.slug, actorAdminId },
    });

    return plan;
  }

  async deletePlan(id: string, actorAdminId?: string) {
    const plan = await this.planModel.findById(new Types.ObjectId(id)).exec();
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Protection check: Cannot delete plans referenced in subscriptions
    const subCount = await this.subscriptionModel.countDocuments({ planId: plan._id });
    if (subCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan "${plan.name}" because it is referenced by ${subCount} active/historical tenant subscription(s). Please archive it instead.`,
      );
    }

    await this.planModel.findByIdAndDelete(plan._id).exec();

    await this.auditService.log({
      action: 'SUBSCRIPTION_PLAN_DELETED',
      entity: 'SubscriptionPlan',
      entityId: plan._id.toString(),
      metadata: { name: plan.name, slug: plan.slug, actorAdminId },
    });

    return { message: `Plan ${plan.name} deleted successfully` };
  }

  async getPlanById(id: string) {
    const plan = await this.planModel.findById(new Types.ObjectId(id)).exec();
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }

  async getPlanBySlug(slug: string) {
    const plan = await this.planModel.findOne({ slug: slug.toLowerCase().trim() }).exec();
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }

  async listPlans(filters?: { isActive?: boolean; isPublic?: boolean }) {
    const query: any = {};
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;
    if (filters?.isPublic !== undefined) query.isPublic = filters.isPublic;
    return this.planModel.find(query).sort({ price: 1 }).exec();
  }
}
