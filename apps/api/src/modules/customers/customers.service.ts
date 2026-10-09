import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import { CustomerNote, CustomerNoteDocument } from '../../schemas/customer-note.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Payment, PaymentDocument } from '../../schemas/payment.schema';
import { PickupRequest, PickupRequestDocument } from '../../schemas/pickup-request.schema';
import { DeliveryRequest, DeliveryRequestDocument } from '../../schemas/delivery-request.schema';
import { Notification, NotificationDocument } from '../../schemas/notification.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto, CustomerAddressDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerNote.name) private customerNoteModel: Model<CustomerNoteDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(PickupRequest.name) private pickupModel: Model<PickupRequestDocument>,
    @InjectModel(DeliveryRequest.name) private deliveryModel: Model<DeliveryRequestDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
  ) {}

  normalizePhone(phone: string): string {
    if (!phone) return '';
    // Remove all whitespace, hyphens, parentheses, and dots
    let clean = phone.replace(/[\s\-\(\)\.]/g, '');
    // If phone starts with +91 or 91 and has 12/13 chars, standardize to 10 digits or E.164
    if (clean.startsWith('+91') && clean.length === 13) {
      clean = clean.substring(3);
    } else if (clean.startsWith('91') && clean.length === 12) {
      clean = clean.substring(2);
    } else if (clean.startsWith('0') && clean.length === 11) {
      clean = clean.substring(1);
    }
    return clean;
  }

  async findAll(
    tenantId: string | Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      phone?: string;
      name?: string;
      isVip?: boolean;
      branchId?: string;
      isActive?: boolean;
    } = {},
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      tenantId: tId,
      isDeleted: false,
    };

    if (query.isActive !== undefined) {
      filter.isActive = String(query.isActive) === 'true';
    }

    if (query.isVip !== undefined) {
      filter.isVip = String(query.isVip) === 'true';
    }

    if (query.phone) {
      const normalized = this.normalizePhone(query.phone);
      filter.phone = { $regex: normalized, $options: 'i' };
    }

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.search) {
      const s = query.search.trim();
      const normPhone = this.normalizePhone(s);
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { phone: { $regex: normPhone || s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { customerCode: { $regex: s, $options: 'i' } },
      ];
    }

    if (query.branchId) {
      const bId = new Types.ObjectId(query.branchId);
      filter.$or = filter.$or || [];
      filter.branchIds = { $in: [bId] };
    }

    const [items, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(filter),
    ]);

    return {
      items: items.map((c) => {
        const obj = c.toObject();
        return {
          ...obj,
          id: c._id.toString(),
          isVIP: c.isVip,
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(tenantId: string | Types.ObjectId, term: string) {
    if (!term || !term.trim()) return [];
    const tId = new Types.ObjectId(tenantId.toString());
    const s = term.trim();
    const normPhone = this.normalizePhone(s);

    const filter: Record<string, any> = {
      tenantId: tId,
      isDeleted: false,
      $or: [
        { name: { $regex: s, $options: 'i' } },
        { phone: { $regex: normPhone || s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { customerCode: { $regex: s, $options: 'i' } },
      ],
    };

    const customers = await this.customerModel
      .find(filter)
      .limit(10)
      .sort({ updatedAt: -1 })
      .exec();

    return customers.map((c) => {
      const obj = c.toObject();
      return {
        ...obj,
        id: c._id.toString(),
        isVIP: c.isVip,
      };
    });
  }

  async findById(tenantId: string | Types.ObjectId, id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const obj = customer.toObject();
    return {
      ...obj,
      id: customer._id.toString(),
      isVIP: customer.isVip,
    };
  }

  async create(
    tenantId: string | Types.ObjectId,
    actorUserId: string | Types.ObjectId,
    dto: CreateCustomerDto,
  ): Promise<any> {
    const tId = new Types.ObjectId(tenantId.toString());
    const normalizedPhone = this.normalizePhone(dto.phone);

    // Check uniqueness of phone within current tenant
    const existing = await this.customerModel
      .findOne({ tenantId: tId, phone: normalizedPhone, isDeleted: false })
      .exec();

    if (existing) {
      throw new ConflictException(
        `A customer with phone number "${dto.phone}" already exists in your organization.`,
      );
    }

    const customerCode = await this.counterService.generateCustomerCode(tId);
    const branchObjectIds = (dto.branchIds || []).map((id) => new Types.ObjectId(id));

    const customer = new this.customerModel({
      tenantId: tId,
      branchIds: branchObjectIds,
      customerCode,
      name: dto.name,
      phone: normalizedPhone,
      alternatePhone: dto.alternatePhone ? this.normalizePhone(dto.alternatePhone) : undefined,
      email: dto.email ? dto.email.toLowerCase() : undefined,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth,
      notes: dto.notes,
      tags: dto.tags || [],
      addresses: dto.addresses || [],
      isVip: dto.isVip ?? false,
      totalOrders: 0,
      totalSpent: 0,
      pendingBalance: 0,
      isActive: true,
      isDeleted: false,
    });

    await customer.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_CREATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { name: customer.name, phone: customer.phone, code: customer.customerCode },
    });

    const obj = customer.toObject();
    return {
      ...obj,
      id: customer._id.toString(),
      isVIP: customer.isVip,
    };
  }

  async update(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
    dto: UpdateCustomerDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    if (dto.phone) {
      const normalizedPhone = this.normalizePhone(dto.phone);
      if (normalizedPhone !== customer.phone) {
        const existing = await this.customerModel
          .findOne({
            tenantId: tId,
            phone: normalizedPhone,
            _id: { $ne: customer._id },
            isDeleted: false,
          })
          .exec();

        if (existing) {
          throw new ConflictException(
            `Another customer with phone "${dto.phone}" already exists in your organization.`,
          );
        }
        customer.phone = normalizedPhone;
      }
    }

    if (dto.name !== undefined) customer.name = dto.name;
    if (dto.alternatePhone !== undefined) {
      customer.alternatePhone = dto.alternatePhone ? this.normalizePhone(dto.alternatePhone) : undefined;
    }
    if (dto.email !== undefined) customer.email = dto.email ? dto.email.toLowerCase() : undefined;
    if (dto.gender !== undefined) customer.gender = dto.gender;
    if (dto.dateOfBirth !== undefined) customer.dateOfBirth = dto.dateOfBirth;
    if (dto.notes !== undefined) customer.notes = dto.notes;
    if (dto.tags !== undefined) customer.tags = dto.tags;
    if (dto.addresses !== undefined) customer.addresses = dto.addresses as any;
    if (dto.isVip !== undefined) customer.isVip = dto.isVip;
    if (dto.isActive !== undefined) customer.isActive = dto.isActive;
    if (dto.branchIds !== undefined) {
      customer.branchIds = dto.branchIds.map((bid) => new Types.ObjectId(bid));
    }

    await customer.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_UPDATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: dto,
    });

    const obj = customer.toObject();
    return {
      ...obj,
      id: customer._id.toString(),
      isVIP: customer.isVip,
    };
  }

  async delete(
    tenantId: string | Types.ObjectId,
    id: string,
    actorUserId: string | Types.ObjectId,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: tId, isDeleted: false })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    customer.isDeleted = true;
    customer.isActive = false;
    customer.deletedAt = new Date();
    customer.deletedBy = new Types.ObjectId(actorUserId.toString());
    await customer.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_DELETED',
      entity: 'Customer',
      entityId: customer._id.toString(),
    });

    return { message: 'Customer removed successfully' };
  }

  async getCustomerOrders(
    tenantId: string | Types.ObjectId,
    customerId: string,
    query: { page?: number; limit?: number } = {},
  ) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);

    // Verify customer exists in tenant
    await this.findById(tId, customerId);

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const filter = { tenantId: tId, customerId: cId, isDeleted: false };

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      items: orders.map((o) => {
        const obj = o.toObject();
        return {
          ...obj,
          id: o._id.toString(),
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerBalance(tenantId: string | Types.ObjectId, customerId: string) {
    const customer = await this.findById(tenantId, customerId);
    return {
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      pendingBalance: customer.pendingBalance || 0,
    };
  }

  async updateCustomerStats(tenantId: Types.ObjectId, customerId: Types.ObjectId) {
    const orders = await this.orderModel.find({
      tenantId,
      customerId,
      isDeleted: false,
      status: { $ne: 'CANCELLED' as any },
    }).exec();

    let totalOrders = orders.length;
    let totalSpent = 0;
    let pendingBalance = 0;

    for (const ord of orders) {
      totalSpent += ord.grandTotal || ord.subtotal || 0;
      pendingBalance += ord.dueAmount || 0;
    }

    await this.customerModel.updateOne(
      { _id: customerId, tenantId },
      {
        $set: {
          totalOrders,
          totalSpent: Math.round(totalSpent * 100) / 100,
          pendingBalance: Math.max(0, Math.round(pendingBalance * 100) / 100),
        },
      },
    ).exec();
  }

  // ==========================================
  // CUSTOMER ADDRESSES
  // ==========================================

  async getAddresses(tenantId: string | Types.ObjectId, customerId: string): Promise<any[]> {
    const customer = await this.findById(tenantId, customerId);
    return customer.addresses || [];
  }

  async addAddress(
    tenantId: string | Types.ObjectId,
    customerId: string,
    actorUserId: string | Types.ObjectId,
    dto: CustomerAddressDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(customerId), tenantId: tId, isDeleted: false })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    if (dto.isDefault) {
      for (const addr of customer.addresses) {
        addr.isDefault = false;
      }
    } else if (customer.addresses.length === 0) {
      dto.isDefault = true;
    }

    customer.addresses.push(dto as any);
    await customer.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_ADDRESS_ADDED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { label: dto.label, addressLine1: dto.addressLine1 },
    });

    return customer.addresses;
  }

  async updateAddress(
    tenantId: string | Types.ObjectId,
    customerId: string,
    addressId: string,
    actorUserId: string | Types.ObjectId,
    dto: CustomerAddressDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(customerId) || !Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid customer or address ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(customerId), tenantId: tId, isDeleted: false })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const addr = (customer.addresses as any).id(addressId);
    if (!addr) {
      throw new NotFoundException('Address not found.');
    }

    if (dto.isDefault) {
      for (const a of customer.addresses) {
        a.isDefault = false;
      }
    }

    Object.assign(addr, dto);
    await customer.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_ADDRESS_UPDATED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { addressId, label: dto.label },
    });

    return customer.addresses;
  }

  async deleteAddress(
    tenantId: string | Types.ObjectId,
    customerId: string,
    addressId: string,
    actorUserId: string | Types.ObjectId,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(customerId) || !Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid customer or address ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(customerId), tenantId: tId, isDeleted: false })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const targetIndex = customer.addresses.findIndex((a: any) => a._id?.toString() === addressId);
    if (targetIndex === -1) {
      throw new NotFoundException('Address not found.');
    }

    const wasDefault = customer.addresses[targetIndex].isDefault;
    customer.addresses.splice(targetIndex, 1);

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_ADDRESS_DELETED',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { addressId },
    });

    return customer.addresses;
  }

  async setDefaultAddress(
    tenantId: string | Types.ObjectId,
    customerId: string,
    addressId: string,
    actorUserId: string | Types.ObjectId,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(customerId) || !Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid customer or address ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(customerId), tenantId: tId, isDeleted: false })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    let found = false;
    for (const a of customer.addresses) {
      if ((a as any)._id?.toString() === addressId) {
        a.isDefault = true;
        found = true;
      } else {
        a.isDefault = false;
      }
    }

    if (!found) {
      throw new NotFoundException('Address not found.');
    }

    await customer.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_DEFAULT_ADDRESS_SET',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { addressId },
    });

    return customer.addresses;
  }

  // ==========================================
  // INTERNAL CRM 360 & NOTES
  // ==========================================

  async getOverview(tenantId: string | Types.ObjectId, customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);

    const customer = await this.customerModel
      .findOne({ _id: cId, tenantId: tId, isDeleted: false })
      .lean();

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const [orders, payments, pickups, deliveries, notesCount, notificationsCount] = await Promise.all([
      this.orderModel
        .find({ tenantId: tId, customerId: cId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      this.paymentModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      this.pickupModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ scheduledDate: -1 })
        .limit(5)
        .lean(),
      this.deliveryModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ scheduledDate: -1 })
        .limit(5)
        .lean(),
      this.customerNoteModel.countDocuments({ tenantId: tId, customerId: cId, isDeleted: false }),
      this.notificationModel.countDocuments({ tenantId: tId, customerId: cId }),
    ]);

    const allCustomerOrders = await this.orderModel
      .find({ tenantId: tId, customerId: cId, isDeleted: { $ne: true } }, { grandTotal: 1, paidAmount: 1, dueAmount: 1, status: 1 })
      .lean();

    const totalOrders = allCustomerOrders.length;
    const totalSpent = allCustomerOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const outstanding = allCustomerOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
    const activeOrders = allCustomerOrders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length;

    return {
      customer,
      kpis: {
        totalOrders,
        totalSpent,
        outstanding,
        activeOrders,
        notesCount,
        notificationsCount,
      },
      recentOrders: orders,
      recentPayments: payments,
      recentPickups: pickups,
      recentDeliveries: deliveries,
    };
  }

  async getNotes(tenantId: string | Types.ObjectId, customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);

    return this.customerNoteModel
      .find({ tenantId: tId, customerId: cId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
  }

  async addNote(
    tenantId: string | Types.ObjectId,
    customerId: string,
    actorUserId: string | Types.ObjectId,
    dto: { content: string; authorName?: string },
  ) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    if (!dto.content?.trim()) {
      throw new BadRequestException('Note content is required.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);

    const customer = await this.customerModel.findOne({ _id: cId, tenantId: tId, isDeleted: false });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const note = await this.customerNoteModel.create({
      tenantId: tId,
      customerId: cId,
      content: dto.content.trim(),
      authorName: dto.authorName || 'Staff',
      createdBy: actorUserId ? new Types.ObjectId(actorUserId.toString()) : undefined,
      isDeleted: false,
    });

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_NOTE_CREATED',
      entity: 'CustomerNote',
      entityId: note._id.toString(),
      metadata: { customerId: cId.toString() },
    });

    return note;
  }

  async updateNote(
    tenantId: string | Types.ObjectId,
    customerId: string,
    noteId: string,
    actorUserId: string | Types.ObjectId,
    dto: { content: string },
  ) {
    if (!Types.ObjectId.isValid(customerId) || !Types.ObjectId.isValid(noteId)) {
      throw new BadRequestException('Invalid ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);
    const nId = new Types.ObjectId(noteId);

    const note = await this.customerNoteModel.findOne({
      _id: nId,
      customerId: cId,
      tenantId: tId,
      isDeleted: false,
    });

    if (!note) {
      throw new NotFoundException('Note not found.');
    }

    note.content = dto.content.trim();
    await note.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_NOTE_UPDATED',
      entity: 'CustomerNote',
      entityId: note._id.toString(),
      metadata: { customerId: cId.toString() },
    });

    return note;
  }

  async deleteNote(
    tenantId: string | Types.ObjectId,
    customerId: string,
    noteId: string,
    actorUserId: string | Types.ObjectId,
  ) {
    if (!Types.ObjectId.isValid(customerId) || !Types.ObjectId.isValid(noteId)) {
      throw new BadRequestException('Invalid ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);
    const nId = new Types.ObjectId(noteId);

    const note = await this.customerNoteModel.findOne({
      _id: nId,
      customerId: cId,
      tenantId: tId,
      isDeleted: false,
    });

    if (!note) {
      throw new NotFoundException('Note not found.');
    }

    note.isDeleted = true;
    await note.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId,
      action: 'CUSTOMER_NOTE_DELETED',
      entity: 'CustomerNote',
      entityId: note._id.toString(),
      metadata: { customerId: cId.toString() },
    });

    return { success: true, message: 'Note deleted successfully.' };
  }

  async getCustomerPayments(
    tenantId: string | Types.ObjectId,
    customerId: string,
    query: { page?: number; limit?: number } = {},
  ) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.paymentModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.paymentModel.countDocuments({ tenantId: tId, customerId: cId }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCustomerInvoices(
    tenantId: string | Types.ObjectId,
    customerId: string,
    query: { page?: number; limit?: number } = {},
  ) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {
      tenantId: tId,
      customerId: cId,
      invoiceNumber: { $exists: true, $ne: null },
      isDeleted: { $ne: true },
    };

    const [items, total] = await Promise.all([
      this.orderModel
        .find(
          filter,
          {
            orderNumber: 1,
            invoiceNumber: 1,
            createdAt: 1,
            grandTotal: 1,
            totalPaid: 1,
            balanceDue: 1,
            paymentStatus: 1,
            status: 1,
          },
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCustomerPickups(tenantId: string | Types.ObjectId, customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);

    return this.pickupModel
      .find({ tenantId: tId, customerId: cId })
      .sort({ scheduledDate: -1 })
      .lean();
  }

  async getCustomerDeliveries(tenantId: string | Types.ObjectId, customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);

    return this.deliveryModel
      .find({ tenantId: tId, customerId: cId })
      .sort({ scheduledDate: -1 })
      .lean();
  }

  async getCustomerNotifications(
    tenantId: string | Types.ObjectId,
    customerId: string,
    query: { page?: number; limit?: number } = {},
  ) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.notificationModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments({ tenantId: tId, customerId: cId }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActivityTimeline(tenantId: string | Types.ObjectId, customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('Invalid customer ID format.');
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const cId = new Types.ObjectId(customerId);

    const [orders, payments, pickups, deliveries, notes, notifications] = await Promise.all([
      this.orderModel
        .find({ tenantId: tId, customerId: cId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      this.paymentModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      this.pickupModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      this.deliveryModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      this.customerNoteModel
        .find({ tenantId: tId, customerId: cId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      this.notificationModel
        .find({ tenantId: tId, customerId: cId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const events: any[] = [];

    for (const o of orders) {
      events.push({
        id: `order-${o._id}`,
        type: 'ORDER',
        title: `Order #${o.orderNumber} Created`,
        description: `Status: ${o.status} • ₹${o.grandTotal}`,
        timestamp: (o as any).createdAt,
        metadata: { orderId: o._id, orderNumber: o.orderNumber, status: o.status },
      });
    }

    for (const p of payments) {
      events.push({
        id: `payment-${p._id}`,
        type: 'PAYMENT',
        title: `Payment Received: ₹${p.amount}`,
        description: `Method: ${p.method} • Status: ${p.status}`,
        timestamp: (p as any).createdAt,
        metadata: { paymentId: p._id, amount: p.amount, method: p.method },
      });
    }

    for (const pu of pickups) {
      events.push({
        id: `pickup-${pu._id}`,
        type: 'PICKUP',
        title: `Pickup ${pu.pickupNumber}`,
        description: `Status: ${pu.status} • Scheduled: ${new Date(pu.scheduledDate).toLocaleDateString()}`,
        timestamp: (pu as any).createdAt,
        metadata: { pickupId: pu._id, status: pu.status },
      });
    }

    for (const d of deliveries) {
      events.push({
        id: `delivery-${d._id}`,
        type: 'DELIVERY',
        title: `Delivery ${d.deliveryNumber}`,
        description: `Status: ${d.status} • Scheduled: ${new Date(d.scheduledDate).toLocaleDateString()}`,
        timestamp: (d as any).createdAt,
        metadata: { deliveryId: d._id, status: d.status },
      });
    }

    for (const n of notes) {
      events.push({
        id: `note-${n._id}`,
        type: 'NOTE',
        title: `Staff Note by ${n.authorName}`,
        description: n.content,
        timestamp: (n as any).createdAt,
        metadata: { noteId: n._id },
      });
    }

    for (const notif of notifications) {
      events.push({
        id: `notif-${notif._id}`,
        type: 'NOTIFICATION',
        title: `Notification Sent (${notif.channel})`,
        description: `Template: ${notif.templateKey || notif.eventType || 'Custom'} • Status: ${notif.status}`,
        timestamp: (notif as any).createdAt,
        metadata: { notificationId: notif._id, channel: notif.channel },
      });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events.slice(0, 50);
  }
}
