import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../../schemas/audit-log.schema';
import { PlatformAuthGuard } from '../guards/platform-auth.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';
import { RequirePlatformPermission } from '../decorators/require-permission.decorator';
import { PlatformPermission } from '@washora/shared';

@ApiTags('Platform Audit')
@Controller('platform/audit')
@UseGuards(PlatformAuthGuard, PlatformPermissionsGuard)
@ApiBearerAuth()
export class PlatformAuditController {
  constructor(
    @InjectModel(AuditLog.name)
    private auditModel: Model<AuditLogDocument>,
  ) {}

  @Get()
  @RequirePlatformPermission(PlatformPermission.AUDIT_VIEW)
  @ApiOperation({ summary: 'List platform governance and sensitive administrative audit logs' })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listAuditLogs(
    @Query('action') action?: string,
    @Query('tenantId') tenantId?: string,
    @Query('entity') entity?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = Math.max(1, page || 1);
    const l = Math.min(100, Math.max(1, limit || 20));
    const skip = (p - 1) * l;

    const filter: any = {};
    if (action) filter.action = new RegExp(action.trim(), 'i');
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);
    if (entity) filter.entity = entity.trim();

    const [items, total] = await Promise.all([
      this.auditModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(l).exec(),
      this.auditModel.countDocuments(filter),
    ]);

    return {
      items: items.map((a) => ({
        id: a._id.toString(),
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        actorId: (a as any).actorId?.toString(),
        tenantId: (a as any).tenantId?.toString(),
        metadata: a.metadata,
        timestamp: (a as any).createdAt || new Date(),
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }
}
