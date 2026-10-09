import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShiftDefinitionDocument = ShiftDefinition & Document;

@Schema({ timestamps: true, collection: 'shift_definitions' })
export class ShiftDefinition {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', index: true })
  branchId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true }) // HH:mm
  startTime: string;

  @Prop({ required: true, trim: true }) // HH:mm
  endTime: string;

  @Prop({ default: 0, min: 0 })
  breakMinutes: number;

  @Prop({ default: 15, min: 0 })
  graceMinutes: number;

  @Prop({ default: 480, min: 0 })
  workingMinutes: number;

  @Prop({ default: false })
  isOvernight: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const ShiftDefinitionSchema = SchemaFactory.createForClass(ShiftDefinition);

ShiftDefinitionSchema.index({ tenantId: 1, branchId: 1, code: 1 });
ShiftDefinitionSchema.index({ tenantId: 1, code: 1 });
