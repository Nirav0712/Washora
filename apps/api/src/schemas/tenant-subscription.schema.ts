import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscriptionStatus, BillingInterval } from '@washora/shared';

export type TenantSubscriptionDocument = TenantSubscription & Document;

@Schema({ timestamps: true, collection: 'tenant_subscriptions' })
export class TenantSubscription {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  planId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.TRIALING,
  })
  status: SubscriptionStatus;

  @Prop({
    type: String,
    enum: Object.values(BillingInterval),
    default: BillingInterval.MONTHLY,
  })
  billingInterval: BillingInterval;

  @Prop({ type: Date, default: Date.now })
  startDate: Date;

  @Prop({ type: Date })
  trialStart?: Date;

  @Prop({ type: Date })
  trialEnd?: Date;

  @Prop({ type: Date, required: true })
  currentPeriodStart: Date;

  @Prop({ type: Date, required: true })
  currentPeriodEnd: Date;

  @Prop({ default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({ type: Date })
  gracePeriodEnd?: Date;
}

export const TenantSubscriptionSchema = SchemaFactory.createForClass(TenantSubscription);
TenantSubscriptionSchema.index({ tenantId: 1 });
TenantSubscriptionSchema.index({ planId: 1 });
TenantSubscriptionSchema.index({ status: 1 });
TenantSubscriptionSchema.index({ tenantId: 1, status: 1 });
