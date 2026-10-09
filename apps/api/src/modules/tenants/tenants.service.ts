import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private auditService: AuditService,
  ) {}

  async findById(tenantId: string | Types.ObjectId): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }
    return tenant;
  }

  async update(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    dto: UpdateTenantDto,
  ): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    if (dto.name) tenant.name = dto.name;
    if (dto.businessType) tenant.businessType = dto.businessType;
    if (dto.phone) tenant.phone = dto.phone;
    if (dto.email) tenant.email = dto.email;
    if (dto.address) tenant.address = dto.address;
    if (dto.gstNumber) tenant.gstNumber = dto.gstNumber;
    if (dto.logo) tenant.logo = dto.logo;

    await tenant.save();

    await this.auditService.log({
      tenantId: tenant._id,
      actorUserId,
      action: 'TENANT_UPDATED',
      entity: 'Tenant',
      entityId: tenant._id.toString(),
      metadata: dto,
    });

    return tenant;
  }
}
