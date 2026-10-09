import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTenantSettingsDto {
  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @IsOptional()
  @IsNumber()
  invoiceNumberStart?: number;

  @IsOptional()
  @IsNumber()
  defaultTaxRate?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  currencySymbol?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderStatuses?: string[];

  @IsOptional()
  businessHours?: {
    open: string;
    close: string;
    daysOpen: string[];
  };

  @IsOptional()
  receiptSettings?: {
    headerText?: string;
    footerText?: string;
    showGstNumber: boolean;
    showTermsAndConditions: boolean;
    terms?: string;
  };

  @IsOptional()
  notificationSettings?: {
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
  };

  @IsOptional()
  branding?: {
    primaryColor?: string;
    accentColor?: string;
  };
}
