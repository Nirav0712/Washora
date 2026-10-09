import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  GarmentCondition,
  GarmentProcessingStatus,
  ProcessingStage,
} from '@washora/shared';

export type GarmentDocument = Garment & Document;

@Schema({ timestamps: true, collection: 'garments' })
export class Garment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ trim: true })
  orderItemId?: string;

  @Prop({ required: true, trim: true, uppercase: true })
  garmentNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ trim: true })
  productName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  serviceId?: Types.ObjectId;

  @Prop({ trim: true })
  serviceName?: string;

  @Prop({ trim: true })
  barcode?: string;

  @Prop({ trim: true })
  qrCode?: string;

  @Prop({ trim: true })
  garmentType?: string;

  @Prop({ default: 1, min: 1 })
  quantity: number;

  @Prop({ trim: true })
  color?: string;

  @Prop({ trim: true })
  brand?: string;

  @Prop({
    type: String,
    enum: Object.values(GarmentCondition),
    default: GarmentCondition.GOOD,
  })
  condition: GarmentCondition;

  @Prop({ trim: true })
  conditionNotes?: string;

  @Prop({ type: [String], default: [] })
  stainsNoted: string[];

  @Prop({ type: [String], default: [] })
  damagesNoted: string[];

  @Prop({ trim: true })
  specialInstructions?: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({
    type: String,
    enum: Object.values(GarmentProcessingStatus),
    default: GarmentProcessingStatus.RECEIVED,
  })
  processingStatus: GarmentProcessingStatus;

  @Prop({
    type: String,
    enum: Object.values(ProcessingStage),
    default: ProcessingStage.INTAKE,
  })
  stage: ProcessingStage;

  @Prop({ default: false })
  isQCApproved: boolean;

  @Prop({ trim: true })
  shelfLocation?: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const GarmentSchema = SchemaFactory.createForClass(Garment);

GarmentSchema.index({ tenantId: 1, orderId: 1 });
GarmentSchema.index({ tenantId: 1, garmentNumber: 1 });
GarmentSchema.index({ tenantId: 1, barcode: 1 }, { sparse: true });
GarmentSchema.index({ tenantId: 1, processingStatus: 1 });
GarmentSchema.index({ tenantId: 1, branchId: 1, processingStatus: 1 });
GarmentSchema.index({ tenantId: 1, createdAt: -1 });
