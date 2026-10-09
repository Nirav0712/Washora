import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShiftAssignmentDocument = ShiftAssignment & Document;

@Schema({ timestamps: true, collection: 'shift_assignments' })
export class ShiftAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StaffProfile', required: true, index: true })
  staffId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ShiftDefinition', required: true, index: true })
  shiftId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true }) // YYYY-MM-DD
  date: string;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop({ min: 0, max: 6 })
  dayOfWeek?: number;
}

export const ShiftAssignmentSchema = SchemaFactory.createForClass(ShiftAssignment);

ShiftAssignmentSchema.index({ tenantId: 1, staffId: 1, date: 1 });
ShiftAssignmentSchema.index({ tenantId: 1, branchId: 1, date: 1 });
ShiftAssignmentSchema.index({ tenantId: 1, shiftId: 1 });
