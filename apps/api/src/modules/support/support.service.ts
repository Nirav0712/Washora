import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SupportTicket,
  SupportTicketDocument,
  TicketStatus,
  SenderType,
} from '../../schemas/support-ticket.schema';
import {
  PlatformContactSettings,
  PlatformContactSettingsDocument,
} from '../../schemas/platform-contact-settings.schema';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';
import { CounterService } from '../../common/services/counter.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateSupportTicketDto,
  AddTicketMessageDto,
  UpdateTicketStatusDto,
  AssignTicketDto,
  UpdatePlatformContactSettingsDto,
} from './dto/support.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectModel(SupportTicket.name)
    private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(PlatformContactSettings.name)
    private contactSettingsModel: Model<PlatformContactSettingsDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    private counterService: CounterService,
    private auditService: AuditService,
  ) {}

  // ==========================================
  // TENANT SHOP APIS
  // ==========================================

  async createTicket(
    tenantId: string | Types.ObjectId,
    userId: string,
    userName: string,
    dto: CreateSupportTicketDto,
  ): Promise<SupportTicketDocument> {
    const tId = new Types.ObjectId(tenantId.toString());
    const uId = new Types.ObjectId(userId);

    const seq = await this.counterService.getNextSequence(tId, 'SUPPORT_TICKET');
    const tenantSuffix = tId.toString().slice(-4).toUpperCase();
    const ticketNumber = `TKT-${tenantSuffix}-${String(seq).padStart(5, '0')}`;

    const initialMessage = {
      senderId: uId,
      senderName: userName || 'Tenant Staff',
      senderType: SenderType.TENANT,
      message: dto.description.trim(),
      attachments: dto.attachments || [],
      createdAt: new Date(),
    };

    const ticket = new this.ticketModel({
      tenantId: tId,
      ticketNumber,
      createdBy: uId,
      category: dto.category,
      priority: dto.priority || 'MEDIUM',
      status: TicketStatus.OPEN,
      subject: dto.subject.trim(),
      description: dto.description.trim(),
      messages: [initialMessage],
    });

    const saved = await ticket.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId: userId,
      action: 'SUPPORT_TICKET_CREATED',
      entity: 'SupportTicket',
      entityId: saved._id.toString(),
      metadata: {
        ticketNumber: saved.ticketNumber,
        category: saved.category,
        priority: saved.priority,
        subject: saved.subject,
      },
    });

    return saved;
  }

  async getTenantTickets(
    tenantId: string | Types.ObjectId,
    query: {
      status?: string;
      category?: string;
      priority?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const tId = new Types.ObjectId(tenantId.toString());
    const filter: any = { tenantId: tId };

    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.priority) filter.priority = query.priority;
    if (query.search) {
      filter.$or = [
        { ticketNumber: { $regex: query.search.trim(), $options: 'i' } },
        { subject: { $regex: query.search.trim(), $options: 'i' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email phone avatar')
        .lean()
        .exec(),
      this.ticketModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTenantTicketById(
    tenantId: string | Types.ObjectId,
    ticketId: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(ticketId)) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const ticket = await this.ticketModel
      .findOne({ _id: new Types.ObjectId(ticketId), tenantId: tId })
      .populate('createdBy', 'name email phone avatar')
      .lean()
      .exec();

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    return ticket;
  }

  async addTenantMessage(
    tenantId: string | Types.ObjectId,
    ticketId: string,
    userId: string,
    userName: string,
    dto: AddTicketMessageDto,
  ): Promise<SupportTicketDocument> {
    if (!Types.ObjectId.isValid(ticketId)) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }
    const tId = new Types.ObjectId(tenantId.toString());
    const ticket = await this.ticketModel.findOne({
      _id: new Types.ObjectId(ticketId),
      tenantId: tId,
    }).exec();

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Cannot message on a closed support ticket');
    }

    const newMessage = {
      senderId: new Types.ObjectId(userId),
      senderName: userName || 'Tenant Staff',
      senderType: SenderType.TENANT,
      message: dto.message.trim(),
      attachments: dto.attachments || [],
      createdAt: new Date(),
    };

    ticket.messages.push(newMessage as any);

    // If ticket was waiting for customer, move back to in-progress
    if (ticket.status === TicketStatus.WAITING_FOR_CUSTOMER) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    const saved = await ticket.save();

    await this.auditService.log({
      tenantId: tId,
      actorUserId: userId,
      action: 'SUPPORT_MESSAGE_SENT',
      entity: 'SupportTicket',
      entityId: ticketId,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    return saved;
  }

  // ==========================================
  // PLATFORM / SUPER ADMIN APIS
  // ==========================================

  async getAllTickets(query: {
    tenantId?: string;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: any = {};
    if (query.tenantId) filter.tenantId = new Types.ObjectId(query.tenantId);
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.priority) filter.priority = query.priority;
    if (query.search) {
      filter.$or = [
        { ticketNumber: { $regex: query.search.trim(), $options: 'i' } },
        { subject: { $regex: query.search.trim(), $options: 'i' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('tenantId', 'name slug email phone')
        .populate('createdBy', 'name email phone avatar')
        .lean()
        .exec(),
      this.ticketModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPlatformTicketById(ticketId: string): Promise<any> {
    const ticket = await this.ticketModel
      .findById(new Types.ObjectId(ticketId))
      .populate('tenantId', 'name slug email phone address gstNumber')
      .populate('createdBy', 'name email phone avatar')
      .lean()
      .exec();

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    return ticket;
  }

  async updateTicketStatus(
    ticketId: string,
    dto: UpdateTicketStatusDto,
    adminUserId: string,
  ): Promise<SupportTicketDocument> {
    const ticket = await this.ticketModel.findById(new Types.ObjectId(ticketId)).exec();
    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    ticket.status = dto.status;
    if (dto.resolutionNotes) {
      ticket.resolutionNotes = dto.resolutionNotes.trim();
    }
    if (dto.status === TicketStatus.RESOLVED) {
      ticket.resolvedAt = new Date();
    }
    if (dto.status === TicketStatus.CLOSED) {
      ticket.closedAt = new Date();
    }

    const saved = await ticket.save();

    await this.auditService.log({
      tenantId: ticket.tenantId,
      actorUserId: adminUserId,
      action: 'SUPPORT_TICKET_STATUS_UPDATED',
      entity: 'SupportTicket',
      entityId: ticketId,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        newStatus: dto.status,
        resolutionNotes: dto.resolutionNotes,
      },
    });

    return saved;
  }

  async assignTicket(
    ticketId: string,
    dto: AssignTicketDto,
    adminUserId: string,
  ): Promise<SupportTicketDocument> {
    const ticket = await this.ticketModel.findById(new Types.ObjectId(ticketId)).exec();
    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    ticket.assignedTo = new Types.ObjectId(dto.assignedTo);
    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    const saved = await ticket.save();

    await this.auditService.log({
      tenantId: ticket.tenantId,
      actorUserId: adminUserId,
      action: 'SUPPORT_TICKET_ASSIGNED',
      entity: 'SupportTicket',
      entityId: ticketId,
      metadata: { ticketNumber: ticket.ticketNumber, assignedTo: dto.assignedTo },
    });

    return saved;
  }

  async addPlatformAdminMessage(
    ticketId: string,
    adminUserId: string,
    adminName: string,
    dto: AddTicketMessageDto,
  ): Promise<SupportTicketDocument> {
    const ticket = await this.ticketModel.findById(new Types.ObjectId(ticketId)).exec();
    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    const newMessage = {
      senderId: new Types.ObjectId(adminUserId),
      senderName: adminName || 'Washora Support Engineer',
      senderType: SenderType.PLATFORM_ADMIN,
      message: dto.message.trim(),
      attachments: dto.attachments || [],
      createdAt: new Date(),
    };

    ticket.messages.push(newMessage as any);

    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    const saved = await ticket.save();

    await this.auditService.log({
      tenantId: ticket.tenantId,
      actorUserId: adminUserId,
      action: 'SUPPORT_ADMIN_MESSAGE_SENT',
      entity: 'SupportTicket',
      entityId: ticketId,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    return saved;
  }

  // ==========================================
  // PLATFORM CONTACT SETTINGS
  // ==========================================

  async getPlatformContactInfo(): Promise<PlatformContactSettingsDocument> {
    let settings = await this.contactSettingsModel.findOne().exec();
    if (!settings) {
      settings = new this.contactSettingsModel({
        serviceSupportNumber: '+91 80 4680 1100',
        salesNumber: '+91 80 4680 1101',
        companyConnectNumber: '+91 99000 88221',
        supportEmail: 'support@washora.com',
        salesEmail: 'sales@washora.com',
        whatsappNumber: '+91 99000 88221',
        businessHours: 'Monday - Saturday: 8:00 AM - 9:00 PM IST',
      });
      await settings.save();
    }
    return settings;
  }

  async updatePlatformContactInfo(
    dto: UpdatePlatformContactSettingsDto,
    adminUserId: string,
  ): Promise<PlatformContactSettingsDocument> {
    let settings = await this.contactSettingsModel.findOne().exec();
    if (!settings) {
      settings = new this.contactSettingsModel();
    }

    if (dto.serviceSupportNumber !== undefined) settings.serviceSupportNumber = dto.serviceSupportNumber.trim();
    if (dto.salesNumber !== undefined) settings.salesNumber = dto.salesNumber.trim();
    if (dto.companyConnectNumber !== undefined) settings.companyConnectNumber = dto.companyConnectNumber.trim();
    if (dto.supportEmail !== undefined) settings.supportEmail = dto.supportEmail.trim().toLowerCase();
    if (dto.salesEmail !== undefined) settings.salesEmail = dto.salesEmail.trim().toLowerCase();
    if (dto.whatsappNumber !== undefined) settings.whatsappNumber = dto.whatsappNumber.trim();
    if (dto.businessHours !== undefined) settings.businessHours = dto.businessHours.trim();
    settings.updatedBy = new Types.ObjectId(adminUserId);

    const saved = await settings.save();

    await this.auditService.log({
      tenantId: new Types.ObjectId('000000000000000000000000'), // Platform global
      actorUserId: adminUserId,
      action: 'PLATFORM_CONTACT_UPDATED',
      entity: 'PlatformContactSettings',
      entityId: saved._id.toString(),
      metadata: dto,
    });

    return saved;
  }
}
