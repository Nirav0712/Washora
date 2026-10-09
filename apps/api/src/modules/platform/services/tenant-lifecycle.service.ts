import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../../../schemas/tenant.schema';
import { User, UserDocument } from '../../../schemas/user.schema';
import { Branch, BranchDocument } from '../../../schemas/branch.schema';
import { Membership, MembershipDocument } from '../../../schemas/membership.schema';
import { Role, RoleDocument } from '../../../schemas/role.schema';
import { Customer, CustomerDocument } from '../../../schemas/customer.schema';
import { Order, OrderDocument } from '../../../schemas/order.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../../../schemas/subscription-plan.schema';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { SubscriptionHistory, SubscriptionHistoryDocument } from '../../../schemas/subscription-history.schema';
import { AuditService } from '../../audit/audit.service';
import { PasswordUtil } from '../../../common/utils/password.util';
import {
  TenantStatus,
  RoleType,
  MembershipStatus,
  BusinessType,
  SubscriptionStatus,
  BillingInterval,
  SubscriptionHistoryEventType,
  Tenant360Overview,
} from '@washora/shared';
import { ProvisionTenantDto, UpdateTenantAdminDto } from '../dto/platform-tenant.dto';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Valid Lifecycle Transitions Matrix
const ALLOWED_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  [TenantStatus.PROVISIONING]: [TenantStatus.TRIAL, TenantStatus.ACTIVE, TenantStatus.CANCELLED],
  [TenantStatus.TRIAL]: [TenantStatus.ACTIVE, TenantStatus.PAST_DUE, TenantStatus.SUSPENDED, TenantStatus.CANCELLED, TenantStatus.EXPIRED],
  [TenantStatus.ACTIVE]: [TenantStatus.PAST_DUE, TenantStatus.SUSPENDED, TenantStatus.CANCELLED],
  [TenantStatus.PAST_DUE]: [TenantStatus.ACTIVE, TenantStatus.SUSPENDED, TenantStatus.CANCELLED],
  [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.CANCELLED, TenantStatus.ARCHIVED],
  [TenantStatus.EXPIRED]: [TenantStatus.ACTIVE, TenantStatus.SUSPENDED, TenantStatus.CANCELLED, TenantStatus.ARCHIVED],
  [TenantStatus.CANCELLED]: [TenantStatus.ARCHIVED, TenantStatus.ACTIVE, TenantStatus.TRIAL],
  [TenantStatus.ARCHIVED]: [], // Terminal state
};

@Injectable()
export class TenantLifecycleService {
  private readonly logger = new Logger(TenantLifecycleService.name);

