import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';
import { Membership, MembershipDocument } from '../../schemas/membership.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { Role, RoleDocument } from '../../schemas/role.schema';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { Service, ServiceDocument } from '../../schemas/service.schema';
import { RolesService } from '../roles/roles.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { PasswordUtil } from '../../common/utils/password.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RoleType, MembershipStatus, TenantStatus, BusinessType } from '@washora/shared';

import { SubscriptionPlan, SubscriptionPlanDocument } from '../../schemas/subscription-plan.schema';
import { TenantSubscription, TenantSubscriptionDocument } from '../../schemas/tenant-subscription.schema';
import { SubscriptionStatus, BillingInterval } from '@washora/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Membership.name) private membershipModel: Model<MembershipDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(TenantSubscription.name) private subscriptionModel: Model<TenantSubscriptionDocument>,
    private rolesService: RolesService,
    private settingsService: SettingsService,
    private auditService: AuditService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async generateTokens(userId: string, membershipId: string, tenantId: string) {
    const payload = {
      sub: userId,
      membershipId,
      tenantId,
    };

    const accessSecret =
      this.configService.get<string>('jwt.accessSecret') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'washora_access_token_secret_key_prod_2026_x89q';

    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ||
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'washora_refresh_token_secret_key_prod_2026_z72k';

    const accessExpiresIn =
      this.configService.get<string>('jwt.accessExpiresIn') ||
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
      '15m';

    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ||
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
      '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    // 1. Generate unique tenant slug
    let baseSlug = this.slugify(dto.tenantName);
    let slug = baseSlug;
    let counter = 1;
    while (await this.tenantModel.findOne({ slug }).exec()) {
      slug = `${baseSlug}-${counter++}`;
    }

    // 2. Create Tenant
    const tenant = new this.tenantModel({
      name: dto.tenantName,
      slug,
      businessType: dto.businessType || BusinessType.LAUNDRY,
      phone: dto.phone,
      email: dto.email.toLowerCase(),
      gstNumber: dto.gstNumber,
      partnerCode: dto.partnerCode ? dto.partnerCode.toUpperCase() : undefined,
      status: TenantStatus.ACTIVE,
    });
    await tenant.save();

    // 3. Create User
    const passwordHash = await PasswordUtil.hash(dto.password);
    const user = new this.userModel({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      passwordHash,
      isActive: true,
      emailVerified: true,
      lastLoginAt: new Date(),
    });
    await user.save();

    // 4. Create Default System Roles for the Tenant
    const tenantRoles = await this.rolesService.createDefaultTenantRoles(tenant._id as Types.ObjectId);
    const ownerRole = tenantRoles[RoleType.SHOP_OWNER];

    // 5. Create Default Branch for the Tenant
    const branch = new this.branchModel({
      tenantId: tenant._id,
      name: dto.branchName || 'Main Hub Branch',
      code: 'MAIN-01',
      phone: dto.phone,
      email: dto.email.toLowerCase(),
      city: dto.branchCity || 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      taxRate: 5.0,
      isActive: true,
      isMainHub: true,
    });
    await branch.save();

    // 6. Create Default Tenant Settings
    await this.settingsService.getOrCreate(tenant._id);

    // 7. Create Owner Membership
    const membership = new this.membershipModel({
      userId: user._id,
      tenantId: tenant._id,
      roleId: ownerRole._id,
      branchIds: [branch._id],
      status: MembershipStatus.ACTIVE,
    });
    await membership.save();

    // 8. Seed default initial categories & services for new tenant
    await this.seedInitialTenantCatalog(tenant._id as Types.ObjectId);

    // 8.5. Create 14-Day Free Trial Subscription if none exists
    try {
      const existingSub = await this.subscriptionModel.findOne({ tenantId: tenant._id }).exec();
      if (!existingSub) {
        let starterPlan = await this.planModel.findOne({ slug: 'starter' }).exec();
        if (!starterPlan) {
          starterPlan = await this.planModel.findOne({ isActive: true }).exec();
        }
        if (starterPlan) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          await this.subscriptionModel.create({
            tenantId: tenant._id,
            planId: starterPlan._id,
            status: SubscriptionStatus.TRIALING,
            billingInterval: BillingInterval.MONTHLY,
            startDate: now,
            trialStart: now,
            trialEnd,
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            cancelAtPeriodEnd: false,
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not attach trial subscription on register: ${err.message}`);
    }

    // 9. Generate JWT Tokens
    const tokens = await this.generateTokens(
      user._id.toString(),
      membership._id.toString(),
      tenant._id.toString(),
    );

    // 10. Audit Log
    await this.auditService.log({
      tenantId: tenant._id,
      actorUserId: user._id,
      branchId: branch._id,
      action: 'TENANT_REGISTERED',
      entity: 'Tenant',
      entityId: tenant._id.toString(),
      metadata: { tenantName: tenant.name, ownerEmail: user.email },
    });

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
      },
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        businessType: tenant.businessType,
        status: tenant.status,
      },
      membership: {
        id: membership._id.toString(),
        roleId: ownerRole._id.toString(),
        branchIds: [branch._id.toString()],
        status: membership.status,
      },
      role: {
        id: ownerRole._id.toString(),
        name: ownerRole.name,
        code: ownerRole.code,
        permissions: ownerRole.permissions,
        isSystem: ownerRole.isSystem,
      },
      branches: [
        {
          id: branch._id.toString(),
          name: branch.name,
          code: branch.code,
          city: branch.city,
          isActive: branch.isActive,
          isMainHub: branch.isMainHub,
        },
      ],
      permissions: ownerRole.permissions,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isValidPassword = await PasswordUtil.compare(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    // Find memberships for this user
    let membershipQuery: Record<string, any> = {
      userId: user._id,
      status: MembershipStatus.ACTIVE,
    };

    if (dto.tenantId && Types.ObjectId.isValid(dto.tenantId)) {
      membershipQuery.tenantId = new Types.ObjectId(dto.tenantId);
    } else if (dto.tenantSlug) {
      const targetTenant = await this.tenantModel.findOne({ slug: dto.tenantSlug }).exec();
      if (targetTenant) {
        membershipQuery.tenantId = targetTenant._id;
      }
    }

    const memberships = await this.membershipModel.find(membershipQuery).exec();
    if (!memberships || memberships.length === 0) {
      throw new UnauthorizedException('No active organization membership found for this user.');
    }

    // Pick targeted or primary membership
    const activeMembership = memberships[0];

    const [tenant, role, branches] = await Promise.all([
      this.tenantModel.findById(activeMembership.tenantId).exec(),
      this.roleModel.findById(activeMembership.roleId).exec(),
      this.branchModel.find({
        tenantId: activeMembership.tenantId,
        isActive: true,
        isDeleted: false,
      }).exec(),
    ]);

    if (!tenant || tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.CANCELLED) {
      throw new UnauthorizedException('This business account is suspended or not active.');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.generateTokens(
      user._id.toString(),
      activeMembership._id.toString(),
      tenant._id.toString(),
    );

    // Audit log
    await this.auditService.log({
      tenantId: tenant._id,
      actorUserId: user._id,
      action: 'USER_LOGGED_IN',
      entity: 'User',
      entityId: user._id.toString(),
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
      },
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        businessType: tenant.businessType,
        status: tenant.status,
      },
      membership: {
        id: activeMembership._id.toString(),
        roleId: role ? role._id.toString() : '',
        branchIds: (activeMembership.branchIds || []).map((id) => id.toString()),
        status: activeMembership.status,
      },
      role: role
        ? {
            id: role._id.toString(),
            name: role.name,
            code: role.code,
            permissions: role.permissions,
            isSystem: role.isSystem,
          }
        : null,
      branches: branches.map((b) => ({
        id: b._id.toString(),
        name: b.name,
        code: b.code,
        city: b.city,
        isActive: b.isActive,
        isMainHub: b.isMainHub,
      })),
      permissions: role?.permissions || [],
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required.');
    }

    try {
      const refreshSecret =
        this.configService.get<string>('jwt.refreshSecret') ||
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'washora_refresh_token_secret_key_prod_2026_z72k';

      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });

      const [user, membership] = await Promise.all([
        this.userModel.findById(decoded.sub).exec(),
        this.membershipModel.findById(decoded.membershipId).exec(),
      ]);

      if (!user || !user.isActive || !membership || membership.status !== MembershipStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid or expired refresh token session.');
      }

      return await this.generateTokens(
        user._id.toString(),
        membership._id.toString(),
        membership.tenantId.toString(),
      );
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  async getMe(userId: string, membershipId: string) {
    const [user, membership] = await Promise.all([
      this.userModel.findById(userId).select('-passwordHash').exec(),
      this.membershipModel.findById(membershipId).exec(),
    ]);

    if (!user || !membership) {
      throw new NotFoundException('Account details not found.');
    }

    const [tenant, role, branches] = await Promise.all([
      this.tenantModel.findById(membership.tenantId).exec(),
      this.roleModel.findById(membership.roleId).exec(),
      this.branchModel.find({
        tenantId: membership.tenantId,
        isActive: true,
        isDeleted: false,
      }).exec(),
    ]);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
      },
      tenant: tenant
        ? {
            id: tenant._id.toString(),
            name: tenant.name,
            slug: tenant.slug,
            businessType: tenant.businessType,
            status: tenant.status,
          }
        : null,
      membership: {
        id: membership._id.toString(),
        roleId: role ? role._id.toString() : '',
        branchIds: (membership.branchIds || []).map((id) => id.toString()),
        status: membership.status,
      },
      role: role
        ? {
            id: role._id.toString(),
            name: role.name,
            code: role.code,
            permissions: role.permissions,
            isSystem: role.isSystem,
          }
        : null,
      branches: branches.map((b) => ({
        id: b._id.toString(),
        name: b.name,
        code: b.code,
        city: b.city,
        isActive: b.isActive,
        isMainHub: b.isMainHub,
      })),
      permissions: role?.permissions || [],
    };
  }

  private async seedInitialTenantCatalog(tenantId: Types.ObjectId) {
    // Seed default Services
    const defaultServices = [
      { name: 'Wash & Fold', code: 'WASH_FOLD', multiplier: 1.0, displayOrder: 1 },
      { name: 'Dry Cleaning', code: 'DRY_CLEAN', multiplier: 1.5, displayOrder: 2 },
      { name: 'Steam Press & Iron', code: 'STEAM_PRESS', multiplier: 0.8, displayOrder: 3 },
      { name: 'Shoe Spa & Restore', code: 'SHOE_SPA', multiplier: 2.0, displayOrder: 4 },
    ];

    for (const s of defaultServices) {
      const existing = await this.serviceModel.findOne({ tenantId, name: s.name }).exec();
      if (!existing) {
        await new this.serviceModel({
          tenantId,
          ...s,
          isActive: true,
        }).save();
      }
    }

    // Seed default Categories
    const defaultCategories = [
      { name: 'Men Garments', icon: 'Shirt', color: '#3B82F6', sortOrder: 1 },
      { name: 'Women Wear', icon: 'Sparkles', color: '#EC4899', sortOrder: 2 },
      { name: 'Household & Linen', icon: 'Layers', color: '#8B5CF6', sortOrder: 3 },
      { name: 'Footwear & Bags', icon: 'Footprints', color: '#F59E0B', sortOrder: 4 },
    ];

    for (const c of defaultCategories) {
      const existing = await this.categoryModel.findOne({ tenantId, name: c.name }).exec();
      if (!existing) {
        await new this.categoryModel({
          tenantId,
          ...c,
          slug: this.slugify(c.name),
          isActive: true,
        }).save();
      }
    }
  }
}
