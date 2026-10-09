import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Membership, MembershipDocument } from '../../schemas/membership.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Role, RoleDocument } from '../../schemas/role.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { RolesService } from '../roles/roles.service';
import { AuditService } from '../audit/audit.service';
import { PasswordUtil } from '../../common/utils/password.util';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembershipStatus, RoleType } from '@washora/shared';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectModel(Membership.name) private membershipModel: Model<MembershipDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    private rolesService: RolesService,
    private auditService: AuditService,
  ) {}

  async findAllByTenant(tenantId: string | Types.ObjectId) {
    const tId = new Types.ObjectId(tenantId.toString());
    const memberships = await this.membershipModel
      .find({ tenantId: tId })
      .populate('userId', 'name email phone avatar isActive lastLoginAt')
      .populate('roleId', 'name code permissions isSystem')
      .populate('branchIds', 'name code city isActive')
      .exec();

    return memberships.map((m: any) => ({
      id: m._id.toString(),
      userId: m.userId?._id?.toString(),
      user: m.userId,
      roleId: m.roleId?._id?.toString(),
      role: m.roleId,
      branchIds: (m.branchIds || []).map((b: any) => b?._id?.toString() || b),
      branches: m.branchIds,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  async inviteMember(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    dto: InviteMemberDto,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());

    // 1. Find or create user
    let user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    if (!user) {
      const tempPasswordHash = await PasswordUtil.hash('Washora@2026');
      user = new this.userModel({
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash: tempPasswordHash,
        isActive: true,
        emailVerified: false,
      });
      await user.save();
    }

    // 2. Check if membership already exists in this tenant
    const existingMembership = await this.membershipModel
      .findOne({ userId: user._id, tenantId: tId })
      .exec();

    if (existingMembership) {
      throw new ConflictException('This user is already a member of this organization.');
    }

    // 3. Find or create role
    const role = await this.rolesService.getOrCreateSystemRole(tId, dto.roleCode);

    // 4. Validate branchIds
    const branchObjectIds = (dto.branchIds || []).map((id) => new Types.ObjectId(id));

    // 5. Create membership
    const membership = new this.membershipModel({
      userId: user._id,
      tenantId: tId,
      roleId: role._id,
      branchIds: branchObjectIds,
      status: MembershipStatus.ACTIVE,
    });
    await membership.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'USER_INVITED',
      entity: 'Membership',
      entityId: membership._id.toString(),
      metadata: { invitedEmail: user.email, role: dto.roleCode },
    });

    return {
      id: membership._id.toString(),
      userId: user._id.toString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      role: {
        id: role._id.toString(),
        name: role.name,
        code: role.code,
      },
      branchIds: branchObjectIds.map((b) => b.toString()),
      status: membership.status,
    };
  }

  async updateMember(
    tenantId: string | Types.ObjectId,
    membershipId: string,
    actorUserId: string | Types.ObjectId,
    dto: UpdateMemberDto,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const membership = await this.membershipModel
      .findOne({ _id: new Types.ObjectId(membershipId), tenantId: tId })
      .exec();

    if (!membership) {
      throw new NotFoundException('Membership not found in this organization.');
    }

    if (dto.roleCode) {
      const role = await this.rolesService.getOrCreateSystemRole(tId, dto.roleCode);
      membership.roleId = role._id as Types.ObjectId;
    }

    if (dto.branchIds) {
      membership.branchIds = dto.branchIds.map((id) => new Types.ObjectId(id));
    }

    if (dto.status) {
      membership.status = dto.status;
    }

    await membership.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'USER_MEMBERSHIP_UPDATED',
      entity: 'Membership',
      entityId: membership._id.toString(),
      metadata: dto,
    });

    return membership;
  }

  async removeMember(
    tenantId: string | Types.ObjectId,
    membershipId: string,
    actorUserId: string | Types.ObjectId,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const membership = await this.membershipModel
      .findOne({ _id: new Types.ObjectId(membershipId), tenantId: tId })
      .exec();

    if (!membership) {
      throw new NotFoundException('Membership not found in this organization.');
    }

    // Protect against self-removal if needed or check role
    membership.status = MembershipStatus.SUSPENDED;
    await membership.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'USER_REMOVED',
      entity: 'Membership',
      entityId: membership._id.toString(),
    });

    return { message: 'Member deactivated successfully' };
  }
}
