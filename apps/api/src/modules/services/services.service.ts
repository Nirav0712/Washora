import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../../schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string | Types.ObjectId): Promise<ServiceDocument[]> {
    const tId = new Types.ObjectId(tenantId.toString());
    return this.serviceModel
      .find({ tenantId: tId, isDeleted: false })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<ServiceDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const service = await this.serviceModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    return service;
  }

  async create(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    dto: CreateServiceDto,
  ): Promise<ServiceDocument> {
    const tId = new Types.ObjectId(tenantId.toString());

    const service = new this.serviceModel({
      tenantId: tId,
      name: dto.name,
      code: dto.code || dto.name.toUpperCase().replace(/\s+/g, '_'),
      description: dto.description,
      multiplier: dto.multiplier ?? 1.0,
      displayOrder: dto.displayOrder ?? 0,
      isActive: true,
      isDeleted: false,
    });

    await service.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'SERVICE_CREATED',
      entity: 'Service',
      entityId: service._id.toString(),
      metadata: { name: service.name },
    });

    return service;
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    dto: UpdateServiceDto,
  ): Promise<ServiceDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const service = await this.findById(tId, id);

    if (dto.name !== undefined) service.name = dto.name;
    if (dto.code !== undefined) service.code = dto.code;
    if (dto.description !== undefined) service.description = dto.description;
    if (dto.multiplier !== undefined) service.multiplier = dto.multiplier;
    if (dto.displayOrder !== undefined) service.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) service.isActive = dto.isActive;

    await service.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'SERVICE_UPDATED',
      entity: 'Service',
      entityId: service._id.toString(),
      metadata: dto,
    });

    return service;
  }

  async delete(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const service = await this.findById(tId, id);

    service.isDeleted = true;
    service.isActive = false;
    service.deletedAt = new Date();
    service.deletedBy = new Types.ObjectId(actorUserId.toString());
    await service.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'SERVICE_DELETED',
      entity: 'Service',
      entityId: service._id.toString(),
    });

    return { message: 'Service removed successfully' };
  }
}
