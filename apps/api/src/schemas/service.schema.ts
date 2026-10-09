import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true, collection: 'services' })
export class Service {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, uppercase: true })
  code?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 1.0 })
  multiplier: number;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

ServiceSchema.index({ tenantId: 1, name: 1 });
ServiceSchema.index({ tenantId: 1, code: 1 });
ServiceSchema.index({ tenantId: 1, isActive: 1, isDeleted: 1 });
