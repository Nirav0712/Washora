import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Partner, PartnerDocument } from '../../../schemas/partner.schema';
import { PlatformAdmin, PlatformAdminDocument } from '../../../schemas/platform-admin.schema';
import { Tenant, TenantDocument } from '../../../schemas/tenant.schema';
import { TenantSubscription, TenantSubscriptionDocument } from '../../../schemas/tenant-subscription.schema';
import { BillingPayment, BillingPaymentDocument } from '../../../schemas/billing-payment.schema';
import { PlatformAdminRole, PlatformPermission, TenantStatus, BusinessType, SubscriptionStatus } from '@washora/shared';
import { AuditService } from '../../audit/audit.service';
import { TenantLifecycleService } from './tenant-lifecycle.service';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    @InjectModel(Partner.name)
    private partnerModel: Model<PartnerDocument>,
    @InjectModel(PlatformAdmin.name)
    private adminModel: Model<PlatformAdminDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantSubscription.name)
    private subscriptionModel: Model<TenantSubscriptionDocument>,
    @InjectModel(BillingPayment.name)
    private paymentModel: Model<BillingPaymentDocument>,
    private auditService: AuditService,
    private tenantLifecycleService: TenantLifecycleService,
  ) {}

  async createPartner(
    data: {
      name: string;
      email: string;
      phone?: string;
      companyName?: string;
      code: string;
      commissionRate?: number;
      password?: string;
    },
    actorId?: string,
  ): Promise<PartnerDocument> {
    const existingCode = await this.partnerModel.findOne({ code: data.code.toUpperCase() }).exec();
    if (existingCode) {
      throw new ConflictException(`Partner code "${data.code}" is already in use`);
    }

    const existingAdmin = await this.adminModel.findOne({ email: data.email.toLowerCase() }).exec();
    if (existingAdmin) {
      throw new ConflictException(`Admin account with email "${data.email}" already exists`);
    }

    // 1. Create Partner record
    const partner = new this.partnerModel({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      companyName: data.companyName,
      code: data.code.toUpperCase(),
      commissionRate: data.commissionRate !== undefined ? data.commissionRate : 15,
      isActive: true,
      assignedTenantIds: [],
      metrics: {
        totalTenants: 0,
        activeTenants: 0,
        trialTenants: 0,
        monthlyRevenue: 0,
      },
    });

    const savedPartner = await partner.save();

    // 2. Create PlatformAdmin with PARTNER_ADMIN role
    const defaultPassword = data.password || 'Partner@123456';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const partnerAdmin = new this.adminModel({
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role: PlatformAdminRole.PARTNER_ADMIN,
      permissions: [
        PlatformPermission.DASHBOARD_VIEW,
        PlatformPermission.PARTNER_CLIENTS_MANAGE,
        PlatformPermission.PARTNER_REPORTS_VIEW,
      ],
      partnerId: savedPartner._id,
      isActive: true,
    });

    await partnerAdmin.save();

    savedPartner.adminUserId = partnerAdmin._id as Types.ObjectId;
    await savedPartner.save();

    await this.auditService.log({
      action: 'partner.created',
      entity: 'PARTNER',
      entityId: (savedPartner._id as Types.ObjectId).toString(),
      metadata: {
        actorId: actorId || 'SYSTEM',
        code: savedPartner.code,
        name: savedPartner.name,
        email: savedPartner.email,
        commissionRate: savedPartner.commissionRate,
      },
    });

    return savedPartner;
  }

  async findAll(query?: { search?: string; isActive?: boolean }): Promise<any[]> {
    const filter: any = {};
    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    if (query?.search) {
      const q = query.search;
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
      ];
    }

    const partners = await this.partnerModel.find(filter).sort({ createdAt: -1 }).exec();

    // Enrich with live metrics
    return Promise.all(
      partners.map(async (partner) => {
        const tenantCount = await this.tenantModel.countDocuments({ partnerId: partner._id }).exec();
        const activeCount = await this.tenantModel.countDocuments({
          partnerId: partner._id,
          status: TenantStatus.ACTIVE,
        }).exec();
        const trialCount = await this.tenantModel.countDocuments({
          partnerId: partner._id,
          status: TenantStatus.TRIAL,
        }).exec();

        // Calculate revenue for assigned tenants
        const tenantIds = await this.tenantModel.find({ partnerId: partner._id }).distinct('_id').exec();
        const payments = await this.paymentModel.aggregate([
          { $match: { tenantId: { $in: tenantIds }, status: 'SUCCESS' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).exec();

        const totalRevenue = payments[0]?.total || 0;
        const estimatedCommission = Math.round((totalRevenue * (partner.commissionRate || 15)) / 100);

        return {
          id: (partner._id as Types.ObjectId).toString(),
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          companyName: partner.companyName,
          code: partner.code,
          commissionRate: partner.commissionRate,
          isActive: partner.isActive,
          adminUserId: partner.adminUserId?.toString(),
          metrics: {
            totalTenants: tenantCount,
            activeTenants: activeCount,
            trialTenants: trialCount,
            monthlyRevenue: totalRevenue,
            estimatedCommission,
          },
          createdAt: (partner as any).createdAt,
          updatedAt: (partner as any).updatedAt,
        };
      }),
    );
  }

  async findById(id: string): Promise<any> {
    const partner = await this.partnerModel.findById(id).exec();
    if (!partner) {
      throw new NotFoundException(`Partner with ID "${id}" not found`);
    }

    const assignedTenants = await this.tenantModel
      .find({ partnerId: partner._id })
      .select('name slug businessType phone email status createdAt')
      .sort({ createdAt: -1 })
      .exec();

    return {
      id: (partner._id as Types.ObjectId).toString(),
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      companyName: partner.companyName,
      code: partner.code,
      commissionRate: partner.commissionRate,
      isActive: partner.isActive,
      adminUserId: partner.adminUserId?.toString(),
      assignedTenants,
      createdAt: (partner as any).createdAt,
      updatedAt: (partner as any).updatedAt,
    };
  }

  async updatePartner(
    id: string,
    data: { name?: string; phone?: string; companyName?: string; commissionRate?: number; isActive?: boolean },
    actorId?: string,
  ): Promise<PartnerDocument> {
    const partner = await this.partnerModel.findById(id).exec();
    if (!partner) {
      throw new NotFoundException(`Partner with ID "${id}" not found`);
    }

    if (data.name) partner.name = data.name;
    if (data.phone !== undefined) partner.phone = data.phone;
    if (data.companyName !== undefined) partner.companyName = data.companyName;
    if (data.commissionRate !== undefined) partner.commissionRate = data.commissionRate;
    if (data.isActive !== undefined) partner.isActive = data.isActive;

    await partner.save();

    await this.auditService.log({
      action: 'partner.updated',
      entity: 'PARTNER',
      entityId: (partner._id as Types.ObjectId).toString(),
      metadata: {
        actorId: actorId || 'SYSTEM',
        ...data,
      },
    });

    return partner;
  }

  async assignTenant(partnerId: string, tenantId: string, actorId?: string): Promise<TenantDocument> {
    const partner = await this.partnerModel.findById(partnerId).exec();
    if (!partner) {
      throw new NotFoundException(`Partner with ID "${partnerId}" not found`);
    }

    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${tenantId}" not found`);
    }

    tenant.partnerId = partner._id as Types.ObjectId;
    tenant.partnerCode = partner.code;
    await tenant.save();

    if (!partner.assignedTenantIds.some((tId) => tId.toString() === tenantId)) {
      partner.assignedTenantIds.push(tenant._id as Types.ObjectId);
      await partner.save();
    }

    await this.auditService.log({
      action: 'partner.tenant_assigned',
      entity: 'TENANT',
      entityId: tenantId,
      metadata: {
        actorId: actorId || 'SYSTEM',
        partnerId,
        partnerCode: partner.code,
        partnerName: partner.name,
      },
    });

    return tenant;
  }

  // ==========================================
  // PARTNER SCOPED PORTAL METHODS (Partner Admin)
  // ==========================================

  async getPartnerDashboard(partnerId: string): Promise<any> {
    const partner = await this.partnerModel.findById(partnerId).exec();
    if (!partner) {
      throw new NotFoundException('Partner account not found');
    }

    const tenants = await this.tenantModel
      .find({ partnerId: partner._id })
      .select('name slug businessType phone email status createdAt')
      .sort({ createdAt: -1 })
      .exec();

    const tenantIds = tenants.map((t) => t._id);

    const subscriptions = await this.subscriptionModel
      .find({ tenantId: { $in: tenantIds } })
      .populate('planId', 'name price billingInterval')
      .exec();

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === TenantStatus.ACTIVE).length;
    const trialTenants = tenants.filter((t) => t.status === TenantStatus.TRIAL).length;

    // Revenue calculation
    const payments = await this.paymentModel.aggregate([
      { $match: { tenantId: { $in: tenantIds }, status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).exec();

    const monthlyRevenue = payments[0]?.total || 0;
    const commissionRate = partner.commissionRate || 15;
    const estimatedCommission = Math.round((monthlyRevenue * commissionRate) / 100);

    return {
      partner: {
        id: (partner._id as Types.ObjectId).toString(),
        name: partner.name,
        companyName: partner.companyName,
        code: partner.code,
        commissionRate,
      },
      metrics: {
        totalTenants,
        activeTenants,
        trialTenants,
        monthlyRevenue,
        estimatedCommission,
      },
      tenants: tenants.map((t) => {
        const sub = subscriptions.find((s) => s.tenantId.toString() === t._id.toString());
        return {
          id: (t._id as Types.ObjectId).toString(),
          name: t.name,
          slug: t.slug,
          businessType: t.businessType,
          phone: t.phone,
          email: t.email,
          status: t.status,
          subscription: sub
            ? {
                status: sub.status,
                planName: (sub.planId as any)?.name || 'Standard',
                billingInterval: sub.billingInterval,
                currentPeriodEnd: sub.currentPeriodEnd,
              }
            : null,
          createdAt: (t as any).createdAt,
        };
      }),
    };
  }

  async getPartnerClients(partnerId: string): Promise<any[]> {
    const partnerObjId = Types.ObjectId.isValid(partnerId) ? new Types.ObjectId(partnerId) : partnerId;
    const tenants = await this.tenantModel
      .find({ $or: [{ partnerId: partnerObjId }, { partnerId }] })
      .select('name slug businessType phone email status createdAt')
      .sort({ createdAt: -1 })
      .exec();

    const tenantIds = tenants.map((t) => t._id);
    const subscriptions = await this.subscriptionModel
      .find({ tenantId: { $in: tenantIds } })
      .populate('planId', 'name price billingInterval')
      .exec();

    return tenants.map((t) => {
      const sub = subscriptions.find((s) => s.tenantId.toString() === t._id.toString());
      return {
        id: (t._id as Types.ObjectId).toString(),
        name: t.name,
        slug: t.slug,
        businessType: t.businessType,
        phone: t.phone,
        email: t.email,
        status: t.status,
        planName: (sub?.planId as any)?.name || 'Free Trial',
        subscriptionStatus: sub?.status || SubscriptionStatus.TRIALING,
        renewalDate: sub?.currentPeriodEnd || null,
        createdAt: (t as any).createdAt,
      };
    });
  }

  async getPartnerClientDetail(partnerId: string, tenantId: string): Promise<any> {
    const partnerObjId = Types.ObjectId.isValid(partnerId) ? new Types.ObjectId(partnerId) : partnerId;
    const tenantObjId = Types.ObjectId.isValid(tenantId) ? new Types.ObjectId(tenantId) : tenantId;
    const tenant = await this.tenantModel.findOne({ _id: tenantObjId, $or: [{ partnerId: partnerObjId }, { partnerId }] }).exec();
    if (!tenant) {
      throw new NotFoundException(`Client shop not found under your partner account`);
    }

    const subscription = await this.subscriptionModel
      .findOne({ tenantId: tenant._id })
      .populate('planId')
      .exec();

    const payments = await this.paymentModel
      .find({ tenantId: tenant._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return {
      tenant: {
        id: (tenant._id as Types.ObjectId).toString(),
        name: tenant.name,
        slug: tenant.slug,
        businessType: tenant.businessType,
        phone: tenant.phone,
        email: tenant.email,
        status: tenant.status,
        address: tenant.address,
        gstNumber: tenant.gstNumber,
        createdAt: (tenant as any).createdAt,
      },
      subscription: subscription
        ? {
            id: (subscription._id as Types.ObjectId).toString(),
            status: subscription.status,
            plan: subscription.planId,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialEnd: subscription.trialEnd,
          }
        : null,
      recentPayments: payments,
    };
  }

  async onboardClientUnderPartner(
    partnerId: string,
    dto: {
      shopName: string;
      ownerName: string;
      ownerEmail: string;
      ownerPhone: string;
      password?: string;
      businessType?: BusinessType;
      planSlug?: string;
    },
  ): Promise<any> {
    const partner = await this.partnerModel.findById(partnerId).exec();
    if (!partner) {
      throw new NotFoundException('Partner account not found');
    }

    // Call TenantLifecycleService to provision tenant & owner user
    const result = await this.tenantLifecycleService.provisionTenant({
      businessName: dto.shopName,
      ownerEmail: dto.ownerEmail,
      ownerName: dto.ownerName,
      ownerPhone: dto.ownerPhone,
      ownerPassword: dto.password || 'Washora@123456',
      businessType: dto.businessType || BusinessType.LAUNDRY,
    });

    // Assign to Partner
    const tenant = await this.tenantModel.findById(result.tenant.id).exec();
    if (tenant) {
      tenant.partnerId = partner._id as Types.ObjectId;
      tenant.partnerCode = partner.code;
      await tenant.save();

      partner.assignedTenantIds.push(tenant._id as Types.ObjectId);
      await partner.save();
    }

    await this.auditService.log({
      action: 'partner.client_onboarded',
      entity: 'TENANT',
      entityId: result.tenant.id,
      metadata: {
        partnerId,
        partnerCode: partner.code,
        shopName: dto.shopName,
        ownerEmail: dto.ownerEmail,
      },
    });

    return result;
  }
}
