import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerNoteDocument = CustomerNote & Document;

@Schema({ timestamps: true, collection: 'customer_notes' })
export class CustomerNote {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ trim: true, default: 'Staff' })
  authorName: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const CustomerNoteSchema = SchemaFactory.createForClass(CustomerNote);

// Indexes
CustomerNoteSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });
CustomerNoteSchema.index({ tenantId: 1, isDeleted: 1 });
