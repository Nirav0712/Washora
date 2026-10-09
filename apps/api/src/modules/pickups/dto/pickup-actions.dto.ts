import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PickupFailureReason } from '@washora/shared';

export class AssignPickupDto {
  @ApiPropertyOptional({ example: '66554433221100aabbccdd55', description: 'Staff Agent ID' })
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiPropertyOptional({ example: '66554433221100aabbccdd55', description: 'Staff Agent ID' })
  @IsString()
  @IsOptional()
  assignedAgentId?: string;

  @ApiPropertyOptional({ example: 'Assigned for morning pickup run' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class FailPickupDto {
  @ApiProperty({ enum: PickupFailureReason, example: PickupFailureReason.CUSTOMER_NOT_AVAILABLE })
  @IsEnum(PickupFailureReason)
  @IsNotEmpty()
  reason: PickupFailureReason;

  @ApiPropertyOptional({ example: 'Customer called saying they stepped out' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Customer called saying they stepped out' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class ReschedulePickupDto {
  @ApiPropertyOptional({ example: '2026-10-10', description: 'New scheduled date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  newDate?: string;

  @ApiPropertyOptional({ example: '2026-10-10', description: 'New scheduled date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '14:00', description: 'New time from' })
  @IsString()
  @IsOptional()
  newTimeFrom?: string;

  @ApiPropertyOptional({ example: '14:00', description: 'New time from' })
  @IsString()
  @IsOptional()
  scheduledTimeFrom?: string;

  @ApiPropertyOptional({ example: '17:00', description: 'New time to' })
  @IsString()
  @IsOptional()
  newTimeTo?: string;

  @ApiPropertyOptional({ example: '17:00', description: 'New time to' })
  @IsString()
  @IsOptional()
  scheduledTimeTo?: string;

  @ApiPropertyOptional({ example: 'Customer requested afternoon slot after returning' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Customer requested afternoon slot after returning' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelPickupDto {
  @ApiProperty({ example: 'Customer decided to drop garments off at store directly' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'Customer decided to drop garments off at store directly' })
  @IsString()
  @IsOptional()
  notes?: string;
}
