import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlatformAdminRole, PlatformPermission } from '@washora/shared';

export type PlatformAdminDocument = PlatformAdmin & Document;

@Schema({ timestamps: true, collection: 'platform_admins' })
export class PlatformAdmin {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(PlatformAdminRole),
    default: PlatformAdminRole.SUPPORT_ADMIN,
  })
  role: PlatformAdminRole;

  @Prop({
    type: [String],
    default: [],
  })
  permissions: PlatformPermission[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Partner' })
  partnerId?: Types.ObjectId;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockUntil?: Date;
}

export const PlatformAdminSchema = SchemaFactory.createForClass(PlatformAdmin);
PlatformAdminSchema.index({ email: 1 }, { unique: true });
PlatformAdminSchema.index({ role: 1 });
PlatformAdminSchema.index({ isActive: 1 });
PlatformAdminSchema.index({ partnerId: 1 });
