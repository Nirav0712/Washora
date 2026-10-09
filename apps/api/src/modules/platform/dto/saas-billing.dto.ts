import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingInvoiceStatus, BillingPaymentStatus } from '@washora/shared';

export class CreateBillingInvoiceDto {
  @ApiProperty({ example: '65f1234567890abcdef12345' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ example: '65f1234567890abcdef12346' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  billingPeriodStart: string;

  @ApiProperty({ example: '2026-10-31T23:59:59.000Z' })
  @IsString()
  @IsNotEmpty()
  billingPeriodEnd: string;

  @ApiProperty({ example: 2999 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ example: 539.82 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: '2026-10-15T23:59:59.000Z' })
  @IsString()
  @IsNotEmpty()
  dueAt: string;
}

export class RecordBillingPaymentDto {
  @ApiProperty({ example: '65f1234567890abcdef12347' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ example: 3538.82 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'MOCK_GATEWAY' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 'pay_mock_123456789' })
  @IsOptional()
  @IsString()
  providerPaymentId?: string;
}

export class ProcessWebhookDto {
  @ApiProperty({ example: 'payment.success' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({ example: 'evt_mock_99887766' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: { invoiceNumber: 'SINV-000001', amount: 3538.82, providerPaymentId: 'pay_998877' } })
  @IsObject()
  payload: Record<string, any>;
}
