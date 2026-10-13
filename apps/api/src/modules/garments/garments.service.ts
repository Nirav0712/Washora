import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Garment, GarmentDocument } from '../../schemas/garment.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { CreateGarmentDto } from './dto/create-garment.dto';
import { UpdateGarmentDto } from './dto/update-garment.dto';
import { GarmentProcessingStatus, ProcessingStage } from '@washora/shared';

@Injectable()
export class GarmentsService {
  private readonly logger = new Logger(GarmentsService.name);

  constructor(
    @InjectModel(Garment.name) private garmentModel: Model<GarmentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
  ) {}

  async findById(tenantId: string | Types.ObjectId, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid garment ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const garment = await this.garmentModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .populate('orderId', 'orderNumber status customerSnapshot')
      .populate('branchId', 'name code')
      .populate('productId', 'name')
      .populate('serviceId', 'name')
      .exec();

    if (!garment) {
      throw new NotFoundException('Garment not found.');
    }

    return {
      ...garment.toObject(),
      id: garment._id.toString(),
    };
  }

  async findByOrderId(tenantId: string | Types.ObjectId, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const garments = await this.garmentModel
      .find({ orderId: new Types.ObjectId(orderId), tenantId: tId, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate('productId', 'name')
      .populate('serviceId', 'name')
      .exec();

    return garments.map((g) => ({
      ...g.toObject(),
      id: g._id.toString(),
    }));
  }

  async createForOrder(
    tenantId: string | Types.ObjectId,
    orderId: string,
    actorUserId: string | Types.ObjectId,
    dto: CreateGarmentDto,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(orderId), tenantId: tId, isDeleted: false })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const garmentNumber = await this.counterService.generateGarmentNumber(tId);

    const garment = new this.garmentModel({
      tenantId: tId,
      branchId: order.branchId,
      orderId: order._id,
      garmentNumber,
      productId: new Types.ObjectId(dto.productId),
      productName: dto.productName || 'Garment Item',
      serviceId: dto.serviceId ? new Types.ObjectId(dto.serviceId) : undefined,
      serviceName: dto.serviceName,
      garmentType: dto.garmentType,
      barcode: garmentNumber,
      quantity: dto.quantity || 1,
      color: dto.color,
      brand: dto.brand,
      condition: dto.condition || 'GOOD',
      conditionNotes: dto.conditionNotes,
      stainsNoted: dto.stainsNoted || [],
      damagesNoted: dto.damagesNoted || [],
      specialInstructions: dto.specialInstructions,
      shelfLocation: dto.shelfLocation,
      processingStatus: GarmentProcessingStatus.RECEIVED,
      stage: ProcessingStage.INTAKE,
    });

    await garment.save();

    // Link into order's garmentIds
    await this.orderModel.updateOne(
      { _id: order._id },
      { $push: { garmentIds: garment._id } },
    ).exec();

    await this.auditService.log({
      tenantId: tId,
      branchId: order.branchId,
      actorUserId: uId,
      action: 'GARMENT_CREATED',
      entity: 'Garment',
      entityId: garment._id.toString(),
      metadata: { garmentNumber, orderId: order._id.toString() },
    });

    return this.findById(tId, garment._id.toString());
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    dto: UpdateGarmentDto,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid garment ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(actorUserId.toString());

    const garment = await this.garmentModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!garment) {
      throw new NotFoundException('Garment not found.');
    }

    if (dto.color !== undefined) garment.color = dto.color;
    if (dto.brand !== undefined) garment.brand = dto.brand;
    if (dto.condition !== undefined) garment.condition = dto.condition;
    if (dto.conditionNotes !== undefined) garment.conditionNotes = dto.conditionNotes;
    if (dto.stainsNoted !== undefined) garment.stainsNoted = dto.stainsNoted;
    if (dto.damagesNoted !== undefined) garment.damagesNoted = dto.damagesNoted;
    if (dto.specialInstructions !== undefined) garment.specialInstructions = dto.specialInstructions;
    if (dto.processingStatus !== undefined) garment.processingStatus = dto.processingStatus;
    if (dto.stage !== undefined) garment.stage = dto.stage;
    if (dto.isQCApproved !== undefined) garment.isQCApproved = dto.isQCApproved;
    if (dto.shelfLocation !== undefined) garment.shelfLocation = dto.shelfLocation;

