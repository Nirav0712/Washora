import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, BillingInterval } from '@washora/shared';

export class CreateSubscriptionDto {
  @ApiProperty({ example: '65f1234567890abcdef12345' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ example: '65f1234567890abcdef12346' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({ enum: BillingInterval, example: BillingInterval.MONTHLY })
  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  startTrial?: boolean;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;
}

export class ChangePlanDto {
  @ApiProperty({ example: '65f1234567890abcdef12346' })
  @IsString()
  @IsNotEmpty()
  newPlanId: string;

  @ApiPropertyOptional({ enum: BillingInterval, example: BillingInterval.MONTHLY })
  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({ example: 'Business expansion requiring more branches' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ManualSubscriptionUpdateDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsString()
  currentPeriodEnd?: string;

  @ApiPropertyOptional({ example: '2026-11-15T23:59:59.000Z' })
  @IsOptional()
  @IsString()
  trialEnd?: string;

  @ApiPropertyOptional({ example: 'Customer goodwill 30-day extension' })
  @IsOptional()
  @IsString()
  reason?: string;
}
