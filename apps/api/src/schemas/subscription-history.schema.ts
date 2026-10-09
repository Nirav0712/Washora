import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscriptionHistoryEventType } from '@washora/shared';

export type SubscriptionHistoryDocument = SubscriptionHistory & Document;

@Schema({ timestamps: true, collection: 'subscription_histories' })
export class SubscriptionHistory {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TenantSubscription', required: true })
  subscriptionId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionHistoryEventType),
    required: true,
  })
  event: SubscriptionHistoryEventType;

  @Prop({ type: Object, default: {} })
  previousState?: Record<string, any>;

  @Prop({ type: Object, required: true })
  newState: Record<string, any>;

  @Prop({ type: Types.ObjectId })
  actorId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['PLATFORM_ADMIN', 'TENANT_OWNER', 'SYSTEM'],
    default: 'SYSTEM',
  })
  actorType: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const SubscriptionHistorySchema = SchemaFactory.createForClass(SubscriptionHistory);
SubscriptionHistorySchema.index({ tenantId: 1, createdAt: -1 });
SubscriptionHistorySchema.index({ subscriptionId: 1 });
