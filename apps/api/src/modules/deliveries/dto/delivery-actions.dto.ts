import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryFailureReason, PaymentMethod } from '@washora/shared';

export class AssignDeliveryDto {
  @ApiPropertyOptional({ example: '66554433221100aabbccdd55', description: 'Staff Agent ID' })
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiPropertyOptional({ example: '66554433221100aabbccdd55', description: 'Staff Agent ID' })
  @IsString()
  @IsOptional()
  assignedAgentId?: string;

  @ApiPropertyOptional({ example: 'Assigned for evening delivery route' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class FailDeliveryDto {
  @ApiProperty({ enum: DeliveryFailureReason, example: DeliveryFailureReason.CUSTOMER_NOT_AVAILABLE })
  @IsEnum(DeliveryFailureReason)
  @IsNotEmpty()
  reason: DeliveryFailureReason;

  @ApiPropertyOptional({ example: 'House locked, phone not answered' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'House locked, phone not answered' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class RescheduleDeliveryDto {
  @ApiPropertyOptional({ example: '2026-10-10', description: 'New scheduled date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  newDate?: string;

  @ApiPropertyOptional({ example: '2026-10-10', description: 'New scheduled date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '10:00', description: 'New time from' })
  @IsString()
  @IsOptional()
  newTimeFrom?: string;

  @ApiPropertyOptional({ example: '10:00', description: 'New time from' })
  @IsString()
  @IsOptional()
  scheduledTimeFrom?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'New time to' })
  @IsString()
  @IsOptional()
  newTimeTo?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'New time to' })
  @IsString()
  @IsOptional()
  scheduledTimeTo?: string;

  @ApiPropertyOptional({ example: 'Customer requested redelivery tomorrow morning' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Customer requested redelivery tomorrow morning' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelDeliveryDto {
  @ApiProperty({ example: 'Customer requested to pick up garments from branch instead' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'Customer requested to pick up garments from branch instead' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordCollectionDto {
  @ApiProperty({ example: 45000, description: 'Amount collected in cents/paise' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'UPI-REF-9988221' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'Collected on doorstep delivery' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitProofDto {
  @ApiPropertyOptional({ example: 'Rajesh Kumar (Security)' })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiPropertyOptional({ example: 'Handed over to building security as requested' })
  @IsString()
  @IsOptional()
  deliveryNote?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/washora/signature_123.png' })
  @IsString()
  @IsOptional()
  signatureUrl?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/washora/delivery_photo_123.jpg' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  otpVerified?: boolean;
}
