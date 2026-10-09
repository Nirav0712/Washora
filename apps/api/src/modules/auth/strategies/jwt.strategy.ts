import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../../schemas/user.schema';
import { Membership, MembershipDocument } from '../../../schemas/membership.schema';
import { Role, RoleDocument } from '../../../schemas/role.schema';
import { MembershipStatus } from '@washora/shared';

export interface JwtTokenPayload {
  sub: string;
  membershipId: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Membership.name) private membershipModel: Model<MembershipDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.accessSecret') ||
        configService.get<string>('JWT_ACCESS_SECRET') ||
        'washora_access_token_secret_key_prod_2026_x89q',
    });
  }

  async validate(payload: JwtTokenPayload) {
    const { sub: userId, membershipId, tenantId } = payload;

    if (!userId || !membershipId || !tenantId) {
      throw new UnauthorizedException('Invalid token structure');
    }

    const [user, membership] = await Promise.all([
      this.userModel.findById(userId).select('-passwordHash').exec(),
      this.membershipModel.findById(membershipId).exec(),
    ]);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or not found.');
    }

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new UnauthorizedException('Active membership not found for this tenant.');
    }

    if (membership.tenantId.toString() !== tenantId.toString()) {
      throw new UnauthorizedException('Tenant mismatch in token.');
    }

    const role = await this.roleModel.findById(membership.roleId).exec();

    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      membershipId: membership._id.toString(),
      tenantId: membership.tenantId.toString(),
      role: role?.code || 'OPERATOR',
      roleId: role?._id.toString(),
      permissions: role?.permissions || [],
      branchIds: (membership.branchIds || []).map((id) => id.toString()),
    };
  }
}
