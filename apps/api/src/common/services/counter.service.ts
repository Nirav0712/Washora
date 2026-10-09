import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Counter, CounterDocument } from '../../schemas/counter.schema';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async getNextSequence(
    tenantId: string | Types.ObjectId,
    sequenceName: string,
    initialOffset = 0,
  ): Promise<number> {
    const tId = new Types.ObjectId(tenantId.toString());
    const counter = await this.counterModel.findOneAndUpdate(
      { tenantId: tId, sequenceName: sequenceName.toUpperCase() },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    return (counter?.seq ?? 1) + initialOffset;
  }

  async generateOrderNumber(
    tenantId: string | Types.ObjectId,
    prefix = 'WS-',
    startNumber = 1,
  ): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'ORDER', startNumber > 1 ? startNumber - 1 : 0);
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async generateCustomerCode(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'CUSTOMER');
    return `CUST-${String(seq).padStart(5, '0')}`;
  }

  async generateGarmentNumber(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'GARMENT');
    return `WS-G-${String(seq).padStart(6, '0')}`;
  }

  async generatePaymentNumber(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'PAYMENT');
    return `PAY-${String(seq).padStart(6, '0')}`;
  }

  async generateEmployeeCode(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'EMPLOYEE');
    return `EMP-${String(seq).padStart(6, '0')}`;
  }

  async generateExpenseNumber(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'EXPENSE');
    return `EXP-${String(seq).padStart(6, '0')}`;
  }

  async generateSupplierCode(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'SUPPLIER');
    return `SUP-${String(seq).padStart(6, '0')}`;
  }

  async generatePurchaseNumber(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'PURCHASE');
    return `PUR-${String(seq).padStart(6, '0')}`;
  }

  async generateInventoryCode(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'INVENTORY');
    return `INV-${String(seq).padStart(6, '0')}`;
  }

  async generateSupplierPaymentNumber(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'SUPPLIER_PAYMENT');
    return `SPAY-${String(seq).padStart(6, '0')}`;
  }

  async generatePickupNumber(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'PICKUP');
    return `PU-${String(seq).padStart(6, '0')}`;
  }

  async generateDeliveryNumber(tenantId: string | Types.ObjectId): Promise<string> {
    const seq = await this.getNextSequence(tenantId, 'DELIVERY');
    return `DEL-${String(seq).padStart(6, '0')}`;
  }
}

