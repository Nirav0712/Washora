import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantSettingsDocument = TenantSettings & Document;

@Schema({ timestamps: true, collection: 'tenant_settings' })
export class TenantSettings {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, unique: true })
  tenantId: Types.ObjectId;

  @Prop({ default: 'WSH-', trim: true })
  invoicePrefix: string;

  @Prop({ default: 1000 })
  invoiceNumberStart: number;

  @Prop({ default: 5.0 })
  defaultTaxRate: number;

  @Prop({ default: 'INR', uppercase: true, trim: true })
  currency: string;

  @Prop({ default: '₹', trim: true })
  currencySymbol: string;

  @Prop({ default: 'Asia/Kolkata', trim: true })
  timezone: string;

  @Prop({ default: 'DD/MM/YYYY', trim: true })
  dateFormat: string;

  @Prop({ type: [String], default: [] })
  orderStatuses: string[];

  @Prop({
    type: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '21:00' },
      daysOpen: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    },
    default: {},
  })
  businessHours?: {
    open: string;
    close: string;
    daysOpen: string[];
  };

  @Prop({
    type: {
      invoiceTitle: { type: String, default: 'TAX INVOICE' },
      paperSize: { type: String, enum: ['A4', 'THERMAL_80MM', 'THERMAL_58MM'], default: 'A4' },
      logoUrl: { type: String, default: '' },
      headerText: { type: String, default: 'Thank you for choosing Washora' },
      footerText: { type: String, default: 'Please collect garments within 15 days' },
      showGstNumber: { type: Boolean, default: true },
      showTermsAndConditions: { type: Boolean, default: true },
      showQrCode: { type: Boolean, default: true },
      showBarcode: { type: Boolean, default: true },
      showCustomerGstin: { type: Boolean, default: true },
      showStoreContact: { type: Boolean, default: true },
      terms: { type: String, default: 'Washora is not liable for color bleeding on delicate unlabelled fabrics.' },
      customFooter: { type: String, default: 'For inquiries or pick-up updates, please reach out to our counter.' },
    },
    default: {},
  })
  receiptSettings?: {
    invoiceTitle?: string;
    paperSize?: 'A4' | 'THERMAL_80MM' | 'THERMAL_58MM';
    logoUrl?: string;
    headerText?: string;
    footerText?: string;
    showGstNumber: boolean;
    showTermsAndConditions: boolean;
    showQrCode?: boolean;
    showBarcode?: boolean;
    showCustomerGstin?: boolean;
    showStoreContact?: boolean;
    terms?: string;
    customFooter?: string;
  };

  @Prop({
    type: {
      smsEnabled: { type: Boolean, default: true },
      whatsappEnabled: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: true },
    },
    default: {},
  })
  notificationSettings?: {
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
  };

  @Prop({
    type: {
      primaryColor: { type: String, default: '#3B82F6' },
      accentColor: { type: String, default: '#06B6D4' },
    },
    default: {},
  })
  branding?: {
    primaryColor?: string;
    accentColor?: string;
  };
}

export const TenantSettingsSchema = SchemaFactory.createForClass(TenantSettings);

