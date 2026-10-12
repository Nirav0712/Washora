import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PlatformAdmin, PlatformAdminDocument } from '../../../schemas/platform-admin.schema';
import { PasswordUtil } from '../../../common/utils/password.util';
import { AuditService } from '../../audit/audit.service';
import {
  PlatformAdminRole,
  PlatformPermission,
  DEFAULT_PLATFORM_ROLE_PERMISSIONS,
} from '@washora/shared';
import { AdminLoginDto, CreateAdminUserDto, UpdateAdminProfileDto } from '../dto/platform-auth.dto';

@Injectable()
export class PlatformAuthService implements OnModuleInit {
  private readonly logger = new Logger(PlatformAuthService.name);

  constructor(
    @InjectModel(PlatformAdmin.name)
    private adminModel: Model<PlatformAdminDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async onModuleInit() {
    const isDbReady = () => (this.adminModel.db?.readyState as number) === 1;

    if (isDbReady()) {
      await this.seedInitialSuperAdmin();
    } else {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2000);
        this.adminModel.db?.once('connected', () => {
          clearTimeout(timer);
          resolve();
        });
      });
      if (isDbReady()) {
        await this.seedInitialSuperAdmin();
      } else {
        this.adminModel.db?.once('connected', () => {
          this.seedInitialSuperAdmin().catch((err) => {
            this.logger.warn(`Could not seed initial superadmin: ${err?.message || err}`);
          });
        });
      }
    }
  }

  async seedInitialSuperAdmin() {
    if ((this.adminModel.db?.readyState as number) !== 1) {
      return;
    }
    try {
      const count = await this.adminModel.countDocuments();
      if (count === 0) {
        const defaultEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL', 'admin@washora.com');
        const defaultPassword = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD', 'WashoraAdmin@2026');
        const passwordHash = await PasswordUtil.hash(defaultPassword);

        await this.adminModel.create({
          email: defaultEmail.toLowerCase().trim(),
          passwordHash,
          name: 'Washora Platform Super Admin',
          role: PlatformAdminRole.SUPER_ADMIN,
          permissions: Object.values(PlatformPermission),
          isActive: true,
        });

        this.logger.log(`Initial platform superadmin created: ${defaultEmail}`);
      }
    } catch (err: any) {
      this.logger.warn(`Could not seed initial superadmin: ${err.message}`);
    }
  }

  async login(dto: AdminLoginDto, ipAddress?: string, userAgent?: string) {
    const email = dto.email.toLowerCase().trim();
    const admin = await this.adminModel.findOne({ email }).exec();

    if (!admin) {
      throw new UnauthorizedException('Invalid platform credentials');
    }

    if (!admin.isActive) {
      throw new ForbiddenException('Platform administrator account is deactivated');
    }

    if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
      const waitMinutes = Math.ceil((admin.lockUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Account locked due to consecutive failed login attempts. Try again in ${waitMinutes} minute(s).`,
      );
    }

    const isMatch = await PasswordUtil.compare(dto.password, admin.passwordHash);

    if (!isMatch) {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
        this.logger.warn(`Admin account locked: ${admin.email}`);
      }
      await admin.save();
      throw new UnauthorizedException('Invalid platform credentials');
    }

    // Reset lockout counters
    admin.failedLoginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLoginAt = new Date();
    await admin.save();

    const effectivePermissions = Array.from(
      new Set([
        ...(DEFAULT_PLATFORM_ROLE_PERMISSIONS[admin.role] || []),
        ...(admin.permissions || []),
      ]),
    );

    const payload = {
      adminId: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: effectivePermissions,
      partnerId: admin.partnerId ? admin.partnerId.toString() : undefined,
      isPlatformAdmin: true,
    };

    const secret = this.configService.get<string>('JWT_SECRET', 'washora_dev_jwt_secret_2026_super_secure');
    const token = this.jwtService.sign(payload, { secret, expiresIn: '24h' });

    await this.auditService.log({
      action: 'PLATFORM_ADMIN_LOGIN',
      entity: 'PlatformAdmin',
      entityId: admin._id.toString(),
      metadata: { email: admin.email, role: admin.role, ipAddress, userAgent },
    });

    return {
      token,
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: effectivePermissions,
        partnerId: admin.partnerId ? admin.partnerId.toString() : undefined,
        lastLoginAt: admin.lastLoginAt,
      },
    };
  }

  async createAdmin(creatorAdminId: string, dto: CreateAdminUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.adminModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('Platform administrator with this email already exists');
    }

    const passwordHash = await PasswordUtil.hash(dto.password);
    const permissions = dto.permissions || DEFAULT_PLATFORM_ROLE_PERMISSIONS[dto.role] || [];

    const newAdmin = await this.adminModel.create({
      email,
      passwordHash,
      name: dto.name.trim(),
      role: dto.role,
      permissions,
      isActive: true,
    });

    await this.auditService.log({
      action: 'PLATFORM_ADMIN_CREATED',
      entity: 'PlatformAdmin',
      entityId: newAdmin._id.toString(),
      metadata: { email: newAdmin.email, role: newAdmin.role, createdBy: creatorAdminId },
    });

    return this.sanitizeAdmin(newAdmin);
  }

  async getMe(adminId: string) {
    const admin = await this.adminModel.findById(new Types.ObjectId(adminId)).exec();
    if (!admin) {
      throw new NotFoundException('Platform administrator not found');
    }
    return this.sanitizeAdmin(admin);
  }

  async updateMe(adminId: string, dto: UpdateAdminProfileDto) {
    const admin = await this.adminModel.findById(new Types.ObjectId(adminId)).exec();
    if (!admin) {
      throw new NotFoundException('Platform administrator not found');
    }

    if (dto.name) {
      admin.name = dto.name.trim();
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password required to set new password');
      }
      const isMatch = await PasswordUtil.compare(dto.currentPassword, admin.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('Current password is incorrect');
      }
      admin.passwordHash = await PasswordUtil.hash(dto.newPassword);
    }

    await admin.save();

    await this.auditService.log({
      action: 'PLATFORM_ADMIN_UPDATED',
      entity: 'PlatformAdmin',
      entityId: admin._id.toString(),
      metadata: { email: admin.email },
    });

    return this.sanitizeAdmin(admin);
  }

  async listAdmins() {
    const admins = await this.adminModel.find().sort({ createdAt: -1 }).exec();
    return admins.map((a) => this.sanitizeAdmin(a));
  }

  async setAdminStatus(adminId: string, isActive: boolean, actorAdminId: string) {
    if (adminId === actorAdminId && !isActive) {
      throw new BadRequestException('Cannot deactivate your own administrator account');
    }

    const admin = await this.adminModel.findById(new Types.ObjectId(adminId)).exec();
    if (!admin) {
      throw new NotFoundException('Platform administrator not found');
    }

    admin.isActive = isActive;
    await admin.save();

    await this.auditService.log({
      action: isActive ? 'PLATFORM_ADMIN_ACTIVATED' : 'PLATFORM_ADMIN_DEACTIVATED',
      entity: 'PlatformAdmin',
      entityId: admin._id.toString(),
      metadata: { email: admin.email, changedBy: actorAdminId },
    });

    return this.sanitizeAdmin(admin);
  }

  private sanitizeAdmin(admin: PlatformAdminDocument) {
    const effectivePermissions = Array.from(
      new Set([
        ...(DEFAULT_PLATFORM_ROLE_PERMISSIONS[admin.role] || []),
        ...(admin.permissions || []),
      ]),
    );

    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: effectivePermissions,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
      createdAt: (admin as any).createdAt,
      updatedAt: (admin as any).updatedAt,
    };
  }
}
