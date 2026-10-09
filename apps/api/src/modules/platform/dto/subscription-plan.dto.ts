import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingInterval } from '@washora/shared';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Professional Growth Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'pro-growth' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Complete multi-branch laundry management with full automation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: BillingInterval, example: BillingInterval.MONTHLY })
  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @ApiProperty({ example: 2999 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    example: {
      POS: true,
      CUSTOMERS: true,
      ORDERS: true,
      PROCESSING: true,
      QC: true,
      STAFF: true,
      ATTENDANCE: true,
      PAYROLL: true,
      EXPENSES: true,
      SUPPLIERS: true,
      PURCHASES: true,
      INVENTORY: true,
      FINANCE: true,
      PICKUP_DELIVERY: true,
      NOTIFICATIONS: true,
      WHATSAPP: true,
      CUSTOMER_PORTAL: true,
      CRM: true,
      REPORTS: true,
      MULTI_BRANCH: true,
    },
  })
  @IsObject()
  features: Record<string, boolean>;

  @ApiProperty({
    example: {
      MAX_BRANCHES: 5,
      MAX_STAFF: 25,
      MAX_CUSTOMERS: 5000,
      MAX_MONTHLY_ORDERS: 2000,
      MAX_USERS: 10,
      MAX_PRODUCTS: 200,
      MAX_INVENTORY_ITEMS: 500,
      MAX_WHATSAPP_MESSAGES: 5000,
      MAX_STORAGE: 10,
    },
  })
  @IsObject()
  limits: Record<string, number>;
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ example: 'Professional Plan Plus' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 3499 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  limits?: Record<string, number>;
}