  constructor(
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Branch.name)
    private branchModel: Model<BranchDocument>,
    @InjectModel(Membership.name)
    private membershipModel: Model<MembershipDocument>,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
    @InjectModel(SubscriptionHistory.name)
    private subHistoryModel: Model<SubscriptionHistoryDocument>,
    private auditService: AuditService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async provisionTenant(dto: ProvisionTenantDto, actorAdminId?: string) {
    const slug = (dto.slug || dto.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const existingTenant = await this.tenantModel.findOne({ slug }).exec();
    if (existingTenant) {
      throw new ConflictException(`Tenant with slug "${slug}" already exists`);
    }

    const email = dto.ownerEmail.toLowerCase().trim();
    let user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      const password = dto.ownerPassword || 'Washora@123';
      const passwordHash = await PasswordUtil.hash(password);
      user = await this.userModel.create({
        email,
        name: dto.ownerName.trim(),
        phone: dto.ownerPhone.trim(),
        passwordHash,
      });
    }

    // 1. Create Tenant
    const tenant = await this.tenantModel.create({
      name: dto.businessName.trim(),
      slug,
      businessType: dto.businessType || BusinessType.LAUNDRY,
      phone: dto.ownerPhone.trim(),
      email,
      address: dto.address?.trim(),
      status: TenantStatus.TRIAL,
      settings: { isVerified: false },
    });

    const tenantId = tenant._id;

    // 2. Create Primary Branch
    const branch = await this.branchModel.create({
      tenantId,
      name: dto.primaryBranchName?.trim() || 'Main Branch',
      code: 'MB-01',
      phone: dto.ownerPhone.trim(),
      email,
      address: dto.address?.trim() || 'Headquarters',
      isMainBranch: true,
      isActive: true,
    });

    // 3. Find or Create SHOP_OWNER Role
    let role = await this.roleModel.findOne({ tenantId, code: RoleType.SHOP_OWNER }).exec();
    if (!role) {
      role = await this.roleModel.create({
        tenantId,
        name: 'Shop Owner',
        code: RoleType.SHOP_OWNER,
        permissions: ['*'],
        isSystem: true,
      });
    }

    // 4. Create Membership
    await this.membershipModel.create({
      userId: user._id,
      tenantId,
      branchIds: [branch._id],
      roleId: role._id,
      status: MembershipStatus.ACTIVE,
    });

    // 5. Attach Subscription Plan
    let plan: SubscriptionPlanDocument | null = null;
    if (dto.planId) {
      plan = await this.planModel.findById(new Types.ObjectId(dto.planId)).exec();
    }
    if (!plan) {
      plan = await this.planModel.findOne({ slug: 'starter' }).exec();
    }
    if (!plan) {
      plan = await this.planModel.findOne({ isActive: true }).exec();
    }

    if (plan) {
      const trialDays = dto.trialDays ?? plan.trialDays ?? 14;
      const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      const subscription = await this.subscriptionModel.create({
        tenantId,
        planId: plan._id,
        status: SubscriptionStatus.TRIALING,
        billingInterval: plan.billingInterval || BillingInterval.MONTHLY,
        startDate: new Date(),
        trialStart: new Date(),
        trialEnd,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
      });

      await this.subHistoryModel.create({
        tenantId,
        subscriptionId: subscription._id,
        event: SubscriptionHistoryEventType.TRIAL_STARTED,
        newState: {
          planId: plan._id.toString(),
          planName: plan.name,
          trialDays,
          trialEnd: trialEnd.toISOString(),
          status: SubscriptionStatus.TRIALING,
        },
        actorId: actorAdminId ? new Types.ObjectId(actorAdminId) : undefined,
        actorType: actorAdminId ? 'PLATFORM_ADMIN' : 'SYSTEM',
        metadata: { businessName: tenant.name },
      });
    }

    await this.auditService.log({
      tenantId: tenantId.toString(),
      action: 'TENANT_PROVISIONED',
      entity: 'Tenant',
      entityId: tenantId.toString(),
      metadata: { slug: tenant.slug, ownerEmail: email, actorAdminId },
    });

    return this.getTenant360(tenantId.toString());
  }

