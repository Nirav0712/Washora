import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string | Types.ObjectId, assignedBranchIds: string[] = []): Promise<BranchDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    const filter: Record<string, any> = {
      tenantId: tId,
      isDeleted: false,
    };

    if (assignedBranchIds && assignedBranchIds.length > 0) {
      filter._id = { $in: assignedBranchIds.map((id) => new Types.ObjectId(id)) };
    }

    return this.branchModel.find(filter).sort({ isMainHub: -1, name: 1 }).exec();
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<BranchDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const branch = await this.branchModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }

  async create(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    dto: CreateBranchDto,
  ): Promise<BranchDocument> {
    const tId = new Types.ObjectId(tenantId.toString());

    // Check code uniqueness within tenant
    const existing = await this.branchModel
      .findOne({ tenantId: tId, code: dto.code.toUpperCase(), isDeleted: false })
      .exec();

    if (existing) {
      throw new ConflictException(`A branch with code "${dto.code}" already exists in this tenant.`);
    }

    const branch = new this.branchModel({
      tenantId: tId,
      name: dto.name,
      code: dto.code.toUpperCase(),
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      taxRate: dto.taxRate ?? 5.0,
      isMainHub: dto.isMainHub ?? false,
      isActive: true,
    });

    await branch.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      branchId: branch._id,
      action: 'BRANCH_CREATED',
      entity: 'Branch',
      entityId: branch._id.toString(),
      metadata: { code: branch.code, name: branch.name },
    });

    return branch;
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    dto: UpdateBranchDto,
  ): Promise<BranchDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const branch = await this.findById(tId, id);

    if (dto.code && dto.code.toUpperCase() !== branch.code) {
      const existing = await this.branchModel
        .findOne({
          tenantId: tId,
          code: dto.code.toUpperCase(),
          _id: { $ne: branch._id },
          isDeleted: false,
        })
        .exec();

      if (existing) {
        throw new ConflictException(`A branch with code "${dto.code}" already exists in this tenant.`);
      }
      branch.code = dto.code.toUpperCase();
    }

    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.phone !== undefined) branch.phone = dto.phone;
    if (dto.email !== undefined) branch.email = dto.email;
    if (dto.address !== undefined) branch.address = dto.address;
    if (dto.city !== undefined) branch.city = dto.city;
    if (dto.state !== undefined) branch.state = dto.state;
    if (dto.pincode !== undefined) branch.pincode = dto.pincode;
    if (dto.taxRate !== undefined) branch.taxRate = dto.taxRate;
    if (dto.isActive !== undefined) branch.isActive = dto.isActive;
    if (dto.isMainHub !== undefined) branch.isMainHub = dto.isMainHub;

    await branch.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      branchId: branch._id,
      action: 'BRANCH_UPDATED',
      entity: 'Branch',
      entityId: branch._id.toString(),
      metadata: dto,
    });

    return branch;
  }

  async delete(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const branch = await this.findById(tId, id);

    // Soft delete
    branch.isDeleted = true;
    branch.isActive = false;
    branch.deletedAt = new Date();
    branch.deletedBy = new Types.ObjectId(actorUserId.toString());
    await branch.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      branchId: branch._id,
      action: 'BRANCH_DELETED',
      entity: 'Branch',
      entityId: branch._id.toString(),
    });

    return { message: 'Branch removed successfully' };
  }
}
