import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MembershipStatus } from '@washora/shared';

export type MembershipDocument = Membership & Document;

@Schema({ timestamps: true, collection: 'memberships' })
export class Membership {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true, index: true })
  roleId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
  branchIds: Types.ObjectId[];

  @Prop({
    type: String,
    enum: Object.values(MembershipStatus),
    default: MembershipStatus.ACTIVE,
  })
  status: MembershipStatus;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);

// Unique compound index: userId + tenantId
MembershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true });
MembershipSchema.index({ tenantId: 1, status: 1 });
MembershipSchema.index({ userId: 1, status: 1 });