  async transitionStatus(tenantId: string, targetStatus: TenantStatus, reason: string, actorAdminId?: string) {
    const tenant = await this.tenantModel.findById(new Types.ObjectId(tenantId)).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const currentStatus = tenant.status || TenantStatus.ACTIVE;

    if (currentStatus === targetStatus) {
      return tenant;
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid lifecycle state transition from "${currentStatus}" to "${targetStatus}". Allowed next states: ${allowed.join(', ') || 'None (Terminal state)'}`,
      );
    }

    tenant.status = targetStatus;
    if (!tenant.settings) tenant.settings = {};
    tenant.settings.lifecycleNotes = `${new Date().toISOString()}: Transitioned to ${targetStatus}. Reason: ${reason}`;
    await tenant.save();

    // Synchronize subscription if suspended or cancelled
    if (targetStatus === TenantStatus.SUSPENDED || targetStatus === TenantStatus.CANCELLED) {
      await this.subscriptionModel.updateMany(
        { tenantId: tenant._id, status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
        { status: targetStatus === TenantStatus.SUSPENDED ? SubscriptionStatus.PAUSED : SubscriptionStatus.CANCELLED },
      );
    } else if (targetStatus === TenantStatus.ACTIVE) {
      await this.subscriptionModel.updateMany(
        { tenantId: tenant._id, status: SubscriptionStatus.PAUSED },
        { status: SubscriptionStatus.ACTIVE },
      );
    }

    await this.auditService.log({
      tenantId,
      action: 'TENANT_LIFECYCLE_CHANGED',
      entity: 'Tenant',
      entityId: tenant._id.toString(),
      metadata: { previousStatus: currentStatus, newStatus: targetStatus, reason, actorAdminId },
    });

    return tenant;
  }

  async verifyTenant(tenantId: string, isVerified: boolean, actorAdminId?: string) {
    const tenant = await this.tenantModel.findById(new Types.ObjectId(tenantId)).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.settings) tenant.settings = {};
    tenant.settings.isVerified = isVerified;
    await tenant.save();

    await this.auditService.log({
      tenantId,
      action: isVerified ? 'TENANT_VERIFIED' : 'TENANT_UNVERIFIED',
      entity: 'Tenant',
      entityId: tenant._id.toString(),
      metadata: { isVerified, actorAdminId },
    });

    return tenant;
  }

  async updateTenant(tenantId: string, dto: UpdateTenantAdminDto, actorAdminId?: string) {
    const tenant = await this.tenantModel.findById(new Types.ObjectId(tenantId)).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (dto.name) tenant.name = dto.name.trim();
    if (dto.phone) tenant.phone = dto.phone.trim();
    if (dto.email) tenant.email = dto.email.trim().toLowerCase();
    if (dto.address) tenant.address = dto.address.trim();
    if (dto.gstNumber) tenant.gstNumber = dto.gstNumber.trim();
    if (dto.status && dto.status !== tenant.status) {
      return this.transitionStatus(tenantId, dto.status, 'Updated via platform admin', actorAdminId);
    }

    await tenant.save();

    await this.auditService.log({
      tenantId,
      action: 'TENANT_UPDATED',
      entity: 'Tenant',
      entityId: tenant._id.toString(),
      metadata: { name: tenant.name, actorAdminId },
    });

    return tenant;
  }

  async getTenant360(tenantId: string): Promise<Tenant360Overview> {
    const tenant = await this.tenantModel.findById(new Types.ObjectId(tenantId)).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Owner info from Membership
    const ownerMembership = await this.membershipModel
      .findOne({ tenantId: tenant._id })
      .populate('userId')
      .exec();
    const ownerUser = ownerMembership?.userId as any;

    // Subscription
    const subscription = await this.subscriptionModel
      .findOne({ tenantId: tenant._id })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();
    const plan = subscription?.planId as any;

    // Aggregate stats
    const [branchesCount, staffCount, customersCount, ordersCount, orderStats] = await Promise.all([
      this.branchModel.countDocuments({ tenantId: tenant._id, isActive: true }),
      this.membershipModel.countDocuments({ tenantId: tenant._id, status: MembershipStatus.ACTIVE }),
      this.customerModel.countDocuments({ tenantId: tenant._id, isDeleted: { $ne: true } }),
      this.orderModel.countDocuments({ tenantId: tenant._id }),
      this.orderModel.aggregate([
        { $match: { tenantId: tenant._id } },
        { $group: { _id: null, totalRevenue: { $sum: '$paidAmount' } } },
      ]),
    ]);

    const limits = plan?.limits || {
      MAX_BRANCHES: 1,
      MAX_STAFF: 5,
      MAX_CUSTOMERS: 500,
      MAX_MONTHLY_ORDERS: 300,
      MAX_USERS: 3,
      MAX_PRODUCTS: 50,
      MAX_INVENTORY_ITEMS: 50,
    };

    const warnings: string[] = [];
    const bLimit = limits.MAX_BRANCHES || 1;
    const sLimit = limits.MAX_STAFF || 5;
    const cLimit = limits.MAX_CUSTOMERS || 500;
    const oLimit = limits.MAX_MONTHLY_ORDERS || 300;

    if (branchesCount >= bLimit) warnings.push('Branch limit reached or exceeded');
    if (staffCount >= sLimit) warnings.push('Staff limit reached or exceeded');
    if (customersCount >= cLimit) warnings.push('Customer limit reached or exceeded');

    return {
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        businessType: tenant.businessType,
        isVerified: !!tenant.settings?.isVerified,
        createdAt: (tenant as any).createdAt?.toISOString() || new Date().toISOString(),
      },
      owner: {
        id: ownerUser?._id?.toString(),
        name: ownerUser?.name,
        email: ownerUser?.email,
        phone: ownerUser?.phone,
      },
      subscription: subscription ? {
        id: subscription._id.toString(),
        planName: plan?.name || 'Standard Plan',
        status: subscription.status,
        billingInterval: subscription.billingInterval,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        trialEnd: subscription.trialEnd?.toISOString(),
        price: plan?.price || 0,
      } : undefined,
      stats: {
        branchesCount,
        staffCount,
        customersCount,
        ordersCount,
        totalRevenue: orderStats[0]?.totalRevenue || 0,
      },
      usage: {
        tenantId: tenant._id.toString(),
        tenantName: tenant.name,
        planName: plan?.name || 'Standard Plan',
        metrics: {
          branches: {
            current: branchesCount,
            limit: bLimit,
            percentage: Math.min(100, Math.round((branchesCount / bLimit) * 100)),
          },
          staff: {
            current: staffCount,
            limit: sLimit,
            percentage: Math.min(100, Math.round((staffCount / sLimit) * 100)),
          },
          customers: {
            current: customersCount,
            limit: cLimit,
            percentage: Math.min(100, Math.round((customersCount / cLimit) * 100)),
          },
          monthlyOrders: {
            current: ordersCount,
            limit: oLimit,
            percentage: Math.min(100, Math.round((ordersCount / oLimit) * 100)),
          },
          users: {
            current: staffCount,
            limit: limits.MAX_USERS || 5,
            percentage: Math.min(100, Math.round((staffCount / (limits.MAX_USERS || 5)) * 100)),
          },
          products: {
            current: 0,
            limit: limits.MAX_PRODUCTS || 100,
            percentage: 0,
          },
          inventoryItems: {
            current: 0,
            limit: limits.MAX_INVENTORY_ITEMS || 100,
            percentage: 0,
          },
        },
        warnings,
      },
    };
  }

  async listTenants(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: TenantStatus;
    businessType?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.status) {
      filter.status = params.status;
    }
    if (params.businessType) {
      filter.businessType = params.businessType;
    }
    if (params.search) {
      const regex = new RegExp(params.search.trim(), 'i');
      filter.$or = [{ name: regex }, { slug: regex }, { email: regex }, { phone: regex }];
    }

    const [tenants, total] = await Promise.all([
      this.tenantModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.tenantModel.countDocuments(filter),
    ]);

    // Populate subscriptions and owner memberships for list view
    const tenantIds = tenants.map((t) => t._id);
    const [subscriptions, memberships] = await Promise.all([
      this.subscriptionModel
        .find({ tenantId: { $in: tenantIds } })
        .populate('planId')
        .sort({ createdAt: -1 })
        .exec(),
      this.membershipModel
        .find({ tenantId: { $in: tenantIds } })
        .populate('userId')
        .exec(),
    ]);

    const subMap = new Map<string, any>();
    subscriptions.forEach((s) => {
      const tid = s.tenantId.toString();
      if (!subMap.has(tid)) {
        subMap.set(tid, s);
      }
    });

    const memberMap = new Map<string, any>();
    memberships.forEach((m) => {
      const tid = m.tenantId.toString();
      if (!memberMap.has(tid) && m.userId) {
        memberMap.set(tid, m.userId);
      }
    });

    const items = tenants.map((t) => {
      const tid = t._id.toString();
      const sub = subMap.get(tid);
      const plan = sub?.planId as any;
      const owner = memberMap.get(tid);

      return {
        id: tid,
        name: t.name,
        slug: t.slug,
        businessType: t.businessType,
        status: t.status,
        phone: t.phone,
        email: t.email,
        ownerName: owner?.name || t.name,
        ownerEmail: owner?.email || t.email,
        ownerPhone: owner?.phone || t.phone,
        ownerLastLogin: owner?.lastLoginAt || null,
        partnerCode: t.partnerCode || null,
        partnerId: t.partnerId ? t.partnerId.toString() : null,
        isVerified: !!t.settings?.isVerified,
        planName: plan?.name || 'No Plan',
        planSlug: plan?.slug || null,
        subscriptionStatus: sub?.status || 'NONE',
        trialStart: sub?.trialStart || null,
        trialEnd: sub?.trialEnd || null,
        currentPeriodEnd: sub?.currentPeriodEnd || null,
        createdAt: (t as any).createdAt,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async impersonateTenant(tenantId: string, admin: any) {
    const tenant = await this.tenantModel.findById(new Types.ObjectId(tenantId)).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.CANCELLED || tenant.status === TenantStatus.ARCHIVED) {
      throw new BadRequestException(`Cannot impersonate tenant in ${tenant.status} status. Please reactivate tenant first.`);
    }

    // Find owner membership
    const ownerMembership = await this.membershipModel
      .findOne({ tenantId: tenant._id, status: MembershipStatus.ACTIVE })
      .populate('userId')
      .exec();

    if (!ownerMembership || !ownerMembership.userId) {
      throw new NotFoundException('Active owner account not found for this tenant');
    }

    const ownerUser = ownerMembership.userId as any;

    const accessSecret =
      this.configService.get<string>('jwt.accessSecret') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'washora_access_token_secret_key_prod_2026_x89q';

    const payload = {
      sub: ownerUser._id.toString(),
      membershipId: ownerMembership._id.toString(),
      tenantId: tenant._id.toString(),
      isImpersonated: true,
      impersonatedBy: admin.adminId || admin.id,
      impersonatorEmail: admin.email,
      impersonatorName: admin.name || 'Platform Admin',
      shopName: tenant.name,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: '2h',
    });

    await this.auditService.log({
      tenantId: tenant._id.toString(),
      action: 'PLATFORM_IMPERSONATION_STARTED',
      entity: 'Tenant',
      entityId: tenant._id.toString(),
      metadata: {
        adminId: admin.adminId || admin.id,
        adminEmail: admin.email,
        adminName: admin.name,
        targetTenantId: tenant._id.toString(),
        targetShopName: tenant.name,
        targetOwnerEmail: ownerUser.email,
      },
    });

    return {
      accessToken,
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      },
      user: {
        id: ownerUser._id.toString(),
        name: ownerUser.name,
        email: ownerUser.email,
        phone: ownerUser.phone,
        role: RoleType.SHOP_OWNER,
      },
      isImpersonated: true,
      impersonatedBy: admin.adminId || admin.id,
      impersonatorName: admin.name || 'Platform Super Admin',
      impersonatorEmail: admin.email,
    };
  }

  async resetTenantPassword(tenantId: string, admin: any) {
    const tenant = await this.tenantModel.findById(new Types.ObjectId(tenantId)).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const ownerMembership = await this.membershipModel
      .findOne({ tenantId: tenant._id })
      .populate('userId')
      .exec();

    if (!ownerMembership || !ownerMembership.userId) {
      throw new NotFoundException('Owner account not found for this tenant');
    }

    const ownerUser = await this.userModel.findById((ownerMembership.userId as any)._id).exec();
    if (!ownerUser) {
      throw new NotFoundException('Owner user record not found');
    }

    // Generate random secure temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let tempPassword = 'W@sh';
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    ownerUser.passwordHash = await PasswordUtil.hash(tempPassword);
    await ownerUser.save();

    await this.auditService.log({
      tenantId: tenant._id.toString(),
      action: 'PLATFORM_TENANT_PASSWORD_RESET',
      entity: 'User',
      entityId: ownerUser._id.toString(),
      metadata: {
        adminId: admin.adminId || admin.id,
        adminEmail: admin.email,
        tenantId: tenant._id.toString(),
        ownerEmail: ownerUser.email,
      },
    });

    return {
      success: true,
      message: 'Temporary password generated successfully. It will only be shown once.',
      temporaryPassword: tempPassword,
      ownerEmail: ownerUser.email,
      ownerName: ownerUser.name,
    };
  }
}
