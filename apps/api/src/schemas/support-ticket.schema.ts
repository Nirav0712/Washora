import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;

export enum SupportCategory {
  BILLING = 'BILLING',
  TECHNICAL = 'TECHNICAL',
  HARDWARE_PRINTER = 'HARDWARE_PRINTER',
  SUBSCRIPTION = 'SUBSCRIPTION',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  OTHER = 'OTHER',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_CUSTOMER = 'WAITING_FOR_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SenderType {
  TENANT = 'TENANT',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

@Schema({ _id: false })
export class TicketMessage {
  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ trim: true })
  senderName: string;

  @Prop({ type: String, enum: Object.values(SenderType), required: true })
  senderType: SenderType;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

@Schema({ timestamps: true, collection: 'support_tickets' })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  ticketNumber: string; // e.g. TKT-10024

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SupportCategory),
    default: SupportCategory.TECHNICAL,
    index: true,
  })
  category: SupportCategory;

  @Prop({
    type: String,
    enum: Object.values(TicketPriority),
    default: TicketPriority.MEDIUM,
    index: true,
  })
  priority: TicketPriority;

  @Prop({
    type: String,
    enum: Object.values(TicketStatus),
    default: TicketStatus.OPEN,
    index: true,
  })
  status: TicketStatus;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'PlatformAdmin' })
  assignedTo?: Types.ObjectId;

  @Prop({ type: [TicketMessageSchema], default: [] })
  messages: TicketMessage[];

  @Prop({ trim: true })
  resolutionNotes?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  closedAt?: Date;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);

SupportTicketSchema.index({ tenantId: 1, status: 1 });
SupportTicketSchema.index({ tenantId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });
