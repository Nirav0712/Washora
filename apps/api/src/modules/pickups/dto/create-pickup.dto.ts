import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogisticsPriority, PickupStatus } from '@washora/shared';
import { CustomerAddressDto } from '../../customers/dto/create-customer.dto';

export class CreatePickupDto {
  @ApiProperty({ example: '66554433221100aabbccdd11', description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: '66554433221100aabbccdd22', description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional({ example: '66554433221100aabbccdd33', description: 'Associated Order ID' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ example: '66554433221100aabbccdd44', description: 'Existing Customer Address ID' })
  @IsString()
  @IsOptional()
  pickupAddressId?: string;

  @ApiPropertyOptional({ type: CustomerAddressDto, description: 'Pickup Address (if custom/new)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  pickupAddress?: CustomerAddressDto;

  @ApiProperty({ example: '2026-10-09', description: 'Scheduled date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiPropertyOptional({ example: '09:00', description: 'Time from (HH:mm)' })
  @IsString()
  @IsOptional()
  scheduledTimeFrom?: string;

  @ApiPropertyOptional({ example: '12:00', description: 'Time to (HH:mm)' })
  @IsString()
  @IsOptional()
  scheduledTimeTo?: string;

  @ApiPropertyOptional({ example: '66554433221100aabbccdd55', description: 'Assigned Staff Agent ID' })
  @IsString()
  @IsOptional()
  assignedAgentId?: string;

  @ApiPropertyOptional({ enum: LogisticsPriority, default: LogisticsPriority.NORMAL })
  @IsEnum(LogisticsPriority)
  @IsOptional()
  priority?: LogisticsPriority;

  @ApiPropertyOptional({ example: 'Ring the doorbell twice' })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({ example: '5 suits and 3 jackets' })
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiPropertyOptional({ example: 'VIP Customer, urgent delivery expected' })
  @IsString()
  @IsOptional()
  internalNotes?: string;
}

export class UpdatePickupDto {
  @ApiPropertyOptional({ example: '2026-10-09' })
  @IsString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  scheduledTimeFrom?: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsString()
  @IsOptional()
  scheduledTimeTo?: string;

  @ApiPropertyOptional({ example: '66554433221100aabbccdd55' })
  @IsString()
  @IsOptional()
  assignedAgentId?: string;

  @ApiPropertyOptional({ enum: LogisticsPriority })
  @IsEnum(LogisticsPriority)
  @IsOptional()
  priority?: LogisticsPriority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiPropertyOptional({ type: CustomerAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  pickupAddress?: CustomerAddressDto;
}
