import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlatformAdmin, PlatformAdminDocument } from '../../../schemas/platform-admin.schema';
import { DEFAULT_PLATFORM_ROLE_PERMISSIONS } from '@washora/shared';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(PlatformAdmin.name)
    private adminModel: Model<PlatformAdminDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Platform administration token missing');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'washora_dev_jwt_secret_2026_super_secure');
      const payload = this.jwtService.verify(token, { secret });

      if (!payload.isPlatformAdmin || !payload.adminId) {
        throw new UnauthorizedException('Invalid platform administration token');
      }

      const admin = await this.adminModel.findById(new Types.ObjectId(payload.adminId)).exec();

      if (!admin) {
        throw new UnauthorizedException('Platform administrator account not found');
      }

      if (!admin.isActive) {
        throw new ForbiddenException('Platform administrator account is deactivated');
      }

      if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
        throw new ForbiddenException('Account temporarily locked due to excessive failed login attempts');
      }

      const effectivePermissions = Array.from(
        new Set([
          ...(DEFAULT_PLATFORM_ROLE_PERMISSIONS[admin.role] || []),
          ...(admin.permissions || []),
        ]),
      );

      request.admin = {
        adminId: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: effectivePermissions,
        partnerId: admin.partnerId ? admin.partnerId.toString() : undefined,
        isPlatformAdmin: true,
      };

      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired platform token');
    }
  }
}
