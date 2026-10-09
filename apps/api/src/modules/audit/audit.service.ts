import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema';

export interface CreateAuditLogDto {
  tenantId?: string | Types.ObjectId;
  actorUserId?: string | Types.ObjectId;
  branchId?: string | Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    try {
      const tIdStr = (dto.tenantId as any)?._id?.toString() || dto.tenantId?.toString();
      const uIdStr = (dto.actorUserId as any)?._id?.toString() || dto.actorUserId?.toString();
      const bIdStr = (dto.branchId as any)?._id?.toString() || dto.branchId?.toString();

      const created = new this.auditLogModel({
        tenantId: tIdStr && Types.ObjectId.isValid(tIdStr) ? new Types.ObjectId(tIdStr) : dto.tenantId,
        actorUserId: uIdStr && Types.ObjectId.isValid(uIdStr) ? new Types.ObjectId(uIdStr) : null,
        branchId: bIdStr && Types.ObjectId.isValid(bIdStr) ? new Types.ObjectId(bIdStr) : null,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        metadata: dto.metadata || {},
      });
      return await created.save();
    } catch (err: any) {
      this.logger.error(`Failed to record audit log: ${err.message}`);
      return null;
    }
  }

  async findByTenant(
    tenantId: string | Types.ObjectId,
    options: { limit?: number; page?: number; entity?: string } = {},
  ) {
    const limit = Math.min(options.limit || 50, 100);
    const page = Math.max(options.page || 1, 1);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId.toString()),
    };

    if (options.entity) {
      filter.entity = options.entity;
    }

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
