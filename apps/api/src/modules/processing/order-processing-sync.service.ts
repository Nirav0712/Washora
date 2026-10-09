import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Garment, GarmentDocument } from '../../schemas/garment.schema';
import { OrderStatus, GarmentProcessingStatus } from '@washora/shared';

@Injectable()
export class OrderProcessingSyncService {
  private readonly logger = new Logger(OrderProcessingSyncService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Garment.name) private garmentModel: Model<GarmentDocument>,
  ) {}

  async syncOrder(
    tenantId: string | Types.ObjectId,
    orderId: string | Types.ObjectId,
    actorUserName = 'System Automation',
  ): Promise<OrderDocument | null> {
    const tId = new Types.ObjectId(tenantId.toString());
    const oId = new Types.ObjectId(orderId.toString());

    const order = await this.orderModel
      .findOne({ _id: oId, tenantId: tId, isDeleted: false })
      .exec();

    if (!order) {
      return null;
    }

    // Do not alter cancelled orders
    if (order.status === OrderStatus.CANCELLED) {
      return order;
    }

    // Get all garments for this order
    const garments = await this.garmentModel
      .find({ tenantId: tId, orderId: oId })
      .exec();

    if (garments.length === 0) {
      return order;
    }

    const allReady = garments.every(
      (g) =>
        g.processingStatus === GarmentProcessingStatus.READY ||
        g.processingStatus === GarmentProcessingStatus.DELIVERED,
    );

    const anyProcessing = garments.some(
      (g) =>
        g.processingStatus === GarmentProcessingStatus.PROCESSING ||
        g.processingStatus === GarmentProcessingStatus.SORTED ||
        g.processingStatus === GarmentProcessingStatus.QUALITY_CHECK,
    );

    let stateChanged = false;

    if (allReady && order.status !== OrderStatus.READY && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED) {
      order.status = OrderStatus.READY;
      order.timeline.push({
        status: OrderStatus.READY,
        label: 'All Garments Ready & QC Passed',
        timestamp: new Date(),
        updatedBy: actorUserName,
        note: `All ${garments.length} garments processed, quality inspected and packaged on shelf.`,
        isCompleted: true,
      });
      stateChanged = true;
      this.logger.log(`Order ${order.orderNumber} automatically transitioned to READY.`);
    } else if (anyProcessing && order.status === OrderStatus.RECEIVED) {
      order.status = OrderStatus.PROCESSING;
      order.timeline.push({
        status: OrderStatus.PROCESSING,
        label: 'Processing Plant Operations Started',
        timestamp: new Date(),
        updatedBy: actorUserName,
        note: 'Garments actively entered production workflow.',
        isCompleted: true,
      });
      stateChanged = true;
      this.logger.log(`Order ${order.orderNumber} automatically transitioned to PROCESSING.`);
    }

    if (stateChanged) {
      await order.save();
    }

    return order;
  }
}
