import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BillingInterval } from '@washora/shared';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({ timestamps: true, collection: 'subscription_plans' })
export class SubscriptionPlan {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(BillingInterval),
    default: BillingInterval.MONTHLY,
  })
  billingInterval: BillingInterval;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 'INR', uppercase: true, trim: true })
  currency: string;

  @Prop({ default: 14, min: 0 })
  trialDays: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ type: Object, default: {} })
  features: Record<string, boolean>;

  @Prop({ type: Object, default: {} })
  limits: Record<string, number>;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
SubscriptionPlanSchema.index({ slug: 1 }, { unique: true });
SubscriptionPlanSchema.index({ isActive: 1, isPublic: 1 });