    await garment.save();

    await this.auditService.log({
      tenantId: tId,
      branchId: garment.branchId,
      actorUserId: uId,
      action: 'GARMENT_UPDATED',
      entity: 'Garment',
      entityId: garment._id.toString(),
      metadata: { garmentNumber: garment.garmentNumber, status: garment.processingStatus },
    });

    return this.findById(tId, garment._id.toString());
  }

  async scan(
    tenantId: string | Types.ObjectId,
    rawCode: string,
    userBranchIds: string[] = [],
  ): Promise<any> {
    if (!rawCode || !rawCode.trim()) {
      throw new BadRequestException('Scan code cannot be empty.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const code = rawCode.trim().toUpperCase();

    // 1. Try finding garment by barcode, garmentNumber, or ObjectId
    const garmentFilter: any = {
      tenantId: tId,
      isDeleted: false,
      $or: [
        { barcode: code },
        { garmentNumber: code },
        { qrCode: code },
      ],
    };

    if (Types.ObjectId.isValid(rawCode.trim())) {
      garmentFilter.$or.push({ _id: new Types.ObjectId(rawCode.trim()) });
    }

    const garment = await this.garmentModel
      .findOne(garmentFilter)
      .populate('orderId', 'orderNumber status paymentStatus customerSnapshot grandTotal dueAmount')
      .populate('branchId', 'name code')
      .populate('productId', 'name')
      .populate('serviceId', 'name')
      .exec();

    if (garment) {
      if (userBranchIds && userBranchIds.length > 0) {
        const garmentBranchId = (garment.branchId as any)?._id?.toString() || garment.branchId?.toString();
        if (!userBranchIds.includes(garmentBranchId)) {
          throw new ForbiddenException('You do not have access to the branch this garment belongs to.');
        }
      }
      return {
        type: 'GARMENT',
        item: {
          ...garment.toObject(),
          id: garment._id.toString(),
        },
      };
    }

    // 2. If no garment, check if code matches an order
    const orderFilter: any = {
      tenantId: tId,
      isDeleted: false,
      $or: [
        { orderNumber: code },
        { barcode: code },
      ],
    };
    if (Types.ObjectId.isValid(rawCode.trim())) {
      orderFilter.$or.push({ _id: new Types.ObjectId(rawCode.trim()) });
    }

    const order = await this.orderModel
      .findOne(orderFilter)
      .populate('branchId', 'name code')
      .populate('garmentIds')
      .exec();

    if (order) {
      if (userBranchIds && userBranchIds.length > 0) {
        const orderBranchId = (order.branchId as any)?._id?.toString() || order.branchId?.toString();
        if (!userBranchIds.includes(orderBranchId)) {
          throw new ForbiddenException('You do not have access to the branch this order belongs to.');
        }
      }
      return {
        type: 'ORDER',
        item: {
          ...order.toObject(),
          id: order._id.toString(),
        },
      };
    }

    throw new NotFoundException(`No garment or order found matching scanned code: ${rawCode}`);
  }

  async scanTransition(
    tenantId: string | Types.ObjectId,
    rawCode: string,
    targetStage: ProcessingStage,
    actorUserId: string | Types.ObjectId,
    notes?: string,
    userBranchIds: string[] = [],
  ): Promise<any> {
    const scanResult = await this.scan(tenantId, rawCode, userBranchIds);
    if (scanResult.type !== 'GARMENT') {
      throw new BadRequestException('Scan transition can only be applied to a specific garment.');
    }

    const garmentId = scanResult.item.id;
    return this.update(tenantId, garmentId, actorUserId, {
      stage: targetStage,
      conditionNotes: notes,
    });
  }
}
